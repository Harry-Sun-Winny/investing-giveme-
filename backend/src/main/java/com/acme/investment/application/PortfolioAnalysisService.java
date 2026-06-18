package com.acme.investment.application;

import com.acme.investment.application.ports.AiAnalysisProvider;
import com.acme.investment.domain.analysis.PortfolioAnalysis;
import java.util.UUID;
import org.springframework.stereotype.Service;

@Service
public class PortfolioAnalysisService {
    private final AiAnalysisProvider aiAnalysisProvider;

    public PortfolioAnalysisService(AiAnalysisProvider aiAnalysisProvider) {
        this.aiAnalysisProvider = aiAnalysisProvider;
    }

    public PortfolioAnalysis analyze(UUID portfolioId) {
        PortfolioAnalysis analysis = aiAnalysisProvider.analyzePortfolio(portfolioId);
        if (analysis.citations().isEmpty()) {
            throw new IllegalStateException("AI analysis without citations is rejected");
        }
        return analysis;
    }
}

