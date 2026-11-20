package de.quizsalon.app;

import android.app.Activity;
import android.net.ConnectivityManager;
import android.net.Network;
import android.net.NetworkCapabilities;
import android.os.Handler;
import android.os.Looper;
import com.android.billingclient.api.*;
import org.json.JSONException;
import org.json.JSONObject;

import java.util.Collections;
import java.util.List;

/** All state transitions run on the main looper. Only an online complete ownership query may revoke Plus. */
final class PlayStore {
    private final Activity activity;
    private final ConnectivityManager network;
    private final BillingClient client;
    private final PlayCache cache;
    private final Runnable notifyUi;
    private final Handler handler = new Handler(Looper.getMainLooper());
    private final Runnable retry = this::refresh;
    private final Runnable connectionTimeout = () -> {
        if (connecting()) problem("Google Play antwortet gerade nicht. Versuche die Wiederherstellung später.");
    };
    private JSONObject record = new JSONObject();
    private Purchase owned;
    private ProductDetails product;
    private ProductDetails.OneTimePurchaseOfferDetails offer;
    private String state = "unknown";
    private String message = "Der Kaufstatus wird bei Google Play geprüft.";
    private volatile String snapshot = "{}";
    private String acknowledging = "";
    private int sequence;
    private boolean checking;
    private boolean shopping;
    private boolean closed;
    private boolean onlineLast;
    private boolean connectedAtLeastOnce;

    private final ConnectivityManager.NetworkCallback connection = new ConnectivityManager.NetworkCallback() {
        @Override public void onCapabilitiesChanged(Network ignored, NetworkCapabilities capabilities) {
            handler.post(() -> networkChanged());
        }
        @Override public void onLost(Network ignored) { handler.post(() -> networkChanged()); }
    };

    PlayStore(Activity activity, Runnable notifyUi) {
        this.activity = activity;
        this.notifyUi = notifyUi;
        this.network = activity.getSystemService(ConnectivityManager.class);
        this.cache = new PlayCache(activity);
        client = BillingClient.newBuilder(activity.getApplicationContext())
                .setListener((result, purchases) -> handler.post(() -> updated(result, purchases)))
                .enablePendingPurchases(PendingPurchasesParams.newBuilder().enableOneTimeProducts().build())
                .enableAutoServiceReconnection().build();
        if (!BuildConfig.PLAY_PUBLIC_KEY.isEmpty()) {
            try {
                record = cache.read();
                if (record.has("data")) {
                    Purchase cached = new Purchase(record.getString("data"), record.getString("signature"));
                    if (valid(cached) && cached.getPurchaseState() == Purchase.PurchaseState.PURCHASED) {
                        owned = cached;
                        state = "entitled";
                        message = "Plus ist auf diesem Gerät verfügbar.";
                    } else {
                        state = "error";
                        message = "Der gespeicherte Kauf muss erneut geprüft werden.";
                    }
                } else if (record.optBoolean("revoked")) {
                    state = "revoked";
                    message = "Google Play führt diesen Kauf nicht mehr.";
                } else if (record.optBoolean("pending")) {
                    state = "pending";
                    message = "Die Zahlung wartet auf Bestätigung durch Google Play.";
                }
            } catch (Exception unreadable) {
                state = "error";
                message = "Der gespeicherte Kauf lässt sich nicht lesen. Nutze Kauf wiederherstellen.";
            }
        } else {
            state = "unavailable";
            message = "Für diese Testfassung ist kein Google-Play-Kauf eingerichtet.";
        }
        publish();
        onlineLast = online();
        network.registerDefaultNetworkCallback(connection);
    }

    String stateJson() { return snapshot; }

    private boolean valid(Purchase purchase) {
        return PlayReceipt.valid(purchase, activity.getPackageName(), BuildConfig.PLAY_PUBLIC_KEY);
    }

    private boolean online() {
        NetworkCapabilities caps = network.getNetworkCapabilities(network.getActiveNetwork());
        return caps != null && caps.hasCapability(NetworkCapabilities.NET_CAPABILITY_VALIDATED);
    }

    private void networkChanged() {
        if (closed) return;
        boolean available = online();
        if (available == onlineLast) return;
        onlineLast = available;
        refresh();
    }

    private void publish() {
        if (closed) return;
        JSONObject view = new JSONObject();
        try {
            view.put("state", owned == null ? state : "entitled");
            view.put("message", message);
            if (offer != null && online() && client.isReady() && !checking
                    && ("not_entitled".equals(state) || "revoked".equals(state))) {
                view.put("price", offer.getFormattedPrice());
            }
        } catch (JSONException impossible) { throw new IllegalStateException(impossible); }
        snapshot = view.toString();
        notifyUi.run();
    }

    private void problem(String text) {
        checking = false;
        message = text;
        if (owned == null && !"pending".equals(state)) state = "unavailable";
        publish();
    }

    private boolean connecting() { return client.getConnectionState() == BillingClient.ConnectionState.CONNECTING; }

    void refresh() {
        if (closed || BuildConfig.PLAY_PUBLIC_KEY.isEmpty()) { publish(); return; }
        handler.removeCallbacks(retry);
        if (!online()) {
            sequence++;
            product = null;
            offer = null;
            problem(owned != null ? "Dein bestätigtes Plus ist offline verfügbar."
                    : "Verbinde dich für Kauf und Wiederherstellung mit dem Internet.");
            return;
        }
        if (client.isReady() || connectedAtLeastOnce && !connecting()) {
            inventory();
            return;
        }
        if (connecting()) return;
        handler.removeCallbacks(connectionTimeout);
        handler.postDelayed(connectionTimeout, 16000);
        client.startConnection(new BillingClientStateListener() {
            @Override public void onBillingSetupFinished(BillingResult result) {
                handler.post(() -> {
                    if (closed) return;
                    handler.removeCallbacks(connectionTimeout);
                    if (ok(result)) { connectedAtLeastOnce = true; inventory(); }
                    else problem("Google Play ist derzeit nicht für diesen Kauf verfügbar.");
                });
            }
            @Override public void onBillingServiceDisconnected() {
                handler.post(() -> {
                    if (closed) return;
                    sequence++;
                    problem("Die Verbindung zu Google Play wurde unterbrochen.");
                    retryLater();
                });
            }
        });
    }

    private static boolean ok(BillingResult result) {
        return result.getResponseCode() == BillingClient.BillingResponseCode.OK;
    }

    private void inventory() {
        int request = ++sequence;
        checking = true;
        product = null;
        offer = null;
        publish();
        handler.postDelayed(() -> {
            if (request == sequence && checking && !closed) {
                sequence++;
                problem("Google Play antwortet gerade nicht. Du kannst es später erneut versuchen.");
            }
        }, 20000);
        QueryPurchasesParams purchases = QueryPurchasesParams.newBuilder()
                .setProductType(BillingClient.ProductType.INAPP).build();
        client.queryPurchasesAsync(purchases, (result, found) -> handler.post(() -> {
            if (closed || request != sequence) return;
            checking = false;
            if (!ok(result) || !online()) {
                problem("Der Kaufstatus konnte nicht mit Google Play abgeglichen werden.");
                return;
            }
            if (receive(found, true) && owned == null && !"pending".equals(state)) details(request);
        }));
    }

    private void details(int request) {
        QueryProductDetailsParams.Product item = QueryProductDetailsParams.Product.newBuilder()
                .setProductId(PlayReceipt.PRODUCT).setProductType(BillingClient.ProductType.INAPP).build();
        client.queryProductDetailsAsync(QueryProductDetailsParams.newBuilder()
                .setProductList(Collections.singletonList(item)).build(), (result, found) -> handler.post(() -> {
            if (closed || request != sequence) return;
            if (ok(result)) {
                for (ProductDetails candidate : found.getProductDetailsList()) {
                    if (!PlayReceipt.PRODUCT.equals(candidate.getProductId())) continue;
                    List<ProductDetails.OneTimePurchaseOfferDetails> offers = candidate.getOneTimePurchaseOfferDetailsList();
                    if (offers == null || offers.isEmpty()) {
                        ProductDetails.OneTimePurchaseOfferDetails legacy = candidate.getOneTimePurchaseOfferDetails();
                        if (legacy == null) continue;
                        offers = Collections.singletonList(legacy);
                    }
                    for (ProductDetails.OneTimePurchaseOfferDetails choice : offers) {
                        if (choice.getRentalDetails() == null && (choice.getOfferId() == null || choice.getOfferId().isEmpty())
                                && !choice.getFormattedPrice().isEmpty()) {
                            product = candidate;
                            offer = choice;
                            publish();
                            return;
                        }
                    }
                }
            }
            problem("Google Play kann für Plus momentan keinen Preis anbieten.");
        }));
    }

    void buy() {
        if (closed || shopping || owned != null || checking) return;
        if (product == null || offer == null || !online() || !client.isReady()
                || !("not_entitled".equals(state) || "revoked".equals(state))) {
            refresh();
            return;
        }
        BillingFlowParams.ProductDetailsParams.Builder item = BillingFlowParams.ProductDetailsParams.newBuilder()
                .setProductDetails(product);
        String token = offer.getOfferToken();
        if (token != null && !token.isEmpty()) item.setOfferToken(token);
        shopping = true;
        BillingResult result = client.launchBillingFlow(activity, BillingFlowParams.newBuilder()
                .setProductDetailsParamsList(Collections.singletonList(item.build())).build());
        if (!ok(result)) updated(result, null);
    }

    private void updated(BillingResult result, List<Purchase> list) {
        if (closed) return;
        shopping = false;
        int code = result.getResponseCode();
        if (ok(result) && list != null) {
            sequence++;
            checking = false;
            if (receive(list, false)) refresh();
        } else if (code == BillingClient.BillingResponseCode.ITEM_ALREADY_OWNED) {
            refresh();
        } else if (code == BillingClient.BillingResponseCode.USER_CANCELED) {
            message = "Du hast den Kaufdialog geschlossen.";
            publish();
        } else {
            problem("Der Kauf wurde nicht bestätigt. Prüfe den Status über Kauf wiederherstellen.");
        }
    }

    private boolean receive(List<Purchase> list, boolean complete) {
        try {
            Ownership decision = Ownership.reconcile(list, complete, activity.getPackageName(),
                    BuildConfig.PLAY_PUBLIC_KEY, owned, record, System.currentTimeMillis());
            if (decision == null) return true;
            JSONObject next = decision.record;
            cache.write(next);
            record = next;
            owned = decision.purchased;
            if (owned != null) {
                state = "entitled";
                message = "Deine freien Themenrunden sind freigeschaltet.";
                if (!record.optBoolean("ack")) acknowledge(owned.getPurchaseToken());
            } else if (decision.pending) {
                state = "pending";
                message = "Die Zahlung ist ausstehend. Plus öffnet sich nach Bestätigung durch Google Play.";
            } else if (next.optBoolean("revoked")) {
                state = "revoked";
                message = "Google Play führt diesen Kauf nicht mehr. Begonnene Runden kannst du beenden.";
            } else {
                state = "not_entitled";
                message = "Für dieses Google-Play-Konto wurde kein Plus-Kauf gefunden.";
            }
            publish();
            return true;
        } catch (SecurityException invalid) {
            state = "error";
            message = "Die Echtheit des Kaufbelegs konnte nicht bestätigt werden.";
            publish();
            return false;
        } catch (Exception failure) {
            state = "error";
            message = "Der Kaufstatus konnte nicht sicher gespeichert werden. Nutze Kauf wiederherstellen.";
            publish();
            return false;
        }
    }

    private void acknowledge(String token) {
        if (token.equals(acknowledging)) return;
        acknowledging = token;
        client.acknowledgePurchase(AcknowledgePurchaseParams.newBuilder().setPurchaseToken(token).build(),
                result -> handler.post(() -> {
                    if (closed || !token.equals(acknowledging)) return;
                    acknowledging = "";
                    if (owned == null || !owned.getPurchaseToken().equals(token)) return;
                    if (ok(result)) {
                        try {
                            JSONObject next = new JSONObject(record.toString());
                            next.put("ack", true);
                            cache.write(next);
                            record = next;
                            return;
                        } catch (Exception ignored) { /* A fresh Play query recovers acknowledgement. */ }
                    }
                    retryLater();
                }));
    }

    private void retryLater() {
        handler.removeCallbacks(retry);
        if (!closed) handler.postDelayed(retry, 60000);
    }

    void close() {
        closed = true;
        handler.removeCallbacksAndMessages(null);
        network.unregisterNetworkCallback(connection);
        client.endConnection();
    }
}
