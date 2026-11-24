package de.quizsalon.app;

import android.app.Activity;
import android.app.Instrumentation;
import android.app.UiAutomation;
import android.content.Intent;
import android.graphics.Rect;
import android.net.Uri;
import android.os.Bundle;
import android.os.SystemClock;
import android.util.Base64;
import android.view.View;
import android.view.ViewGroup;
import android.view.accessibility.AccessibilityManager;
import android.view.accessibility.AccessibilityNodeInfo;
import android.webkit.WebView;
import org.json.JSONArray;
import org.json.JSONObject;
import java.util.Iterator;
import java.util.ArrayList;
import java.util.Collections;
import java.nio.charset.StandardCharsets;

/** Real touchscreen gestures go through the installed TalkBack service while accessibility remains enabled. */
final class TalkBackTraversal {
    private final Instrumentation runner;
    private final UiAutomation ui;
    private final StringBuilder report = new StringBuilder();
    private GameDatabase game;
    private String mode = "daily";
    private int length = 10;

    TalkBackTraversal(Instrumentation runner) {
        this.runner = runner;
        ui = runner.getUiAutomation(UiAutomation.FLAG_DONT_SUPPRESS_ACCESSIBILITY_SERVICES);
    }

    String run(String encodedInvitation) throws Exception {
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
            if (encodedInvitation != null) return playInvitation(activity, encodedInvitation);
            JSONObject first = null;
            for (int i=0; i<30 && first==null; i++) {
                SystemClock.sleep(300);
                try { first = session().getJSONArray("items").getJSONObject(0); }
                catch (Exception waiting) { /* HTML creates the new round after its assets have loaded. */ }
            }
            require(first != null && first.isNull("answer"), "Frischer unbeantworteter Prüflauf nötig.");
            for(int position=0;position<length;position++) playQuestion(position);
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

    private String playInvitation(Activity activity, String encoded) throws Exception {
        String fragment = new String(Base64.decode(encoded, Base64.URL_SAFE), StandardCharsets.UTF_8);
        require(fragment.startsWith("#freunde/1/"), "Ein erspielter Einladungslink der aktuellen Version ist erforderlich.");
        String[] parts = fragment.split("/");
        require(parts.length == 8, "Einladung erwartet fünf Karten.");
        // This local navigation belongs exclusively to the separate test APK. The ordinary
        // public invitation URL opens a browser; the application's manifest has no link filter.
        find("Heute am Tisch mit drei Computergegnern", false);
        exploreText("Heute am Tisch mit drei Computergegnern");
        report.append("\nPASS Vor der ersten Antwort erreichte der echte TalkBack-Fokus die Bezeichnung „Heute am Tisch mit drei Computergegnern“.");
        JSONObject before = new JSONObject(game.read()).getJSONObject("value");
        runner.runOnMainSync(() -> findWeb(activity.findViewById(android.R.id.content)).loadUrl(
                "https://" + MainActivity.HOST + "/index.html" + fragment));
        find("Deine Einladung", false);
        focusButton("Freundesrunde starten");
        JSONObject preview = new JSONObject(game.read()).getJSONObject("value");
        for (String part : new String[]{"progress", "ledger", "trials", "awards", "sessions"}) {
            require(before.getJSONObject(part).toString().equals(preview.getJSONObject(part).toString()),
                    "Die reine Einladungsansicht änderte " + part);
        }
        gesture("invite", 540, 1000);
        SystemClock.sleep(1200);
        activateFocused();
        mode = "friend";
        length = 5;
        JSONObject round = null;
        for (int i=0; i<35 && round==null; i++) {
            try { round = session(); }
            catch (Exception waiting) { SystemClock.sleep(250); }
        }
        require(round != null && round.optInt("friendScore") == Integer.parseInt(parts[2]), "Empfangener Trefferwert fehlt.");
        for (int i=0; i<length; i++) {
            JSONObject item = round.getJSONArray("items").getJSONObject(i);
            JSONObject question = item.getJSONObject("q");
            String[] card = parts[i+3].split("~");
            require(Uri.decode(card[0]).equals(question.getString("id")) &&
                    Integer.parseInt(card[1]) == question.getInt("content_revision") &&
                    Integer.parseInt(card[2]) == question.getInt("semantic_revision"), "Abweichende Kartenfassung.");
            ArrayList<String> ids = new ArrayList<>();
            JSONArray options = question.getJSONArray("options");
            for (int j=0; j<4; j++) ids.add(options.getJSONObject(j).getString("id"));
            Collections.sort(ids);
            for (int j=0; j<4; j++) require(ids.get(card[3].charAt(j)-'0').equals(item.getJSONArray("order").getString(j)),
                    "Abweichende Antwortreihenfolge.");
        }
        report.append("\nPASS Einladung per TalkBack-Doppeltipp angenommen. Fünf Karten, beide Revisionen und alle 20 Antwortpositionen stimmen mit dem geteilten Link überein.");
        for (int i=0; i<length; i++) playQuestion(i);
        JSONObject complete = session(), result = complete.getJSONObject("result");
        JSONObject after = new JSONObject(game.read()).getJSONObject("value");
        require("completed".equals(complete.getString("status")) && result.getInt("valid")==5 &&
                result.getInt("xp")==0 && before.getJSONObject("ledger").toString().equals(after.getJSONObject("ledger").toString()),
                "Freundesrunde oder Tageswertung nach Abschluss fehlerhaft.");
        for (int i=0; i<length; i++) {
            JSONObject q=complete.getJSONArray("items").getJSONObject(i).getJSONObject("q");
            require(after.getJSONObject("progress").has(q.getString("id")+"@"+q.getInt("semantic_revision")),
                    "Lernbuchung für die eigene Antwort fehlt.");
        }
        find("Dein Rundenergebnis", false);
        exploreText("Geteiltes Ergebnis");
        find(result.getInt("correct")+" von 5", false);
        find(Integer.parseInt(parts[2])+" von 5", false);
        gesture("result", 540, 900);
        SystemClock.sleep(1200);
        focusButton("Ergebnis zurückschicken");
        focusButton("Noch 5 Fragen");
        activateUntil("Thema wählen","Deine Themen");
        find("Deine Themen", false);
        // Compound tile labels include the number of questions and available scopes.
        AccessibilityNodeInfo category = find("Natur und Tiere", false);
        while (category!=null && !"android.widget.Button".contentEquals(category.getClassName())) category=category.getParent();
        require(category!=null,"Naturkategorie ist nicht als Schaltfläche erreichbar.");
        String name = nodeText(category);
        activateUntil(name,"Gesamte Kategorie");
        String scopeSelected="document.querySelector('[data-action=topic-scope][data-subtopic=wetter]')?.getAttribute('aria-pressed')==='true'";
        for (int attempt=0;attempt<3 && !observed(activity,scopeSelected);attempt++) {
            activateUntil("Wetter","Mit Quizsalon Plus");
            SystemClock.sleep(350);
        }
        require(observed(activity,scopeSelected),"Wetter ist nach der TalkBack-Aktivierung nicht ausgewählt.");
        find("Quizsalon Plus ansehen", false);
        gesture("scope", 540, 900);
        SystemClock.sleep(1200);
        report.append("\nPASS Gesamte Freundesrunde mit TalkBack. Fünf eigene Antworten, ")
                .append(result.getInt("correct")).append(" richtige Antworten, übermittelter Wert ")
                .append(parts[2]).append(" von 5. Alle persönlichen Lernbuchungen vorhanden, Tageswertung identisch. ")
                .append("Rückmeldung und Ergebnisaktionen fokussiert, Themenwahl geöffnet, Wetter im Plus-Angebot erreicht.");
        return report.toString();
    }

    private static WebView findWeb(View node) {
        if (node instanceof WebView) return (WebView) node;
        if (node instanceof ViewGroup) {
            ViewGroup group = (ViewGroup) node;
            for (int i=0; i<group.getChildCount(); i++) {
                WebView web=findWeb(group.getChildAt(i));
                if (web!=null) return web;
            }
        }
        return null;
    }

    private String nodeText(AccessibilityNodeInfo node) {
        String text=node.getText()==null ? "" : normalized(node.getText().toString());
        return text.isEmpty() ? normalized(String.valueOf(node.getContentDescription())) : text;
    }

    private void exploreText(String label) {
        find(label,false);
        AccessibilityNodeInfo target = textTarget(label);
        target.performAction(AccessibilityNodeInfo.AccessibilityAction.ACTION_SHOW_ON_SCREEN.getId());
        SystemClock.sleep(600);
        target=textTarget(label);
        Rect bounds = new Rect();
        target.getBoundsInScreen(bounds);
        int x=bounds.left+Math.min(bounds.width()/3,110);
        int y=bounds.top+Math.min(bounds.height()/2,46);
        gesture("explore",x,y);
        SystemClock.sleep(1150);
        int centerX=runner.getTargetContext().getResources().getDisplayMetrics().widthPixels/2;
        int centerY=runner.getTargetContext().getResources().getDisplayMetrics().heightPixels/2;
        note("Textposition "+label+" "+bounds+"; TalkBack-Fokus nach Berührung: "+focus());
        for (int i=0; i<11 && !focus().contains(label); i++) {
            stepFocus("swipeLeft",centerX,centerY);
            note("Rückwärtsfokus: "+focus());
        }
        for (int i=0; i<28 && !focus().contains(label); i++) {
            nextFocus(centerX,centerY);
            note("Vorwärtsfokus: "+focus());
        }
        require(focus().contains(label),"TalkBack konnte den Text nicht fokussieren: "+label+" ("+focus()+")");
    }

    private AccessibilityNodeInfo textTarget(String label) {
        AccessibilityNodeInfo best=exactText(ui.getRootInActiveWindow(),label);
        return best!=null ? best : find(label,false);
    }

    private AccessibilityNodeInfo exactText(AccessibilityNodeInfo node,String label) {
        if (node==null) return null;
        // A labelled WebView section can contain a separate, smaller, speakable heading.
        // Search its children first so touch exploration lands on the text itself.
        for (int i=0;i<node.getChildCount();i++) {
            AccessibilityNodeInfo candidate=exactText(node.getChild(i),label);
            if (candidate!=null) return candidate;
        }
        return normalized(String.valueOf(node.getText())).equals(label) ? node : null;
    }

    private void note(String text) {
        Bundle status=new Bundle();
        status.putString("quizFocus",text);
        runner.sendStatus(1,status);
    }

    private void focusButton(String label) {
        AccessibilityNodeInfo target=findButton(label);
        target.performAction(AccessibilityNodeInfo.AccessibilityAction.ACTION_SHOW_ON_SCREEN.getId());
        SystemClock.sleep(550);
        target=findButton(label);
        Rect bounds=new Rect();
        target.getBoundsInScreen(bounds);
        android.util.DisplayMetrics display=runner.getTargetContext().getResources().getDisplayMetrics();
        if (bounds.intersect(0,0,display.widthPixels,display.heightPixels)) {
            gesture("explore",bounds.centerX(),bounds.centerY());
            SystemClock.sleep(1050);
        }
        for (int i=0; i<28 && !isFocusedButton(label); i++) nextFocus(display.widthPixels/2,display.heightPixels/2);
        require(isFocusedButton(label),"TalkBack konnte die Schaltfläche nicht fokussieren: "+label+" ("+focus()+")");
    }

    private void activateFocused() {
        android.util.DisplayMetrics display=runner.getTargetContext().getResources().getDisplayMetrics();
        gesture("activate",display.widthPixels/2,display.heightPixels/2);
        SystemClock.sleep(850);
    }

    private void activateUntil(String button,String nextText) {
        android.util.DisplayMetrics display=runner.getTargetContext().getResources().getDisplayMetrics();
        for (int attempt=0;attempt<3;attempt++) {
            focusButton(button);
            SystemClock.sleep(450);
            Rect bounds=new Rect();
            findButton(button).getBoundsInScreen(bounds);
            require(bounds.intersect(0,0,display.widthPixels,display.heightPixels),"Schaltfläche außerhalb des Bildschirms.");
            note("Aktivierung "+button+" im Fokus "+focus()+" bei "+bounds);
            gesture("activate",bounds.centerX(),bounds.centerY());
            for (int i=0;i<15;i++) {
                SystemClock.sleep(220);
                if(search(ui.getRootInActiveWindow(),nextText,false,false,new StringBuilder(),0)!=null) return;
            }
        }
        throw new AssertionError("Nach dem Doppeltipp auf "+button+" fehlt "+nextText+". Fokus: "+focus());
    }

    private boolean observed(Activity activity,String expression) throws Exception {
        // Inspect the selected scope only after the real gesture. The test never changes it through JavaScript.
        java.util.concurrent.CountDownLatch latch=new java.util.concurrent.CountDownLatch(1);
        java.util.concurrent.atomic.AtomicBoolean result=new java.util.concurrent.atomic.AtomicBoolean();
        runner.runOnMainSync(()->findWeb(activity.findViewById(android.R.id.content)).evaluateJavascript(expression,value->{
            result.set("true".equals(value));
            latch.countDown();
        }));
        return latch.await(4,java.util.concurrent.TimeUnit.SECONDS) && result.get();
    }

    private void playQuestion(int pos) throws Exception {
        JSONObject item=session().getJSONArray("items").getJSONObject(pos);
        require(item.isNull("answer"),"Frage wurde vor der Berührung schon beantwortet.");
        JSONArray order=item.getJSONArray("order");
        JSONArray options=item.getJSONObject("q").getJSONArray("options");
        String firstText=option(options,order.getString(0));
        // WebView exposes off-screen answers before large text has scrolled into view.
        AccessibilityNodeInfo firstButton=findButton(firstText);
        firstButton.performAction(AccessibilityNodeInfo.AccessibilityAction.ACTION_SHOW_ON_SCREEN.getId());
        SystemClock.sleep(500);
        Rect bounds=new Rect();
        firstButton=findButton(firstText);
        firstButton.getBoundsInScreen(bounds);
        android.util.DisplayMetrics display=runner.getTargetContext().getResources().getDisplayMetrics();
        boolean onScreen=firstButton.isVisibleToUser() && bounds.intersect(0,0,display.widthPixels,display.heightPixels);
        int x=onScreen ? bounds.centerX() : display.widthPixels/2;
        int y=onScreen ? bounds.centerY() : display.heightPixels/3;
        gesture("explore",x,y);
        SystemClock.sleep(1100);
        String label=focus();
        int index=answerIndex(options,order);
        for(int i=0;i<28 && index<0;i++) {
            label=nextFocus(x,y);
            index=answerIndex(options,order);
        }
        require(index>=0,"Keine Antwort im TalkBack-Fokus. " + label);
        require(session().getJSONArray("items").getJSONObject(pos).isNull("answer"),"Voreilige Antwort durch Berührungserkundung.");
        int next=index==3 ? index-1 : index+1;
        String target=option(options,order.getString(next));
        gesture(index==3?"answerLeft":"answerRight",x,y);
        waitFocus(target);
        gesture("doubleTap",display.widthPixels/2,display.heightPixels/2);
        JSONObject saved=null;
        for(int i=0;i<24 && saved==null;i++) {
            SystemClock.sleep(225);
            saved=session().getJSONArray("items").getJSONObject(pos).optJSONObject("answer");
        }
        require(saved!=null && order.getString(next).equals(saved.optString("optionId")),"Abweichende Antwort nach Doppeltipp.");
        String nextLabel=pos==length-1 ? "Ergebnis ansehen" : "Nächste Frage";
        findButton(nextLabel);
        int centerX=display.widthPixels/2, centerY=display.heightPixels/2;
        for(int i=0;i<28 && !isFocusedButton(nextLabel);i++) nextFocus(centerX,centerY);
        require(isFocusedButton(nextLabel),"Weiteraktion im TalkBack-Fokus fehlt: "+focus());
        gesture("activate",centerX,centerY);
        boolean moved=awaitAdvance(pos);
        if(!moved) {
            // A long feedback panel can finish scrolling after the spoken focus changed. Explore
            // the actual system button again, then send another genuine TalkBack double tap.
            AccessibilityNodeInfo button=findButton(nextLabel);
            button.performAction(AccessibilityNodeInfo.AccessibilityAction.ACTION_SHOW_ON_SCREEN.getId());
            SystemClock.sleep(650);
            button=findButton(nextLabel);
            Rect targetBounds=new Rect();
            button.getBoundsInScreen(targetBounds);
            require(button.isVisibleToUser() && targetBounds.intersect(0,0,display.widthPixels,display.heightPixels),
                    "Weiteraktion nach Berührung nicht sichtbar: "+nextLabel+" ("+focus()+")");
            int targetX=targetBounds.centerX(), targetY=targetBounds.centerY();
            gesture("explore",targetX,targetY);
            waitFocus(nextLabel);
            gesture("activate",centerX,centerY);
            moved=awaitAdvance(pos);
        }
        require(moved,"Der TalkBack-Doppeltipp auf "+nextLabel+" hat die Runde nicht weitergeführt. Fokus: "+focus());
        String message="Frage "+(pos+1)+" von "+length+". TalkBack-Fokus auf "+label+", Wischziel "+target+
                ", Doppeltipp mit gespeichertem Antwortwert, "+nextLabel+" fokussiert und per Doppeltipp aktiviert.";
        report.append("\nPASS ").append(message);
        Bundle progress=new Bundle();
        progress.putString("quizCheck",message);
        runner.sendStatus(1,progress);
    }

    private boolean awaitAdvance(int position) throws Exception {
        for(int i=0;i<30;i++) {
            SystemClock.sleep(220);
            JSONObject item=session();
            if(position==length-1 ? "completed".equals(item.optString("status")) : item.optInt("cursor")==position+1) return true;
        }
        return false;
    }

    private String nextFocus(int x,int y) {
        return stepFocus("swipeRight",x,y);
    }

    private String stepFocus(String direction,int x,int y) {
        String old=focus(), current=old;
        gesture(direction,x,y);
        for(int i=0;i<12 && current.equals(old);i++) {SystemClock.sleep(150);current=focus();}
        return current;
    }

    private JSONObject session() throws Exception {
        JSONObject sessions = new JSONObject(game.read()).getJSONObject("value").getJSONObject("sessions");
        Iterator<String> keys = sessions.keys();
        while (keys.hasNext()) {
            JSONObject session = sessions.getJSONObject(keys.next());
            if (mode.equals(session.getString("mode"))) return session;
        }
        throw new IllegalStateException("Gesuchte Runde fehlt: "+mode);
    }

    private static String option(JSONArray options, String id) throws Exception {
        for (int i=0; i<options.length(); i++) {
            JSONObject row = options.getJSONObject(i);
            if (id.equals(row.getString("id"))) return row.getString("text");
        }
        throw new IllegalArgumentException("Antwort-ID fehlt");
    }

    private AccessibilityNodeInfo find(String text, boolean visibleOnly) {
        return find(text,visibleOnly,false);
    }
    private AccessibilityNodeInfo findButton(String text) {
        return find(text,false,true);
    }
    private AccessibilityNodeInfo find(String text, boolean visibleOnly, boolean button) {
        StringBuilder observed=new StringBuilder();
        for (int i=0; i<50; i++) {
            AccessibilityNodeInfo root=ui.getRootInActiveWindow();
            observed.setLength(0);
            AccessibilityNodeInfo node=search(root,text,visibleOnly,button,observed,0);
            if(node!=null) return node;
            SystemClock.sleep(350);
        }
        throw new AssertionError(report+"\nAuf dem aktiven Systembildschirm fehlt: " + text + ". Baum: " + observed);
    }

    private AccessibilityNodeInfo search(AccessibilityNodeInfo node,String text,boolean visibleOnly,boolean button,StringBuilder observed,int depth) {
        if(node==null || depth>45) return null;
        String label=normalized(String.valueOf(node.getText())+" "+node.getContentDescription());
        if(observed.length()<1800) observed.append(node.getClassName()).append('(').append(label).append(") ");
        if((!visibleOnly || node.isVisibleToUser()) && (button ? matchesButton(node,text) : label.contains(text))) return node;
        for(int i=0; i<node.getChildCount(); i++) {
            AccessibilityNodeInfo found=search(node.getChild(i),text,visibleOnly,button,observed,depth+1);
            if(found!=null) return found;
        }
        return null;
    }

    private void waitFocus(String expected) {
        String seen="";
        for (int i=0; i<45; i++) {
            seen=focus();
            if (isFocusedButton(expected)) return;
            SystemClock.sleep(180);
        }
        throw new AssertionError("Erwarteter TalkBack-Fokus: " + expected + ". Beobachteter Fokus: " + seen);
    }

    private String focus() {
        AccessibilityNodeInfo focused=ui.findFocus(AccessibilityNodeInfo.FOCUS_ACCESSIBILITY);
        return focused==null ? "Kein Fokus" : normalized(focused.getText()+" "+focused.getContentDescription()+" "+focused.getClassName());
    }

    private static String normalized(String text) {
        return text.replace('\u00a0',' ').replaceAll("\\s+"," ").trim();
    }

    private static boolean matchesButton(AccessibilityNodeInfo node,String text) {
        if (node==null) return false;
        CharSequence role=node.getClassName();
        return ("android.widget.Button".contentEquals(role) || "android.widget.ToggleButton".contentEquals(role))
                && (normalized(text).equals(normalized(String.valueOf(node.getText())))
                    || normalized(text).equals(normalized(String.valueOf(node.getContentDescription()))));
    }
    private boolean isFocusedButton(String text) {
        return matchesButton(ui.findFocus(AccessibilityNodeInfo.FOCUS_ACCESSIBILITY),text);
    }
    private int answerIndex(JSONArray options,JSONArray order) throws Exception {
        AccessibilityNodeInfo current=ui.findFocus(AccessibilityNodeInfo.FOCUS_ACCESSIBILITY);
        for(int i=0;i<order.length();i++) if(matchesButton(current,option(options,order.getString(i)))) return i;
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
