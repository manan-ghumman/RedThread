package com.example.server.handlers;

import com.example.server.ApiServer;
import com.example.server.JsonUtil;
import com.sun.net.httpserver.HttpExchange;
import com.sun.net.httpserver.HttpHandler;

import java.io.IOException;
import java.sql.Connection;
import java.sql.Date;
import java.sql.PreparedStatement;
import java.sql.ResultSet;
import java.sql.SQLException;
import java.util.Map;

public class DonationHandler implements HttpHandler {

    private final Connection conn;

    public DonationHandler(Connection conn) {
        this.conn = conn;
    }

    @Override
    public void handle(HttpExchange exchange) throws IOException {
        if (!"POST".equalsIgnoreCase(exchange.getRequestMethod())) {
            ApiServer.sendJson(exchange, 405, JsonUtil.errorJson("Method not allowed"));
            return;
        }

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

