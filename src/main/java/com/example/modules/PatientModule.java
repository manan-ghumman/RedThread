package com.example.modules;

import java.sql.Connection;
import java.sql.PreparedStatement;
import java.sql.ResultSet;
import java.sql.SQLException;
import java.util.Scanner;

public class PatientModule {

    public static void menu(Connection conn, Scanner scanner) {

        int choice = -1;

        while (choice != 0) {

            System.out.println("\n=== PATIENT MANAGEMENT ===");
            System.out.println("1. Register Patient");
            System.out.println("2. View Patients");
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
                    registerPatient(conn, scanner);
                    break;

                case 2:
                    viewPatients(conn);
                    break;

                case 0:
                    System.out.println("Returning to main menu...");
                    break;

                default:
                    System.out.println("Invalid choice.");
            }
        }
    }

    private static void registerPatient(
            Connection conn, Scanner scanner) {

        System.out.println("\n--- REGISTER PATIENT ---");

        System.out.print("Enter Patient ID: ");
        String patientId = scanner.nextLine().trim();

        System.out.print("Enter Blood Group: ");
        String bloodType = scanner.nextLine().trim().toUpperCase();

        boolean previousAutoCommit;
        try {
            previousAutoCommit = conn.getAutoCommit();
            conn.setAutoCommit(false);

            try (PreparedStatement person = conn.prepareStatement(
                    "INSERT INTO PERSON (RedThreadID, Name, BloodType) " +
                    "VALUES (?, NULL, ?)")) {
                person.setString(1, patientId);
                person.setString(2, bloodType);
                person.executeUpdate();
            }

            try (PreparedStatement patient = conn.prepareStatement(
                    "INSERT INTO PATIENT (RedThreadID) VALUES (?)")) {
                patient.setString(1, patientId);
                patient.executeUpdate();
                conn.commit();
            } catch (SQLException e) {
                conn.rollback();
                throw e;
            } finally {
                conn.setAutoCommit(previousAutoCommit);
            }

            System.out.println(
                    "Patient registered successfully!");

        } catch (SQLException e) {

            System.out.println(
                    "Failed to register patient: " + e.getMessage());
        }
    }

    private static void viewPatients(Connection conn) {

        String sql =
                "SELECT p.RedThreadID, person.BloodType " +
                "FROM PATIENT p " +
                "JOIN PERSON person ON person.RedThreadID = p.RedThreadID " +
                "ORDER BY p.RedThreadID";

        try (PreparedStatement ps = conn.prepareStatement(sql);
             ResultSet rs = ps.executeQuery()) {

            System.out.println("\n--- REGISTERED PATIENTS ---");
            System.out.printf("%-20s | %-12s%n",
                    "Patient ID", "Blood Group");

            System.out.println("------------------------------------");

            boolean found = false;

            while (rs.next()) {

                found = true;

                System.out.printf("%-20s | %-12s%n",
                        rs.getString("RedThreadID"),
                        rs.getString("BloodType"));
            }

            if (!found) {
                System.out.println("No patients found.");
            }

        } catch (SQLException e) {

            System.out.println(
                    "Failed to retrieve patients: " + e.getMessage());
        }
    }
}