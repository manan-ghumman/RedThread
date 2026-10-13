package com.example.modules;

import java.sql.Connection;
import java.sql.PreparedStatement;
import java.sql.SQLException;
import java.util.Scanner;

public class DonationModule {

    public static void recordDonation(Connection conn, Scanner scanner) {

        System.out.println("\n=== RECORD BLOOD DONATION ===");

        System.out.print("Enter Donation ID (e.g., DN005): ");
        String donationId = scanner.nextLine().trim();

        System.out.print("Enter Donor ID: ");
        String donorId = scanner.nextLine().trim();

        System.out.print("Enter Donation Date (YYYY-MM-DD): ");
        String donationDate = scanner.nextLine().trim();

        System.out.print("Enter Volume in mL: ");
        int volume;

        try {
            volume = Integer.parseInt(scanner.nextLine().trim());
        } catch (NumberFormatException e) {
            System.out.println("[ERROR] Please enter a valid number.");
            return;
        }

        System.out.print("Enter Facility ID (e.g., F001): ");
        String facilityId = scanner.nextLine().trim();

        String sql = "INSERT INTO DONATION " +
                "(DonationID, RedThreadID, DonationDate, Volume_mL, FacilityID) " +
                "VALUES (?, ?, ?, ?, ?)";

        try (PreparedStatement pstmt = conn.prepareStatement(sql)) {

            pstmt.setString(1, donationId);
            pstmt.setString(2, donorId);
            pstmt.setDate(3, java.sql.Date.valueOf(donationDate));
            pstmt.setInt(4, volume);
            pstmt.setString(5, facilityId);

            pstmt.executeUpdate();

            System.out.println(
                    "[SUCCESS] Donation recorded successfully!");

        } catch (SQLException e) {

            System.out.println(
                    "[DONATION FAILED] " + e.getMessage());

        } catch (IllegalArgumentException e) {

            System.out.println(
                    "[ERROR] Invalid date. Use YYYY-MM-DD.");
        }
    }
}