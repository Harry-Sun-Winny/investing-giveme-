package com.acme.investment.application.ports;

import com.acme.investment.domain.analysis.PortfolioAnalysis;
import java.util.UUID;

public interface AiAnalysisProvider {
    PortfolioAnalysis analyzePortfolio(UUID portfolioId);
}

