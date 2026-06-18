package com.acme.investment.infrastructure.persistence.holding;

import com.acme.investment.domain.holding.Holding;
import com.acme.investment.infrastructure.persistence.asset.AssetEntity;
import com.acme.investment.infrastructure.persistence.portfolio.PortfolioEntity;
import jakarta.persistence.*;
import java.math.BigDecimal;
import java.time.OffsetDateTime;
import java.util.UUID;

@Entity
@Table(name = "portfolio_positions")
public class PortfolioPositionEntity {
    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    private UUID id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "portfolio_id", nullable = false)
    private PortfolioEntity portfolio;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "asset_id", nullable = false)
    private AssetEntity asset;

    @Column(nullable = false, precision = 24, scale = 8)
    private BigDecimal quantity;

    @Column(name = "average_cost", nullable = false, precision = 24, scale = 8)
    private BigDecimal averageCost;

    @Column(name = "updated_at")
    private OffsetDateTime updatedAt;

    @PrePersist
    @PreUpdate
    void touch() {
        updatedAt = OffsetDateTime.now();
    }

    public Holding toDomain() {
        return new Holding(id, portfolio.getId(), asset.getId(), asset.getSymbol(),
                asset.getName(), quantity, averageCost);
    }

    public UUID getId() { return id; }
    public PortfolioEntity getPortfolio() { return portfolio; }
    public void setPortfolio(PortfolioEntity portfolio) { this.portfolio = portfolio; }
    public AssetEntity getAsset() { return asset; }
    public void setAsset(AssetEntity asset) { this.asset = asset; }
    public BigDecimal getQuantity() { return quantity; }
    public void setQuantity(BigDecimal quantity) { this.quantity = quantity; }
    public BigDecimal getAverageCost() { return averageCost; }
    public void setAverageCost(BigDecimal averageCost) { this.averageCost = averageCost; }
}
