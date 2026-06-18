package com.acme.investment.interfaces.api;

import com.acme.investment.infrastructure.persistence.UserJpaRepository;
import com.acme.investment.infrastructure.persistence.portfolio.PortfolioJpaRepository;
import com.acme.investment.infrastructure.persistence.transaction.TransactionJpaRepository;
import com.acme.investment.infrastructure.persistence.watchlist.WatchlistJpaRepository;
import com.acme.investment.infrastructure.persistence.news.NewsArticleJpaRepository;
import com.acme.investment.infrastructure.persistence.ai.AiConversationJpaRepository;
import com.acme.investment.infrastructure.persistence.goal.GoalJpaRepository;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import java.util.Map;
import java.util.LinkedHashMap;

@RestController
@RequestMapping("/api/v1/admin")
public class AdminKpiController {

    private final UserJpaRepository userRepo;
    private final PortfolioJpaRepository portfolioRepo;
    private final TransactionJpaRepository transactionRepo;
    private final WatchlistJpaRepository watchlistRepo;
    private final NewsArticleJpaRepository newsRepo;
    private final AiConversationJpaRepository aiRepo;
    private final GoalJpaRepository goalRepo;

    public AdminKpiController(
        UserJpaRepository userRepo,
        PortfolioJpaRepository portfolioRepo,
        TransactionJpaRepository transactionRepo,
        WatchlistJpaRepository watchlistRepo,
        NewsArticleJpaRepository newsRepo,
        AiConversationJpaRepository aiRepo,
        GoalJpaRepository goalRepo
    ) {
        this.userRepo = userRepo;
        this.portfolioRepo = portfolioRepo;
        this.transactionRepo = transactionRepo;
        this.watchlistRepo = watchlistRepo;
        this.newsRepo = newsRepo;
        this.aiRepo = aiRepo;
        this.goalRepo = goalRepo;
    }

    @GetMapping("/kpi")
    public ResponseEntity<Map<String, Object>> getKpi() {
        Map<String, Object> kpi = new LinkedHashMap<>();
        kpi.put("totalUsers", userRepo.count());
        kpi.put("totalPortfolios", portfolioRepo.count());
        kpi.put("totalTransactions", transactionRepo.count());
        kpi.put("totalWatchlists", watchlistRepo.count());
        kpi.put("totalNews", newsRepo.count());
        kpi.put("totalAiConversations", aiRepo.count());
        kpi.put("totalGoals", goalRepo.count());
        return ResponseEntity.ok(kpi);
    }
}