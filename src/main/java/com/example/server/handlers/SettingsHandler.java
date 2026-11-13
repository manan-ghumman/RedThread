package com.example.server.handlers;

import com.example.server.ApiServer;
import com.example.server.JsonUtil;
import com.sun.net.httpserver.HttpExchange;
import com.sun.net.httpserver.HttpHandler;

import java.io.IOException;
import java.nio.charset.StandardCharsets;
import java.sql.Connection;
import java.sql.PreparedStatement;
import java.sql.ResultSet;
import java.sql.SQLException;
import java.util.LinkedHashMap;
import java.util.Map;

public class SettingsHandler implements HttpHandler {

    private final Connection conn;

    public SettingsHandler(Connection conn) {
        this.conn = conn;
    }

    @Override
    public void handle(HttpExchange exchange) throws IOException {
        String method = exchange.getRequestMethod();

        if ("GET".equalsIgnoreCase(method)) {
            handleGet(exchange);
        } else if ("POST".equalsIgnoreCase(method) || "PUT".equalsIgnoreCase(method)) {
            handleSave(exchange);
        } else {
            ApiServer.sendJson(exchange, 405, JsonUtil.errorJson("Method not allowed"));
        }
    }

    private void handleGet(HttpExchange exchange) throws IOException {
        String sql = "SELECT SettingKey, SettingValue, Description FROM SYSTEM_SETTINGS ORDER BY SettingKey";

        try (PreparedStatement ps = conn.prepareStatement(sql);
             ResultSet rs = ps.executeQuery()) {

            Map<String, String> settings = new LinkedHashMap<>();
            while (rs.next()) {
                String k = rs.getString("SettingKey");
                String v = rs.getString("SettingValue");
                settings.put(k, JsonUtil.quoted(v != null ? v : ""));
            }
            ApiServer.sendJson(exchange, 200, JsonUtil.jsonObject(settings));

        } catch (SQLException e) {
            ApiServer.sendJson(exchange, 500, JsonUtil.errorJson("Failed to fetch settings: " + e.getMessage()));
        }
    }

    private void handleSave(HttpExchange exchange) throws IOException {
        String body = new String(exchange.getRequestBody().readAllBytes(), StandardCharsets.UTF_8);
        Map<String, String> data = JsonUtil.parseJsonBody(body);

        if (data.isEmpty()) {
            ApiServer.sendJson(exchange, 400, JsonUtil.errorJson("No settings provided"));
            return;
        }

        String sql = "INSERT INTO SYSTEM_SETTINGS (SettingKey, SettingValue, Description) " +
                     "VALUES (?, ?, ?) " +
                     "ON DUPLICATE KEY UPDATE SettingValue = VALUES(SettingValue), Description = COALESCE(VALUES(Description), Description)";

        try (PreparedStatement ps = conn.prepareStatement(sql)) {
            for (Map.Entry<String, String> entry : data.entrySet()) {
                ps.setString(1, entry.getKey());
                ps.setString(2, entry.getValue());
                ps.setString(3, "Application setting: " + entry.getKey());
                ps.addBatch();
            }
            ps.executeBatch();

            Map<String, String> resp = new LinkedHashMap<>();
            resp.put("success", "true");
            resp.put("message", JsonUtil.quoted("Settings saved successfully"));
            ApiServer.sendJson(exchange, 200, JsonUtil.jsonObject(resp));

        } catch (SQLException e) {
            ApiServer.sendJson(exchange, 500, JsonUtil.errorJson("Failed to save settings: " + e.getMessage()));
        }
    }
}
