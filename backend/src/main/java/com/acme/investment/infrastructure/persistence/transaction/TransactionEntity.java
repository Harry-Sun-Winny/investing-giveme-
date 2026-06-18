package com.acme.investment.infrastructure.persistence.transaction;

import com.acme.investment.domain.transaction.Transaction;
import com.acme.investment.infrastructure.persistence.portfolio.PortfolioEntity;
import jakarta.persistence.*;
import java.math.BigDecimal;
import java.time.LocalDate;
import java.time.OffsetDateTime;
import java.util.UUID;

@Entity
@Table(name = "transactions")
public class TransactionEntity {
    @Id @GeneratedValue(strategy = GenerationType.UUID)
    private UUID id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "portfolio_id", nullable = false)
    private PortfolioEntity portfolio;

    @Column(name = "asset_symbol", nullable = false)
    private String assetSymbol;

    @Column(name = "asset_name")
    private String assetName;
    
    @Column(name = "type", nullable = false)
    private String type;

    @Column(nullable = false, precision = 24, scale = 8)
    private BigDecimal quantity;

    @Column(nullable = false, precision = 24, scale = 8)
    private BigDecimal price;

    @Column(nullable = false, length = 3)
    private String currency;

    @Column(name = "transaction_date", nullable = false)
    private LocalDate transactionDate;

    @Column
    private String notes;

    @Column(name = "created_at")
    private OffsetDateTime createdAt;

    @PrePersist void onCreate() { createdAt = OffsetDateTime.now(); }

    public Transaction toDomain() {
        return new Transaction(id, portfolio.getId(), assetSymbol, assetName,
            type, quantity, price, currency, transactionDate, notes, createdAt);
    }

    public UUID getId() { return id; }
    public PortfolioEntity getPortfolio() { return portfolio; }
    public void setPortfolio(PortfolioEntity p) { this.portfolio = p; }
    public String getAssetSymbol() { return assetSymbol; }
    public void setAssetSymbol(String s) { this.assetSymbol = s; }
    public String getAssetName() { return assetName; }
    public void setAssetName(String s) { this.assetName = s; }
    public String getType() { return type; }
    public void setType(String t) { this.type = t; }
    public BigDecimal getQuantity() { return quantity; }
    public void setQuantity(BigDecimal q) { this.quantity = q; }
    public BigDecimal getPrice() { return price; }
    public void setPrice(BigDecimal p) { this.price = p; }
    public String getCurrency() { return currency; }
    public void setCurrency(String c) { this.currency = c; }
    public LocalDate getTransactionDate() { return transactionDate; }
    public void setTransactionDate(LocalDate d) { this.transactionDate = d; }
    public String getNotes() { return notes; }
    public void setNotes(String n) { this.notes = n; }
    public OffsetDateTime getCreatedAt() { return createdAt; }
}