package de.quizsalon.app;

import android.content.ContentValues;
import android.content.Context;
import android.database.Cursor;
import android.database.sqlite.SQLiteDatabase;
import android.database.sqlite.SQLiteOpenHelper;
import android.database.sqlite.SQLiteStatement;
import android.util.AtomicFile;

import org.json.JSONObject;

import java.io.File;
import java.io.FileNotFoundException;
import java.io.FileOutputStream;
import java.io.IOException;
import java.nio.charset.StandardCharsets;
import java.util.UUID;

/** The JavaScript domain layer computes one change. The revision and every chunk commit together. */
final class GameDatabase extends SQLiteOpenHelper {
    private final AtomicFile installFile;
    private String installationId;

    GameDatabase(Context context) {
        super(context, "game.db", null, 2);
        setWriteAheadLoggingEnabled(false);
        installFile = new AtomicFile(new File(context.getNoBackupFilesDir(), "installation"));
    }

    @Override public void onCreate(SQLiteDatabase db) {
        db.execSQL("CREATE TABLE head (id INTEGER PRIMARY KEY CHECK(id=1), revision INTEGER NOT NULL)");
        db.execSQL("INSERT INTO head VALUES(1, 0)");
        db.execSQL("CREATE TABLE chunks (position INTEGER PRIMARY KEY, value TEXT NOT NULL)");
    }

    @Override public void onUpgrade(SQLiteDatabase db, int before, int after) {
        if (before != 1 || after != 2) throw new IllegalStateException("Unbekanntes Spielstandschema");
        onCreate(db);
        db.execSQL("UPDATE head SET revision = COALESCE((SELECT revision FROM save WHERE id=1),0)");
        // SQLite substr counts Unicode characters. Small rows stay below Android's CursorWindow limit.
        db.execSQL("WITH RECURSIVE pages(pos) AS (SELECT 0 UNION ALL SELECT pos+1 FROM pages " +
                "WHERE (pos+1)*32768 < (SELECT length(value) FROM save WHERE id=1)) " +
                "INSERT INTO chunks SELECT pos, substr(value, pos*32768+1,32768) FROM pages,save WHERE id=1");
        db.execSQL("DROP TABLE save");
    }

    String read() {
        SQLiteDatabase db = getReadableDatabase();
        db.beginTransaction();
        try {
            long rev;
            try (Cursor cursor = db.rawQuery("SELECT revision FROM head WHERE id=1", null)) {
                if (!cursor.moveToFirst()) throw new IllegalStateException("Spielstand fehlt");
                rev = cursor.getLong(0);
            }
            StringBuilder value = new StringBuilder();
            try (Cursor cursor = db.rawQuery("SELECT value FROM chunks ORDER BY position", null)) {
                while (cursor.moveToNext()) value.append(cursor.getString(0));
            }
            db.setTransactionSuccessful();
            return "{\"rev\":" + rev + ",\"value\":" + (value.length() == 0 ? "null" : value) + "}";
        } finally {
            db.endTransaction();
        }
    }

    boolean write(long expected, String json) {
        if (expected < 0 || json == null) throw new IllegalArgumentException("Ungültiger Spielstand");
        try {
            new JSONObject(json);
        } catch (org.json.JSONException invalid) {
            throw new IllegalArgumentException("Ungültiger Spielstand");
        }
        SQLiteDatabase db = getWritableDatabase();
        db.beginTransaction();
        try (SQLiteStatement update = db.compileStatement(
                "UPDATE head SET revision=revision+1 WHERE id=1 AND revision=?")) {
            update.bindLong(1, expected);
            if (update.executeUpdateDelete() != 1) return false;
            db.delete("chunks", null, null);
            int position = 0;
            for (int start = 0; start < json.length();) {
                int end = Math.min(start + 32768, json.length());
                if (end < json.length() && Character.isHighSurrogate(json.charAt(end - 1))) end--;
                ContentValues row = new ContentValues();
                row.put("position", position++);
                row.put("value", json.substring(start, end));
                db.insertOrThrow("chunks", null, row);
                start = end;
            }
            db.setTransactionSuccessful();
            return true;
        } finally {
            db.endTransaction();
        }
    }

    synchronized String installationId() {
        if (installationId != null) return installationId;
        try {
            installationId = new String(installFile.readFully(), StandardCharsets.UTF_8);
        } catch (FileNotFoundException missing) {
            String id = UUID.randomUUID().toString();
            FileOutputStream stream = null;
            try {
                stream = installFile.startWrite();
                stream.write(id.getBytes(StandardCharsets.UTF_8));
                installFile.finishWrite(stream);
                installationId = id;
            } catch (IOException failure) {
                installFile.failWrite(stream);
                throw new IllegalStateException("Installationskennung konnte nicht gespeichert werden");
            }
        } catch (IOException failure) {
            throw new IllegalStateException("Installationskennung konnte nicht gelesen werden");
        }
        return installationId;
    }
}
