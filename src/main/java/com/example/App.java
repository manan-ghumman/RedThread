package com.example;

import java.sql.CallableStatement;
import java.sql.Connection;
import java.sql.DriverManager;
import java.sql.PreparedStatement;
import java.sql.ResultSet;
import java.sql.SQLException;
import java.sql.Statement;
import java.util.Scanner;


public class App {
    // Database connection parameters (Update username/password/URL as needed)
    private static final String DB_URL = "jdbc:mysql://localhost:3306/osdbms?useSSL=false&serverTimezone=UTC";
    private static final String DB_USER = "root";
    private static final String DB_PASSWORD = "";

    public static void main(String[] args) {
        System.out.println("==================================================");
        System.out.println("   RedThread Blood Bank Management System (OSDBMS)");
        System.out.println("==================================================");

        try (Connection conn = DriverManager.getConnection(DB_URL, DB_USER, DB_PASSWORD);
             Scanner scanner = new Scanner(System.in)) {
            
            // Ensure auto-commit is enabled by default for standard queries
            conn.setAutoCommit(true);
            System.out.println("[INFO] Connected successfully to MySQL database 'osdbms'.\n");

            int choice = -1;
            do {
                printMenu();
                System.out.print("Select an option [0-6]: ");
                
                if (!scanner.hasNextInt()) {
                    System.out.println("[ERROR] Invalid input. Please enter a number.");
                    scanner.nextLine(); // Consume invalid input
                    continue;
                }
                
                choice = scanner.nextInt();
                scanner.nextLine(); // Consume newline character

                switch (choice) {
                    case 1:
                        viewInventory(conn);
                        break;
                    case 2:
                        registerDonor(conn, scanner);
                        break;
                    case 3:
                        recordDonation(conn, scanner);
                        break;
                    case 4:
                        raiseBloodRequest(conn, scanner);
                        break;
                    case 5:
                        testAllocationProcedure(conn, scanner);
                        break;
                    case 6:
                        viewSystemAlerts(conn);
                        break;
                    case 0:
                        System.out.println("\n[INFO] Closing RedThread Terminal. Goodbye!");
                        break;
                    default:
                        System.out.println("[WARNING] Invalid option. Please choose between 0 and 6.");
                }
                
                if (choice != 0) {
                    System.out.println("\nPress Enter to return to the main menu...");
                    scanner.nextLine();
                }

            } while (choice != 0);

        } catch (SQLException e) {
            System.err.println("\n[FATAL DATABASE ERROR] " + e.getMessage());
            e.printStackTrace();
        }
    }

    private static void printMenu() {
        System.out.println("\n---------------- MAIN MENU ----------------");
        System.out.println("1. View Available Inventory (v_inventory)");
        System.out.println("2. Register a New Donor");
        System.out.println("3. Record a Donation (Tests Triggers & 56-day Rule)");
        System.out.println("4. Raise a Blood Request");
        System.out.println("5. Allocate Request (Tests Concurrency / Locking Stored Procedure)");
        System.out.println("6. View Unread System Alerts");
        System.out.println("0. Exit");
        System.out.println("-------------------------------------------");
    }

    // Option 1: View Inventory View
    private static void viewInventory(Connection conn) throws SQLException {
        String query = "SELECT BloodType, Type, COUNT(*) AS AvailableUnits " +
                       "FROM v_inventory " +
                       "WHERE Status = 'Available' AND ExpiryDate >= CURDATE() " +
                       "GROUP BY BloodType, Type " +
                       "ORDER BY BloodType, Type";

        try (Statement stmt = conn.createStatement();
             ResultSet rs = stmt.executeQuery(query)) {
            
            System.out.println("\n=== AVAILABLE BLOOD INVENTORY ===");
            System.out.printf("%-12s | %-12s | %-15s\n", "Blood Type", "Component", "Available Units");
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
                System.out.println("No available blood units found in inventory.");
            }
        }
    }

    // Option 2: Register Donor
    private static void registerDonor(Connection conn, Scanner scanner) {
        System.out.println("\n=== REGISTER NEW DONOR ===");
        System.out.print("Enter RedThread Donor ID (e.g., D005): ");
        String donorId = scanner.nextLine().trim();
        
        System.out.print("Enter Full Name: ");
        String name = scanner.nextLine().trim();
        
        System.out.print("Enter Blood Type (A+, A-, B+, B-, AB+, AB-, O+, O-): ");
        String bloodType = scanner.nextLine().trim().toUpperCase();

        String sql = "INSERT INTO DONOR (RedThreadID, Name, BloodType, KarmaPoints, EligibilityStatus) VALUES (?, ?, ?, 0, 'Eligible')";

        try (PreparedStatement pstmt = conn.prepareStatement(sql)) {
            pstmt.setString(1, donorId);
            pstmt.setString(2, name);
            pstmt.setString(3, bloodType);
            
            int rows = pstmt.executeUpdate();
            System.out.println("[SUCCESS] Donor registered successfully! Rows affected: " + rows);
        } catch (SQLException e) {
            System.err.println("[ERROR] Failed to register donor: " + e.getMessage());
        }
    }

    // Option 3: Record Donation (Tests Trigger Constraints)
    private static void recordDonation(Connection conn, Scanner scanner) {
        System.out.println("\n=== RECORD BLOOD DONATION ===");
        System.out.print("Enter Donation ID (e.g., DN005): ");
        String donationId = scanner.nextLine().trim();
        
        System.out.print("Enter Donor ID (RedThreadID): ");
        String donorId = scanner.nextLine().trim();
        
        System.out.print("Enter Donation Date (YYYY-MM-DD): ");
        String donationDate = scanner.nextLine().trim();
        
        System.out.print("Enter Volume in mL (200 - 600): ");
        int volume = scanner.nextInt();
        scanner.nextLine(); // consume newline
        
        System.out.print("Enter Facility ID (e.g., F001): ");
        String facilityId = scanner.nextLine().trim();

        String sql = "INSERT INTO DONATION (DonationID, RedThreadID, DonationDate, Volume_mL, FacilityID) VALUES (?, ?, ?, ?, ?)";

        try (PreparedStatement pstmt = conn.prepareStatement(sql)) {
            pstmt.setString(1, donationId);
            pstmt.setString(2, donorId);
            pstmt.setDate(3, java.sql.Date.valueOf(donationDate));
            pstmt.setInt(4, volume);
            pstmt.setString(5, facilityId);
            
            int rows = pstmt.executeUpdate();
            System.out.println("[SUCCESS] Donation recorded successfully! (Triggers validated successfully). Rows affected: " + rows);
        } catch (SQLException e) {
            System.err.println("[TRIGGER ERROR / FAILED] Rule violation detected by MySQL Trigger: " + e.getMessage());
        }
    }

    // Option 4: Raise Blood Request
    private static void raiseBloodRequest(Connection conn, Scanner scanner) {
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
        int quantity = scanner.nextInt();
        scanner.nextLine(); // consume newline
        
        System.out.print("Enter Priority (Emergency, Urgent, Routine): ");
        String priority = scanner.nextLine().trim();

        String sql = "INSERT INTO BLOOD_REQUEST (RequestID, PatientID, FacilityID, ComponentType, BloodType, Quantity, Priority, Status) " +
                     "VALUES (?, ?, ?, ?, ?, ?, ?, 'Pending')";

        try (PreparedStatement pstmt = conn.prepareStatement(sql)) {
            pstmt.setString(1, requestId);
            pstmt.setString(2, patientId);
            pstmt.setString(3, facilityId);
            pstmt.setString(4, componentType);
            pstmt.setString(5, bloodType);
            pstmt.setInt(6, quantity);
            pstmt.setString(7, priority);
            
            pstmt.executeUpdate();
            System.out.println("[SUCCESS] Blood request raised successfully with status 'Pending'.");
        } catch (SQLException e) {
            System.err.println("[ERROR] Failed to raise request: " + e.getMessage());
        }
    }

    // Option 5: Test Concurrency Stored Procedure (allocate_request)
    private static void testAllocationProcedure(Connection conn, Scanner scanner) {
        System.out.println("\n=== TEST ALLOCATION STORED PROCEDURE ===");
        System.out.print("Enter Pending Request ID to allocate (e.g., R001): ");
        String requestId = scanner.nextLine().trim();

        String callSql = "{CALL allocate_request(?)}";

        try (CallableStatement cstmt = conn.prepareCall(callSql)) {
            cstmt.setString(1, requestId);
            
            long startTime = System.currentTimeMillis();
            cstmt.execute();
            long endTime = System.currentTimeMillis();

            System.out.println("[SUCCESS] Stored procedure `allocate_request` executed successfully!");
            System.out.println("Execution Time: " + (endTime - startTime) + " ms");
            System.out.println("Note: Concurrency locks and FEFO sorting handled safely within transaction.");
            
        } catch (SQLException e) {
            System.err.println("[ALLOCATION FAILED / ROLLED BACK] " + e.getMessage());
        }
    }

    // Option 6: View Alerts
    private static void viewSystemAlerts(Connection conn) throws SQLException {
        String query = "SELECT AlertID, FacilityID, AlertType, Message, CreatedAt " +
                       "FROM ALERT " +
                       "WHERE IsRead = FALSE " +
                       "ORDER BY CreatedAt DESC LIMIT 10";

        try (Statement stmt = conn.createStatement();
             ResultSet rs = stmt.executeQuery(query)) {
            
            System.out.println("\n=== UNREAD SYSTEM ALERTS ===");
            System.out.printf("%-8s | %-10s | %-12s | %-30s\n", "AlertID", "Facility", "Type", "Message");
            System.out.println("--------------------------------------------------------------------------");
            
            boolean hasRows = false;
            while (rs.next()) {
                hasRows = true;
                System.out.printf("%-8d | %-10s | %-12s | %-30s\n",
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