package com.example;

import java.sql.Connection;
import java.sql.DriverManager;
import java.sql.SQLException;
import java.util.Scanner;

import com.example.modules.AlertModule;
import com.example.modules.AllocationModule;
import com.example.modules.BloodRequestModule;
import com.example.modules.CompatibilityModule;
import com.example.modules.DonationModule;
import com.example.modules.DonorModule;
import com.example.modules.FacilityModule;
import com.example.modules.InventoryModule;
import com.example.modules.PatientModule;
import com.example.modules.TransferModule;

import io.github.cdimascio.dotenv.Dotenv;

public class App {

    private static final Dotenv dotenv = Dotenv.configure()
            .ignoreIfMissing()
            .load();

    private static final String DB_URL = resolveSetting(
            "REDTHREAD_DB_URL",
            "jdbc:mysql://localhost:3306/osdbms?useSSL=false&allowPublicKeyRetrieval=true&serverTimezone=UTC"
    );

    private static final String DB_USER = resolveSetting(
            "REDTHREAD_DB_USER",
            "root"
    );

    private static final String DB_PASSWORD = resolveSetting(
            "REDTHREAD_DB_PASSWORD",
            ""
    );

    static String resolveSetting(String key, String defaultValue) {
        String value = System.getenv(key);
        if (value != null && !value.trim().isEmpty()) {
            return value.trim();
        }

        value = dotenv.get(key);
        if (value != null && !value.trim().isEmpty()) {
            return value.trim();
        }

        return defaultValue;
    }

    // setup for mysql env done 

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
                    "\n[INFO] Connected successfully to MySQL database 'osdbms'."
            );

            boolean running = true;

            while (running) {

                printMenu();

                System.out.print("Select an option [0-10]: ");

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

                    // OPTION 5: BLOOD ALLOCATION
                    case 5:
                        AllocationModule.allocateRequest(conn, scanner);
                        break;

                    // OPTION 6: SYSTEM ALERTS
                    case 6:
                        try {
                            AlertModule.viewSystemAlerts(conn);
                        } catch (SQLException e) {
                            System.out.println(
                                    "[ERROR] Alerts: " + e.getMessage()
                            );
                        }
                        break;

                    // OPTION 7: PATIENT MANAGEMENT
                    case 7:
                        PatientModule.menu(conn, scanner);
                        break;

                    // OPTION 8: FACILITY MANAGEMENT
                    case 8:
                        try {
                            FacilityModule.viewFacilities(conn);
                        } catch (SQLException e) {
                            System.out.println(
                                    "[ERROR] Facilities: " + e.getMessage()
                            );
                        }
                        break;

                    // OPTION 9: BLOOD TRANSFERS
                    case 9:
                        try {
                            TransferModule.menu(conn, scanner);
                        } catch (SQLException e) {
                            System.out.println(
                                    "[ERROR] Transfer: " + e.getMessage()
                            );
                        }
                        break;

                    // OPTION 10: BLOOD COMPATIBILITY
                    case 10:
                        CompatibilityModule.menu(conn, scanner);
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
                                "[WARNING] Invalid option. Choose between 0 and 10."
                        );
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

    // DISPLAY MAIN MENU
    private static void printMenu() {

        System.out.println("\n============== MAIN MENU ==============");

        System.out.println("1. View Available Blood Inventory");
        System.out.println("2. Register a New Donor");
        System.out.println("3. Record a Blood Donation");
        System.out.println("4. Raise a Blood Request");
        System.out.println("5. Allocate Blood");
        System.out.println("6. View System Alerts");
        System.out.println("7. Patient Management");
        System.out.println("8. Facility Management");
        System.out.println("9. Blood Transfer Management");
        System.out.println("10. Blood Compatibility");
        System.out.println("0. Exit");

        System.out.println("=======================================");
    }
}