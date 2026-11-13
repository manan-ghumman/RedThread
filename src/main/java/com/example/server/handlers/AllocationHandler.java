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
import java.sql.Timestamp;
import java.util.*;

public class AllocationHandler {

    static class BloodRequest {
        String requestId;
        String redThreadId;
        String priority;
        String bloodType;
        String componentType;
        String facilityId;
        Timestamp requestTime;
        int quantity;
        int karmaPoints;

        BloodRequest(String requestId, String redThreadId, String priority,
                     String bloodType, String componentType, String facilityId,
                     Timestamp requestTime, int quantity, int karmaPoints) {
            this.requestId = requestId;
            this.redThreadId = redThreadId;
            this.priority = priority;
            this.bloodType = bloodType;
            this.componentType = componentType;
            this.facilityId = facilityId;
            this.requestTime = requestTime;
            this.quantity = quantity;
            this.karmaPoints = karmaPoints;
        }
    }

    private static int getPriorityRank(String priority) {
        if ("Critical".equalsIgnoreCase(priority)) return 1;
        if ("Emergency".equalsIgnoreCase(priority)) return 2;
        if ("Urgent".equalsIgnoreCase(priority)) return 3;
        if ("Routine".equalsIgnoreCase(priority)) return 4;
        return 5;
    }

    private static final Comparator<BloodRequest> REQUEST_ORDER =
            Comparator.comparingInt((BloodRequest r) -> getPriorityRank(r.priority))
                    .thenComparing(r -> r.requestTime)
                    .thenComparing(Comparator.comparingInt((BloodRequest r) -> r.karmaPoints).reversed())
                    .thenComparing(r -> r.requestId);

    public static class AllocateHandler implements HttpHandler {
        private final Connection conn;

        public AllocateHandler(Connection conn) {
            this.conn = conn;
        }

        @Override
        public void handle(HttpExchange exchange) throws IOException {
            if (!"POST".equalsIgnoreCase(exchange.getRequestMethod())) {
                ApiServer.sendJson(exchange, 405, JsonUtil.errorJson("Method not allowed"));
                return;
            }

            PriorityQueue<BloodRequest> requestQueue = new PriorityQueue<>(REQUEST_ORDER);
            String query = "SELECT br.RequestID, br.RedThreadID, br.Priority, br.BloodType, " +
                           "br.ComponentType, br.FacilityID, br.RequestTime, " +
                           "br.Quantity, 0 AS KarmaPoints " +
                           "FROM BLOOD_REQUEST br " +
                           "WHERE br.Status = 'Pending'";

            try (PreparedStatement ps = conn.prepareStatement(query);
                 ResultSet rs = ps.executeQuery()) {

                while (rs.next()) {
                    requestQueue.offer(new BloodRequest(
                            rs.getString("RequestID"),
                            rs.getString("RedThreadID"),
                            rs.getString("Priority"),
                            rs.getString("BloodType"),
                            rs.getString("ComponentType"),
                            rs.getString("FacilityID"),
                            rs.getTimestamp("RequestTime"),
                            rs.getInt("Quantity"),
                            rs.getInt("KarmaPoints")
                    ));
                }

            } catch (SQLException e) {
                ApiServer.sendJson(exchange, 500, JsonUtil.errorJson("Could not load requests: " + e.getMessage()));
                return;
            }

            int allocatedCount = 0;
            while (!requestQueue.isEmpty()) {
                BloodRequest request = requestQueue.poll();
                try {
                    if (allocateOne(conn, request)) {
                        allocatedCount++;
                    }
                } catch (SQLException ignored) {}
            }

            Map<String, String> res = new LinkedHashMap<>();
            res.put("success", "true");
            res.put("message", JsonUtil.quoted("Allocation processed. " + allocatedCount + " requests fulfilled."));
            res.put("allocatedCount", String.valueOf(allocatedCount));
            ApiServer.sendJson(exchange, 200, JsonUtil.jsonObject(res));
        }

        private boolean allocateOne(Connection conn, BloodRequest request) throws SQLException {
            // First try calling the OSDBMS stored procedure allocate_request
            try (java.sql.CallableStatement cs = conn.prepareCall("{CALL allocate_request(?)}")) {
                cs.setString(1, request.requestId);
                cs.execute();
                return true;
            } catch (SQLException ex) {
                // If stored procedure fails (e.g. not enough local stock), try network-wide fallback
            }

            boolean previousAutoCommit = conn.getAutoCommit();
            conn.setAutoCommit(false);

            try {
                try (PreparedStatement ps = conn.prepareStatement(
                        "SELECT Status FROM BLOOD_REQUEST WHERE RequestID = ? FOR UPDATE")) {
                    ps.setString(1, request.requestId);
                    try (ResultSet rs = ps.executeQuery()) {
                        if (!rs.next() || !"Pending".equals(rs.getString("Status"))) {
                            conn.rollback();
                            return false;
                        }
                    }
                }

                String stockSql =
                        "SELECT bc.ComponentID " +
                        "FROM BLOOD_COMPONENT bc " +
                        "JOIN DONATION dn ON dn.DonationID = bc.DonationID " +
                        "JOIN DONOR d ON d.RedThreadID = dn.RedThreadID " +
                        "JOIN PERSON donor_person ON donor_person.RedThreadID = d.RedThreadID " +
                        "WHERE bc.Type = ? " +
                        "AND bc.Status = 'Available' " +
                        "AND bc.ExpiryDate >= CURDATE() " +
                        "AND (donor_person.BloodType = ? OR " +
                        "(? = 'RBC' AND EXISTS (" +
                        "SELECT 1 FROM BLOOD_COMPATIBILITY c " +
                        "WHERE c.DonorType = donor_person.BloodType " +
                        "AND c.RecipientType = ?))) " +
                        "ORDER BY (donor_person.BloodType = ?) DESC, " +
                        "bc.ExpiryDate ASC, " +
                        "CASE WHEN ? = 'Routine' THEN d.KarmaPoints ELSE 0 END DESC, " +
                        "bc.ComponentID " +
                        "LIMIT ? FOR UPDATE";

                List<String> components = new ArrayList<>();
                try (PreparedStatement ps = conn.prepareStatement(stockSql)) {
                    ps.setString(1, request.componentType);
                    ps.setString(2, request.bloodType);
                    ps.setString(3, request.componentType);
                    ps.setString(4, request.bloodType);
                    ps.setString(5, request.bloodType);
                    ps.setString(6, request.priority);
                    ps.setInt(7, request.quantity);

                    try (ResultSet rs = ps.executeQuery()) {
                        while (rs.next()) {
                            components.add(rs.getString("ComponentID"));
                        }
                    }
                }

                if (components.size() < request.quantity) {
                    conn.rollback();
                    return false;
                }

                for (String componentId : components) {
                    try (PreparedStatement ps = conn.prepareStatement(
                            "UPDATE BLOOD_COMPONENT SET Status = 'Reserved', RecipientRedThreadID = ? " +
                            "WHERE ComponentID = ? AND Status = 'Available'")) {
                        ps.setString(1, request.redThreadId);
                        ps.setString(2, componentId);
                        ps.executeUpdate();
                    }

                    String allocationId = "AL" + UUID.randomUUID().toString().replace("-", "").substring(0, 10);
                    try (PreparedStatement ps = conn.prepareStatement(
                            "INSERT INTO ALLOCATION (AllocationID, RequestID, ComponentID) VALUES (?, ?, ?)")) {
                        ps.setString(1, allocationId);
                        ps.setString(2, request.requestId);
                        ps.setString(3, componentId);
                        ps.executeUpdate();
                    }
                }

                try (PreparedStatement ps = conn.prepareStatement(
                        "UPDATE BLOOD_REQUEST SET Status = 'Allocated' WHERE RequestID = ? AND Status = 'Pending'")) {
                    ps.setString(1, request.requestId);
                    ps.executeUpdate();
                }

                conn.commit();
                return true;

            } catch (SQLException e) {
                conn.rollback();
                throw e;
            } finally {
                conn.setAutoCommit(previousAutoCommit);
            }
        }
    }

    public static class ListHandler implements HttpHandler {
        private final Connection conn;

        public ListHandler(Connection conn) {
            this.conn = conn;
        }

        @Override
        public void handle(HttpExchange exchange) throws IOException {
            if (!"GET".equalsIgnoreCase(exchange.getRequestMethod())) {
                ApiServer.sendJson(exchange, 405, JsonUtil.errorJson("Method not allowed"));
                return;
            }

            String sql = "SELECT AllocationID, RequestID, ComponentID, AllocatedAt FROM ALLOCATION ORDER BY AllocatedAt DESC";
            try (PreparedStatement ps = conn.prepareStatement(sql);
                 ResultSet rs = ps.executeQuery()) {

                List<String> list = new ArrayList<>();
                while (rs.next()) {
                    Map<String, String> m = new LinkedHashMap<>();
                    m.put("allocationId", JsonUtil.quoted(rs.getString("AllocationID")));
                    m.put("requestId", JsonUtil.quoted(rs.getString("RequestID")));
                    m.put("componentId", JsonUtil.quoted(rs.getString("ComponentID")));
                    m.put("allocatedAt", JsonUtil.quoted(rs.getTimestamp("AllocatedAt") != null ? rs.getTimestamp("AllocatedAt").toString() : ""));
                    list.add(JsonUtil.jsonObject(m));
                }
                ApiServer.sendJson(exchange, 200, JsonUtil.jsonArray(list));

            } catch (SQLException e) {
                ApiServer.sendJson(exchange, 500, JsonUtil.errorJson("Failed to fetch allocations: " + e.getMessage()));
            }
        }
    }
}

