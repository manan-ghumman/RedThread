package com.example.modules;

import java.sql.Connection;
import java.sql.PreparedStatement;
import java.sql.ResultSet;
import java.sql.SQLException;

public class AllocationHistory {

    public static void viewHistory(Connection conn) {

        String query = "SELECT * FROM ALLOCATION ORDER BY AllocatedAt DESC";

        System.out.println("\n========== ALLOCATION HISTORY ==========");

        try {
            PreparedStatement ps = conn.prepareStatement(query);
            ResultSet rs = ps.executeQuery();

            boolean found = false;

            System.out.printf("%-15s %-15s %-15s %-25s%n",
                    "Allocation ID", "Request ID",
                    "Component ID", "Allocated At");

            System.out.println("---------------------------------------------------------------");

            while (rs.next()) {
                found = true;

                System.out.printf("%-15s %-15s %-15s %-25s%n",
                        rs.getString("AllocationID"),
                        rs.getString("RequestID"),
                        rs.getString("ComponentID"),
                        rs.getTimestamp("AllocatedAt"));
            }

            if (!found) {
                System.out.println("No allocation records found.");
            }

            rs.close();
            ps.close();

        } catch (SQLException e) {
            System.out.println("Error fetching allocation history: "
                    + e.getMessage());
        }
    }
}