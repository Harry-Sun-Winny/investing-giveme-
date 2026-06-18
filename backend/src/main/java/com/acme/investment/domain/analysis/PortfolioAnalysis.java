package com.acme.investment.domain.analysis;

import com.acme.investment.domain.common.SourceCitation;
import java.math.BigDecimal;
import java.util.List;
import java.util.UUID;

public record PortfolioAnalysis(UUID portfolioId, BigDecimal riskScore, String analysis, List<SourceCitation> citations) {
    public PortfolioAnalysis {
        if (portfolioId == null || riskScore == null || analysis == null || analysis.isBlank()) {
            throw new IllegalArgumentException("Portfolio analysis requires portfolio id, risk score, and body");
        }
        if (riskScore.compareTo(BigDecimal.ZERO) < 0 || riskScore.compareTo(BigDecimal.valueOf(100)) > 0) {
            throw new IllegalArgumentException("Risk score must be between 0 and 100");
        }
        if (citations == null || citations.isEmpty()) {
            throw new IllegalArgumentException("AI portfolio analysis requires at least one source citation");
        }
        citations = List.copyOf(citations);
    }
}

