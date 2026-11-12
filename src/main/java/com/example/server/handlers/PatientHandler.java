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

public class PatientHandler implements HttpHandler {

    private final Connection conn;

    public PatientHandler(Connection conn) {
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
        String sql = "SELECT p.RedThreadID, person.BloodType " +
                     "FROM PATIENT p " +
                     "JOIN PERSON person ON person.RedThreadID = p.RedThreadID " +
                     "ORDER BY p.RedThreadID";

        try (PreparedStatement ps = conn.prepareStatement(sql);
             ResultSet rs = ps.executeQuery()) {

            List<String> list = new ArrayList<>();
            while (rs.next()) {
                Map<String, String> m = new LinkedHashMap<>();
                m.put("id", JsonUtil.quoted(rs.getString("RedThreadID")));
                m.put("bloodType", JsonUtil.quoted(rs.getString("BloodType")));
                list.add(JsonUtil.jsonObject(m));
            }
            ApiServer.sendJson(exchange, 200, JsonUtil.jsonArray(list));

        } catch (SQLException e) {
            ApiServer.sendJson(exchange, 500, JsonUtil.errorJson("Failed to fetch patients: " + e.getMessage()));
        }
    }

    private void handlePost(HttpExchange exchange) throws IOException {
        String body = ApiServer.readBody(exchange);
        Map<String, String> data = JsonUtil.parseJsonBody(body);

        String id = data.get("id");
        String bloodType = data.get("bloodType");

        if (id == null || id.trim().isEmpty()) {
            id = "P" + (System.currentTimeMillis() % 100000);
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
                    "INSERT INTO PERSON (RedThreadID, Name, BloodType) VALUES (?, NULL, ?)")) {
                person.setString(1, id);
                person.setString(2, bloodType);
                person.executeUpdate();
            }

            try (PreparedStatement patient = conn.prepareStatement(
                    "INSERT INTO PATIENT (RedThreadID) VALUES (?)")) {
                patient.setString(1, id);
                patient.executeUpdate();
            }

            conn.commit();
            ApiServer.sendJson(exchange, 201, JsonUtil.successJson("Patient registered successfully with ID: " + id));

        } catch (SQLException e) {
            try {
                conn.rollback();
            } catch (SQLException ignored) {}
            ApiServer.sendJson(exchange, 500, JsonUtil.errorJson("Failed to register patient: " + e.getMessage()));
        } finally {
            try {
                conn.setAutoCommit(previousAutoCommit);
            } catch (SQLException ignored) {}
        }
    }
}

