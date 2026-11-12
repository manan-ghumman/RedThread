package com.example.server.handlers;

import com.example.server.ApiServer;
import com.example.server.JsonUtil;
import com.sun.net.httpserver.HttpExchange;
import com.sun.net.httpserver.HttpHandler;

import java.io.IOException;
import java.sql.Connection;
import java.sql.PreparedStatement;
import java.sql.ResultSet;
import java.sql.SQLException;
import java.util.ArrayList;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;

public class InventoryHandler implements HttpHandler {

    private final Connection conn;

    public InventoryHandler(Connection conn) {
        this.conn = conn;
    }

    @Override
    public void handle(HttpExchange exchange) throws IOException {
        if (!"GET".equalsIgnoreCase(exchange.getRequestMethod())) {
            ApiServer.sendJson(exchange, 405, JsonUtil.errorJson("Method not allowed"));
            return;
        }

        String sql = "SELECT donor_person.BloodType, bc.Type, COUNT(*) AS AvailableUnits " +
                     "FROM BLOOD_COMPONENT bc " +
                     "JOIN DONATION dn ON dn.DonationID = bc.DonationID " +
                     "JOIN PERSON donor_person ON donor_person.RedThreadID = dn.RedThreadID " +
                     "WHERE bc.Status = 'Available' AND bc.ExpiryDate >= CURDATE() " +
                     "GROUP BY donor_person.BloodType, bc.Type " +
                     "ORDER BY donor_person.BloodType, bc.Type";

        try (PreparedStatement ps = conn.prepareStatement(sql);
             ResultSet rs = ps.executeQuery()) {

            List<String> items = new ArrayList<>();
            while (rs.next()) {
                Map<String, String> m = new LinkedHashMap<>();
                m.put("bloodType", JsonUtil.quoted(rs.getString("BloodType")));
                m.put("component", JsonUtil.quoted(rs.getString("Type")));
                m.put("availableUnits", String.valueOf(rs.getInt("AvailableUnits")));
                items.add(JsonUtil.jsonObject(m));
            }
            ApiServer.sendJson(exchange, 200, JsonUtil.jsonArray(items));

        } catch (SQLException e) {
            ApiServer.sendJson(exchange, 500, JsonUtil.errorJson("Inventory fetch failed: " + e.getMessage()));
        }
    }
}

