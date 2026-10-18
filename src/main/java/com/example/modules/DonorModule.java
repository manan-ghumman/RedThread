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

        boolean previousAutoCommit;
        try {
            previousAutoCommit = conn.getAutoCommit();
            conn.setAutoCommit(false);

            try (PreparedStatement person = conn.prepareStatement(
                    "INSERT INTO PERSON (RedThreadID, Name, BloodType) " +
                    "VALUES (?, ?, ?)")) {
                person.setString(1, donorId);
                person.setString(2, name);
                person.setString(3, bloodType);
                person.executeUpdate();
            }

            try (PreparedStatement donor = conn.prepareStatement(
                    "INSERT INTO DONOR " +
                    "(RedThreadID, KarmaPoints, EligibilityStatus) " +
                    "VALUES (?, 0, 'Eligible')")) {
                donor.setString(1, donorId);
                int rows = donor.executeUpdate();
                conn.commit();

                System.out.println(
                        "[SUCCESS] Donor registered successfully! Rows affected: " + rows);
            } catch (SQLException e) {
                conn.rollback();
                throw e;
            } finally {
                conn.setAutoCommit(previousAutoCommit);
            }

        } catch (SQLException e) {
            System.err.println(
                    "[ERROR] Failed to register donor: " + e.getMessage());
        }
    }
}