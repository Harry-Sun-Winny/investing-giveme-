package com.acme.investment.application.news;

import com.acme.investment.domain.news.NewsArticle;
import com.acme.investment.infrastructure.ai.OpenAiSummarizer;
import com.acme.investment.infrastructure.config.NewsProperties;
import com.acme.investment.infrastructure.news.NewsTagger;
import com.acme.investment.infrastructure.news.RawNewsItem;
import com.acme.investment.infrastructure.news.RssFeedClient;
import com.acme.investment.infrastructure.persistence.asset.AssetEntity;
import com.acme.investment.infrastructure.persistence.news.NewsArticleEntity;
import com.acme.investment.infrastructure.persistence.news.NewsArticleJpaRepository;
import com.acme.investment.infrastructure.persistence.news.NewsTagEntity;
import com.acme.investment.application.notification.NotificationService;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.data.domain.PageRequest;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import java.util.List;

@Service
public class NewsIngestionService {
    private static final Logger log = LoggerFactory.getLogger(NewsIngestionService.class);

    private final RssFeedClient rssFeedClient;
    private final OpenAiSummarizer summarizer;
    private final NewsTagger tagger;
    private final NewsArticleJpaRepository newsRepo;
    private final NewsProperties newsProperties;
    private final NotificationService notificationService;

    public NewsIngestionService(RssFeedClient rssFeedClient, OpenAiSummarizer summarizer,
                                NewsTagger tagger, NewsArticleJpaRepository newsRepo,
                                NewsProperties newsProperties, NotificationService notificationService) {
        this.rssFeedClient = rssFeedClient;
        this.summarizer = summarizer;
        this.tagger = tagger;
        this.newsRepo = newsRepo;
        this.newsProperties = newsProperties;
        this.notificationService = notificationService;
    }

    @Transactional
    public int ingest() {
        List<RawNewsItem> items = rssFeedClient.fetchAll();
        int processed = 0;
        int limit = newsProperties.getIngestion().getMaxArticlesPerRun();

        for (RawNewsItem item : items) {
            if (processed >= limit) {
                break;
            }
            if (newsRepo.findByUrl(item.url()).isPresent()) {
                continue;
            }
            String summary = summarizer.summarize(item);
            if (summary.isBlank()) {
                continue;
            }

            NewsTagger.TagResult tags = tagger.tag(item.title(), summary, item.content());

            NewsArticleEntity article = new NewsArticleEntity();
            article.setSource(item.source());
            article.setPublicationDate(item.publicationDate());
            article.setTitle(item.title());
            article.setUrl(item.url());
            article.setSummary(summary);
            article.getAssets().addAll(tags.assets());
            for (NewsTagger.TaggedTopic topic : tags.tags()) {
                article.getTags().add(new NewsTagEntity(article, topic.tag(), topic.confidence()));
            }

            NewsArticleEntity saved = newsRepo.save(article);
            notificationService.onNewsPublished(saved);
            processed++;
        }

        log.info("News ingestion complete: {} new articles", processed);
        return processed;
    }

    @Transactional
    public long purgeOlderThanDays(int days) {
        java.time.OffsetDateTime cutoff = java.time.OffsetDateTime.now().minusDays(days);
        long removed = newsRepo.deleteByPublicationDateBefore(cutoff);
        log.info("Purged {} news articles older than {} days", removed, days);
        return removed;
    }

    @Transactional(readOnly = true)
    public List<NewsArticle> listLatest(String assetSymbol) {
        List<NewsArticleEntity> entities = assetSymbol == null || assetSymbol.isBlank()
                ? newsRepo.findLatest(PageRequest.of(0, 50))
                : newsRepo.findByAssetSymbol(assetSymbol.trim(), PageRequest.of(0, 50));
        return entities.stream().map(this::toDomain).toList();
    }

    private NewsArticle toDomain(NewsArticleEntity entity) {
        List<String> symbols = entity.getAssets().stream().map(AssetEntity::getSymbol).toList();
        List<String> tags = entity.getTags().stream().map(NewsTagEntity::getTag).toList();
        return new NewsArticle(entity.getId(), entity.getSource(), entity.getPublicationDate(),
                entity.getTitle(), entity.getSummary(), entity.getUrl(), symbols, tags);
    }
}
