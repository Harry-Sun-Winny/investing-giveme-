package com.acme.investment.infrastructure.config;

import java.util.ArrayList;
import java.util.List;
import org.springframework.boot.context.properties.ConfigurationProperties;

@ConfigurationProperties(prefix = "news")
public class NewsProperties {
    private Ingestion ingestion = new Ingestion();
    private Rss rss = new Rss();

    public Ingestion getIngestion() { return ingestion; }
    public void setIngestion(Ingestion ingestion) { this.ingestion = ingestion; }
    public Rss getRss() { return rss; }
    public void setRss(Rss rss) { this.rss = rss; }

    public static class Ingestion {
        private boolean enabled = true;
        private String cron = "0 */15 * * * *";
        private int maxArticlesPerRun = 30;
        private int retentionDays = 1;

        public boolean isEnabled() { return enabled; }
        public void setEnabled(boolean enabled) { this.enabled = enabled; }
        public String getCron() { return cron; }
        public void setCron(String cron) { this.cron = cron; }
        public int getMaxArticlesPerRun() { return maxArticlesPerRun; }
        public void setMaxArticlesPerRun(int maxArticlesPerRun) { this.maxArticlesPerRun = maxArticlesPerRun; }
        public int getRetentionDays() { return retentionDays; }
        public void setRetentionDays(int retentionDays) { this.retentionDays = retentionDays; }
    }

    public static class Rss {
        private List<RssFeed> feeds = new ArrayList<>();

        public List<RssFeed> getFeeds() { return feeds; }
        public void setFeeds(List<RssFeed> feeds) { this.feeds = feeds; }
    }

    public record RssFeed(String url, String source) {}
}
