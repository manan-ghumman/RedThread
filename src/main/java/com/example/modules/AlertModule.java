package com.example.modules;

import java.sql.Connection;
import java.sql.ResultSet;
import java.sql.SQLException;
import java.sql.Statement;

public class AlertModule {

    public static void viewSystemAlerts(Connection conn)
            throws SQLException {

        String query = "SELECT AlertID, FacilityID, AlertType, Message, CreatedAt " +
                       "FROM ALERT " +
                       "WHERE IsRead = FALSE " +
                       "ORDER BY CreatedAt DESC LIMIT 10";

        try (Statement stmt = conn.createStatement();
             ResultSet rs = stmt.executeQuery(query)) {

            System.out.println("\n=== UNREAD SYSTEM ALERTS ===");

            System.out.printf("%-8s | %-10s | %-12s | %-40s\n",
                    "AlertID", "Facility", "Type", "Message");

            System.out.println(
                    "--------------------------------------------------------------------------");

            boolean hasRows = false;

            while (rs.next()) {
                hasRows = true;

                System.out.printf("%-8d | %-10s | %-12s | %-40s\n",
                        rs.getInt("AlertID"),
                        rs.getString("FacilityID"),
                        rs.getString("AlertType"),
                        rs.getString("Message"));
            }

            if (!hasRows) {
                System.out.println("No unread alerts found.");
            }
        }
    }
}