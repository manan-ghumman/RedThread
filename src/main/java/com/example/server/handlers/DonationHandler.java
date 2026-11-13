package com.example.server.handlers;

import com.example.server.ApiServer;
import com.example.server.JsonUtil;
import com.sun.net.httpserver.HttpExchange;
import com.sun.net.httpserver.HttpHandler;

import java.io.IOException;
import java.nio.charset.StandardCharsets;
import java.sql.Connection;
import java.sql.Date;
import java.sql.PreparedStatement;
import java.sql.ResultSet;
import java.sql.SQLException;
import java.util.ArrayList;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;

public class DonationHandler implements HttpHandler {

    private final Connection conn;

    public DonationHandler(Connection conn) {
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
        String query = exchange.getRequestURI().getQuery();
        String donorId = null;

        if (query != null && !query.isEmpty()) {
            for (String param : query.split("&")) {
                String[] pair = param.split("=", 2);
                if (pair.length == 2 && "donorId".equalsIgnoreCase(pair[0])) {
                    donorId = java.net.URLDecoder.decode(pair[1], StandardCharsets.UTF_8);
                }
            }
        }

        String sql;
        if (donorId != null && !donorId.trim().isEmpty()) {
            sql = "SELECT d.DonationID, d.RedThreadID, d.FacilityID, f.FacilityName, " +
                  "d.DonationDate, d.Volume_mL, dn.BloodGroup " +
                  "FROM DONATION d " +
                  "JOIN FACILITY f ON d.FacilityID = f.FacilityID " +
                  "JOIN DONOR dn ON d.RedThreadID = dn.RedThreadID " +
                  "WHERE d.RedThreadID = ? ORDER BY d.DonationDate DESC";
        } else {
            sql = "SELECT d.DonationID, d.RedThreadID, d.FacilityID, f.FacilityName, " +
                  "d.DonationDate, d.Volume_mL, dn.BloodGroup " +
                  "FROM DONATION d " +
                  "JOIN FACILITY f ON d.FacilityID = f.FacilityID " +
                  "JOIN DONOR dn ON d.RedThreadID = dn.RedThreadID " +
                  "ORDER BY d.DonationDate DESC LIMIT 50";
        }

        try (PreparedStatement ps = conn.prepareStatement(sql)) {
            if (donorId != null && !donorId.trim().isEmpty()) {
                ps.setString(1, donorId.trim());
            }

            try (ResultSet rs = ps.executeQuery()) {
                List<String> list = new ArrayList<>();
                while (rs.next()) {
                    Map<String, String> m = new LinkedHashMap<>();
                    m.put("donationId", JsonUtil.quoted(rs.getString("DonationID")));
                    m.put("redThreadId", JsonUtil.quoted(rs.getString("RedThreadID")));
                    m.put("facilityId", JsonUtil.quoted(rs.getString("FacilityID")));
                    m.put("facilityName", JsonUtil.quoted(rs.getString("FacilityName")));
                    m.put("donationDate", JsonUtil.quoted(rs.getDate("DonationDate").toString()));
                    m.put("volume", String.valueOf(rs.getInt("Volume_mL")));
                    m.put("bloodGroup", JsonUtil.quoted(rs.getString("BloodGroup")));
                    list.add(JsonUtil.jsonObject(m));
                }
                ApiServer.sendJson(exchange, 200, JsonUtil.jsonArray(list));
            }
        } catch (SQLException e) {
            ApiServer.sendJson(exchange, 500, JsonUtil.errorJson("Failed to fetch donations: " + e.getMessage()));
        }
    }

    private void handlePost(HttpExchange exchange) throws IOException {
        String body = ApiServer.readBody(exchange);
        Map<String, String> data = JsonUtil.parseJsonBody(body);

        String donationId = data.get("donationId");
        String donorId = data.get("donorId");
        String dateStr = data.get("date");
        String volumeStr = data.get("volume");
        String facilityId = data.get("facilityId");

        if (donationId == null || donationId.trim().isEmpty()) {
            donationId = "DN" + (System.currentTimeMillis() % 100000);
        } else {
            donationId = donationId.trim();
        }

        if (donorId == null || donorId.trim().isEmpty() ||
            facilityId == null || facilityId.trim().isEmpty() ||
            dateStr == null || dateStr.trim().isEmpty()) {
            ApiServer.sendJson(exchange, 400, JsonUtil.errorJson("donorId, facilityId, and date are required"));
            return;
        }

        int volume = 450;
        if (volumeStr != null && !volumeStr.trim().isEmpty()) {
            try {
                volume = Integer.parseInt(volumeStr.trim());
            } catch (NumberFormatException ignored) {}
        }

        // Validate facility exists
        try (PreparedStatement check = conn.prepareStatement("SELECT 1 FROM FACILITY WHERE FacilityID = ?")) {
            check.setString(1, facilityId.trim());
            try (ResultSet rs = check.executeQuery()) {
                if (!rs.next()) {
                    ApiServer.sendJson(exchange, 400, JsonUtil.errorJson("Facility ID does not exist: " + facilityId));
                    return;
                }
            }
        } catch (SQLException e) {
            ApiServer.sendJson(exchange, 500, JsonUtil.errorJson("Facility validation failed: " + e.getMessage()));
            return;
        }

        // Validate donor exists
        try (PreparedStatement check = conn.prepareStatement("SELECT 1 FROM DONOR WHERE RedThreadID = ?")) {
            check.setString(1, donorId.trim());
            try (ResultSet rs = check.executeQuery()) {
                if (!rs.next()) {
                    ApiServer.sendJson(exchange, 400, JsonUtil.errorJson("Donor ID does not exist: " + donorId));
                    return;
                }
            }
        } catch (SQLException e) {
            ApiServer.sendJson(exchange, 500, JsonUtil.errorJson("Donor validation failed: " + e.getMessage()));
            return;
        }

        String sql = "INSERT INTO DONATION (DonationID, RedThreadID, DonationDate, Volume_mL, FacilityID) " +
                     "VALUES (?, ?, ?, ?, ?)";

        try (PreparedStatement ps = conn.prepareStatement(sql)) {
            ps.setString(1, donationId);
            ps.setString(2, donorId.trim());
            ps.setDate(3, Date.valueOf(dateStr.trim()));
            ps.setInt(4, volume);
            ps.setString(5, facilityId.trim());
            ps.executeUpdate();

            ApiServer.sendJson(exchange, 201, JsonUtil.successJson("Donation recorded successfully with ID: " + donationId));

        } catch (SQLException e) {
            ApiServer.sendJson(exchange, 500, JsonUtil.errorJson("Failed to record donation: " + e.getMessage()));
        } catch (IllegalArgumentException e) {
            ApiServer.sendJson(exchange, 400, JsonUtil.errorJson("Invalid date format. Use YYYY-MM-DD"));
        }
    }
}
