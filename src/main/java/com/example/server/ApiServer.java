package com.example.server;

import com.sun.net.httpserver.HttpExchange;
import com.sun.net.httpserver.HttpHandler;
import com.sun.net.httpserver.HttpServer;

import com.example.server.handlers.AlertHandler;
import com.example.server.handlers.AllocationHandler;
import com.example.server.handlers.AuthHandler;
import com.example.server.handlers.CompatibilityHandler;
import com.example.server.handlers.DonationHandler;
import com.example.server.handlers.DonorHandler;
import com.example.server.handlers.FacilityHandler;
import com.example.server.handlers.InventoryHandler;
import com.example.server.handlers.PatientHandler;
import com.example.server.handlers.RequestHandler;
import com.example.server.handlers.TransferHandler;

import java.io.IOException;
import java.io.OutputStream;
import java.net.InetSocketAddress;
import java.sql.Connection;

/**
 * Lightweight REST API server built on {@link com.sun.net.httpserver.HttpServer}.
 * No external frameworks — uses only the JDK's built-in HTTP server.
 */
public final class ApiServer {

    private ApiServer() { }

    /**
     * Starts the HTTP API server on port 8080, using the supplied JDBC
     * connection for all database work.
     *
     * @param conn a live JDBC {@link Connection}
     */
    public static void start(Connection conn) throws IOException {

        HttpServer server = HttpServer.create(new InetSocketAddress(8080), 0);

        // ── Register endpoint handlers ──────────────────────────────
        server.createContext("/api/auth",          cors(new AuthHandler(conn)));
        server.createContext("/api/inventory",     cors(new InventoryHandler(conn)));
        server.createContext("/api/donors",        cors(new DonorHandler(conn)));
        server.createContext("/api/donations",     cors(new DonationHandler(conn)));
        server.createContext("/api/patients",      cors(new PatientHandler(conn)));
        server.createContext("/api/requests",      cors(new RequestHandler(conn)));
        server.createContext("/api/allocate",      cors(new AllocationHandler.AllocateHandler(conn)));
        server.createContext("/api/allocations",   cors(new AllocationHandler.ListHandler(conn)));
        server.createContext("/api/facilities",    cors(new FacilityHandler(conn)));
        server.createContext("/api/transfers",     cors(new TransferHandler(conn)));
        server.createContext("/api/alerts",        cors(new AlertHandler(conn)));
        server.createContext("/api/compatibility", cors(new CompatibilityHandler(conn)));

        server.setExecutor(null); // default single-threaded executor
        server.start();
    }

    // ── CORS wrapper ────────────────────────────────────────────────

    /**
     * Wraps a handler so that every response carries the required CORS
     * headers and OPTIONS preflight requests are answered automatically.
     */
    private static HttpHandler cors(HttpHandler next) {
        return exchange -> {
            exchange.getResponseHeaders().add("Access-Control-Allow-Origin", "*");
            exchange.getResponseHeaders().add("Access-Control-Allow-Methods",
                    "GET, POST, PUT, OPTIONS");
            exchange.getResponseHeaders().add("Access-Control-Allow-Headers",
                    "Content-Type");

            if ("OPTIONS".equalsIgnoreCase(exchange.getRequestMethod())) {
                exchange.sendResponseHeaders(204, -1);
                exchange.close();
                return;
            }

            next.handle(exchange);
        };
    }

    // ── Shared response utilities used by handlers ──────────────────

    /** Sends a JSON response with the given HTTP status code. */
    public static void sendJson(HttpExchange exchange, int status,
                                String json) throws IOException {
        byte[] bytes = json.getBytes(java.nio.charset.StandardCharsets.UTF_8);
        exchange.getResponseHeaders().set("Content-Type",
                "application/json; charset=UTF-8");
        exchange.sendResponseHeaders(status, bytes.length);
        try (OutputStream os = exchange.getResponseBody()) {
            os.write(bytes);
        }
    }

    /** Reads the full request body as a UTF-8 string. */
    public static String readBody(HttpExchange exchange) throws IOException {
        try (java.io.InputStream is = exchange.getRequestBody()) {
            return new String(is.readAllBytes(),
                    java.nio.charset.StandardCharsets.UTF_8);
        }
    }
}
