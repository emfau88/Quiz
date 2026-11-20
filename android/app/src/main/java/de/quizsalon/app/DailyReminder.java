package de.quizsalon.app;

import android.Manifest;
import android.app.AlarmManager;
import android.app.Notification;
import android.app.NotificationChannel;
import android.app.NotificationManager;
import android.app.PendingIntent;
import android.content.BroadcastReceiver;
import android.content.Context;
import android.content.Intent;
import android.content.SharedPreferences;
import android.content.pm.PackageManager;
import android.os.Build;

import java.util.Calendar;
import java.util.TimeZone;
import java.util.regex.Pattern;

public final class DailyReminder extends BroadcastReceiver {
    static final String CHANNEL = "tagesrunde";
    static final String FIRE = "de.quizsalon.app.FIRE";
    static final Pattern CLOCK_TIME = Pattern.compile("(?:[01]\\d|2[0-3]):[0-5]\\d");

    static SharedPreferences prefs(Context context) {
        return context.getSharedPreferences("reminders", Context.MODE_PRIVATE);
    }

    static boolean permitted(Context context) {
        NotificationManager manager = context.getSystemService(NotificationManager.class);
        if (!manager.areNotificationsEnabled()) return false;
        if (Build.VERSION.SDK_INT >= 33 && context.checkSelfPermission(Manifest.permission.POST_NOTIFICATIONS)
                != PackageManager.PERMISSION_GRANTED) return false;
        if (Build.VERSION.SDK_INT >= 26) {
            NotificationChannel channel = manager.getNotificationChannel(CHANNEL);
            return channel == null || channel.getImportance() != NotificationManager.IMPORTANCE_NONE;
        }
        return true;
    }

    static long nextTime(String time, long now, TimeZone zone) {
        Calendar calendar = Calendar.getInstance(zone);
        calendar.setTimeInMillis(now);
        int hour = Integer.parseInt(time.substring(0, 2));
        int minute = Integer.parseInt(time.substring(3));
        calendar.set(Calendar.HOUR_OF_DAY, hour);
        calendar.set(Calendar.MINUTE, minute);
        calendar.set(Calendar.SECOND, 0);
        calendar.set(Calendar.MILLISECOND, 0);
        if (calendar.getTimeInMillis() <= now) {
            calendar.add(Calendar.DAY_OF_MONTH, 1);
            calendar.set(Calendar.HOUR_OF_DAY, hour);
            calendar.set(Calendar.MINUTE, minute);
        }
        return calendar.getTimeInMillis();
    }

    static void schedule(Context context) {
        String time = prefs(context).getString("time", "");
        AlarmManager alarms = context.getSystemService(AlarmManager.class);
        Intent intent = new Intent(context, DailyReminder.class).setAction(FIRE);
        PendingIntent alarm = PendingIntent.getBroadcast(context, 1, intent, PendingIntent.FLAG_IMMUTABLE);
        alarms.cancel(alarm);
        if (CLOCK_TIME.matcher(time).matches() && permitted(context)) {
            alarms.setAndAllowWhileIdle(AlarmManager.RTC_WAKEUP,
                    nextTime(time, System.currentTimeMillis(), TimeZone.getDefault()), alarm);
        } else {
            context.getSystemService(NotificationManager.class).cancel(7);
        }
    }

    @Override public void onReceive(Context context, Intent intent) {
        if (FIRE.equals(intent.getAction()) && !prefs(context).getString("time", "").isEmpty()
                && permitted(context)) {
            NotificationManager notifications = context.getSystemService(NotificationManager.class);
            Notification.Builder builder;
            if (Build.VERSION.SDK_INT >= 26) {
                notifications.createNotificationChannel(new NotificationChannel(CHANNEL,
                        "Tagesrunde", NotificationManager.IMPORTANCE_DEFAULT));
                builder = new Notification.Builder(context, CHANNEL);
            } else {
                builder = new Notification.Builder(context);
            }
            Intent open = context.getPackageManager().getLaunchIntentForPackage(context.getPackageName());
            if (open != null) {
                builder.setContentIntent(PendingIntent.getActivity(context, 2, open,
                        PendingIntent.FLAG_IMMUTABLE | PendingIntent.FLAG_UPDATE_CURRENT));
            }
            notifications.notify(7, builder.setSmallIcon(R.drawable.ic_reminder)
                    .setContentTitle("Quizsalon").setContentText("Deine Tagesrunde wartet auf dich.")
                    .setAutoCancel(true).build());
        }
        schedule(context);
    }
}
