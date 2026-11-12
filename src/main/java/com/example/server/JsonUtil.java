package com.example.server;

import java.util.HashMap;
import java.util.List;
import java.util.Map;

/**
 * Lightweight JSON helper — no external libraries.
 * Builds JSON strings manually and parses simple flat JSON request bodies.
 */
public final class JsonUtil {

    private JsonUtil() { }

    // ── Builders ──────────────────────────────────────────────────────

    /**
     * Builds a JSON object string from a map of key→value pairs.
     * Values are emitted as-is (caller decides quoting).
     * Use {@link #quoted(String)} for string values.
     */
    public static String jsonObject(Map<String, String> fields) {
        StringBuilder sb = new StringBuilder("{");
        boolean first = true;
        for (Map.Entry<String, String> e : fields.entrySet()) {
            if (!first) sb.append(",");
            sb.append("\"").append(escape(e.getKey())).append("\":")
              .append(e.getValue());
            first = false;
        }
        sb.append("}");
        return sb.toString();
    }

    /**
     * Wraps a list of already-serialised JSON objects into a JSON array.
     */
    public static String jsonArray(List<String> jsonObjects) {
        StringBuilder sb = new StringBuilder("[");
        for (int i = 0; i < jsonObjects.size(); i++) {
            if (i > 0) sb.append(",");
            sb.append(jsonObjects.get(i));
        }
        sb.append("]");
        return sb.toString();
    }

    /** Returns a JSON-safe escaped version of {@code s}. */
    public static String escape(String s) {
        if (s == null) return "";
        StringBuilder sb = new StringBuilder();
        for (int i = 0; i < s.length(); i++) {
            char c = s.charAt(i);
            switch (c) {
                case '"':  sb.append("\\\""); break;
                case '\\': sb.append("\\\\"); break;
                case '\b': sb.append("\\b");  break;
                case '\f': sb.append("\\f");  break;
                case '\n': sb.append("\\n");  break;
                case '\r': sb.append("\\r");  break;
                case '\t': sb.append("\\t");  break;
                default:
                    if (c < 0x20) {
                        sb.append(String.format("\\u%04x", (int) c));
                    } else {
                        sb.append(c);
                    }
            }
        }
        return sb.toString();
    }

    /** Convenience: wraps a value in double-quotes after escaping. */
    public static String quoted(String value) {
        return "\"" + escape(value) + "\"";
    }

    // ── Parser ────────────────────────────────────────────────────────

    /**
     * Parses a flat JSON object body (no nested objects/arrays) into a
     * {@code Map<String,String>}.  Values are always returned as plain
     * strings (quotes stripped).  Good enough for the simple POST bodies
     * the API expects.
     */
    public static Map<String, String> parseJsonBody(String json) {
        Map<String, String> map = new HashMap<>();
        if (json == null) return map;

        json = json.trim();
        if (json.startsWith("{")) json = json.substring(1);
        if (json.endsWith("}"))   json = json.substring(0, json.length() - 1);
        json = json.trim();

        if (json.isEmpty()) return map;

        // Walk char-by-char so we correctly handle quoted commas / colons.
        int i = 0;
        int len = json.length();

        while (i < len) {
            // skip whitespace / commas
            while (i < len && (json.charAt(i) == ',' || json.charAt(i) == ' '
                    || json.charAt(i) == '\n' || json.charAt(i) == '\r'
                    || json.charAt(i) == '\t')) {
                i++;
            }
            if (i >= len) break;

            // key (must be quoted)
            String key = readQuotedString(json, i);
            if (key == null) break;
            i = skipPastClosingQuote(json, i);

            // skip colon
            while (i < len && (json.charAt(i) == ':' || json.charAt(i) == ' ')) i++;

            // value
            String value;
            if (i < len && json.charAt(i) == '"') {
                value = readQuotedString(json, i);
                i = skipPastClosingQuote(json, i);
            } else {
                // unquoted value (number, boolean, null)
                int start = i;
                while (i < len && json.charAt(i) != ',' && json.charAt(i) != '}'
                        && json.charAt(i) != ' ' && json.charAt(i) != '\n') {
                    i++;
                }
                value = json.substring(start, i).trim();
            }

            if (key != null && value != null) {
                map.put(key, value);
            }
        }
        return map;
    }

    /** Reads a quoted string starting at position {@code pos} (which should point to '"'). */
    private static String readQuotedString(String s, int pos) {
        if (pos >= s.length() || s.charAt(pos) != '"') return null;
        StringBuilder sb = new StringBuilder();
        int i = pos + 1;
        while (i < s.length()) {
            char c = s.charAt(i);
            if (c == '\\' && i + 1 < s.length()) {
                sb.append(s.charAt(i + 1));
                i += 2;
            } else if (c == '"') {
                return sb.toString();
            } else {
                sb.append(c);
                i++;
            }
        }
        return sb.toString(); // unterminated – best effort
    }

    /** Advances past the closing quote of a quoted string starting at {@code pos}. */
    private static int skipPastClosingQuote(String s, int pos) {
        if (pos >= s.length() || s.charAt(pos) != '"') return pos;
        int i = pos + 1;
        while (i < s.length()) {
            char c = s.charAt(i);
            if (c == '\\') { i += 2; continue; }
            if (c == '"')  { return i + 1; }
            i++;
        }
        return i;
    }

    // ── Response helpers ──────────────────────────────────────────────

    /** Builds a simple {@code {"success":true,"message":"…"}} object. */
    public static String successJson(String message) {
        Map<String, String> m = new java.util.LinkedHashMap<>();
        m.put("success", "true");
        m.put("message", quoted(message).equals("\"" + escape(message) + "\"")
                ? quoted(message) : quoted(message));
        // Use LinkedHashMap to keep insertion order.
        // Re-build for clarity:
        return "{\"success\":true,\"message\":" + quoted(message) + "}";
    }

    /** Builds a simple {@code {"error":"…"}} object. */
    public static String errorJson(String message) {
        return "{\"error\":" + quoted(message) + "}";
    }
}
