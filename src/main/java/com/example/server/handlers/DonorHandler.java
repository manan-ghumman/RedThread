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

public class DonorHandler implements HttpHandler {

    private final Connection conn;

    public DonorHandler(Connection conn) {
        this.conn = conn;
    }

    @Override
    public void handle(HttpExchange exchange) throws IOException {
        String method = exchange.getRequestMethod();

        if ("GET".equalsIgnoreCase(method)) {
            handleGet(exchange);
        } else if ("POST".equalsIgnoreCase(method)) {
            handlePost(exchange);
        } else {
            ApiServer.sendJson(exchange, 405, JsonUtil.errorJson("Method not allowed"));
        }
    }

    private void handleGet(HttpExchange exchange) throws IOException {
        String sql = "SELECT d.RedThreadID, p.Name, p.BloodType, d.KarmaPoints, d.EligibilityStatus " +
                     "FROM DONOR d " +
                     "JOIN PERSON p ON p.RedThreadID = d.RedThreadID " +
                     "ORDER BY d.RedThreadID";

        try (PreparedStatement ps = conn.prepareStatement(sql);
             ResultSet rs = ps.executeQuery()) {

            List<String> list = new ArrayList<>();
            while (rs.next()) {
                Map<String, String> m = new LinkedHashMap<>();
                m.put("id", JsonUtil.quoted(rs.getString("RedThreadID")));
                m.put("name", JsonUtil.quoted(rs.getString("Name") != null ? rs.getString("Name") : ""));
                m.put("bloodType", JsonUtil.quoted(rs.getString("BloodType")));
                m.put("karmaPoints", String.valueOf(rs.getInt("KarmaPoints")));
                m.put("eligibility", JsonUtil.quoted(rs.getString("EligibilityStatus")));
                list.add(JsonUtil.jsonObject(m));
            }
            ApiServer.sendJson(exchange, 200, JsonUtil.jsonArray(list));

        } catch (SQLException e) {
            ApiServer.sendJson(exchange, 500, JsonUtil.errorJson("Failed to fetch donors: " + e.getMessage()));
        }
    }

    private void handlePost(HttpExchange exchange) throws IOException {
        String body = ApiServer.readBody(exchange);
        Map<String, String> data = JsonUtil.parseJsonBody(body);

        String id = data.get("id");
        String name = data.get("name");
        String bloodType = data.get("bloodType");

        if (id == null || id.trim().isEmpty()) {
            id = "D" + (System.currentTimeMillis() % 100000);
        } else {
            id = id.trim();
        }

        if (bloodType == null || bloodType.trim().isEmpty()) {
            ApiServer.sendJson(exchange, 400, JsonUtil.errorJson("Blood type is required"));
            return;
        }

        bloodType = bloodType.trim().toUpperCase();

        boolean previousAutoCommit = true;
        try {
            previousAutoCommit = conn.getAutoCommit();
            conn.setAutoCommit(false);

            try (PreparedStatement person = conn.prepareStatement(
                    "INSERT INTO PERSON (RedThreadID, Name, BloodType) VALUES (?, ?, ?)")) {
                person.setString(1, id);
                person.setString(2, name != null ? name.trim() : "");
                person.setString(3, bloodType);
                person.executeUpdate();
            }

            try (PreparedStatement donor = conn.prepareStatement(
                    "INSERT INTO DONOR (RedThreadID, KarmaPoints, EligibilityStatus) VALUES (?, 0, 'Eligible')")) {
                donor.setString(1, id);
                donor.executeUpdate();
            }

            conn.commit();
            ApiServer.sendJson(exchange, 201, JsonUtil.successJson("Donor registered successfully with ID: " + id));

        } catch (SQLException e) {
            try {
                conn.rollback();
            } catch (SQLException ignored) {}
            ApiServer.sendJson(exchange, 500, JsonUtil.errorJson("Registration failed: " + e.getMessage()));
        } finally {
            try {
                conn.setAutoCommit(previousAutoCommit);
            } catch (SQLException ignored) {}
        }
    }
}

