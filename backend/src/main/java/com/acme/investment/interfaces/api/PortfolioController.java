package com.acme.investment.interfaces.api;
import com.acme.investment.application.portfolio.PortfolioService;
import com.acme.investment.application.holding.HoldingService;
import com.acme.investment.domain.portfolio.Portfolio;
import com.acme.investment.domain.holding.Holding;
import com.acme.investment.infrastructure.persistence.UserJpaRepository;
import org.springframework.http.HttpStatus;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.web.bind.annotation.*;
import java.util.List;
import java.util.UUID;

@RestController
@RequestMapping("/api/v1/portfolios")
public class PortfolioController {
    private final PortfolioService portfolioService;
    private final HoldingService holdingService;
    private final UserJpaRepository userRepo;

    public PortfolioController(PortfolioService portfolioService, HoldingService holdingService,
                               UserJpaRepository userRepo) {
        this.portfolioService = portfolioService;
        this.holdingService = holdingService;
        this.userRepo = userRepo;
    }

    private UUID resolveUserId(UserDetails userDetails) {
        return userRepo.findByEmail(userDetails.getUsername())
                .orElseThrow().getId();
    }

    @GetMapping
    public List<Portfolio> list(@AuthenticationPrincipal UserDetails userDetails) {
        return portfolioService.listByUser(resolveUserId(userDetails));
    }

    @GetMapping("/{id}")
    public Portfolio get(@PathVariable UUID id, @AuthenticationPrincipal UserDetails userDetails) {
        return portfolioService.getById(id, resolveUserId(userDetails));
    }

    @PostMapping
    @ResponseStatus(HttpStatus.CREATED)
    public Portfolio create(@RequestBody CreatePortfolioRequest req,
                            @AuthenticationPrincipal UserDetails userDetails) {
        return portfolioService.create(resolveUserId(userDetails), req.name(), req.baseCurrency(), req.type());
    }

    @PutMapping("/{id}")
    public Portfolio update(@PathVariable UUID id,
                            @RequestBody CreatePortfolioRequest req,
                            @AuthenticationPrincipal UserDetails userDetails) {
        return portfolioService.update(id, resolveUserId(userDetails), req.name(), req.baseCurrency(), req.type());
    }

    @DeleteMapping("/{id}")
    @ResponseStatus(HttpStatus.NO_CONTENT)
    public void delete(@PathVariable UUID id, @AuthenticationPrincipal UserDetails userDetails) {
        portfolioService.delete(id, resolveUserId(userDetails));
    }

    @GetMapping("/{id}/holdings")
    public List<Holding> holdings(@PathVariable UUID id,
                                  @AuthenticationPrincipal UserDetails userDetails) {
        return holdingService.listByPortfolio(id, resolveUserId(userDetails));
    }

    public record CreatePortfolioRequest(String name, String baseCurrency, String type) {}
}