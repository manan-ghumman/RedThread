package com.example.modules;

import java.sql.Connection;
import java.sql.PreparedStatement;
import java.sql.ResultSet;
import java.sql.SQLException;
import java.util.Scanner;

public class BloodRequestModule {

    public static void raiseBloodRequest(Connection conn, Scanner scanner) {

        System.out.println("\n=== RAISE BLOOD REQUEST ===");

        System.out.print("Enter Request ID (e.g., R005): ");
        String requestId = scanner.nextLine().trim();

        System.out.print("Enter Patient ID: ");
        String patientId = scanner.nextLine().trim();

        System.out.print("Enter Requesting Facility ID: ");
        String facilityId = scanner.nextLine().trim();

        System.out.print("Enter Component Type (RBC, Plasma, Platelets): ");
        String componentType = scanner.nextLine().trim();

        System.out.print("Enter Required Blood Type: ");
        String bloodType = scanner.nextLine().trim().toUpperCase();

        System.out.print("Enter Quantity of Units: ");
        int quantity;

        try {
            quantity = Integer.parseInt(scanner.nextLine().trim());

            if (quantity <= 0) {
                System.out.println("[ERROR] Quantity must be greater than zero.");
                return;
            }

        } catch (NumberFormatException e) {
            System.out.println("[ERROR] Enter a valid quantity.");
            return;
        }

        System.out.print("Enter Priority (Emergency, Urgent, Routine): ");
        String priority = scanner.nextLine().trim();

        String sql = "INSERT INTO BLOOD_REQUEST " +
                "(RequestID, PatientID, FacilityID, ComponentType, " +
                "BloodType, Quantity, Priority, Status) " +
                "VALUES (?, ?, ?, ?, ?, ?, ?, 'Pending')";

        try {
            if (!conn.isValid(5)) {
                System.out.println(
                        "[ERROR] Database connection has expired. "
                                + "Restart the application and try again.");
                return;
            }
        } catch (SQLException e) {
            printDatabaseError("check database connection", e);
            return;
        }

        try (PreparedStatement facilityCheck = conn.prepareStatement(
                "SELECT 1 FROM FACILITY WHERE FacilityID = ?")) {

            facilityCheck.setString(1, facilityId);

            try (ResultSet rs = facilityCheck.executeQuery()) {
                if (!rs.next()) {
                    System.out.println(
                            "[ERROR] Facility ID does not exist: " + facilityId
                                    + ". Enter an ID from the FACILITY table.");
                    return;
                }
            }
        } catch (SQLException e) {
            printDatabaseError("validate facility", e);
            return;
        }

        try (PreparedStatement pstmt = conn.prepareStatement(sql)) {

            pstmt.setString(1, requestId);
            pstmt.setString(2, patientId);
            pstmt.setString(3, facilityId);
            pstmt.setString(4, componentType);
            pstmt.setString(5, bloodType);
            pstmt.setInt(6, quantity);
            pstmt.setString(7, priority);

            pstmt.executeUpdate();

            System.out.println(
                    "[SUCCESS] Blood request raised successfully!");

            System.out.println("Request ID: " + requestId);
            System.out.println("Priority: " + priority);
            System.out.println("Status: Pending");

        } catch (SQLException e) {

            printDatabaseError("raise blood request", e);
        }
    }

    private static void printDatabaseError(String operation, SQLException e) {
        if (e.getSQLState() != null && e.getSQLState().startsWith("08")) {
            System.out.println(
                    "[ERROR] Database connection was lost while attempting to "
                    + operation + ". Restart the application and try again.");
            return;
        }

        System.out.println(
                "[ERROR] Failed to " + operation + ": " + e.getMessage());
    }
}