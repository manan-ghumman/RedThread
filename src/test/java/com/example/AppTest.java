package com.example;

import org.junit.jupiter.api.Test;

import static org.junit.jupiter.api.Assertions.assertEquals;

class AppTest {
    @Test
    void resolveSettingUsesProvidedFallbackWhenKeyIsMissing() {
        assertEquals("fallback", App.resolveSetting("REDTHREAD_MISSING_SETTING", "fallback"));
    }

    @Test
    void resolveSettingUsesDefaultDatabaseUserWhenUnset() {
        assertEquals(
                "sql12839033",
                App.resolveSetting(
                        "REDTHREAD_MISSING_DB_USER",
                        "sql12839033"
                )
        );
    }

}
