package com.example.modules;

import java.sql.Connection;
import java.sql.PreparedStatement;
import java.sql.ResultSet;
import java.sql.SQLException;
import java.util.Scanner;

public class CompatibilityModule {

    public static void menu(Connection conn, Scanner scanner) {

        int choice = -1;

        while (choice != 0) {

            System.out.println("\n=== BLOOD COMPATIBILITY ===");
            System.out.println("1. Find Compatible Recipients");
            System.out.println("2. Find Compatible Donor Blood Groups");
            System.out.println("0. Back to Main Menu");
            System.out.print("Enter choice: ");

            try {
                choice = Integer.parseInt(scanner.nextLine().trim());
            } catch (NumberFormatException e) {
                System.out.println("Please enter a valid number.");
                continue;
            }

            switch (choice) {

                case 1:
                    findRecipients(conn, scanner);
                    break;

                case 2:
                    findDonors(conn, scanner);
                    break;

                case 0:
                    System.out.println("Returning to main menu...");
                    break;

                default:
                    System.out.println("Invalid choice.");
            }
        }
    }

    // Find recipient blood groups compatible with a donor
    private static void findRecipients(
            Connection conn, Scanner scanner) {

        System.out.print("Enter Donor Blood Group: ");
        String bloodType = scanner.nextLine().trim().toUpperCase();

        String sql =
                "SELECT RecipientType " +
                "FROM BLOOD_COMPATIBILITY " +
                "WHERE DonorType = ? " +
                "ORDER BY RecipientType";

        try (PreparedStatement ps = conn.prepareStatement(sql)) {

            ps.setString(1, bloodType);

            try (ResultSet rs = ps.executeQuery()) {

                System.out.println(
                        "\nCompatible recipient blood groups for "
                        + bloodType + ":");

                boolean found = false;

                while (rs.next()) {
                    found = true;
                    System.out.println(
                            "- " + rs.getString("RecipientType"));
                }

                if (!found) {
                    System.out.println(
                            "No compatibility records found. " +
                            "Check the blood group.");
                }
            }

        } catch (SQLException e) {
            System.out.println(
                    "Error retrieving compatibility: " + e.getMessage());
        }
    }

    // Find donor blood groups compatible with a recipient
    private static void findDonors(
            Connection conn, Scanner scanner) {

        System.out.print("Enter Recipient Blood Group: ");
        String bloodType = scanner.nextLine().trim().toUpperCase();

        String sql =
                "SELECT DonorType " +
                "FROM BLOOD_COMPATIBILITY " +
                "WHERE RecipientType = ? " +
                "ORDER BY DonorType";

        try (PreparedStatement ps = conn.prepareStatement(sql)) {

            ps.setString(1, bloodType);

            try (ResultSet rs = ps.executeQuery()) {

                System.out.println(
                        "\nCompatible donor blood groups for "
                        + bloodType + ":");

                boolean found = false;

                while (rs.next()) {
                    found = true;
                    System.out.println(
                            "- " + rs.getString("DonorType"));
                }

                if (!found) {
                    System.out.println(
                            "No compatibility records found. " +
                            "Check the blood group.");
                }
            }

        } catch (SQLException e) {
            System.out.println(
                    "Error retrieving compatibility: " + e.getMessage());
        }
    }
}