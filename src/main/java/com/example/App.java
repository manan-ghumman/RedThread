package com.example;

import java.io.IOException;
import java.nio.file.Files;
import java.nio.file.Path;
import java.sql.Connection;
import java.sql.DriverManager;
import java.sql.SQLException;
import java.util.HashMap;
import java.util.Map;
import java.util.Scanner;

import com.example.modules.AlertModule;
import com.example.modules.AllocationHistory;
import com.example.modules.AllocationModule;
import com.example.modules.BloodRequestModule;
import com.example.modules.CompatibilityModule;
import com.example.modules.DonationModule;
import com.example.modules.DonorModule;
import com.example.modules.FacilityModule;
import com.example.modules.InventoryModule;
import com.example.modules.PatientModule;
import com.example.modules.TransferModule;

public class App {

    private static final Map<String, String> localSettings = loadLocalSettings();

    private static final String DB_URL = resolveSetting(
            "REDTHREAD_DB_URL",
            "jdbc:mysql://sql12.freesqldatabase.com:3306/sql12839033?useSSL=true&serverTimezone=UTC"
    );

    private static final String DB_USER = resolveSetting(
            "REDTHREAD_DB_USER",
            "sql12839033"
    );

    private static final String DB_PASSWORD = resolveSetting(
            "REDTHREAD_DB_PASSWORD",
            ""
    );

    static String resolveSetting(String key, String defaultValue) {
        String fileValue = localSettings.get(key);
        if (fileValue != null && !fileValue.trim().isEmpty()) {
            return fileValue.trim();
        }

        String value = System.getenv(key);
        if (value != null && !value.trim().isEmpty()) {
            return value.trim();
        }

        return defaultValue;
    }

    private static Map<String, String> loadLocalSettings() {
        Map<String, String> settings = new HashMap<>();
        Path envFile = Path.of(".env");

        if (!Files.exists(envFile)) {
            return settings;
        }

        try {
            for (String line : Files.readAllLines(envFile)) {
                String trimmed = line.trim();
                if (trimmed.isEmpty() || trimmed.startsWith("#")) {
                    continue;
                }

                int separator = trimmed.indexOf('=');
                if (separator <= 0) {
                    continue;
                }

                String key = trimmed.substring(0, separator).trim();
                String value = trimmed.substring(separator + 1).trim();
                settings.put(key, removeOptionalQuotes(value));
            }
        } catch (IOException e) {
            throw new IllegalStateException("Unable to read .env configuration", e);
        }

        return settings;
    }

    private static String removeOptionalQuotes(String value) {
        if (value.length() >= 2
                && ((value.startsWith("\"") && value.endsWith("\""))
                || (value.startsWith("'") && value.endsWith("'")))) {
            return value.substring(1, value.length() - 1);
        }
        return value;
    }

    public static void main(String[] args) {

        System.out.println("==================================================");
        System.out.println("   RedThread Blood Bank Management System (OSDBMS)");
        System.out.println("==================================================");

        String dbPassword = DB_PASSWORD;

        
        if (dbPassword == null || dbPassword.isEmpty()) {
            System.out.println(
                    "[ERROR] Database password is not configured."
            );
            System.out.println(
                    "Set the REDTHREAD_DB_PASSWORD environment variable or add it to a .env file."
            );
            return;
        }

        try (
                Connection conn = DriverManager.getConnection(
                        DB_URL, DB_USER, dbPassword
                );
                Scanner scanner = new Scanner(System.in)
        ) {

            conn.setAutoCommit(true);

            System.out.println(
                    "\n[INFO] Connected successfully to MySQL database 'sql12839033'."
            );

            // ===== LOGIN SCREEN =====
            String role = loginScreen(scanner);
            if (role == null) {
                return;
            }

            boolean isAdmin = "ADMIN".equals(role);

            System.out.println("\n[INFO] Logged in as: " + role);

            boolean running = true;

            while (running) {

                printMenu(isAdmin);

                if (isAdmin) {
                    System.out.print("Select an option [0-11]: ");
                } else {
                    System.out.print("Select an option [0-5]: ");
                }

                if (!scanner.hasNextLine()) {
                    System.out.println("\n[INFO] No input received. Closing RedThread.");
                    break;
                }

                String input = scanner.nextLine().trim();

                int choice;

                try {
                    choice = Integer.parseInt(input);
                } catch (NumberFormatException e) {
                    System.out.println(
                            "[ERROR] Please enter a valid number."
                    );
                    continue;
                }

                // Facility users can only access options 0-4
                if (!isAdmin && choice > 5) {
                    System.out.println(
                            "[ACCESS DENIED] This option is only available in Admin mode."
                    );
                } else {

                    switch (choice) {

                        // OPTION 1: INVENTORY
                        case 1:
                            try {
                                InventoryModule.viewInventory(conn);
                            } catch (SQLException e) {
                                System.out.println(
                                        "[ERROR] Inventory: " + e.getMessage()
                                );
                            }
                            break;

                        // OPTION 2: DONORS
                        case 2:
                            DonorModule.registerDonor(conn, scanner);
                            break;

                        // OPTION 3: DONATIONS
                        case 3:
                            DonationModule.recordDonation(conn, scanner);
                            break;

                        // OPTION 4: BLOOD REQUESTS
                        case 4:
                            BloodRequestModule.raiseBloodRequest(conn, scanner);
                            break;

                        // OPTION 5: BLOOD ALLOCATION (Admin only)
                        case 5:
                            AllocationModule.allocateRequest(conn);
                            break;

                        // OPTION 6: SYSTEM ALERTS (Admin only)
                        case 6:
                            try {
                                AlertModule.viewSystemAlerts(conn);
                            } catch (SQLException e) {
                                System.out.println(
                                        "[ERROR] Alerts: " + e.getMessage()
                                );
                            }
                            break;

                        // OPTION 7: PATIENT MANAGEMENT (Admin only)
                        case 7:
                            PatientModule.menu(conn, scanner);
                            break;

                        // OPTION 8: FACILITY MANAGEMENT (Admin only)
                        case 8:
                            try {
                                FacilityModule.viewFacilities(conn);
                            } catch (SQLException e) {
                                System.out.println(
                                        "[ERROR] Facilities: " + e.getMessage()
                                );
                            }
                            break;

                        // OPTION 9: BLOOD TRANSFERS (Admin only)
                        case 9:
                            try {
                                TransferModule.menu(conn, scanner);
                            } catch (SQLException e) {
                                System.out.println(
                                        "[ERROR] Transfer: " + e.getMessage()
                                );
                            }
                            break;

                        // OPTION 10: BLOOD COMPATIBILITY (Admin only)
                        case 10:
                            CompatibilityModule.menu(conn, scanner);
                            break;

                        // OPTION 11: VIEW ALLOCATION HISTORY (Admin only)
                        case 11:
                            AllocationHistory.viewHistory(conn);
                            break;

                        // EXIT APPLICATION
                        case 0:
                            System.out.println(
                                    "\n[INFO] Closing RedThread. Goodbye!"
                            );
                            running = false;
                            break;

                        default:
                            System.out.println(
                                    "[WARNING] Invalid option."
                            );
                    }
                }

                if (running) {
                    System.out.println(
                            "\nPress Enter to return to the main menu..."
                    );
                    if (!scanner.hasNextLine()) {
                        System.out.println("[INFO] Input stream closed. Closing RedThread.");
                        running = false;
                        continue;
                    }
                    scanner.nextLine();
                }
            }

        } catch (SQLException e) {

            System.out.println(
                    "\n[FATAL DATABASE ERROR] " + e.getMessage()
            );
        }
    }

    // LOGIN SCREEN
    private static String loginScreen(Scanner scanner) {

        System.out.println("\n================ LOGIN ================");
        System.out.println("  1. Facility");
        System.out.println("  0. Exit");
        System.out.println("=======================================");
        System.out.print("Select role: ");

        if (!scanner.hasNextLine()) {
            System.out.println("\n[INFO] No input received. Closing RedThread.");
            return null;
        }

        String input = scanner.nextLine().trim();

        if ("4dmin".equals(input)) {
            System.out.println("\n[INFO] Admin access granted.");
            return "ADMIN";
        }

        if ("0".equals(input)) {
            System.out.println("\n[INFO] Closing RedThread. Goodbye!");
            return null;
        }

        // Default: Facility mode
        return "FACILITY";
    }

    // DISPLAY MAIN MENU
    private static void printMenu(boolean isAdmin) {

        if (isAdmin) {
            System.out.println("\n=========== ADMIN MENU ============");
        } else {
            System.out.println("\n========== FACILITY MENU ==========");
        }

            System.out.println("1. View Available Blood Inventory");
            System.out.println("2. Register a New Donor");
            System.out.println("3. Record a Blood Donation");
            System.out.println("4. Raise a Blood Request");
                 System.out.println("5. Allocate Blood");

        if (isAdmin) {
            System.out.println("6. View System Alerts");
            System.out.println("7. Patient Management");
            System.out.println("8. Facility Management");
            System.out.println("9. Blood Transfer Management");
            System.out.println("10. Blood Compatibility");
            System.out.println("11. View Allocation History");
        }

        System.out.println("0. Exit");

        System.out.println("===================================");
    }
}