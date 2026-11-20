package de.quizsalon.app;

import android.Manifest;
import android.annotation.SuppressLint;
import android.app.Activity;
import android.content.ActivityNotFoundException;
import android.content.ClipData;
import android.content.ClipboardManager;
import android.content.Intent;
import android.content.pm.PackageManager;
import android.net.Uri;
import android.os.Build;
import android.os.Bundle;
import android.view.View;
import android.view.WindowInsets;
import android.webkit.JavascriptInterface;
import android.webkit.MimeTypeMap;
import android.webkit.WebResourceRequest;
import android.webkit.WebResourceResponse;
import android.webkit.WebSettings;
import android.webkit.WebView;
import android.webkit.WebViewClient;
import android.widget.FrameLayout;
import android.widget.Toast;
import org.json.JSONException;
import org.json.JSONObject;

import java.io.ByteArrayInputStream;
import java.io.IOException;
import java.io.InputStream;
import java.util.HashMap;
import java.util.Locale;
import java.util.Map;

public final class MainActivity extends Activity {
    static final String HOST = "appassets.androidplatform.net";
    private static final String HOME = "https://" + HOST + "/index.html";
    private WebView web;
    private PlayStore play;
    private GameDatabase game;
    private String pendingReminder = "";
    private volatile String reminderMessage = "";

    @SuppressLint("SetJavaScriptEnabled")
    @Override public void onCreate(Bundle saved) {
        super.onCreate(saved);
        if (saved != null) pendingReminder = saved.getString("pendingReminder", "");
        game = new GameDatabase(this);
        FrameLayout frame = new FrameLayout(this);
        frame.setBackgroundColor(0xfffaf8f0);
        web = new WebView(this);
        frame.addView(web);
        setContentView(frame);
        if (Build.VERSION.SDK_INT >= 30) {
            getWindow().setDecorFitsSystemWindows(false);
            getWindow().getInsetsController().setSystemBarsAppearance(
                    android.view.WindowInsetsController.APPEARANCE_LIGHT_STATUS_BARS |
                    android.view.WindowInsetsController.APPEARANCE_LIGHT_NAVIGATION_BARS,
                    android.view.WindowInsetsController.APPEARANCE_LIGHT_STATUS_BARS |
                    android.view.WindowInsetsController.APPEARANCE_LIGHT_NAVIGATION_BARS);
            frame.setOnApplyWindowInsetsListener((v, insets) -> {
                android.graphics.Insets bars = insets.getInsets(WindowInsets.Type.systemBars()
                        | WindowInsets.Type.displayCutout() | WindowInsets.Type.ime());
                v.setPadding(bars.left, bars.top, bars.right, bars.bottom);
                return WindowInsets.CONSUMED;
            });
            frame.requestApplyInsets();
        } else {
            getWindow().getDecorView().setSystemUiVisibility(View.SYSTEM_UI_FLAG_LIGHT_STATUS_BAR);
        }
        WebView.setWebContentsDebuggingEnabled(BuildConfig.DEBUG);
        WebSettings settings = web.getSettings();
        settings.setJavaScriptEnabled(true);
        settings.setDomStorageEnabled(true);
        settings.setAllowContentAccess(false);
        settings.setAllowFileAccess(false);
        settings.setAllowFileAccessFromFileURLs(false);
        settings.setAllowUniversalAccessFromFileURLs(false);
        settings.setMixedContentMode(WebSettings.MIXED_CONTENT_NEVER_ALLOW);
        settings.setCacheMode(WebSettings.LOAD_NO_CACHE);
        settings.setSupportZoom(true);
        settings.setBuiltInZoomControls(true);
        settings.setDisplayZoomControls(false);
        settings.setTextZoom(Math.round(getResources().getConfiguration().fontScale * 100));
        web.setImportantForAccessibility(View.IMPORTANT_FOR_ACCESSIBILITY_YES);
        web.setWebViewClient(new LocalPages());
        if (BuildConfig.USE_PLAY_STORE) play = new PlayStore(this, () -> signal("quizsalon:billing"));
        web.addJavascriptInterface(new Bridge(), "QuizAndroid");
        if (Build.VERSION.SDK_INT >= 33) {
            getOnBackInvokedDispatcher().registerOnBackInvokedCallback(
                    android.window.OnBackInvokedDispatcher.PRIORITY_DEFAULT, this::onBackPressed);
        }
        web.loadUrl(HOME);
    }

    private boolean local(Uri url) {
        return "https".equals(url.getScheme()) && HOST.equals(url.getEncodedAuthority());
    }

    final class LocalPages extends WebViewClient {
        @Override public boolean shouldOverrideUrlLoading(WebView view, WebResourceRequest request) {
            if (request.isForMainFrame() && local(request.getUrl())) {
                String path = request.getUrl().getPath();
                return !"/index.html".equals(path) && !"/".equals(path);
            }
            if (request.isForMainFrame() && request.hasGesture()) external(request.getUrl());
            return true;
        }

        @Override public WebResourceResponse shouldInterceptRequest(WebView view, WebResourceRequest req) {
            Uri uri = req.getUrl();
            String path = uri.getPath();
            if (!local(uri) || !"GET".equals(req.getMethod()) || path == null || path.contains("..")
                    || path.indexOf('\\') >= 0) return absent();
            String file = path.equals("/") ? "index.html" : path.substring(1);
            try {
                InputStream data = getAssets().open(file);
                String extension = file.substring(file.lastIndexOf('.') + 1).toLowerCase(Locale.ROOT);
                String type = MimeTypeMap.getSingleton().getMimeTypeFromExtension(extension);
                if (extension.equals("js") || extension.equals("mjs")) type = "text/javascript";
                if (extension.equals("webmanifest")) type = "application/manifest+json";
                if (extension.equals("woff2")) type = "font/woff2";
                if (extension.equals("svg")) type = "image/svg+xml";
                if (type == null) type = "application/octet-stream";
                Map<String,String> headers = new HashMap<>();
                headers.put("Cache-Control", "no-store");
                headers.put("X-Content-Type-Options", "nosniff");
                headers.put("Content-Security-Policy", "default-src 'self'; script-src 'self'; " +
                        "style-src 'self' 'unsafe-inline'; img-src 'self' data:; connect-src 'self'; " +
                        "frame-src 'none'; object-src 'none'; base-uri 'none'; form-action 'none'");
                return new WebResourceResponse(type, "UTF-8", 200, "OK", headers, data);
            } catch (IOException missing) { return absent(); }
        }
        private WebResourceResponse absent() {
            return new WebResourceResponse("text/plain", "UTF-8", 404, "Not Found", null,
                    new ByteArrayInputStream(new byte[0]));
        }
    }

    private void external(Uri uri) {
        String scheme = uri.getScheme();
        boolean browser = "https".equals(scheme) && uri.getHost() != null && uri.getUserInfo() == null;
        boolean mail = "mailto".equals(scheme);
        if (!browser && !mail) return;
        try {
            startActivity(new Intent(mail ? Intent.ACTION_SENDTO : Intent.ACTION_VIEW, uri));
        } catch (ActivityNotFoundException unavailable) {
            Toast.makeText(this, "Keine passende App gefunden. Du kannst den Text kopieren.",
                    Toast.LENGTH_LONG).show();
        }
    }

    public final class Bridge {
        @JavascriptInterface public String readGame() { return game.read(); }
        @JavascriptInterface public boolean writeGame(long expectedRev, String json) { return game.write(expectedRev, json); }
        @JavascriptInterface public String getInstallationId() { return game.installationId(); }
        @JavascriptInterface public String operatorInfo() {
            try {
                return new JSONObject().put("operator", BuildConfig.OPERATOR)
                        .put("supportEmail", BuildConfig.SUPPORT_EMAIL)
                        .put("privacyUrl", BuildConfig.PRIVACY_URL).toString();
            } catch (JSONException impossible) { throw new IllegalStateException(impossible); }
        }
        @JavascriptInterface public String billingState() {
            return play == null ? "{\"state\":\"unavailable\",\"message\":\"Lokale Testausgabe ohne Play-Kauf.\"}" : play.stateJson();
        }
        @JavascriptInterface public void purchase() { if (play != null) runOnUiThread(play::buy); }
        @JavascriptInterface public void restore() { if (play != null) runOnUiThread(play::refresh); }
        @JavascriptInterface public void setReminder(String time) { runOnUiThread(() -> selectReminder(time)); }
        @JavascriptInterface public String reminderState() {
            String time = DailyReminder.prefs(MainActivity.this).getString("time", "");
            JSONObject result = new JSONObject();
            try {
                boolean allowed = DailyReminder.permitted(MainActivity.this);
                result.put("enabled", !time.isEmpty() && allowed);
                result.put("time", time);
                result.put("message", !time.isEmpty() && !allowed
                        ? "Android hat Benachrichtigungen für Quizsalon ausgeschaltet." : reminderMessage);
                return result.toString();
            } catch (JSONException impossible) { throw new IllegalStateException(impossible); }
        }
        @JavascriptInterface public void openExternal(String url) { runOnUiThread(() -> external(Uri.parse(url))); }
        @JavascriptInterface public void copy(String text) {
            runOnUiThread(() -> getSystemService(ClipboardManager.class)
                    .setPrimaryClip(ClipData.newPlainText("Quizsalon", text)));
        }
        @JavascriptInterface public void haptic() {
            runOnUiThread(() -> web.performHapticFeedback(android.view.HapticFeedbackConstants.VIRTUAL_KEY));
        }
    }

    private void selectReminder(String time) {
        if (time == null || (!time.isEmpty() && !DailyReminder.CLOCK_TIME.matcher(time).matches())) return;
        if (!time.isEmpty() && Build.VERSION.SDK_INT >= 33
                && checkSelfPermission(Manifest.permission.POST_NOTIFICATIONS) != PackageManager.PERMISSION_GRANTED) {
            pendingReminder = time;
            requestPermissions(new String[]{Manifest.permission.POST_NOTIFICATIONS}, 17);
            return;
        }
        saveReminder(time);
    }

    private void saveReminder(String time) {
        pendingReminder = "";
        boolean saved = DailyReminder.prefs(this).edit().putString("time", time).commit();
        if (saved) {
            reminderMessage = time.isEmpty() ? "Die Erinnerung ist ausgeschaltet."
                    : "Android erinnert dich ungefähr um " + time + " Uhr.";
            DailyReminder.schedule(this);
        } else {
            reminderMessage = "Die Erinnerung konnte nicht gespeichert werden.";
        }
        signal("quizsalon:reminder");
    }

    @Override public void onRequestPermissionsResult(int request, String[] permissions, int[] results) {
        super.onRequestPermissionsResult(request, permissions, results);
        if (request != 17) return;
        if (results.length > 0 && results[0] == PackageManager.PERMISSION_GRANTED) saveReminder(pendingReminder);
        else {
            pendingReminder = "";
            reminderMessage = "Die Erinnerung ist aus. Du kannst die Erlaubnis in den Android-Einstellungen ändern.";
            signal("quizsalon:reminder");
        }
    }

    private void signal(String name) {
        if (web != null && !isDestroyed()) {
            web.evaluateJavascript("window.dispatchEvent(new Event(" + JSONObject.quote(name) + "))", null);
        }
    }

    @Override public void onBackPressed() {
        web.evaluateJavascript("window.dispatchEvent(new Event('quizsalon:back',{cancelable:true}))",
                unhandled -> { if ("true".equals(unhandled)) finish(); });
    }
    @Override protected void onSaveInstanceState(Bundle out) {
        super.onSaveInstanceState(out);
        out.putString("pendingReminder", pendingReminder);
    }
    @Override protected void onResume() {
        super.onResume();
        web.onResume();
        if (play != null) play.refresh();
        DailyReminder.schedule(this);
        signal("quizsalon:reminder");
    }
    @Override protected void onPause() { web.onPause(); super.onPause(); }
    @Override protected void onDestroy() {
        if (play != null) play.close();
        web.removeJavascriptInterface("QuizAndroid");
        web.destroy();
        game.close();
        super.onDestroy();
    }
}
