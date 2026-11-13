package com.example;

import org.junit.jupiter.api.Test;
import java.sql.Timestamp;
import java.util.Comparator;
import java.util.PriorityQueue;

import static org.junit.jupiter.api.Assertions.*;

/**
 * Validates OS Priority Scheduling with FCFS and Karma Points aging tie-breaking,
 * as detailed in the Phase-III Project Progress Report (Page 3 & Page 7).
 */
public class PrioritySchedulingTest {

    static class MockRequest {
        String id;
        String priority;
        Timestamp requestTime;
        int karmaPoints;

        MockRequest(String id, String priority, long timeMillis, int karmaPoints) {
            this.id = id;
            this.priority = priority;
            this.requestTime = new Timestamp(timeMillis);
            this.karmaPoints = karmaPoints;
        }
    }

    private static int getPriorityRank(String priority) {
        if ("Critical".equalsIgnoreCase(priority)) return 1;
        if ("Emergency".equalsIgnoreCase(priority)) return 2;
        if ("Urgent".equalsIgnoreCase(priority)) return 3;
        if ("Routine".equalsIgnoreCase(priority)) return 4;
        return 5;
    }

    private static final Comparator<MockRequest> COMPARATOR =
            Comparator.comparingInt((MockRequest r) -> getPriorityRank(r.priority))
                    .thenComparing(r -> r.requestTime)
                    .thenComparing(Comparator.comparingInt((MockRequest r) -> r.karmaPoints).reversed())
                    .thenComparing(r -> r.id);

    @Test
    void testEmergencyPreemptsRoutineOrders() {
        PriorityQueue<MockRequest> queue = new PriorityQueue<>(COMPARATOR);

        long now = System.currentTimeMillis();
        // Routine request arrived first
        MockRequest routine = new MockRequest("REQ_ROUTINE", "Routine", now - 10000, 10);
        // Emergency request arrived later
        MockRequest emergency = new MockRequest("REQ_EMERGENCY", "Emergency", now, 0);

        queue.offer(routine);
        queue.offer(emergency);

        // Emergency must be dequeued first despite arriving later
        assertEquals("REQ_EMERGENCY", queue.poll().id, "Emergency requisition must preempt routine order");
        assertEquals("REQ_ROUTINE", queue.poll().id);
    }

    @Test
    void testFcfsWithinSamePriorityTier() {
        PriorityQueue<MockRequest> queue = new PriorityQueue<>(COMPARATOR);

        long now = System.currentTimeMillis();
        MockRequest first = new MockRequest("REQ_EARLY", "Urgent", now - 5000, 0);
        MockRequest second = new MockRequest("REQ_LATE", "Urgent", now, 0);

        queue.offer(second);
        queue.offer(first);

        // Earlier timestamp must be dequeued first (FCFS tie-breaking)
        assertEquals("REQ_EARLY", queue.poll().id);
        assertEquals("REQ_LATE", queue.poll().id);
    }

    @Test
    void testKarmaAgingPriorityBoost() {
        PriorityQueue<MockRequest> queue = new PriorityQueue<>(COMPARATOR);

        long exactSameTime = 1700000000000L;
        MockRequest regularUser = new MockRequest("USER_REGULAR", "Routine", exactSameTime, 10);
        MockRequest frequentDonor = new MockRequest("USER_FREQUENT_DONOR", "Routine", exactSameTime, 250);

        queue.offer(regularUser);
        queue.offer(frequentDonor);

        // Higher karma points (aging mechanism) must break tie to reward frequent donors
        assertEquals("USER_FREQUENT_DONOR", queue.poll().id);
        assertEquals("USER_REGULAR", queue.poll().id);
    }
}

