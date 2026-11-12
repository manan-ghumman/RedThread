package com.example.server.handlers;

import com.example.server.ApiServer;
import com.example.server.JsonUtil;
import com.sun.net.httpserver.HttpExchange;
import com.sun.net.httpserver.HttpHandler;

import java.io.IOException;
import java.net.URI;
import java.sql.Connection;
import java.sql.PreparedStatement;
import java.sql.ResultSet;
import java.sql.SQLException;
import java.util.ArrayList;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;

public class CompatibilityHandler implements HttpHandler {

    private final Connection conn;

    public CompatibilityHandler(Connection conn) {
        this.conn = conn;
    }

    @Override
    public void handle(HttpExchange exchange) throws IOException {
        if (!"GET".equalsIgnoreCase(exchange.getRequestMethod())) {
            ApiServer.sendJson(exchange, 405, JsonUtil.errorJson("Method not allowed"));
            return;
        }

        URI uri = exchange.getRequestURI();
        String query = uri.getQuery();
        String donorType = null;
        String recipientType = null;

        if (query != null) {
            for (String pair : query.split("&")) {
                String[] kv = pair.split("=");
                if (kv.length == 2) {
                    if ("donorType".equalsIgnoreCase(kv[0])) {
                        donorType = java.net.URLDecoder.decode(kv[1], java.nio.charset.StandardCharsets.UTF_8);
                    } else if ("recipientType".equalsIgnoreCase(kv[0])) {
                        recipientType = java.net.URLDecoder.decode(kv[1], java.nio.charset.StandardCharsets.UTF_8);
                    }
                }
            }
        }

        String sql;
        if (donorType != null) {
            sql = "SELECT RecipientType FROM BLOOD_COMPATIBILITY WHERE DonorType = ? ORDER BY RecipientType";
        } else if (recipientType != null) {
            sql = "SELECT DonorType FROM BLOOD_COMPATIBILITY WHERE RecipientType = ? ORDER BY DonorType";
        } else {
            sql = "SELECT DonorType, RecipientType FROM BLOOD_COMPATIBILITY ORDER BY DonorType, RecipientType";
        }

        try (PreparedStatement ps = conn.prepareStatement(sql)) {
            if (donorType != null) {
                ps.setString(1, donorType.trim().toUpperCase());
            } else if (recipientType != null) {
                ps.setString(1, recipientType.trim().toUpperCase());
            }

            try (ResultSet rs = ps.executeQuery()) {
                List<String> list = new ArrayList<>();
                while (rs.next()) {
                    Map<String, String> m = new LinkedHashMap<>();
                    if (donorType != null) {
                        m.put("recipientType", JsonUtil.quoted(rs.getString("RecipientType")));
                    } else if (recipientType != null) {
                        m.put("donorType", JsonUtil.quoted(rs.getString("DonorType")));
                    } else {
                        m.put("donorType", JsonUtil.quoted(rs.getString("DonorType")));
                        m.put("recipientType", JsonUtil.quoted(rs.getString("RecipientType")));
                    }
                    list.add(JsonUtil.jsonObject(m));
                }
                ApiServer.sendJson(exchange, 200, JsonUtil.jsonArray(list));
            }

        } catch (SQLException e) {
            ApiServer.sendJson(exchange, 500, JsonUtil.errorJson("Failed to query compatibility: " + e.getMessage()));
        }
    }
}

