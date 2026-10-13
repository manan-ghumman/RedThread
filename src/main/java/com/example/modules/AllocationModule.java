package com.example.modules;

import java.sql.CallableStatement;
import java.sql.Connection;
import java.sql.SQLException;
import java.util.Scanner;

public class AllocationModule {

    public static void allocateRequest(Connection conn, Scanner scanner) {

        System.out.println("\n=== BLOOD ALLOCATION MODULE ===");

        System.out.print("Enter Pending Request ID: ");
        String requestId = scanner.nextLine().trim();

        if (requestId.isEmpty()) {
            System.out.println("[ERROR] Request ID cannot be empty.");
            return;
        }

        String sql = "{CALL allocate_request(?)}";

        try (CallableStatement stmt = conn.prepareCall(sql)) {

            stmt.setString(1, requestId);

            long startTime = System.currentTimeMillis();

            stmt.execute();

            long endTime = System.currentTimeMillis();

            System.out.println("\n[SUCCESS] Allocation procedure executed!");
            System.out.println("Request ID: " + requestId);
            System.out.println("Execution Time: "
                    + (endTime - startTime) + " ms");

            System.out.println(
                    "Allocation rules, transactions and locking " +
                    "are handled by the database procedure.");

        } catch (SQLException e) {

            System.out.println("\n[ALLOCATION FAILED]");
            System.out.println(e.getMessage());
        }
    }
}