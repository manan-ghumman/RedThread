package com.example.server.handlers;

import com.example.server.ApiServer;
import com.example.server.JsonUtil;
import com.sun.net.httpserver.HttpExchange;
import com.sun.net.httpserver.HttpHandler;

import java.io.IOException;
import java.nio.charset.StandardCharsets;
import java.sql.Connection;
import java.sql.PreparedStatement;
import java.sql.ResultSet;
import java.sql.SQLException;
import java.util.*;

/**
 * Operating System Load Balancing & Fair-Share Distribution Algorithm for Admin.
 *
 * Implements Min-Max Fair Sharing / Equal Resource Distribution across
 * blood banks and hospitals within the same city or district.
 */
public class DistributionHandler implements HttpHandler {

    private final Connection conn;

    public DistributionHandler(Connection conn) {
        this.conn = conn;
    }

    @Override
    public void handle(HttpExchange exchange) throws IOException {
        String method = exchange.getRequestMethod();
        String path = exchange.getRequestURI().getPath();

        if ("GET".equalsIgnoreCase(method)) {
            handleGetAnalysis(exchange);
        } else if ("POST".equalsIgnoreCase(method)) {
            handleExecuteBalance(exchange);
        } else {
            ApiServer.sendJson(exchange, 405, JsonUtil.errorJson("Method not allowed"));
        }
    }

    private void handleGetAnalysis(HttpExchange exchange) throws IOException {
        String query = exchange.getRequestURI().getQuery();
        String targetLocation = null;

        if (query != null && !query.isEmpty()) {
            for (String param : query.split("&")) {
                String[] pair = param.split("=", 2);
                if (pair.length == 2 && "location".equalsIgnoreCase(pair[0])) {
                    targetLocation = java.net.URLDecoder.decode(pair[1], StandardCharsets.UTF_8).trim();
                }
            }
        }

        try {
            // If a specific location is requested, return detailed facility breakdown
            if (targetLocation != null && !targetLocation.isEmpty() && !"all".equalsIgnoreCase(targetLocation)) {
                String json = getLocationDetailJson(targetLocation);
                ApiServer.sendJson(exchange, 200, json);
            } else {
                // Return overview of all districts/cities
                String json = getAllLocationsSummaryJson();
                ApiServer.sendJson(exchange, 200, json);
            }
        } catch (SQLException e) {
            ApiServer.sendJson(exchange, 500, JsonUtil.errorJson("Failed to analyze distribution: " + e.getMessage()));
        }
    }

    private String getAllLocationsSummaryJson() throws SQLException {
        String sql = "SELECT f.Location, COUNT(DISTINCT f.FacilityID) AS FacilityCount, " +
                     "COUNT(bc.ComponentID) AS TotalUnits " +
                     "FROM FACILITY f " +
                     "LEFT JOIN BLOOD_COMPONENT bc ON bc.FacilityID = f.FacilityID " +
                     "  AND bc.Status = 'Available' AND bc.ExpiryDate >= CURDATE() " +
                     "GROUP BY f.Location " +
                     "ORDER BY f.Location";

        List<String> list = new ArrayList<>();
        try (PreparedStatement ps = conn.prepareStatement(sql);
             ResultSet rs = ps.executeQuery()) {

            while (rs.next()) {
                String loc = rs.getString("Location");
                int fCount = rs.getInt("FacilityCount");
                int tUnits = rs.getInt("TotalUnits");
                int targetPerFacility = fCount > 0 ? tUnits / fCount : 0;

                Map<String, String> m = new LinkedHashMap<>();
                m.put("location", JsonUtil.quoted(loc));
                m.put("facilityCount", String.valueOf(fCount));
                m.put("totalUnits", String.valueOf(tUnits));
                m.put("targetPerFacility", String.valueOf(targetPerFacility));
                m.put("isBalanced", String.valueOf(tUnits == 0 || (tUnits % fCount == 0)));
                list.add(JsonUtil.jsonObject(m));
            }
        }
        return JsonUtil.jsonArray(list);
    }

    private String getLocationDetailJson(String location) throws SQLException {
        // 1. Get facilities in this location
        String facSql = "SELECT FacilityID, FacilityName, FacilityLevel FROM FACILITY WHERE Location = ? ORDER BY FacilityID";
        List<Map<String, String>> facs = new ArrayList<>();
        try (PreparedStatement ps = conn.prepareStatement(facSql)) {
            ps.setString(1, location);
            try (ResultSet rs = ps.executeQuery()) {
                while (rs.next()) {
                    Map<String, String> f = new LinkedHashMap<>();
                    f.put("facilityId", rs.getString("FacilityID"));
                    f.put("facilityName", rs.getString("FacilityName"));
                    f.put("facilityLevel", rs.getString("FacilityLevel"));
                    facs.add(f);
                }
            }
        }

        if (facs.isEmpty()) {
            return JsonUtil.errorJson("No facilities found in location: " + location);
        }

        // 2. Count available units per facility
        Map<String, Integer> stockMap = new HashMap<>();
        int totalUnits = 0;

        String stockSql = "SELECT bc.FacilityID, COUNT(*) AS Units " +
                          "FROM BLOOD_COMPONENT bc " +
                          "JOIN FACILITY f ON f.FacilityID = bc.FacilityID " +
                          "WHERE f.Location = ? AND bc.Status = 'Available' AND bc.ExpiryDate >= CURDATE() " +
                          "GROUP BY bc.FacilityID";

        try (PreparedStatement ps = conn.prepareStatement(stockSql)) {
            ps.setString(1, location);
            try (ResultSet rs = ps.executeQuery()) {
                while (rs.next()) {
                    int u = rs.getInt("Units");
                    stockMap.put(rs.getString("FacilityID"), u);
                    totalUnits += u;
                }
            }
        }

        int numFacilities = facs.size();
        int baseTarget = totalUnits / numFacilities;
        int remainder = totalUnits % numFacilities;

        List<String> facilityJsonList = new ArrayList<>();
        for (int i = 0; i < facs.size(); i++) {
            Map<String, String> f = facs.get(i);
            String fid = f.get("facilityId");
            int currentUnits = stockMap.getOrDefault(fid, 0);
            int targetUnits = baseTarget + (i < remainder ? 1 : 0);
            int disparity = currentUnits - targetUnits;

            String status = "Balanced";
            if (disparity > 0) status = "Surplus (+" + disparity + ")";
            else if (disparity < 0) status = "Deficit (" + disparity + ")";

            Map<String, String> item = new LinkedHashMap<>();
            item.put("facilityId", JsonUtil.quoted(fid));
            item.put("facilityName", JsonUtil.quoted(f.get("facilityName")));
            item.put("facilityLevel", JsonUtil.quoted(f.get("facilityLevel")));
            item.put("currentUnits", String.valueOf(currentUnits));
            item.put("targetUnits", String.valueOf(targetUnits));
            item.put("disparity", String.valueOf(disparity));
            item.put("status", JsonUtil.quoted(status));
            facilityJsonList.add(JsonUtil.jsonObject(item));
        }

        Map<String, String> root = new LinkedHashMap<>();
        root.put("location", JsonUtil.quoted(location));
        root.put("facilityCount", String.valueOf(numFacilities));
        root.put("totalUnits", String.valueOf(totalUnits));
        root.put("targetPerFacility", String.valueOf(baseTarget));
        root.put("facilities", JsonUtil.jsonArray(facilityJsonList));
        return JsonUtil.jsonObject(root);
    }

    private void handleExecuteBalance(HttpExchange exchange) throws IOException {
        String body = ApiServer.readBody(exchange);
        Map<String, String> data = JsonUtil.parseJsonBody(body);
        String location = data.get("location");

        if (location == null || location.trim().isEmpty()) {
            ApiServer.sendJson(exchange, 400, JsonUtil.errorJson("Location is required"));
            return;
        }

        location = location.trim();

        try {
            List<String> locationsToBalance = new ArrayList<>();
            if ("all".equalsIgnoreCase(location)) {
                String sql = "SELECT DISTINCT Location FROM FACILITY WHERE Location IS NOT NULL ORDER BY Location";
                try (PreparedStatement ps = conn.prepareStatement(sql);
                     ResultSet rs = ps.executeQuery()) {
                    while (rs.next()) {
                        locationsToBalance.add(rs.getString("Location"));
                    }
                }
            } else {
                locationsToBalance.add(location);
            }

            int totalTransfers = 0;
            for (String loc : locationsToBalance) {
                totalTransfers += balanceDistrict(loc);
            }

            Map<String, String> res = new LinkedHashMap<>();
            res.put("success", "true");
            res.put("transfersCreated", String.valueOf(totalTransfers));
            res.put("message", JsonUtil.quoted("Fair-Share Equal Distribution completed! " + totalTransfers +
                    " inter-facility unit transfers executed across " + location + "."));
            ApiServer.sendJson(exchange, 200, JsonUtil.jsonObject(res));

        } catch (SQLException e) {
            ApiServer.sendJson(exchange, 500, JsonUtil.errorJson("Failed to execute equal distribution: " + e.getMessage()));
        }
    }

    private int balanceDistrict(String location) throws SQLException {
        boolean previousAutoCommit = conn.getAutoCommit();
        conn.setAutoCommit(false);

        try {
            // 1. Get facilities in location
            List<String> facilityIds = new ArrayList<>();
            String facSql = "SELECT FacilityID FROM FACILITY WHERE Location = ? ORDER BY FacilityID";
            try (PreparedStatement ps = conn.prepareStatement(facSql)) {
                ps.setString(1, location);
                try (ResultSet rs = ps.executeQuery()) {
                    while (rs.next()) {
                        facilityIds.add(rs.getString("FacilityID"));
                    }
                }
            }

            if (facilityIds.size() <= 1) {
                conn.commit();
                return 0; // Nothing to balance if only 1 or 0 facilities
            }

            // 2. Fetch all available, unexpired components in this location
            StringBuilder inClause = new StringBuilder("(");
            for (int i = 0; i < facilityIds.size(); i++) {
                if (i > 0) inClause.append(",");
                inClause.append("?");
            }
            inClause.append(")");

            String compSql = "SELECT ComponentID, FacilityID FROM BLOOD_COMPONENT " +
                             "WHERE FacilityID IN " + inClause + " " +
                             "  AND Status = 'Available' AND ExpiryDate >= CURDATE() " +
                             "ORDER BY ExpiryDate ASC, ComponentID ASC FOR UPDATE";

            Map<String, List<String>> facilityComponents = new LinkedHashMap<>();
            for (String fid : facilityIds) {
                facilityComponents.put(fid, new ArrayList<>());
            }

            int totalComponents = 0;
            try (PreparedStatement ps = conn.prepareStatement(compSql)) {
                for (int i = 0; i < facilityIds.size(); i++) {
                    ps.setString(i + 1, facilityIds.get(i));
                }
                try (ResultSet rs = ps.executeQuery()) {
                    while (rs.next()) {
                        String cid = rs.getString("ComponentID");
                        String fid = rs.getString("FacilityID");
                        facilityComponents.get(fid).add(cid);
                        totalComponents++;
                    }
                }
            }

            if (totalComponents == 0) {
                conn.commit();
                return 0;
            }

            // 3. Compute Fair-Share targets (Min-Max Fair Sharing)
            int n = facilityIds.size();
            int baseTarget = totalComponents / n;
            int remainder = totalComponents % n;

            Map<String, Integer> targetMap = new HashMap<>();
            for (int i = 0; i < n; i++) {
                targetMap.put(facilityIds.get(i), baseTarget + (i < remainder ? 1 : 0));
            }

            // 4. Identify Surplus & Deficit queues
            Queue<String> surplusUnits = new LinkedList<>();
            Map<String, String> unitSourceFacility = new HashMap<>();

            for (String fid : facilityIds) {
                List<String> list = facilityComponents.get(fid);
                int target = targetMap.get(fid);
                while (list.size() > target) {
                    String cid = list.remove(list.size() - 1);
                    surplusUnits.offer(cid);
                    unitSourceFacility.put(cid, fid);
                }
            }

            int transfersDone = 0;
            long baseTransferNum = System.currentTimeMillis() % 1000000;

            // 5. Transfer surplus components to deficit facilities
            for (String fid : facilityIds) {
                List<String> list = facilityComponents.get(fid);
                int target = targetMap.get(fid);

                while (list.size() < target && !surplusUnits.isEmpty()) {
                    String cid = surplusUnits.poll();
                    String fromFid = unitSourceFacility.get(cid);

                    // Update component location
                    try (PreparedStatement ps = conn.prepareStatement(
                            "UPDATE BLOOD_COMPONENT SET FacilityID = ? WHERE ComponentID = ?")) {
                        ps.setString(1, fid);
                        ps.setString(2, cid);
                        ps.executeUpdate();
                    }

                    // Record transfer in TRANSFER table
                    String transferId = "TR" + (baseTransferNum + transfersDone);
                    try (PreparedStatement ps = conn.prepareStatement(
                            "INSERT INTO TRANSFER (TransferID, ComponentID, FromFacility, ToFacility, Status, CompletedAt) " +
                            "VALUES (?, ?, ?, ?, 'Completed', CURRENT_TIMESTAMP)")) {
                        ps.setString(1, transferId);
                        ps.setString(2, cid);
                        ps.setString(3, fromFid);
                        ps.setString(4, fid);
                        ps.executeUpdate();
                    }

                    list.add(cid);
                    transfersDone++;
                }
            }

            conn.commit();
            return transfersDone;

        } catch (SQLException e) {
            conn.rollback();
            throw e;
        } finally {
            conn.setAutoCommit(previousAutoCommit);
        }
    }
}

