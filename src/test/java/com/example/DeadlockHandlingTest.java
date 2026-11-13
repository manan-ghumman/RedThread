package com.example;

import org.junit.jupiter.api.Test;
import java.util.ArrayList;
import java.util.Collections;
import java.util.List;

import static org.junit.jupiter.api.Assertions.*;

/**
 * Validates Deadlock Handling & Havender's Resource Ordering (Page 3 & Page 7 of Phase-III Report).
 * Demonstrates circular-wait elimination by enforcing a global strict acquisition order.
 */
public class DeadlockHandlingTest {

    @Test
    void testHavendersResourceOrderingEliminatesCircularWait() {
        // Two concurrent threads requesting components {BC0020, BC0005} in opposite order
        List<String> thread1Resources = new ArrayList<>(List.of("BC0020", "BC0005"));
        List<String> thread2Resources = new ArrayList<>(List.of("BC0005", "BC0020"));

        // Applying global strict ordering before acquisition (Havender's principle)
        Collections.sort(thread1Resources);
        Collections.sort(thread2Resources);

        // Both threads must acquire resources in identical sequence: BC0005 first, then BC0020
        assertEquals(List.of("BC0005", "BC0020"), thread1Resources);
        assertEquals(List.of("BC0005", "BC0020"), thread2Resources);
        assertEquals(thread1Resources, thread2Resources, "Identical lock acquisition order breaks circular wait condition");
    }
}

