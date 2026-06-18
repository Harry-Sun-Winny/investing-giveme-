package com.acme.investment.infrastructure.persistence.news;

import jakarta.persistence.*;
import java.math.BigDecimal;
import java.util.UUID;

@Entity
@Table(name = "news_tags")
public class NewsTagEntity {
    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    private UUID id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "news_article_id", nullable = false)
    private NewsArticleEntity article;

    @Column(nullable = false, length = 64)
    private String tag;

    @Column(nullable = false, precision = 5, scale = 4)
    private BigDecimal confidence = BigDecimal.ONE;

    public NewsTagEntity() {}

    public NewsTagEntity(NewsArticleEntity article, String tag, BigDecimal confidence) {
        this.article = article;
        this.tag = tag;
        this.confidence = confidence;
    }

    public String getTag() { return tag; }
}
