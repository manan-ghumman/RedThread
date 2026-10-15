
package com.example.modules;

import java.sql.*;
import java.util.Comparator;
import java.util.PriorityQueue;
import java.util.UUID;

public class AllocationModule {

    // Stores the details of each pending blood request
    static class BloodRequest {
        String requestId;
        String priority;
        String bloodType;
        String componentType;
        String facilityId;
        Timestamp requestTime;
        int quantity;

        BloodRequest(
                String requestId,
                String priority,
                String bloodType,
                String componentType,
                String facilityId,
                Timestamp requestTime,
                int quantity) {

            this.requestId = requestId;
            this.priority = priority;
            this.bloodType = bloodType;
            this.componentType = componentType;
            this.facilityId = facilityId;
            this.requestTime = requestTime;
            this.quantity = quantity;
        }
    }

    // PRIORITY SCHEDULING:
    // Critical -> Emergency -> Urgent -> Routine
    // FCFS breaks ties within the same priority.
    private static final Comparator<BloodRequest> REQUEST_ORDER =
            Comparator.comparingInt(
                    (BloodRequest r) -> getPriorityRank(r.priority))
                    .thenComparing(r -> r.requestTime)
                    .thenComparing(r -> r.requestId);

    private static int getPriorityRank(String priority) {
        switch (priority) {
            case "Critical":
                return 1;
            case "Emergency":
                return 2;
            case "Urgent":
                return 3;
            case "Routine":
                return 4;
            default:
                return 5;
        }
    }

    public static void allocateRequest(Connection conn) {

        PriorityQueue<BloodRequest> requestQueue =
                new PriorityQueue<>(REQUEST_ORDER);

        System.out.println("\n=== REDTHREAD BLOOD ALLOCATION ===");

        // Fetch pending requests and add them to the priority queue.
        String query =
                "SELECT RequestID, Priority, BloodType, ComponentType, " +
                "FacilityID, RequestTime, Quantity " +
                "FROM BLOOD_REQUEST WHERE Status = 'Pending'";

        try (PreparedStatement ps = conn.prepareStatement(query);
             ResultSet rs = ps.executeQuery()) {

            while (rs.next()) {
                requestQueue.offer(new BloodRequest(
                        rs.getString("RequestID"),
                        rs.getString("Priority"),
                        rs.getString("BloodType"),
                        rs.getString("ComponentType"),
                        rs.getString("FacilityID"),
                        rs.getTimestamp("RequestTime"),
                        rs.getInt("Quantity")
                ));
            }

        } catch (SQLException e) {
            System.out.println("Could not load requests: "
                    + e.getMessage());
            return;
        }

        if (requestQueue.isEmpty()) {
            System.out.println("No pending blood requests.");
            return;
        }

        System.out.println("\nRequests queued: " + requestQueue.size());
        System.out.println("Scheduling: Priority + FCFS");

        // DEQUEUE: process requests in scheduling order.
        while (!requestQueue.isEmpty()) {

            BloodRequest request = requestQueue.poll();

            System.out.println("\nProcessing: " + request.requestId);
            System.out.println("Priority: " + request.priority);
            System.out.println("Arrival: " + request.requestTime);

            try {
                allocateOneRequest(conn, request);
            } catch (SQLException e) {
                System.out.println("Allocation failed for "
                        + request.requestId + ": " + e.getMessage());
            }
        }

        System.out.println("\nQueue processing completed.");
    }

    private static void allocateOneRequest(
            Connection conn, BloodRequest request) throws SQLException {

        boolean previousAutoCommit = conn.getAutoCommit();
        conn.setAutoCommit(false);

        try {
            // Lock the request and check that it is still pending.
            try (PreparedStatement ps = conn.prepareStatement(
                    "SELECT Status FROM BLOOD_REQUEST " +
                    "WHERE RequestID = ? FOR UPDATE")) {

                ps.setString(1, request.requestId);

                try (ResultSet rs = ps.executeQuery()) {
                    if (!rs.next()
                            || !"Pending".equals(rs.getString("Status"))) {
                        conn.rollback();
                        System.out.println("Request is no longer pending.");
                        return;
                    }
                }
            }

            // Find compatible, available and unexpired units.
            // For Routine requests, Karma Points break ties
            // after exact blood-type match and expiry date.
            String stockSql =
                    "SELECT bc.ComponentID " +
                    "FROM BLOOD_COMPONENT bc " +
                    "JOIN DONATION dn ON dn.DonationID = bc.DonationID " +
                    "JOIN DONOR d ON d.RedThreadID = dn.RedThreadID " +
                    "WHERE bc.Type = ? " +
                    "AND bc.Status = 'Available' " +
                    "AND bc.ExpiryDate >= CURDATE() " +
                    "AND bc.FacilityID = ? " +
                    "AND (d.BloodType = ? OR " +
                    "(? = 'RBC' AND EXISTS (" +
                    "SELECT 1 FROM BLOOD_COMPATIBILITY c " +
                    "WHERE c.DonorType = d.BloodType " +
                    "AND c.RecipientType = ?))) " +
                    "ORDER BY (d.BloodType = ?) DESC, " +
                    "bc.ExpiryDate ASC, " +
                    "CASE WHEN ? = 'Routine' " +
                    "THEN d.KarmaPoints ELSE 0 END DESC, " +
                    "bc.ComponentID " +
                    "LIMIT ? FOR UPDATE";

            java.util.List<String> components = new java.util.ArrayList<>();

            try (PreparedStatement ps =
                         conn.prepareStatement(stockSql)) {

                ps.setString(1, request.componentType);
                ps.setString(2, request.facilityId);
                ps.setString(3, request.bloodType);
                ps.setString(4, request.componentType);
                ps.setString(5, request.bloodType);
                ps.setString(6, request.bloodType);
                ps.setString(7, request.priority);
                ps.setInt(8, request.quantity);

                try (ResultSet rs = ps.executeQuery()) {
                    while (rs.next()) {
                        components.add(rs.getString("ComponentID"));
                    }
                }
            }

            // Do not partially allocate a request.
            if (components.size() < request.quantity) {
                conn.rollback();
                System.out.println(
                        "Insufficient compatible stock. Request remains pending.");
                return;
            }

            for (String componentId : components) {

                // Reserve the selected blood component.
                try (PreparedStatement ps = conn.prepareStatement(
                        "UPDATE BLOOD_COMPONENT " +
                        "SET Status = 'Reserved' " +
                        "WHERE ComponentID = ? AND Status = 'Available'")) {

                    ps.setString(1, componentId);

                    if (ps.executeUpdate() != 1) {
                        throw new SQLException(
                                "Blood unit is no longer available.");
                    }
                }

                // Record the allocation.
                String allocationId =
                        "AL" + UUID.randomUUID()
                                .toString().replace("-", "").substring(0, 10);

                try (PreparedStatement ps = conn.prepareStatement(
                        "INSERT INTO ALLOCATION " +
                        "(AllocationID, RequestID, ComponentID) " +
                        "VALUES (?, ?, ?)")) {

                    ps.setString(1, allocationId);
                    ps.setString(2, request.requestId);
                    ps.setString(3, componentId);
                    ps.executeUpdate();
                }
            }

            try (PreparedStatement ps = conn.prepareStatement(
                    "UPDATE BLOOD_REQUEST SET Status = 'Allocated' " +
                    "WHERE RequestID = ? AND Status = 'Pending'")) {

                ps.setString(1, request.requestId);

                if (ps.executeUpdate() != 1) {
                    throw new SQLException(
                            "Could not update request status.");
                }
            }

            conn.commit();

            System.out.println("Allocation successful!");
            System.out.println("Request: " + request.requestId);
            System.out.println("Units allocated: " + components.size());

        } catch (SQLException e) {
            conn.rollback();
            throw e;

        } finally {
            conn.setAutoCommit(previousAutoCommit);
        }
    }
}
