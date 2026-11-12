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

public class RequestHandler implements HttpHandler {

    private final Connection conn;

    public RequestHandler(Connection conn) {
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
        String sql = "SELECT RequestID, RedThreadID, FacilityID, ComponentType, BloodType, Quantity, Priority, Status, RequestTime " +
                     "FROM BLOOD_REQUEST ORDER BY RequestTime DESC";

        try (PreparedStatement ps = conn.prepareStatement(sql);
             ResultSet rs = ps.executeQuery()) {

            List<String> list = new ArrayList<>();
            while (rs.next()) {
                Map<String, String> m = new LinkedHashMap<>();
                m.put("requestId", JsonUtil.quoted(rs.getString("RequestID")));
                m.put("patientId", JsonUtil.quoted(rs.getString("RedThreadID")));
                m.put("facilityId", JsonUtil.quoted(rs.getString("FacilityID")));
                m.put("componentType", JsonUtil.quoted(rs.getString("ComponentType")));
                m.put("bloodType", JsonUtil.quoted(rs.getString("BloodType")));
                m.put("quantity", String.valueOf(rs.getInt("Quantity")));
                m.put("priority", JsonUtil.quoted(rs.getString("Priority")));
                m.put("status", JsonUtil.quoted(rs.getString("Status")));
                m.put("requestTime", JsonUtil.quoted(rs.getTimestamp("RequestTime") != null ? rs.getTimestamp("RequestTime").toString() : ""));
                list.add(JsonUtil.jsonObject(m));
            }
            ApiServer.sendJson(exchange, 200, JsonUtil.jsonArray(list));

        } catch (SQLException e) {
            ApiServer.sendJson(exchange, 500, JsonUtil.errorJson("Failed to fetch requests: " + e.getMessage()));
        }
    }

    private void handlePost(HttpExchange exchange) throws IOException {
        String body = ApiServer.readBody(exchange);
        Map<String, String> data = JsonUtil.parseJsonBody(body);

        String requestId = data.get("requestId");
        String patientId = data.get("patientId");
        String facilityId = data.get("facilityId");
        String componentType = data.get("componentType");
        String bloodType = data.get("bloodType");
        String quantityStr = data.get("quantity");
        String priority = data.get("priority");

        if (requestId == null || requestId.trim().isEmpty()) {
            requestId = "R" + (System.currentTimeMillis() % 100000);
        } else {
            requestId = requestId.trim();
        }

        if (patientId == null || patientId.trim().isEmpty()) {
            patientId = "P" + (System.currentTimeMillis() % 100000);
        } else {
            patientId = patientId.trim();
        }

        if (facilityId == null || facilityId.trim().isEmpty()) {
            facilityId = "F005"; // fallback to default facility
        } else {
            facilityId = facilityId.trim();
        }

        if (componentType == null || componentType.trim().isEmpty()) {
            componentType = "RBC";
        } else {
            componentType = componentType.trim();
            if (componentType.toLowerCase().contains("rbc") || componentType.toLowerCase().contains("packed")) {
                componentType = "RBC";
            } else if (componentType.toLowerCase().contains("platelet")) {
                componentType = "Platelets";
            } else if (componentType.toLowerCase().contains("plasma")) {
                componentType = "Plasma";
            } else {
                componentType = "RBC";
            }
        }

        if (bloodType == null || bloodType.trim().isEmpty()) {
            bloodType = "O+";
        } else {
            bloodType = bloodType.trim().toUpperCase();
        }

        int quantity = 1;
        if (quantityStr != null && !quantityStr.trim().isEmpty()) {
            try {
                quantity = Integer.parseInt(quantityStr.trim());
            } catch (NumberFormatException ignored) {}
        }

        if (priority == null || priority.trim().isEmpty()) {
            priority = "Emergency";
        } else {
            priority = priority.trim();
            if (priority.equalsIgnoreCase("1") || priority.toLowerCase().contains("emergen")) {
                priority = "Emergency";
            } else if (priority.equalsIgnoreCase("2") || priority.toLowerCase().contains("accident") || priority.toLowerCase().contains("urgent")) {
                priority = "Urgent";
            } else {
                priority = "Routine";
            }
        }

        // Check if patient exists, if not create record
        try (PreparedStatement check = conn.prepareStatement("SELECT 1 FROM PATIENT WHERE RedThreadID = ?")) {
            check.setString(1, patientId);
            try (ResultSet rs = check.executeQuery()) {
                if (!rs.next()) {
                    try (PreparedStatement p = conn.prepareStatement(
                            "INSERT INTO PERSON (RedThreadID, Name, BloodType) VALUES (?, NULL, ?) ON DUPLICATE KEY UPDATE BloodType=VALUES(BloodType)")) {
                        p.setString(1, patientId);
                        p.setString(2, bloodType);
                        p.executeUpdate();
                    }
                    try (PreparedStatement pt = conn.prepareStatement(
                            "INSERT INTO PATIENT (RedThreadID) VALUES (?) ON DUPLICATE KEY UPDATE RedThreadID=RedThreadID")) {
                        pt.setString(1, patientId);
                        pt.executeUpdate();
                    }
                }
            }
        } catch (SQLException e) {
            ApiServer.sendJson(exchange, 500, JsonUtil.errorJson("Patient auto-provisioning failed: " + e.getMessage()));
            return;
        }

        String sql = "INSERT INTO BLOOD_REQUEST (RequestID, RedThreadID, FacilityID, ComponentType, BloodType, Quantity, Priority, Status) " +
                     "VALUES (?, ?, ?, ?, ?, ?, ?, 'Pending')";

        try (PreparedStatement ps = conn.prepareStatement(sql)) {
            ps.setString(1, requestId);
            ps.setString(2, patientId);
            ps.setString(3, facilityId);
            ps.setString(4, componentType);
            ps.setString(5, bloodType);
            ps.setInt(6, quantity);
            ps.setString(7, priority);
            ps.executeUpdate();

            ApiServer.sendJson(exchange, 201, JsonUtil.successJson("Blood request raised successfully with ID: " + requestId));

        } catch (SQLException e) {
            ApiServer.sendJson(exchange, 500, JsonUtil.errorJson("Failed to raise request: " + e.getMessage()));
        }
    }
}

