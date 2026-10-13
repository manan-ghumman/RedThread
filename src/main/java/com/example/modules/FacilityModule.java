package com.example.modules;

import java.sql.Connection;
import java.sql.ResultSet;
import java.sql.SQLException;
import java.sql.Statement;

public class FacilityModule {

    public static void viewFacilities(Connection conn)
            throws SQLException {

        String sql = "SELECT f.FacilityID, f.Type, f.Location, " +
                     "f.ReportsTo, p.Location AS ParentLocation " +
                     "FROM FACILITY f " +
                     "LEFT JOIN FACILITY p " +
                     "ON f.ReportsTo = p.FacilityID " +
                     "ORDER BY f.FacilityID";

        try (Statement stmt = conn.createStatement();
             ResultSet rs = stmt.executeQuery(sql)) {

            System.out.println("\n=== FACILITY MANAGEMENT ===");

            System.out.printf(
                    "%-12s | %-12s | %-20s | %-12s | %-20s%n",
                    "Facility ID", "Type", "Location",
                    "Reports To", "Parent Location");

            System.out.println(
                    "--------------------------------------------------------------------------");

            boolean found = false;

            while (rs.next()) {

                found = true;

                System.out.printf(
                        "%-12s | %-12s | %-20s | %-12s | %-20s%n",
                        rs.getString("FacilityID"),
                        rs.getString("Type"),
                        rs.getString("Location"),
                        rs.getString("ReportsTo"),
                        rs.getString("ParentLocation"));
            }

            if (!found) {
                System.out.println("No facilities found.");
            }
        }
    }
}