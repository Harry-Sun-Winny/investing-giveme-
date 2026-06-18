package com.acme.investment.infrastructure.persistence.news;

import jakarta.persistence.*;
import java.time.OffsetDateTime;
import java.util.ArrayList;
import java.util.List;
import java.util.UUID;

@Entity
@Table(name = "news_articles")
public class NewsArticleEntity {
    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    private UUID id;

    @Column(nullable = false)
    private String source;

    @Column(name = "publication_date", nullable = false)
    private OffsetDateTime publicationDate;

    @Column(nullable = false, length = 300)
    private String title;

    @Column(nullable = false, unique = true, columnDefinition = "TEXT")
    private String url;

    @Column(nullable = false, columnDefinition = "TEXT")
    private String summary;

    @Column(name = "created_at")
    private OffsetDateTime createdAt;

    @OneToMany(mappedBy = "article", cascade = CascadeType.ALL, orphanRemoval = true)
    private List<NewsTagEntity> tags = new ArrayList<>();

    @ManyToMany
    @JoinTable(
            name = "news_article_assets",
            joinColumns = @JoinColumn(name = "news_article_id"),
            inverseJoinColumns = @JoinColumn(name = "asset_id"))
    private List<com.acme.investment.infrastructure.persistence.asset.AssetEntity> assets = new ArrayList<>();

    @PrePersist
    void onCreate() {
        createdAt = OffsetDateTime.now();
    }

    public UUID getId() { return id; }
    public String getSource() { return source; }
    public void setSource(String source) { this.source = source; }
    public OffsetDateTime getPublicationDate() { return publicationDate; }
    public void setPublicationDate(OffsetDateTime publicationDate) { this.publicationDate = publicationDate; }
    public String getTitle() { return title; }
    public void setTitle(String title) { this.title = title; }
    public String getUrl() { return url; }
    public void setUrl(String url) { this.url = url; }
    public String getSummary() { return summary; }
    public void setSummary(String summary) { this.summary = summary; }
    public List<NewsTagEntity> getTags() { return tags; }
    public List<com.acme.investment.infrastructure.persistence.asset.AssetEntity> getAssets() { return assets; }
}
