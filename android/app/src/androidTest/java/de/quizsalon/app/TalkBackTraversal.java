package de.quizsalon.app;

import android.app.Activity;
import android.app.Instrumentation;
import android.app.UiAutomation;
import android.content.Intent;
import android.graphics.Rect;
import android.os.Bundle;
import android.os.SystemClock;
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
            for(int position=0;position<10;position++) playQuestion(position);
            JSONObject completed=session();
            JSONObject result=completed.getJSONObject("result");
            require("completed".equals(completed.getString("status")) && result.getInt("valid")==10,
                    "Der Tagesabschluss fehlt.");
            JSONObject state=new JSONObject(game.read()).getJSONObject("value");
            JSONObject ledger=state.getJSONObject("ledger");
            require(ledger.length()==1 && ledger.getJSONObject("daily-complete:"+completed.getString("id")).getInt("xp")==result.getInt("xp"),
                    "Der Buchungsnachweis stimmt nicht mit dem Ergebnis überein.");
            find("Dein Rundenergebnis", true);
            report.append("\nPASS Gesamte Tagesrunde mit TalkBack. 10 gültige Antworten, ").append(result.getInt("correct"))
                    .append(" richtige Antworten, ").append(result.getInt("xp")).append(" XP und genau eine Abschlussbuchung.");
            gesture("result",540,600);
            SystemClock.sleep(2200);
            return report.toString();
        } finally {
            game.close();
            runner.runOnMainSync(activity::finish);
        }
    }

    private void playQuestion(int pos) throws Exception {
        JSONObject item=session().getJSONArray("items").getJSONObject(pos);
        require(item.isNull("answer"),"Frage wurde vor der Berührung schon beantwortet.");
        JSONArray order=item.getJSONArray("order");
        JSONArray options=item.getJSONObject("q").getJSONArray("options");
        String firstText=option(options,order.getString(0));
        // WebView exposes off-screen answers before large text has scrolled into view.
        AccessibilityNodeInfo firstButton=find(firstText, false);
        firstButton.performAction(AccessibilityNodeInfo.AccessibilityAction.ACTION_SHOW_ON_SCREEN.getId());
        SystemClock.sleep(500);
        Rect bounds=new Rect();
        firstButton=find(firstText, false);
        firstButton.getBoundsInScreen(bounds);
        android.util.DisplayMetrics display=runner.getTargetContext().getResources().getDisplayMetrics();
        boolean onScreen=firstButton.isVisibleToUser() && bounds.intersect(0,0,display.widthPixels,display.heightPixels);
        int x=onScreen ? bounds.centerX() : display.widthPixels/2;
        int y=onScreen ? bounds.centerY() : display.heightPixels/3;
        gesture("explore",x,y);
        SystemClock.sleep(1100);
        String label=focus();
        int index=answerIndex(options,order,label);
        for(int i=0;i<28 && index<0;i++) {
            label=nextFocus(x,y);
            index=answerIndex(options,order,label);
        }
        require(index>=0,"Keine Antwort im TalkBack-Fokus. " + label);
        require(session().getJSONArray("items").getJSONObject(pos).isNull("answer"),"Voreilige Antwort durch Berührungserkundung.");
        int next=index==3 ? index-1 : index+1;
        String target=option(options,order.getString(next));
        gesture(index==3?"answerLeft":"answerRight",x,y);
        waitFocus(target);
        gesture("doubleTap",x,y);
        JSONObject saved=null;
        for(int i=0;i<24 && saved==null;i++) {
            SystemClock.sleep(225);
            saved=session().getJSONArray("items").getJSONObject(pos).optJSONObject("answer");
        }
        require(saved!=null && order.getString(next).equals(saved.optString("optionId")),"Abweichende Antwort nach Doppeltipp.");
        String nextLabel=pos==9 ? "Ergebnis ansehen" : "Nächste Frage";
        find(nextLabel, false);
        String action=focus();
        for(int i=0;i<28 && !action.contains(nextLabel);i++) action=nextFocus(x,y);
        require(action.contains(nextLabel),"Weiteraktion im TalkBack-Fokus fehlt: "+action);
        gesture("activate",x,y);
        boolean moved=false;
        for(int i=0;i<35&&!moved;i++) {
            SystemClock.sleep(220);
            JSONObject current=session();
            moved=pos==9 ? "completed".equals(current.optString("status")) : current.optInt("cursor")==pos+1;
        }
        require(moved,"Der TalkBack-Doppeltipp auf "+nextLabel+" hat die Runde nicht weitergeführt.");
        String message="Frage "+(pos+1)+" von 10. TalkBack-Fokus auf "+label+", Wischziel "+target+
                ", Doppeltipp mit gespeichertem Antwortwert, "+nextLabel+" fokussiert und per Doppeltipp aktiviert.";
        report.append("\nPASS ").append(message);
        Bundle progress=new Bundle();
        progress.putString("quizCheck",message);
        runner.sendStatus(1,progress);
    }

    private String nextFocus(int x,int y) {
        String old=focus(), current=old;
        gesture("swipeRight",x,y);
        for(int i=0;i<12 && current.equals(old);i++) {SystemClock.sleep(150);current=focus();}
        return current;
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

    private AccessibilityNodeInfo find(String text, boolean visibleOnly) {
        StringBuilder observed=new StringBuilder();
        for (int i=0; i<50; i++) {
            AccessibilityNodeInfo root=ui.getRootInActiveWindow();
            observed.setLength(0);
            AccessibilityNodeInfo node=search(root,text,visibleOnly,observed,0);
            if(node!=null) return node;
            SystemClock.sleep(350);
        }
        throw new AssertionError(report+"\nAuf dem aktiven Systembildschirm fehlt: " + text + ". Baum: " + observed);
    }

    private AccessibilityNodeInfo search(AccessibilityNodeInfo node,String text,boolean visibleOnly,StringBuilder observed,int depth) {
        if(node==null || depth>45) return null;
        String label=String.valueOf(node.getText())+" "+node.getContentDescription();
        if(observed.length()<1800) observed.append(node.getClassName()).append('(').append(label).append(") ");
        if((!visibleOnly || node.isVisibleToUser()) && label.contains(text)) return node;
        for(int i=0; i<node.getChildCount(); i++) {
            AccessibilityNodeInfo found=search(node.getChild(i),text,visibleOnly,observed,depth+1);
            if(found!=null) return found;
        }
        return null;
    }

    private void waitFocus(String expected) {
        String seen="";
        for (int i=0; i<45; i++) {
            seen=focus();
            if (seen.contains(expected)) return;
            SystemClock.sleep(180);
        }
        throw new AssertionError("Erwarteter TalkBack-Fokus: " + expected + ". Beobachteter Fokus: " + seen);
    }

    private String focus() {
        AccessibilityNodeInfo focused=ui.findFocus(AccessibilityNodeInfo.FOCUS_ACCESSIBILITY);
        return focused==null ? "Kein Fokus" : focused.getText()+" "+focused.getContentDescription()+" "+focused.getClassName();
    }

    private int answerIndex(JSONArray options,JSONArray order,String label) throws Exception {
        for(int i=0;i<order.length();i++) if(label.contains(option(options,order.getString(i)))) return i;
        return -1;
    }

    private void gesture(String kind,int x,int y) {
        // UiAutomation.injectInputEvent bypasses touch exploration. Request an event on the emulator's touchscreen instead.
        Bundle step=new Bundle();
        step.putString("quizGesture",kind+" "+x+" "+y);
        runner.sendStatus(1,step);
    }

    private static void require(boolean yes, String text) {
        if (!yes) throw new AssertionError(text);
    }
}
