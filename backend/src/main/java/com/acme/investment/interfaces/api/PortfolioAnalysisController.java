package com.acme.investment.interfaces.api;

import com.acme.investment.application.PortfolioAnalysisService;
import com.acme.investment.domain.analysis.PortfolioAnalysis;
import java.util.UUID;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/v1/portfolios/{portfolioId}/analysis")
public class PortfolioAnalysisController {
    private final PortfolioAnalysisService service;

    public PortfolioAnalysisController(PortfolioAnalysisService service) {
        this.service = service;
    }

    @PostMapping
    PortfolioAnalysis analyze(@PathVariable UUID portfolioId) {
        return service.analyze(portfolioId);
    }
}

