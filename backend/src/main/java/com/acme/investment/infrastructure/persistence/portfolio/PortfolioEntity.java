package com.acme.investment.infrastructure.persistence.portfolio;
import com.acme.investment.domain.portfolio.Portfolio;
import com.acme.investment.infrastructure.persistence.UserEntity;
import jakarta.persistence.*;
import java.time.OffsetDateTime;
import java.util.UUID;
@Entity
@Table(name = "portfolios")
public class PortfolioEntity {
    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    private UUID id;
    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "user_id", nullable = false)
    private UserEntity user;
    @Column(nullable = false)
    private String name;
    @Column(name = "base_currency", nullable = false, columnDefinition = "CHAR(3)")
    private String baseCurrency;
    @Column(name = "type", nullable = false)
    private String type = "STOCKS";
    @Column(name = "created_at")
    private OffsetDateTime createdAt;
    @Column(name = "updated_at")
    private OffsetDateTime updatedAt;
    @PrePersist
    void onCreate() {
        createdAt = updatedAt = OffsetDateTime.now();
    }
    @PreUpdate
    void onUpdate() {
        updatedAt = OffsetDateTime.now();
    }
    public Portfolio toDomain() {
        return new Portfolio(id, user.getId(), name, baseCurrency, type, createdAt, updatedAt);
    }
    public UUID getId() { return id; }
    public UserEntity getUser() { return user; }
    public void setUser(UserEntity user) { this.user = user; }
    public String getName() { return name; }
    public void setName(String name) { this.name = name; }
    public String getBaseCurrency() { return baseCurrency; }
    public void setBaseCurrency(String baseCurrency) { this.baseCurrency = baseCurrency; }
    public String getType() { return type; }
    public void setType(String type) { this.type = type; }
    public OffsetDateTime getCreatedAt() { return createdAt; }
    public OffsetDateTime getUpdatedAt() { return updatedAt; }
}