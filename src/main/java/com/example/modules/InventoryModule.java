package com.example.modules;

import java.sql.Connection;
import java.sql.ResultSet;
import java.sql.SQLException;
import java.sql.Statement;

public class InventoryModule {

    public static void viewInventory(Connection conn)
            throws SQLException {

        String query = "SELECT BloodType, Type, COUNT(*) AS AvailableUnits " +
                       "FROM v_inventory " +
                       "WHERE Status = 'Available' AND ExpiryDate >= CURDATE() " +
                       "GROUP BY BloodType, Type " +
                       "ORDER BY BloodType, Type";

        try (Statement stmt = conn.createStatement();
             ResultSet rs = stmt.executeQuery(query)) {

            System.out.println("\n=== AVAILABLE BLOOD INVENTORY ===");

            System.out.printf("%-12s | %-12s | %-15s\n",
                    "Blood Type", "Component", "Available Units");

            System.out.println("--------------------------------------------");

            boolean hasRows = false;

            while (rs.next()) {
                hasRows = true;

                System.out.printf("%-12s | %-12s | %-15d\n",
                        rs.getString("BloodType"),
                        rs.getString("Type"),
                        rs.getInt("AvailableUnits"));
            }

            if (!hasRows) {
                System.out.println(
                        "No available blood units found in inventory.");
            }
        }
    }
}