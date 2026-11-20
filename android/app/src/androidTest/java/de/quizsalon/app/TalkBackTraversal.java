package de.quizsalon.app;

import android.app.Activity;
import android.app.Instrumentation;
import android.app.UiAutomation;
import android.content.Intent;
import android.graphics.Rect;
import android.os.SystemClock;
import android.view.InputDevice;
import android.view.MotionEvent;
import android.view.accessibility.AccessibilityManager;
import android.view.accessibility.AccessibilityNodeInfo;
import org.json.JSONArray;
import org.json.JSONObject;
import java.util.Iterator;

/** Real touchscreen gestures go through the installed TalkBack service while accessibility remains enabled. */
final class TalkBackTraversal {
    private final Instrumentation runner;
    private final UiAutomation ui;
    private final StringBuilder report = new StringBuilder();
    private GameDatabase game;

    TalkBackTraversal(Instrumentation runner) {
        this.runner = runner;
        ui = runner.getUiAutomation(UiAutomation.FLAG_DONT_SUPPRESS_ACCESSIBILITY_SERVICES);
    }

    String run() throws Exception {
        AccessibilityManager manager = runner.getTargetContext().getSystemService(AccessibilityManager.class);
        for (int i=0; i<40 && !manager.isTouchExplorationEnabled(); i++) SystemClock.sleep(500);
        require(manager.isTouchExplorationEnabled(), "Die echte TalkBack-Berührungserkundung muss eingeschaltet sein.");
        String services = android.provider.Settings.Secure.getString(runner.getTargetContext().getContentResolver(),
                android.provider.Settings.Secure.ENABLED_ACCESSIBILITY_SERVICES);
        require(services != null && services.contains("com.google.android.marvin.talkback"), "Google TalkBack fehlt");
        report.append("\nPASS Google TalkBack und tatsächliche Berührungserkundung sind aktiv.");
        Intent intent = runner.getTargetContext().getPackageManager().getLaunchIntentForPackage(runner.getTargetContext().getPackageName());
        Activity activity = runner.startActivitySync(intent);
        game = new GameDatabase(runner.getTargetContext());
        try {
            JSONObject first = null;
            for (int i=0; i<30 && first==null; i++) {
                SystemClock.sleep(300);
                try { first = session().getJSONArray("items").getJSONObject(0); }
                catch (Exception waiting) { /* HTML creates the new round after its assets have loaded. */ }
            }
            require(first != null && first.isNull("answer"), "Frischer unbeantworteter Prüflauf nötig.");
            JSONArray order = first.getJSONArray("order");
            JSONArray options = first.getJSONObject("q").getJSONArray("options");
            String firstText = option(options, order.getString(0));
            String secondText = option(options, order.getString(1));
            AccessibilityNodeInfo firstButton = find(firstText);
            firstButton.performAction(AccessibilityNodeInfo.AccessibilityAction.ACTION_SHOW_ON_SCREEN.getId());
            SystemClock.sleep(750);
            Rect bounds = new Rect();
            find(firstText).getBoundsInScreen(bounds);
            int x = bounds.centerX(), y = bounds.centerY();
            tap(x,y);
            waitFocus(firstText);
            report.append("\nPASS Eine einfache Berührung fokussiert die erste Antwort. ").append(firstText);
            require(session().getJSONArray("items").getJSONObject(0).isNull("answer"), "Berührungserkundung hat voreilig geantwortet.");
            swipeRight(x,y);
            waitFocus(secondText);
            report.append("\nPASS Ein echter Rechtswisch setzt TalkBack-Fokus auf die nächste Antwort. ").append(secondText);
            tap(x,y);
            SystemClock.sleep(75);
            tap(x,y);
            JSONObject answer = null;
            for (int i=0; i<20 && answer==null; i++) {
                SystemClock.sleep(250);
                answer=session().getJSONArray("items").getJSONObject(0).optJSONObject("answer");
            }
            require(answer != null && order.getString(1).equals(answer.optString("optionId")), "TalkBack-Doppeltipp hat die fokussierte Antwort nicht bestätigt.");
            report.append("\nPASS Der Doppeltipp antwortet mit der zuvor durch Wischen fokussierten Option.");
            find("Nächste Frage");
            report.append("\nPASS Nach der Antwort ist die nächste Aktion im nativen Zugänglichkeitsbaum vorhanden.");
            return report.toString();
        } finally {
            game.close();
            runner.runOnMainSync(activity::finish);
        }
    }

    private JSONObject session() throws Exception {
        JSONObject sessions = new JSONObject(game.read()).getJSONObject("value").getJSONObject("sessions");
        Iterator<String> keys = sessions.keys();
        while (keys.hasNext()) {
            JSONObject session = sessions.getJSONObject(keys.next());
            if ("daily".equals(session.getString("mode"))) return session;
        }
        throw new IllegalStateException("Tagesrunde fehlt");
    }

    private static String option(JSONArray options, String id) throws Exception {
        for (int i=0; i<options.length(); i++) {
            JSONObject row = options.getJSONObject(i);
            if (id.equals(row.getString("id"))) return row.getString("text");
        }
        throw new IllegalArgumentException("Antwort-ID fehlt");
    }

    private AccessibilityNodeInfo find(String text) {
        for (int i=0; i<25; i++) {
            AccessibilityNodeInfo root=ui.getRootInActiveWindow();
            if (root!=null) {
                for (AccessibilityNodeInfo node:root.findAccessibilityNodeInfosByText(text)) {
                    if (node.isVisibleToUser()) return node;
                }
            }
            SystemClock.sleep(220);
        }
        throw new AssertionError("Auf dem aktiven Systembildschirm fehlt: " + text);
    }

    private void waitFocus(String expected) {
        String seen="";
        for (int i=0; i<20; i++) {
            AccessibilityNodeInfo focused = ui.findFocus(AccessibilityNodeInfo.FOCUS_ACCESSIBILITY);
            if (focused!=null) {
                seen = focused.getText() + " " + focused.getContentDescription() + " " + focused.getClassName();
                if (seen.contains(expected)) return;
            }
            SystemClock.sleep(180);
        }
        throw new AssertionError("Erwarteter TalkBack-Fokus: " + expected + ". Beobachteter Fokus: " + seen);
    }

    private void event(long down, int action, int x, int y) {
        MotionEvent e=MotionEvent.obtain(down,SystemClock.uptimeMillis(),action,x,y,0);
        e.setSource(InputDevice.SOURCE_TOUCHSCREEN);
        try { require(ui.injectInputEvent(e,true),"Android hat die Berührung nicht angenommen"); }
        finally { e.recycle(); }
    }

    private void tap(int x, int y) {
        long start=SystemClock.uptimeMillis();
        event(start,MotionEvent.ACTION_DOWN,x,y);
        SystemClock.sleep(55);
        event(start,MotionEvent.ACTION_UP,x,y);
    }

    private void swipeRight(int x,int y) {
        long start=SystemClock.uptimeMillis();
        int left=Math.max(50,x-270);
        event(start,MotionEvent.ACTION_DOWN,left,y);
        for(int i=1; i<=9; i++) {
            SystemClock.sleep(16);
            event(start,MotionEvent.ACTION_MOVE,left+i*56,y);
        }
        event(start,MotionEvent.ACTION_UP,left+504,y);
    }

    private static void require(boolean yes, String text) {
        if (!yes) throw new AssertionError(text);
    }
}
