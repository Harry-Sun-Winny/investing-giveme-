package com.acme.investment.domain;

import static org.junit.jupiter.api.Assertions.assertThrows;

import com.acme.investment.domain.analysis.PortfolioAnalysis;
import java.math.BigDecimal;
import java.util.List;
import java.util.UUID;
import org.junit.jupiter.api.Test;

class PortfolioAnalysisTest {
    @Test
    void rejectsAnalysisWithoutCitations() {
        assertThrows(IllegalArgumentException.class, () ->
                new PortfolioAnalysis(UUID.randomUUID(), BigDecimal.TEN, "Risk is elevated.", List.of()));
    }

    @Test
    void rejectsRiskScoreOutsideBounds() {
        assertThrows(IllegalArgumentException.class, () ->
                new PortfolioAnalysis(UUID.randomUUID(), BigDecimal.valueOf(101), "Risk is elevated.", List.of()));
    }
}

