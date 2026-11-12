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

public class TransferHandler implements HttpHandler {

    private final Connection conn;

    public TransferHandler(Connection conn) {
        this.conn = conn;
    }

    @Override
    public void handle(HttpExchange exchange) throws IOException {
        String method = exchange.getRequestMethod();
        URI uri = exchange.getRequestURI();
        String path = uri.getPath();

        if ("GET".equalsIgnoreCase(method)) {
            handleGet(exchange);
        } else if ("POST".equalsIgnoreCase(method) || "PUT".equalsIgnoreCase(method)) {
            if (path.contains("/complete") || (uri.getQuery() != null && uri.getQuery().contains("action=complete"))) {
                handleComplete(exchange);
            } else {
                handleStart(exchange);
            }
        } else {
            ApiServer.sendJson(exchange, 405, JsonUtil.errorJson("Method not allowed"));
        }
    }

    private void handleGet(HttpExchange exchange) throws IOException {
        String sql = "SELECT t.TransferID, t.ComponentID, t.FromFacility, t.ToFacility, t.Status, " +
                     "t.InitiatedAt, t.CompletedAt, bc.Type AS ComponentType, p.BloodType " +
                     "FROM TRANSFER t " +
                     "LEFT JOIN BLOOD_COMPONENT bc ON bc.ComponentID = t.ComponentID " +
                     "LEFT JOIN DONATION dn ON dn.DonationID = bc.DonationID " +
                     "LEFT JOIN PERSON p ON p.RedThreadID = dn.RedThreadID " +
                     "ORDER BY t.InitiatedAt DESC";

        try (PreparedStatement ps = conn.prepareStatement(sql);
             ResultSet rs = ps.executeQuery()) {

            List<String> list = new ArrayList<>();
            while (rs.next()) {
                Map<String, String> m = new LinkedHashMap<>();
                m.put("transferId", JsonUtil.quoted(rs.getString("TransferID")));
                m.put("componentId", JsonUtil.quoted(rs.getString("ComponentID")));
                m.put("fromFacility", JsonUtil.quoted(rs.getString("FromFacility")));
                m.put("toFacility", JsonUtil.quoted(rs.getString("ToFacility")));
                m.put("status", JsonUtil.quoted(rs.getString("Status")));
                m.put("componentType", JsonUtil.quoted(rs.getString("ComponentType") != null ? rs.getString("ComponentType") : "RBC"));
                m.put("bloodType", JsonUtil.quoted(rs.getString("BloodType") != null ? rs.getString("BloodType") : "O+"));
                m.put("initiatedAt", JsonUtil.quoted(rs.getTimestamp("InitiatedAt") != null ? rs.getTimestamp("InitiatedAt").toString() : ""));
                m.put("completedAt", rs.getTimestamp("CompletedAt") != null ? JsonUtil.quoted(rs.getTimestamp("CompletedAt").toString()) : "null");
                list.add(JsonUtil.jsonObject(m));
            }
            ApiServer.sendJson(exchange, 200, JsonUtil.jsonArray(list));

        } catch (SQLException e) {
            ApiServer.sendJson(exchange, 500, JsonUtil.errorJson("Failed to fetch transfers: " + e.getMessage()));
        }
    }

    private void handleStart(HttpExchange exchange) throws IOException {
        String body = ApiServer.readBody(exchange);
        Map<String, String> data = JsonUtil.parseJsonBody(body);

        String transferId = data.get("transferId");
        String componentId = data.get("componentId");
        String fromFacility = data.get("fromFacility");
        String toFacility = data.get("toFacility");

        if (transferId == null || transferId.trim().isEmpty()) {
            transferId = "TR" + (System.currentTimeMillis() % 100000);
        } else {
            transferId = transferId.trim();
        }

        if (componentId == null || fromFacility == null || toFacility == null) {
            ApiServer.sendJson(exchange, 400, JsonUtil.errorJson("componentId, fromFacility, and toFacility are required"));
            return;
        }

        boolean oldAutoCommit = true;
        try {
            oldAutoCommit = conn.getAutoCommit();
            conn.setAutoCommit(false);

            String updateSql = "UPDATE BLOOD_COMPONENT SET Status = 'In Transit', FacilityID = ? WHERE ComponentID = ?";
            try (PreparedStatement ps = conn.prepareStatement(updateSql)) {
                ps.setString(1, toFacility.trim());
                ps.setString(2, componentId.trim());
                ps.executeUpdate();
            }

            String insertSql = "INSERT INTO TRANSFER (TransferID, ComponentID, FromFacility, ToFacility, Status) " +
                               "VALUES (?, ?, ?, ?, 'In Transit')";
            try (PreparedStatement ps = conn.prepareStatement(insertSql)) {
                ps.setString(1, transferId);
                ps.setString(2, componentId.trim());
                ps.setString(3, fromFacility.trim());
                ps.setString(4, toFacility.trim());
                ps.executeUpdate();
            }

            conn.commit();
            ApiServer.sendJson(exchange, 201, JsonUtil.successJson("Transfer started successfully with ID: " + transferId));

        } catch (SQLException e) {
            try { conn.rollback(); } catch (SQLException ignored) {}
            ApiServer.sendJson(exchange, 500, JsonUtil.errorJson("Failed to start transfer: " + e.getMessage()));
        } finally {
            try { conn.setAutoCommit(oldAutoCommit); } catch (SQLException ignored) {}
        }
    }

    private void handleComplete(HttpExchange exchange) throws IOException {
        String transferId = null;
        String query = exchange.getRequestURI().getQuery();
        if (query != null && query.contains("id=")) {
            for (String pair : query.split("&")) {
                String[] kv = pair.split("=");
                if (kv.length == 2 && "id".equalsIgnoreCase(kv[0])) {
                    transferId = kv[1];
                }
            }
        }

        if (transferId == null) {
            String body = ApiServer.readBody(exchange);
            Map<String, String> data = JsonUtil.parseJsonBody(body);
            transferId = data.get("id");
            if (transferId == null) transferId = data.get("transferId");
        }

        if (transferId == null || transferId.trim().isEmpty()) {
            ApiServer.sendJson(exchange, 400, JsonUtil.errorJson("Transfer id is required"));
            return;
        }

        transferId = transferId.trim();

        boolean oldAutoCommit = true;
        try {
            oldAutoCommit = conn.getAutoCommit();
            conn.setAutoCommit(false);

            String componentId = null;
            String destination = null;
            try (PreparedStatement ps = conn.prepareStatement(
                    "SELECT ComponentID, ToFacility FROM TRANSFER WHERE TransferID = ? FOR UPDATE")) {
                ps.setString(1, transferId);
                try (ResultSet rs = ps.executeQuery()) {
                    if (rs.next()) {
                        componentId = rs.getString("ComponentID");
                        destination = rs.getString("ToFacility");
                    }
                }
            }

            if (componentId != null) {
                try (PreparedStatement ps = conn.prepareStatement(
                        "UPDATE BLOOD_COMPONENT SET Status = 'Available', FacilityID = ? WHERE ComponentID = ?")) {
                    ps.setString(1, destination);
                    ps.setString(2, componentId);
                    ps.executeUpdate();
                }
            }

            try (PreparedStatement ps = conn.prepareStatement(
                    "UPDATE TRANSFER SET Status = 'Completed', CompletedAt = CURRENT_TIMESTAMP WHERE TransferID = ?")) {
                ps.setString(1, transferId);
                ps.executeUpdate();
            }

            conn.commit();
            ApiServer.sendJson(exchange, 200, JsonUtil.successJson("Transfer marked as completed: " + transferId));

        } catch (SQLException e) {
            try { conn.rollback(); } catch (SQLException ignored) {}
            ApiServer.sendJson(exchange, 500, JsonUtil.errorJson("Failed to complete transfer: " + e.getMessage()));
        } finally {
            try { conn.setAutoCommit(oldAutoCommit); } catch (SQLException ignored) {}
        }
    }
}

