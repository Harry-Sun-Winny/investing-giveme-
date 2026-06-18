package com.acme.investment.infrastructure.ai;

import com.acme.investment.application.ports.AiAnalysisProvider;
import com.acme.investment.domain.analysis.PortfolioAnalysis;
import java.util.UUID;
import org.springframework.stereotype.Component;

@Component
public class OpenAiAnalysisAdapter implements AiAnalysisProvider {
    @Override
    public PortfolioAnalysis analyzePortfolio(UUID portfolioId) {
        throw new IllegalStateException("AI analysis provider is not configured with a verified market-data and citation pipeline");
    }
}

