package de.quizsalon.app;

import android.util.Base64;
import com.android.billingclient.api.Purchase;
import org.json.JSONException;
import org.json.JSONObject;

import java.nio.charset.StandardCharsets;
import java.security.GeneralSecurityException;
import java.security.KeyFactory;
import java.security.PublicKey;
import java.security.Signature;
import java.security.spec.X509EncodedKeySpec;

final class PlayReceipt {
    static final String PRODUCT = "quizsalon_plus";

    static boolean valid(Purchase purchase, String packageName, String publicKey) {
        if (publicKey.isEmpty() || purchase == null || !packageName.equals(purchase.getPackageName())
                || purchase.getProducts().size() != 1 || !PRODUCT.equals(purchase.getProducts().get(0))
                || purchase.getPurchaseToken().isEmpty() || purchase.getQuantity() != 1) return false;
        try {
            String original = purchase.getOriginalJson();
            JSONObject signed = new JSONObject(original);
            int rawState = signed.getInt("purchaseState");
            if (rawState != 0 && rawState != 4) return false;
            PublicKey key = KeyFactory.getInstance("RSA").generatePublic(new X509EncodedKeySpec(
                    Base64.decode(publicKey, Base64.DEFAULT)));
            byte[] signature = Base64.decode(purchase.getSignature(), Base64.DEFAULT);
            byte[] bytes = original.getBytes(StandardCharsets.UTF_8);
            for (String algorithm : new String[]{"SHA256withRSA", "SHA1withRSA"}) {
                Signature verifier = Signature.getInstance(algorithm);
                verifier.initVerify(key);
                verifier.update(bytes);
                if (verifier.verify(signature)) return true;
            }
        } catch (GeneralSecurityException | IllegalArgumentException | JSONException invalid) {
            return false;
        }
        return false;
    }
}
