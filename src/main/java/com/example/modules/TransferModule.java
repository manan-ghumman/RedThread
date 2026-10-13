package com.example.modules;

import java.sql.Connection;
import java.sql.PreparedStatement;
import java.sql.ResultSet;
import java.sql.SQLException;
import java.sql.Statement;
import java.util.Scanner;

public class TransferModule {

    public static void menu(Connection conn, Scanner scanner)
            throws SQLException {

        int choice = -1;

        while (choice != 0) {

            System.out.println("\n=== BLOOD TRANSFER MODULE ===");
            System.out.println("1. Start a Transfer");
            System.out.println("2. Complete a Transfer");
            System.out.println("3. View Transfer History");
            System.out.println("0. Back to Main Menu");
            System.out.print("Enter choice: ");

            try {
                choice = Integer.parseInt(scanner.nextLine().trim());
            } catch (NumberFormatException e) {
                System.out.println("Enter a valid number.");
                continue;
            }

            switch (choice) {

                case 1:
                    startTransfer(conn, scanner);
                    break;

                case 2:
                    completeTransfer(conn, scanner);
                    break;

                case 3:
                    viewTransfers(conn);
                    break;

                case 0:
                    System.out.println("Returning to main menu...");
                    break;

                default:
                    System.out.println("Invalid choice.");
            }
        }
    }

    // 1. Start a blood transfer
    private static void startTransfer(
            Connection conn, Scanner scanner)
            throws SQLException {

        System.out.println("\n--- START BLOOD TRANSFER ---");

        System.out.print("Enter Transfer ID: ");
        String transferId = scanner.nextLine().trim();

        System.out.print("Enter Component ID: ");
        String componentId = scanner.nextLine().trim();

        System.out.print("Enter Source Facility ID: ");
        String fromFacility = scanner.nextLine().trim();

        System.out.print("Enter Destination Facility ID: ");
        String toFacility = scanner.nextLine().trim();

        if (transferId.isEmpty() || componentId.isEmpty()
                || fromFacility.isEmpty() || toFacility.isEmpty()) {

            System.out.println("All fields are required.");
            return;
        }

        if (fromFacility.equals(toFacility)) {
            System.out.println(
                    "Source and destination must be different.");
            return;
        }

        boolean oldAutoCommit = conn.getAutoCommit();
        conn.setAutoCommit(false);

        try {

            String currentFacility = null;
            String status = null;

            // Lock the component while checking its availability
            String checkSql =
                    "SELECT FacilityID, Status " +
                    "FROM BLOOD_COMPONENT " +
                    "WHERE ComponentID = ? FOR UPDATE";

            try (PreparedStatement ps =
                    conn.prepareStatement(checkSql)) {

                ps.setString(1, componentId);

                try (ResultSet rs = ps.executeQuery()) {

                    if (rs.next()) {
                        currentFacility = rs.getString("FacilityID");
                        status = rs.getString("Status");
                    }
                }
            }

            if (status == null) {
                conn.rollback();
                System.out.println("Blood component not found.");
                return;
            }

            if (!"Available".equals(status)
                    || !fromFacility.equals(currentFacility)) {

                conn.rollback();

                System.out.println(
                        "Transfer failed. The component must be " +
                        "Available at the selected source facility.");

                return;
            }

            // Update component status
            String updateSql =
                    "UPDATE BLOOD_COMPONENT " +
                    "SET Status = 'In Transit', FacilityID = ? " +
                    "WHERE ComponentID = ?";

            try (PreparedStatement ps =
                    conn.prepareStatement(updateSql)) {

                ps.setString(1, toFacility);
                ps.setString(2, componentId);
                ps.executeUpdate();
            }

            // Record the transfer
            String insertSql =
                    "INSERT INTO TRANSFER " +
                    "(TransferID, ComponentID, FromFacility, " +
                    "ToFacility, Status) " +
                    "VALUES (?, ?, ?, ?, 'In Transit')";

            try (PreparedStatement ps =
                    conn.prepareStatement(insertSql)) {

                ps.setString(1, transferId);
                ps.setString(2, componentId);
                ps.setString(3, fromFacility);
                ps.setString(4, toFacility);
                ps.executeUpdate();
            }

            conn.commit();

            System.out.println(
                    "Transfer started successfully!");

            System.out.println("Transfer ID: " + transferId);
            System.out.println("Status: In Transit");

        } catch (SQLException e) {

            conn.rollback();
            throw e;

        } finally {

            conn.setAutoCommit(oldAutoCommit);
        }
    }

    // 2. Complete a blood transfer
    private static void completeTransfer(
            Connection conn, Scanner scanner)
            throws SQLException {

        System.out.println("\n--- COMPLETE BLOOD TRANSFER ---");

        System.out.print("Enter Transfer ID: ");
        String transferId = scanner.nextLine().trim();

        if (transferId.isEmpty()) {
            System.out.println("Transfer ID cannot be empty.");
            return;
        }

        boolean oldAutoCommit = conn.getAutoCommit();
        conn.setAutoCommit(false);

        try {

            String componentId = null;
            String destination = null;
            String status = null;

            String checkSql =
                    "SELECT ComponentID, ToFacility, Status " +
                    "FROM TRANSFER " +
                    "WHERE TransferID = ? FOR UPDATE";

            try (PreparedStatement ps =
                    conn.prepareStatement(checkSql)) {

                ps.setString(1, transferId);

                try (ResultSet rs = ps.executeQuery()) {

                    if (rs.next()) {
                        componentId = rs.getString("ComponentID");
                        destination = rs.getString("ToFacility");
                        status = rs.getString("Status");
                    }
                }
            }

            if (status == null) {
                conn.rollback();
                System.out.println("Transfer not found.");
                return;
            }

            if (!"In Transit".equals(status)) {
                conn.rollback();

                System.out.println(
                        "Only transfers that are In Transit " +
                        "can be completed.");

                return;
            }

            // Mark the component as available at its destination
            String updateComponent =
                    "UPDATE BLOOD_COMPONENT " +
                    "SET Status = 'Available', FacilityID = ? " +
                    "WHERE ComponentID = ? AND Status = 'In Transit'";

            try (PreparedStatement ps =
                    conn.prepareStatement(updateComponent)) {

                ps.setString(1, destination);
                ps.setString(2, componentId);

                int rows = ps.executeUpdate();

                if (rows != 1) {
                    throw new SQLException(
                            "Component is not currently in transit.");
                }
            }

            // Update transfer history
            String updateTransfer =
                    "UPDATE TRANSFER " +
                    "SET Status = 'Completed', " +
                    "CompletedAt = CURRENT_TIMESTAMP " +
                    "WHERE TransferID = ?";

            try (PreparedStatement ps =
                    conn.prepareStatement(updateTransfer)) {

                ps.setString(1, transferId);
                ps.executeUpdate();
            }

            conn.commit();

            System.out.println(
                    "Transfer completed successfully!");

            System.out.println(
                    "Component is now available at " + destination);

        } catch (SQLException e) {

            conn.rollback();
            throw e;

        } finally {

            conn.setAutoCommit(oldAutoCommit);
        }
    }

    // 3. View transfer history
    private static void viewTransfers(Connection conn)
            throws SQLException {

        String sql =
                "SELECT TransferID, ComponentID, FromFacility, " +
                "ToFacility, Status, InitiatedAt, CompletedAt " +
                "FROM TRANSFER ORDER BY InitiatedAt DESC";

        try (Statement stmt = conn.createStatement();
             ResultSet rs = stmt.executeQuery(sql)) {

            System.out.println("\n=== TRANSFER HISTORY ===");

            System.out.printf(
                    "%-12s | %-12s | %-10s | %-10s | %-12s%n",
                    "Transfer ID", "Component", "Source",
                    "Destination", "Status");

            System.out.println(
                    "----------------------------------------------------------------");

            boolean found = false;

            while (rs.next()) {

                found = true;

                System.out.printf(
                        "%-12s | %-12s | %-10s | %-10s | %-12s%n",
                        rs.getString("TransferID"),
                        rs.getString("ComponentID"),
                        rs.getString("FromFacility"),
                        rs.getString("ToFacility"),
                        rs.getString("Status"));

                System.out.println(
                        "   Initiated: " + rs.getTimestamp("InitiatedAt"));

                System.out.println(
                        "   Completed: " + rs.getTimestamp("CompletedAt"));
            }

            if (!found) {
                System.out.println("No transfers found.");
            }
        }
    }
}