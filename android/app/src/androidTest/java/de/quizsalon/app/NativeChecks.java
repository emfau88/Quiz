package de.quizsalon.app;

import android.app.Activity;
import android.app.Instrumentation;
import android.content.Context;
import android.content.ContextWrapper;
import android.database.DatabaseErrorHandler;
import android.database.sqlite.SQLiteDatabase;
import android.os.Bundle;
import android.util.Base64;
import com.android.billingclient.api.Purchase;
import org.json.JSONObject;

import java.io.File;
import java.nio.charset.StandardCharsets;
import java.security.KeyPair;
import java.security.KeyPairGenerator;
import java.security.Signature;
import java.util.Arrays;
import java.util.Calendar;
import java.util.Collections;
import java.util.TimeZone;
import java.util.UUID;

/** Runs on Android. Ephemeral receipt keys and test cases exist only in the instrumentation APK. */
public final class NativeChecks extends Instrumentation {
    private final StringBuilder results = new StringBuilder();
    private static final String TEST_PKG = "de.quizsalon.receipt.test";
    private KeyPair pair;
    private String key;
    private boolean checkTalkBack;
    private String invitation;

    @Override public void onCreate(Bundle args) {
        super.onCreate(args);
        checkTalkBack = "true".equals(args.getString("talkback"));
        invitation = args.getString("invite64");
        start();
    }

    @Override public void onStart() {
        Bundle output = new Bundle();
        try {
            if (checkTalkBack) {
                output.putString("stream", new TalkBackTraversal(this).run(invitation));
                finish(Activity.RESULT_OK, output);
                return;
            }
            Context scoped = isolated(getTargetContext());
            database(scoped);
            receipts(scoped);
            reminderTimes();
            output.putString("stream", results.toString());
            finish(Activity.RESULT_OK, output);
        } catch (Throwable error) {
            output.putString("stream", results + "\nFAILED: " + android.util.Log.getStackTraceString(error));
            finish(Activity.RESULT_CANCELED, output);
        }
    }

    private Context isolated(Context base) {
        String prefix = "qa-" + UUID.randomUUID() + "-";
        File files = new File(base.getCacheDir(), prefix);
        if (!files.mkdirs()) throw new AssertionError("Testverzeichnis fehlt");
        return new ContextWrapper(base) {
            @Override public File getDatabasePath(String name) { return base.getDatabasePath(prefix + name); }
            @Override public SQLiteDatabase openOrCreateDatabase(String name, int mode, SQLiteDatabase.CursorFactory factory) {
                return base.openOrCreateDatabase(prefix + name, mode, factory);
            }
            @Override public SQLiteDatabase openOrCreateDatabase(String name, int mode, SQLiteDatabase.CursorFactory factory, DatabaseErrorHandler errors) {
                return base.openOrCreateDatabase(prefix + name, mode, factory, errors);
            }
            @Override public File getNoBackupFilesDir() { return files; }
        };
    }

    private void check(boolean passed, String text) {
        if (!passed) throw new AssertionError(text);
        results.append("\nPASS ").append(text);
    }

    private void database(Context scoped) throws Exception {
        SQLiteDatabase legacy = scoped.openOrCreateDatabase("game.db", Context.MODE_PRIVATE, null);
        legacy.execSQL("CREATE TABLE save(id INTEGER PRIMARY KEY, revision INTEGER NOT NULL, value TEXT NOT NULL)");
        legacy.execSQL("INSERT INTO save VALUES(1, 3, ?)", new Object[]{"{\"history\":[1,2,3]}"});
        legacy.setVersion(1);
        legacy.close();
        GameDatabase db = new GameDatabase(scoped);
        JSONObject old = new JSONObject(db.read());
        check(old.getLong("rev") == 3 && old.getJSONObject("value").getJSONArray("history").length() == 3, "SQLite-Migration 1 zu 2 mit bestehendem Stand");
        StringBuilder body = new StringBuilder(2600000);
        for (int i = 0; i < 270000; i++) body.append("ÄÖ Wissen🌿");
        String value = new JSONObject().put("data", body.toString()).toString();
        check(!db.write(1, value), "Falsche Datenrevision wird abgewiesen");
        check(db.write(3, value), "Großer, gültiger Spielstand wird vollständig geschrieben");
        check(!db.write(3, "{}"), "Zweiter Commit derselben Revision bleibt wirkungslos");
        String id = db.installationId();
        db.close();
        GameDatabase reopened = new GameDatabase(scoped);
        JSONObject read = new JSONObject(reopened.read());
        check(read.getLong("rev") == 4 && body.toString().equals(read.getJSONObject("value").getString("data")),
                "Neustart erhält mehr als 2 MB und Unicode über Chunkgrenzen");
        check(id.equals(reopened.installationId()), "Installationskennung bleibt bei Neustart stabil");
        reopened.close();
    }

    private Purchase receipt(int state, String pkg, String product, String token,
                             String algorithm, boolean acknowledged) throws Exception {
        String payload = new JSONObject().put("productId", product).put("packageName", pkg)
                .put("purchaseToken", token).put("purchaseState", state).put("acknowledged", acknowledged).toString();
        Signature signer = Signature.getInstance(algorithm);
        signer.initSign(pair.getPrivate());
        signer.update(payload.getBytes(StandardCharsets.UTF_8));
        return new Purchase(payload, Base64.encodeToString(signer.sign(), Base64.NO_WRAP));
    }

    private void receipts(Context scoped) throws Exception {
        KeyPairGenerator generator = KeyPairGenerator.getInstance("RSA");
        generator.initialize(2048);
        pair = generator.generateKeyPair();
        key = Base64.encodeToString(pair.getPublic().getEncoded(), Base64.NO_WRAP);
        Purchase paid = receipt(0, TEST_PKG, PlayReceipt.PRODUCT, "instrumentation", "SHA256withRSA", false);
        Purchase pending = receipt(4, TEST_PKG, PlayReceipt.PRODUCT, "instrumentation", "SHA1withRSA", false);
        check(PlayReceipt.valid(paid, TEST_PKG, key) && PlayReceipt.valid(pending, TEST_PKG, key), "PKCS1-Belegsignaturen und Play-Originaldaten geprüft");
        check(!PlayReceipt.valid(paid, "another.app", key)
                && !PlayReceipt.valid(receipt(0, TEST_PKG, "other", "instrumentation", "SHA1withRSA", false), TEST_PKG, key)
                && !PlayReceipt.valid(receipt(0, TEST_PKG, PlayReceipt.PRODUCT, "", "SHA1withRSA", false), TEST_PKG, key),
                "Falsches Paket, Produkt und leerer Token abgewiesen");
        Purchase altered = new Purchase(paid.getOriginalJson().replace("instrumentation", "changed"), paid.getSignature());
        check(!PlayReceipt.valid(altered, TEST_PKG, key) && !PlayReceipt.valid(paid, TEST_PKG, ""), "Veränderter Beleg oder fehlender Schlüssel gewährt kein Plus");
        JSONObject old = new JSONObject();
        Ownership waiting = Ownership.reconcile(Collections.singletonList(pending), true, TEST_PKG, key, null, old, 10);
        check(waiting.pending && waiting.purchased == null && !waiting.record.has("data"), "Ausstehende Zahlung ohne Freischaltung");
        Ownership granted = Ownership.reconcile(Arrays.asList(pending, paid), true, TEST_PKG, key, null, waiting.record, 20);
        check(granted.purchased.equals(paid) && !granted.record.optBoolean("ack"), "Bestätigter Übergang von pending zu purchased vorm Acknowledgement");
        PlayCache cache = new PlayCache(scoped);
        cache.write(granted.record);
        JSONObject offline = new PlayCache(scoped).read();
        Purchase cached = new Purchase(offline.getString("data"), offline.getString("signature"));
        check(PlayReceipt.valid(cached, TEST_PKG, key), "Offline-Neulesen des AES-GCM-Caches mit Android Keystore");
        check(Ownership.reconcile(Collections.emptyList(), false, TEST_PKG, key, cached, offline, 25) == null,
                "Partielles Ereignis ohne Kauf löscht keine Berechtigung");
        offline.put("ack", true);
        Ownership duplicate = Ownership.reconcile(Collections.singletonList(paid), false, TEST_PKG, key, cached, offline, 25);
        check(duplicate.record.getBoolean("ack") && duplicate.record.getLong("lastFullQuery") == 20,
                "Wiederholtes Kaufereignis erhält Bestätigungs- und Abgleichstatus");
        Ownership revoked = Ownership.reconcile(Collections.emptyList(), true, TEST_PKG, key, cached, offline, 30);
        check(revoked.record.getBoolean("revoked") && revoked.purchased == null && !revoked.record.has("data"), "Vollständiges leeres Inventar widerruft den Offlinekauf");
        Ownership canceled = Ownership.reconcile(Collections.emptyList(), true, TEST_PKG, key, null, waiting.record, 30);
        check(!canceled.pending && !canceled.record.optBoolean("revoked") && canceled.purchased == null, "Abgebrochene ausstehende Zahlung bleibt kostenlos");
    }

    private void reminderTimes() {
        TimeZone berlin = TimeZone.getTimeZone("Europe/Berlin");
        Calendar start = Calendar.getInstance(berlin);
        start.clear();
        start.set(2026, Calendar.MARCH, 28, 12, 0);
        long spring = DailyReminder.nextTime("09:15", start.getTimeInMillis(), berlin);
        Calendar target = Calendar.getInstance(berlin);
        target.setTimeInMillis(spring);
        check(target.get(Calendar.DAY_OF_MONTH) == 29 && target.get(Calendar.HOUR_OF_DAY) == 9 &&
                target.get(Calendar.MINUTE) == 15, "Erinnerung über Sommerzeitbeginn um lokale 09:15");
        start.set(2026, Calendar.OCTOBER, 24, 12, 0);
        target.setTimeInMillis(DailyReminder.nextTime("09:15", start.getTimeInMillis(), berlin));
        check(target.get(Calendar.DAY_OF_MONTH) == 25 && target.get(Calendar.HOUR_OF_DAY) == 9,
                "Erinnerung über Winterzeitbeginn um lokale 09:15");
        TimeZone tokyo = TimeZone.getTimeZone("Asia/Tokyo");
        long moved = DailyReminder.nextTime("09:15", start.getTimeInMillis(), tokyo);
        target.setTimeZone(tokyo);
        target.setTimeInMillis(moved);
        check(target.get(Calendar.HOUR_OF_DAY) == 9 && target.get(Calendar.MINUTE) == 15,
                "Nach Reisen wird die eingestellte lokale Uhrzeit neu berechnet");
    }
}
