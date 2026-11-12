package com.example.server.handlers;

import com.example.server.ApiServer;
import com.example.server.JsonUtil;
import com.sun.net.httpserver.HttpExchange;
import com.sun.net.httpserver.HttpHandler;

import java.io.IOException;
import java.net.URI;
import java.sql.Connection;
import java.sql.PreparedStatement;
import java.sql.ResultSet;
import java.sql.SQLException;
import java.util.ArrayList;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;

public class FacilityHandler implements HttpHandler {

    private final Connection conn;

    public FacilityHandler(Connection conn) {
        this.conn = conn;
    }

    @Override
    public void handle(HttpExchange exchange) throws IOException {
        if (!"GET".equalsIgnoreCase(exchange.getRequestMethod())) {
            ApiServer.sendJson(exchange, 405, JsonUtil.errorJson("Method not allowed"));
            return;
        }

        URI uri = exchange.getRequestURI();
        String query = uri.getQuery();
        String typeFilter = null;
        if (query != null && query.contains("type=")) {
            String[] pairs = query.split("&");
            for (String pair : pairs) {
                String[] kv = pair.split("=");
                if (kv.length == 2 && "type".equalsIgnoreCase(kv[0])) {
                    try {
                        typeFilter = java.net.URLDecoder.decode(kv[1], java.nio.charset.StandardCharsets.UTF_8);
                    } catch (Exception e) {
                        typeFilter = kv[1];
                    }
                }
            }
        }

        String sql = "SELECT FacilityID, FacilityName, Type, FacilityLevel, StateName, Location, ReportsTo " +
                     "FROM FACILITY " +
                     (typeFilter != null ? "WHERE Type = ? " : "") +
                     "ORDER BY FacilityID";

        try (PreparedStatement ps = conn.prepareStatement(sql)) {
            if (typeFilter != null) {
                ps.setString(1, typeFilter);
            }

            try (ResultSet rs = ps.executeQuery()) {
                List<String> list = new ArrayList<>();
                while (rs.next()) {
                    Map<String, String> m = new LinkedHashMap<>();
                    m.put("facilityId", JsonUtil.quoted(rs.getString("FacilityID")));
                    m.put("facilityName", JsonUtil.quoted(rs.getString("FacilityName")));
                    m.put("type", JsonUtil.quoted(rs.getString("Type")));
                    m.put("facilityLevel", JsonUtil.quoted(rs.getString("FacilityLevel")));
                    m.put("stateName", JsonUtil.quoted(rs.getString("StateName")));
                    m.put("location", JsonUtil.quoted(rs.getString("Location")));
                    String reportsTo = rs.getString("ReportsTo");
                    m.put("reportsTo", reportsTo != null ? JsonUtil.quoted(reportsTo) : "null");
                    list.add(JsonUtil.jsonObject(m));
                }
                ApiServer.sendJson(exchange, 200, JsonUtil.jsonArray(list));
            }

        } catch (SQLException e) {
            ApiServer.sendJson(exchange, 500, JsonUtil.errorJson("Failed to fetch facilities: " + e.getMessage()));
        }
    }
}

