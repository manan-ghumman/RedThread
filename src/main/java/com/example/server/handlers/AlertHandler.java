package com.example.server.handlers;

import com.example.server.ApiServer;
import com.example.server.JsonUtil;
import com.sun.net.httpserver.HttpExchange;
import com.sun.net.httpserver.HttpHandler;

import java.io.IOException;
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
        if (!"GET".equalsIgnoreCase(exchange.getRequestMethod())) {
            ApiServer.sendJson(exchange, 405, JsonUtil.errorJson("Method not allowed"));
            return;
        }

        String sql = "SELECT AlertID, FacilityID, ComponentID, AlertType, Message, CreatedAt " +
                     "FROM ALERT " +
                     "WHERE IsRead = FALSE " +
                     "ORDER BY CreatedAt DESC LIMIT 10";

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
}

