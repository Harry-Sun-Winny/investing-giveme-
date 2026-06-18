package com.acme.investment.interfaces.api;

import com.acme.investment.application.audit.AuditLogService;
import com.acme.investment.application.transaction.TransactionService;
import com.acme.investment.domain.transaction.Transaction;
import com.acme.investment.infrastructure.persistence.UserJpaRepository;
import jakarta.servlet.http.HttpServletRequest;
import org.springframework.http.HttpStatus;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.web.bind.annotation.*;
import java.math.BigDecimal;
import java.time.LocalDate;
import java.util.List;
import java.util.UUID;

@RestController
@RequestMapping("/api/v1/portfolios/{portfolioId}/transactions")
public class TransactionController {
    private final TransactionService transactionService;
    private final UserJpaRepository userRepo;
    private final AuditLogService auditLogService;

    public TransactionController(TransactionService transactionService,
                                  UserJpaRepository userRepo,
                                  AuditLogService auditLogService) {
        this.transactionService = transactionService;
        this.userRepo = userRepo;
        this.auditLogService = auditLogService;
    }

    private UUID resolveUserId(UserDetails u) {
        return userRepo.findByEmail(u.getUsername()).orElseThrow().getId();
    }

    @GetMapping
    public List<Transaction> list(@PathVariable UUID portfolioId,
                                   @AuthenticationPrincipal UserDetails u) {
        return transactionService.listByPortfolio(portfolioId, resolveUserId(u));
    }

    @PostMapping
    @ResponseStatus(HttpStatus.CREATED)
    public Transaction create(@PathVariable UUID portfolioId,
                               @RequestBody CreateTransactionRequest req,
                               @AuthenticationPrincipal UserDetails u,
                               HttpServletRequest request) {
        UUID userId = resolveUserId(u);
        Transaction t = transactionService.create(portfolioId, userId,
            req.assetSymbol(), req.assetName(), req.type(),
            req.quantity(), req.price(), req.currency(),
            req.transactionDate(), req.notes());
        auditLogService.log(userId, "TRANSACTION", t.id(), "CREATE", null, t);
        return t;
    }

    @DeleteMapping("/{id}")
    @ResponseStatus(HttpStatus.NO_CONTENT)
    public void delete(@PathVariable UUID portfolioId,
                       @PathVariable UUID id,
                       @AuthenticationPrincipal UserDetails u,
                       HttpServletRequest request) {
        UUID userId = resolveUserId(u);
        Transaction t = transactionService.getById(id, userId);
        transactionService.delete(id, userId);
        auditLogService.log(userId, "TRANSACTION", id, "DELETE", t, null);
    }

@PutMapping("/{id}")
public Transaction update(@PathVariable UUID portfolioId,
                          @PathVariable UUID id,
                          @RequestBody CreateTransactionRequest req,
                          @AuthenticationPrincipal UserDetails u,
                          HttpServletRequest request) {
    UUID userId = resolveUserId(u);
    Transaction t = transactionService.update(id, userId, portfolioId,
        req.assetSymbol(), req.assetName(), req.type(),
        req.quantity(), req.price(), req.currency(),
        req.transactionDate(), req.notes());
    auditLogService.log(userId, "TRANSACTION", id, "UPDATE", null, t);
    return t;
}

    public record CreateTransactionRequest(
        String assetSymbol, String assetName, String type,
        BigDecimal quantity, BigDecimal price, String currency,
        LocalDate transactionDate, String notes
    ) {}
}