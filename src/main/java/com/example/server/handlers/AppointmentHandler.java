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

public class AppointmentHandler implements HttpHandler {

    private final Connection conn;

    public AppointmentHandler(Connection conn) {
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
            sql = "SELECT a.AppointmentID, a.RedThreadID, a.FacilityID, f.FacilityName, " +
                  "a.AppointmentDate, a.PreferredTime, a.Status, a.CreatedAt " +
                  "FROM DONOR_APPOINTMENT a " +
                  "JOIN FACILITY f ON a.FacilityID = f.FacilityID " +
                  "WHERE a.RedThreadID = ? ORDER BY a.AppointmentDate DESC, a.AppointmentID DESC";
        } else {
            sql = "SELECT a.AppointmentID, a.RedThreadID, a.FacilityID, f.FacilityName, " +
                  "a.AppointmentDate, a.PreferredTime, a.Status, a.CreatedAt " +
                  "FROM DONOR_APPOINTMENT a " +
                  "JOIN FACILITY f ON a.FacilityID = f.FacilityID " +
                  "ORDER BY a.AppointmentDate DESC, a.AppointmentID DESC";
        }

        try (PreparedStatement ps = conn.prepareStatement(sql)) {
            if (donorId != null && !donorId.trim().isEmpty()) {
                ps.setString(1, donorId);
            }

            try (ResultSet rs = ps.executeQuery()) {
                List<String> list = new ArrayList<>();
                while (rs.next()) {
                    Map<String, String> m = new LinkedHashMap<>();
                    m.put("appointmentId", JsonUtil.quoted(rs.getString("AppointmentID")));
                    m.put("redThreadId", JsonUtil.quoted(rs.getString("RedThreadID")));
                    m.put("facilityId", JsonUtil.quoted(rs.getString("FacilityID")));
                    m.put("facilityName", JsonUtil.quoted(rs.getString("FacilityName")));
                    m.put("appointmentDate", JsonUtil.quoted(rs.getDate("AppointmentDate").toString()));
                    m.put("preferredTime", JsonUtil.quoted(rs.getString("PreferredTime")));
                    m.put("status", JsonUtil.quoted(rs.getString("Status")));
                    m.put("createdAt", JsonUtil.quoted(rs.getTimestamp("CreatedAt") != null ? rs.getTimestamp("CreatedAt").toString() : ""));
                    list.add(JsonUtil.jsonObject(m));
                }
                ApiServer.sendJson(exchange, 200, JsonUtil.jsonArray(list));
            }
        } catch (SQLException e) {
            ApiServer.sendJson(exchange, 500, JsonUtil.errorJson("Failed to fetch appointments: " + e.getMessage()));
        }
    }

    private void handlePost(HttpExchange exchange) throws IOException {
        String body = new String(exchange.getRequestBody().readAllBytes(), StandardCharsets.UTF_8);
        Map<String, String> data = JsonUtil.parseJsonBody(body);

        String redThreadId = data.get("redThreadId");
        String facilityId = data.get("facilityId");
        String appointmentDate = data.get("appointmentDate");
        String preferredTime = data.get("preferredTime");
        String status = data.getOrDefault("status", "Pending");

        if (redThreadId == null || redThreadId.isEmpty()) {
            redThreadId = "RT0001"; // Fallback default donor
        }

        if (facilityId == null || facilityId.isEmpty()) {
            facilityId = "F005"; // Fallback to RedThread Central Blood Bank
        }

        // If facilityId was passed as a facility name, resolve to FacilityID
        if (!facilityId.startsWith("F")) {
            String resolved = resolveFacilityId(facilityId);
            if (resolved != null) {
                facilityId = resolved;
            } else {
                facilityId = "F005";
            }
        }

        if (appointmentDate == null || appointmentDate.isEmpty()) {
            ApiServer.sendJson(exchange, 400, JsonUtil.errorJson("appointmentDate is required"));
            return;
        }

        if (preferredTime == null || preferredTime.isEmpty()) {
            preferredTime = "10:00 AM";
        }

        String nextId = getNextAppointmentId();

        String sql = "INSERT INTO DONOR_APPOINTMENT (AppointmentID, RedThreadID, FacilityID, AppointmentDate, PreferredTime, Status) " +
                     "VALUES (?, ?, ?, ?, ?, ?)";

        try (PreparedStatement ps = conn.prepareStatement(sql)) {
            ps.setString(1, nextId);
            ps.setString(2, redThreadId);
            ps.setString(3, facilityId);
            ps.setDate(4, java.sql.Date.valueOf(appointmentDate));
            ps.setString(5, preferredTime);
            ps.setString(6, status);

            ps.executeUpdate();

            Map<String, String> resp = new LinkedHashMap<>();
            resp.put("success", "true");
            resp.put("appointmentId", JsonUtil.quoted(nextId));
            resp.put("message", JsonUtil.quoted("Appointment booked successfully"));
            ApiServer.sendJson(exchange, 201, JsonUtil.jsonObject(resp));

        } catch (SQLException e) {
            ApiServer.sendJson(exchange, 500, JsonUtil.errorJson("Failed to create appointment: " + e.getMessage()));
        }
    }

    private String resolveFacilityId(String facilityName) {
        String sql = "SELECT FacilityID FROM FACILITY WHERE FacilityName LIKE ? LIMIT 1";
        try (PreparedStatement ps = conn.prepareStatement(sql)) {
            ps.setString(1, "%" + facilityName + "%");
            try (ResultSet rs = ps.executeQuery()) {
                if (rs.next()) {
                    return rs.getString("FacilityID");
                }
            }
        } catch (SQLException ignored) {}
        return null;
    }

    private String getNextAppointmentId() {
        String sql = "SELECT AppointmentID FROM DONOR_APPOINTMENT ORDER BY AppointmentID DESC LIMIT 1";
        try (PreparedStatement ps = conn.prepareStatement(sql);
             ResultSet rs = ps.executeQuery()) {
            if (rs.next()) {
                String lastId = rs.getString("AppointmentID");
                if (lastId != null && lastId.startsWith("APT")) {
                    int num = Integer.parseInt(lastId.substring(3));
                    return String.format("APT%04d", num + 1);
                }
            }
        } catch (Exception ignored) {}
        return "APT0001";
    }
}
