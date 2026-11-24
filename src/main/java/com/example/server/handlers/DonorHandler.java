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
        } else if ("PUT".equalsIgnoreCase(method)) {
            handlePut(exchange);
        } else {
            ApiServer.sendJson(exchange, 405, JsonUtil.errorJson("Method not allowed"));
        }
    }

    private void handleGet(HttpExchange exchange) throws IOException {
        String sql = "SELECT d.RedThreadID, p.Name, p.BloodType, d.KarmaPoints, d.EligibilityStatus, " +
                     "u.Email, " +
                     "(SELECT SettingValue FROM SYSTEM_SETTINGS WHERE SettingKey = CONCAT('donor_phone_', d.RedThreadID)) AS Phone, " +
                     "(SELECT SettingValue FROM SYSTEM_SETTINGS WHERE SettingKey = CONCAT('donor_address_', d.RedThreadID)) AS Address " +
                     "FROM DONOR d " +
                     "JOIN PERSON p ON p.RedThreadID = d.RedThreadID " +
                     "LEFT JOIN USERS u ON u.AssociatedID = d.RedThreadID " +
                     "ORDER BY d.RedThreadID";

        try (PreparedStatement ps = conn.prepareStatement(sql);
             ResultSet rs = ps.executeQuery()) {

            List<String> list = new ArrayList<>();
            while (rs.next()) {
                Map<String, String> m = new LinkedHashMap<>();
                m.put("id", JsonUtil.quoted(rs.getString("RedThreadID")));
                m.put("donorId", JsonUtil.quoted(rs.getString("RedThreadID")));
                m.put("name", JsonUtil.quoted(rs.getString("Name") != null ? rs.getString("Name") : ""));
                m.put("bloodType", JsonUtil.quoted(rs.getString("BloodType")));
                m.put("bloodGroup", JsonUtil.quoted(rs.getString("BloodType")));
                m.put("karmaPoints", String.valueOf(rs.getInt("KarmaPoints")));
                m.put("eligibility", JsonUtil.quoted(rs.getString("EligibilityStatus")));
                String email = rs.getString("Email");
                m.put("email", email != null ? JsonUtil.quoted(email) : "\"donor@redthread.org\"");
                String phone = rs.getString("Phone");
                m.put("phone", phone != null ? JsonUtil.quoted(phone) : "\"9876543210\"");
                String addr = rs.getString("Address");
                m.put("address", addr != null ? JsonUtil.quoted(addr) : "\"Dehradun, Uttarakhand\"");
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

    private void handlePut(HttpExchange exchange) throws IOException {
        String body = ApiServer.readBody(exchange);
        Map<String, String> data = JsonUtil.parseJsonBody(body);

        String id = data.get("id");
        if (id == null || id.trim().isEmpty()) {
            id = data.get("donorId");
        }
        String name = data.get("name");
        String email = data.get("email");
        String phone = data.get("phone");
        String address = data.get("address");

        if (id == null || id.trim().isEmpty()) {
            ApiServer.sendJson(exchange, 400, JsonUtil.errorJson("Donor ID is required"));
            return;
        }

        id = id.trim();

        try {
            if (name != null && !name.trim().isEmpty()) {
                try (PreparedStatement ps = conn.prepareStatement(
                        "UPDATE PERSON SET Name = ? WHERE RedThreadID = ?")) {
                    ps.setString(1, name.trim());
                    ps.setString(2, id);
                    ps.executeUpdate();
                }
            }

            if (email != null && !email.trim().isEmpty()) {
                try (PreparedStatement ps = conn.prepareStatement(
                        "UPDATE USERS SET Email = ? WHERE AssociatedID = ?")) {
                    ps.setString(1, email.trim());
                    ps.setString(2, id);
                    ps.executeUpdate();
                }
            }

            if (phone != null) {
                try (PreparedStatement ps = conn.prepareStatement(
                        "INSERT INTO SYSTEM_SETTINGS (SettingKey, SettingValue, Description) VALUES (?, ?, ?) " +
                        "ON DUPLICATE KEY UPDATE SettingValue = VALUES(SettingValue)")) {
                    ps.setString(1, "donor_phone_" + id);
                    ps.setString(2, phone.trim());
                    ps.setString(3, "Phone for donor " + id);
                    ps.executeUpdate();
                }
            }

            if (address != null) {
                try (PreparedStatement ps = conn.prepareStatement(
                        "INSERT INTO SYSTEM_SETTINGS (SettingKey, SettingValue, Description) VALUES (?, ?, ?) " +
                        "ON DUPLICATE KEY UPDATE SettingValue = VALUES(SettingValue)")) {
                    ps.setString(1, "donor_address_" + id);
                    ps.setString(2, address.trim());
                    ps.setString(3, "Address for donor " + id);
                    ps.executeUpdate();
                }
            }

            ApiServer.sendJson(exchange, 200, JsonUtil.successJson("Donor profile updated successfully"));

        } catch (SQLException e) {
            ApiServer.sendJson(exchange, 500, JsonUtil.errorJson("Failed to update donor profile: " + e.getMessage()));
        }
    }
}
