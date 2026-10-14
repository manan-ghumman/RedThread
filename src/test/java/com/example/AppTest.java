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
        assertEquals("root", App.resolveSetting("REDTHREAD_DB_USER", "root"));
    }
}
