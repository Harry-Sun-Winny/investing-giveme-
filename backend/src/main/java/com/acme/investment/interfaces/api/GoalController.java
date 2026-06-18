package com.acme.investment.interfaces.api;
import com.acme.investment.application.goal.GoalService;
import com.acme.investment.domain.goal.Goal;
import com.acme.investment.infrastructure.persistence.UserJpaRepository;
import org.springframework.http.HttpStatus;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.web.bind.annotation.*;
import java.math.BigDecimal;
import java.time.LocalDate;
import java.util.List;
import java.util.UUID;
@RestController
@RequestMapping("/api/v1/goals")
public class GoalController {
    private final GoalService goalService;
    private final UserJpaRepository userRepo;
    public GoalController(GoalService goalService, UserJpaRepository userRepo) {
        this.goalService = goalService;
        this.userRepo = userRepo;
    }
    private UUID resolveUserId(UserDetails u) {
        return userRepo.findByEmail(u.getUsername()).orElseThrow().getId();
    }
    @GetMapping
    public List<Goal> list(@AuthenticationPrincipal UserDetails u) {
        return goalService.listByUser(resolveUserId(u));
    }
    @PostMapping
    @ResponseStatus(HttpStatus.CREATED)
    public Goal create(@RequestBody CreateGoalRequest req, @AuthenticationPrincipal UserDetails u) {
        return goalService.create(resolveUserId(u), req.name(), req.targetAmount(), req.currency(), req.targetDate());
    }
    @PutMapping("/{id}")
    public Goal update(@PathVariable UUID id, @RequestBody UpdateGoalRequest req, @AuthenticationPrincipal UserDetails u) {
        return goalService.update(id, resolveUserId(u), req.currentAmount(), req.status());
    }
    @DeleteMapping("/{id}")
    @ResponseStatus(HttpStatus.NO_CONTENT)
    public void delete(@PathVariable UUID id, @AuthenticationPrincipal UserDetails u) {
        goalService.delete(id, resolveUserId(u));
    }
    public record CreateGoalRequest(String name, BigDecimal targetAmount, String currency, LocalDate targetDate) {}
    public record UpdateGoalRequest(BigDecimal currentAmount, String status) {}
}