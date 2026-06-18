package com.acme.investment.infrastructure.scheduler;

import com.acme.investment.application.news.NewsIngestionService;
import com.acme.investment.infrastructure.config.NewsProperties;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Component;

@Component
public class NewsIngestionScheduler {
    private static final Logger log = LoggerFactory.getLogger(NewsIngestionScheduler.class);

    private final NewsIngestionService ingestionService;
    private final NewsProperties newsProperties;

    public NewsIngestionScheduler(NewsIngestionService ingestionService, NewsProperties newsProperties) {
        this.ingestionService = ingestionService;
        this.newsProperties = newsProperties;
    }

    @Scheduled(cron = "${news.ingestion.cron:0 */15 * * * *}")
    public void run() {
        if (!newsProperties.getIngestion().isEnabled()) {
            return;
        }
        try {
            ingestionService.ingest();
            ingestionService.purgeOlderThanDays(newsProperties.getIngestion().getRetentionDays());
        } catch (Exception e) {
            log.error("Scheduled news ingestion failed: {}", e.getMessage());
        }
    }
}
