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
import java.util.ArrayList;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;

public class AlertHandler implements HttpHandler {

    private final Connection conn;

    public AlertHandler(Connection conn) {
        this.conn = conn;
    }

    @Override
    public void handle(HttpExchange exchange) throws IOException {
        String method = exchange.getRequestMethod();

        if ("GET".equalsIgnoreCase(method)) {
            handleGet(exchange);
        } else if ("PUT".equalsIgnoreCase(method) || "POST".equalsIgnoreCase(method)) {
            handleMarkRead(exchange);
        } else {
            ApiServer.sendJson(exchange, 405, JsonUtil.errorJson("Method not allowed"));
        }
    }

    private void handleGet(HttpExchange exchange) throws IOException {
        String sql = "SELECT AlertID, FacilityID, ComponentID, AlertType, Message, CreatedAt " +
                     "FROM ALERT " +
                     "WHERE IsRead = FALSE " +
                     "ORDER BY CreatedAt DESC LIMIT 15";

        try (PreparedStatement ps = conn.prepareStatement(sql);
             ResultSet rs = ps.executeQuery()) {

            List<String> list = new ArrayList<>();
            while (rs.next()) {
                Map<String, String> m = new LinkedHashMap<>();
                m.put("alertId", String.valueOf(rs.getInt("AlertID")));
                m.put("facilityId", JsonUtil.quoted(rs.getString("FacilityID")));
                String componentId = rs.getString("ComponentID");
                m.put("componentId", componentId != null ? JsonUtil.quoted(componentId) : "null");
                m.put("alertType", JsonUtil.quoted(rs.getString("AlertType")));
                m.put("message", JsonUtil.quoted(rs.getString("Message")));
                m.put("createdAt", JsonUtil.quoted(rs.getTimestamp("CreatedAt") != null ? rs.getTimestamp("CreatedAt").toString() : ""));
                list.add(JsonUtil.jsonObject(m));
            }
            ApiServer.sendJson(exchange, 200, JsonUtil.jsonArray(list));

        } catch (SQLException e) {
            ApiServer.sendJson(exchange, 500, JsonUtil.errorJson("Failed to fetch alerts: " + e.getMessage()));
        }
    }

    private void handleMarkRead(HttpExchange exchange) throws IOException {
        String query = exchange.getRequestURI().getQuery();
        String alertId = null;

        if (query != null && !query.isEmpty()) {
            for (String param : query.split("&")) {
                String[] pair = param.split("=", 2);
                if (pair.length == 2 && "id".equalsIgnoreCase(pair[0])) {
                    alertId = java.net.URLDecoder.decode(pair[1], StandardCharsets.UTF_8);
                }
            }
        }

        if (alertId == null) {
            String body = new String(exchange.getRequestBody().readAllBytes(), StandardCharsets.UTF_8);
            Map<String, String> data = JsonUtil.parseJsonBody(body);
            alertId = data.get("alertId");
        }

        String sql;
        if (alertId != null && !alertId.trim().isEmpty() && !"all".equalsIgnoreCase(alertId)) {
            sql = "UPDATE ALERT SET IsRead = TRUE WHERE AlertID = ?";
        } else {
            sql = "UPDATE ALERT SET IsRead = TRUE WHERE IsRead = FALSE";
        }

        try (PreparedStatement ps = conn.prepareStatement(sql)) {
            if (alertId != null && !alertId.trim().isEmpty() && !"all".equalsIgnoreCase(alertId)) {
                ps.setInt(1, Integer.parseInt(alertId.trim()));
            }
            int updated = ps.executeUpdate();

            Map<String, String> resp = new LinkedHashMap<>();
            resp.put("success", "true");
            resp.put("updatedCount", String.valueOf(updated));
            resp.put("message", JsonUtil.quoted("Alert(s) marked as read"));
            ApiServer.sendJson(exchange, 200, JsonUtil.jsonObject(resp));

        } catch (Exception e) {
            ApiServer.sendJson(exchange, 500, JsonUtil.errorJson("Failed to update alert: " + e.getMessage()));
        }
    }
}
