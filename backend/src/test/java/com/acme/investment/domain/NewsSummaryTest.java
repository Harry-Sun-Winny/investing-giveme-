package com.acme.investment.domain;

import static org.junit.jupiter.api.Assertions.assertThrows;

import com.acme.investment.domain.news.NewsSummary;
import java.time.OffsetDateTime;
import org.junit.jupiter.api.Test;

class NewsSummaryTest {
    @Test
    void requiresSourcePublicationDateSummaryAndLink() {
        assertThrows(IllegalArgumentException.class, () ->
                new NewsSummary("Reuters", OffsetDateTime.now(), "", "https://example.com/article"));
    }
}

