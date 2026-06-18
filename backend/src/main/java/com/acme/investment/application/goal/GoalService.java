package com.acme.investment.application.goal;
import com.acme.investment.domain.goal.Goal;
import com.acme.investment.infrastructure.persistence.UserJpaRepository;
import com.acme.investment.infrastructure.persistence.goal.GoalEntity;
import com.acme.investment.infrastructure.persistence.goal.GoalJpaRepository;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.web.server.ResponseStatusException;
import java.math.BigDecimal;
import java.time.LocalDate;
import java.util.List;
import java.util.UUID;
@Service
public class GoalService {
    private final GoalJpaRepository goalRepo;
    private final UserJpaRepository userRepo;
    public GoalService(GoalJpaRepository goalRepo, UserJpaRepository userRepo) {
        this.goalRepo = goalRepo;
        this.userRepo = userRepo;
    }
    public List<Goal> listByUser(UUID userId) {
        return goalRepo.findByUserId(userId).stream().map(GoalEntity::toDomain).toList();
    }
    public Goal create(UUID userId, String name, BigDecimal targetAmount, String currency, LocalDate targetDate) {
        var user = userRepo.findById(userId).orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND));
        var entity = new GoalEntity();
        entity.setUser(user);
        entity.setName(name);
        entity.setTargetAmount(targetAmount);
        entity.setCurrency(currency);
        entity.setTargetDate(targetDate);
        return goalRepo.save(entity).toDomain();
    }
    public Goal update(UUID id, UUID userId, BigDecimal currentAmount, String status) {
        var entity = goalRepo.findById(id)
                .filter(g -> g.getUser().getId().equals(userId))
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND));
        entity.setCurrentAmount(currentAmount);
        entity.setStatus(status);
        return goalRepo.save(entity).toDomain();
    }
    public void delete(UUID id, UUID userId) {
        var entity = goalRepo.findById(id)
                .filter(g -> g.getUser().getId().equals(userId))
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND));
        goalRepo.delete(entity);
    }
}