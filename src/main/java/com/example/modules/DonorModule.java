package com.example.modules;

import java.sql.Connection;
import java.sql.PreparedStatement;
import java.sql.SQLException;
import java.util.Scanner;

public class DonorModule {

    public static void registerDonor(Connection conn, Scanner scanner) {

        System.out.println("\n=== REGISTER NEW DONOR ===");

        System.out.print("Enter Donor ID (e.g., D005): ");
        String donorId = scanner.nextLine().trim();

        System.out.print("Enter Full Name: ");
        String name = scanner.nextLine().trim();

        System.out.print("Enter Blood Type (A+, A-, B+, B-, AB+, AB-, O+, O-): ");
        String bloodType = scanner.nextLine().trim().toUpperCase();

        String sql = "INSERT INTO DONOR " +
                "(RedThreadID, Name, BloodType, KarmaPoints, EligibilityStatus) " +
                "VALUES (?, ?, ?, 0, 'Eligible')";

        try (PreparedStatement pstmt = conn.prepareStatement(sql)) {

            pstmt.setString(1, donorId);
            pstmt.setString(2, name);
            pstmt.setString(3, bloodType);

            int rows = pstmt.executeUpdate();

            System.out.println(
                    "[SUCCESS] Donor registered successfully! Rows affected: " + rows);

        } catch (SQLException e) {

            System.err.println(
                    "[ERROR] Failed to register donor: " + e.getMessage());
        }
    }
}