package de.quizsalon.app;

import com.android.billingclient.api.Purchase;
import org.json.JSONException;
import org.json.JSONObject;
import java.util.List;

/** A partial purchase callback is evidence about listed products only. An online inventory is complete. */
final class Ownership {
    final Purchase purchased;
    final boolean pending;
    final JSONObject record;

    private Ownership(Purchase purchased, boolean pending, JSONObject record) {
        this.purchased = purchased;
        this.pending = pending;
        this.record = record;
    }

    static Ownership reconcile(List<Purchase> list, boolean complete, String packageName,
                               String publicKey, Purchase previous, JSONObject old, long now)
            throws JSONException {
        Purchase purchased = null;
        boolean pending = false;
        for (Purchase item : list) {
            if (!item.getProducts().contains(PlayReceipt.PRODUCT)) continue;
            if (!PlayReceipt.valid(item, packageName, publicKey)) throw new SecurityException();
            if (item.getPurchaseState() == Purchase.PurchaseState.PURCHASED) purchased = item;
            if (item.getPurchaseState() == Purchase.PurchaseState.PENDING) pending = true;
        }
        if (purchased == null && !complete && (!pending || previous != null)) return null;
        JSONObject next = new JSONObject();
        next.put("lastFullQuery", complete ? now : old.optLong("lastFullQuery"));
        if (purchased != null) {
            boolean same = previous != null && previous.getPurchaseToken().equals(purchased.getPurchaseToken());
            next.put("data", purchased.getOriginalJson());
            next.put("signature", purchased.getSignature());
            next.put("ack", purchased.isAcknowledged() || (same && old.optBoolean("ack")));
        } else {
            next.put("pending", pending);
            next.put("revoked", !pending && (previous != null || old.optBoolean("revoked")));
        }
        return new Ownership(purchased, pending, next);
    }
}
