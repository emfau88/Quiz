package de.quizsalon.app;

import android.content.Context;
import android.security.keystore.KeyGenParameterSpec;
import android.security.keystore.KeyProperties;
import android.util.AtomicFile;
import android.util.Base64;
import org.json.JSONObject;

import java.io.File;
import java.io.FileOutputStream;
import java.nio.charset.StandardCharsets;
import java.security.KeyStore;
import javax.crypto.Cipher;
import javax.crypto.KeyGenerator;
import javax.crypto.SecretKey;
import javax.crypto.spec.GCMParameterSpec;

/** Only the app can use the non-exportable key. Android excludes the receipt file from backup. */
final class PlayCache {
    private static final String ALIAS = "quizsalon.play.receipt.v1";
    private final AtomicFile file;

    PlayCache(Context context) {
        file = new AtomicFile(new File(context.getNoBackupFilesDir(), "play-v1"));
    }

    private SecretKey key() throws Exception {
        KeyStore keys = KeyStore.getInstance("AndroidKeyStore");
        keys.load(null);
        SecretKey key = (SecretKey) keys.getKey(ALIAS, null);
        if (key != null) return key;
        KeyGenerator generator = KeyGenerator.getInstance(KeyProperties.KEY_ALGORITHM_AES, "AndroidKeyStore");
        generator.init(new KeyGenParameterSpec.Builder(ALIAS,
                KeyProperties.PURPOSE_ENCRYPT | KeyProperties.PURPOSE_DECRYPT)
                .setBlockModes(KeyProperties.BLOCK_MODE_GCM)
                .setEncryptionPaddings(KeyProperties.ENCRYPTION_PADDING_NONE).build());
        return generator.generateKey();
    }

    JSONObject read() throws Exception {
        if (!file.getBaseFile().exists()) return new JSONObject();
        JSONObject encrypted = new JSONObject(new String(file.readFully(), StandardCharsets.UTF_8));
        Cipher cipher = Cipher.getInstance("AES/GCM/NoPadding");
        cipher.init(Cipher.DECRYPT_MODE, key(), new GCMParameterSpec(128,
                Base64.decode(encrypted.getString("iv"), Base64.DEFAULT)));
        return new JSONObject(new String(cipher.doFinal(Base64.decode(
                encrypted.getString("body"), Base64.DEFAULT)), StandardCharsets.UTF_8));
    }

    void write(JSONObject value) throws Exception {
        Cipher cipher = Cipher.getInstance("AES/GCM/NoPadding");
        cipher.init(Cipher.ENCRYPT_MODE, key());
        JSONObject encrypted = new JSONObject();
        encrypted.put("iv", Base64.encodeToString(cipher.getIV(), Base64.NO_WRAP));
        encrypted.put("body", Base64.encodeToString(cipher.doFinal(
                value.toString().getBytes(StandardCharsets.UTF_8)), Base64.NO_WRAP));
        FileOutputStream stream = null;
        try {
            stream = file.startWrite();
            stream.write(encrypted.toString().getBytes(StandardCharsets.UTF_8));
            file.finishWrite(stream);
        } catch (Exception failure) {
            file.failWrite(stream);
            throw failure;
        }
    }
}
