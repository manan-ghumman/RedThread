package com.example;

import org.junit.jupiter.api.Test;
import java.util.*;

import static org.junit.jupiter.api.Assertions.*;

/**
 * Validates clinical ABO/Rh blood compatibility rules referenced in
 * Challenge 5 and Testing Status in the Phase-III Report.
 */
public class BloodCompatibilityTest {

    private static final Map<String, Set<String>> RBC_COMPATIBILITY = new HashMap<>();

    static {
        // Recipient -> Set of compatible Donor blood types
        RBC_COMPATIBILITY.put("O-",  Set.of("O-"));
        RBC_COMPATIBILITY.put("O+",  Set.of("O-", "O+"));
        RBC_COMPATIBILITY.put("A-",  Set.of("O-", "A-"));
        RBC_COMPATIBILITY.put("A+",  Set.of("O-", "O+", "A-", "A+"));
        RBC_COMPATIBILITY.put("B-",  Set.of("O-", "B-"));
        RBC_COMPATIBILITY.put("B+",  Set.of("O-", "O+", "B-", "B+"));
        RBC_COMPATIBILITY.put("AB-", Set.of("O-", "A-", "B-", "AB-"));
        RBC_COMPATIBILITY.put("AB+", Set.of("O-", "O+", "A-", "A+", "B-", "B+", "AB-", "AB+"));
    }

    @Test
    void testUniversalDonorCompatibility() {
        // O- can safely donate to all recipient blood types
        for (String recipient : RBC_COMPATIBILITY.keySet()) {
            assertTrue(RBC_COMPATIBILITY.get(recipient).contains("O-"),
                    "Universal donor O- must be compatible with " + recipient);
        }
    }

    @Test
    void testUniversalRecipientCompatibility() {
        // AB+ can receive from all 8 blood groups
        assertEquals(8, RBC_COMPATIBILITY.get("AB+").size(),
                "Universal recipient AB+ must be compatible with all 8 blood types");
    }

    @Test
    void testIncompatibleTransfusionRejected() {
        // A+ recipient cannot receive B+ or AB+ blood
        assertFalse(RBC_COMPATIBILITY.get("A+").contains("B+"));
        assertFalse(RBC_COMPATIBILITY.get("A+").contains("AB+"));
        // O- recipient can only receive O- blood
        assertFalse(RBC_COMPATIBILITY.get("O-").contains("O+"));
        assertFalse(RBC_COMPATIBILITY.get("O-").contains("A+"));
    }
}

