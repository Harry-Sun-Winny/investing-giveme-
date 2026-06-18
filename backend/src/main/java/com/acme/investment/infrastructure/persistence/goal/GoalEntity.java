package com.acme.investment.infrastructure.persistence.goal;
import com.acme.investment.domain.goal.Goal;
import com.acme.investment.infrastructure.persistence.UserEntity;
import jakarta.persistence.*;
import java.math.BigDecimal;
import java.time.LocalDate;
import java.time.OffsetDateTime;
import java.util.UUID;
@Entity
@Table(name = "financial_goals")
public class GoalEntity {
    @Id @GeneratedValue(strategy = GenerationType.UUID)
    private UUID id;
    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "user_id", nullable = false)
    private UserEntity user;
    @Column(nullable = false)
    private String name;
    @Column(name = "target_amount", nullable = false)
    private BigDecimal targetAmount;
    @Column(name = "current_amount", nullable = false)
    private BigDecimal currentAmount = BigDecimal.ZERO;
    @Column(nullable = false, length = 3)
    private String currency;
    @Column(name = "target_date", nullable = false)
    private LocalDate targetDate;
    @Column(nullable = false)
    private String status = "ACTIVE";
    @Column(name = "created_at")
    private OffsetDateTime createdAt;
    @PrePersist void onCreate() { createdAt = OffsetDateTime.now(); }
    public Goal toDomain() {
        return new Goal(id, user.getId(), name, targetAmount, currentAmount, currency, targetDate, status, createdAt);
    }
    public UUID getId() { return id; }
    public UserEntity getUser() { return user; }
    public void setUser(UserEntity user) { this.user = user; }
    public String getName() { return name; }
    public void setName(String name) { this.name = name; }
    public BigDecimal getTargetAmount() { return targetAmount; }
    public void setTargetAmount(BigDecimal targetAmount) { this.targetAmount = targetAmount; }
    public BigDecimal getCurrentAmount() { return currentAmount; }
    public void setCurrentAmount(BigDecimal currentAmount) { this.currentAmount = currentAmount; }
    public String getCurrency() { return currency; }
    public void setCurrency(String currency) { this.currency = currency; }
    public LocalDate getTargetDate() { return targetDate; }
    public void setTargetDate(LocalDate targetDate) { this.targetDate = targetDate; }
    public String getStatus() { return status; }
    public void setStatus(String status) { this.status = status; }
}