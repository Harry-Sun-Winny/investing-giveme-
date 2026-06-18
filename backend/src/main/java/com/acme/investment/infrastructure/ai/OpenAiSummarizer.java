package com.acme.investment.infrastructure.ai;

import com.acme.investment.infrastructure.config.OpenAiProperties;
import com.acme.investment.infrastructure.news.RawNewsItem;
import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import java.net.URI;
import java.net.http.HttpClient;
import java.net.http.HttpRequest;
import java.net.http.HttpResponse;
import java.time.Duration;
import java.time.format.DateTimeFormatter;
import java.util.Map;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.stereotype.Component;

@Component
public class OpenAiSummarizer {
    private static final Logger log = LoggerFactory.getLogger(OpenAiSummarizer.class);
    private static final int MAX_WORDS = 150;

    private final OpenAiProperties openAiProperties;
    private final ObjectMapper objectMapper;
    private final HttpClient httpClient = HttpClient.newBuilder()
            .connectTimeout(Duration.ofSeconds(10))
            .build();

    public OpenAiSummarizer(OpenAiProperties openAiProperties, ObjectMapper objectMapper) {
        this.openAiProperties = openAiProperties;
        this.objectMapper = objectMapper;
    }

    public String summarize(RawNewsItem item) {
        if (!openAiProperties.isConfigured()) {
            return fallbackSummary(item);
        }
        try {
            String prompt = """
                    Summarize this financial news in at most %d words.
                    Do NOT give investment advice or price predictions.
                    Source: %s
                    Published: %s
                    Title: %s
                    Content: %s
                    """.formatted(
                    MAX_WORDS,
                    item.source(),
                    item.publicationDate().format(DateTimeFormatter.ISO_OFFSET_DATE_TIME),
                    item.title(),
                    truncate(item.content(), 2000));

            String body = objectMapper.writeValueAsString(Map.of(
                    "model", openAiProperties.getModel(),
                    "messages", new Object[]{
                            Map.of("role", "system", "content",
                                    "You are a financial news summarizer. Cite the source. No investment advice."),
                            Map.of("role", "user", "content", prompt)
                    },
                    "max_tokens", 300
            ));

            HttpRequest request = HttpRequest.newBuilder()
                    .uri(URI.create("https://api.openai.com/v1/chat/completions"))
                    .header("Authorization", "Bearer " + openAiProperties.getApiKey())
                    .header("Content-Type", "application/json")
                    .timeout(Duration.ofSeconds(30))
                    .POST(HttpRequest.BodyPublishers.ofString(body))
                    .build();

            HttpResponse<String> response = httpClient.send(request, HttpResponse.BodyHandlers.ofString());
            if (response.statusCode() != 200) {
                log.warn("OpenAI summarizer failed: HTTP {}", response.statusCode());
                return fallbackSummary(item);
            }
            JsonNode root = objectMapper.readTree(response.body());
            String summary = root.path("choices").path(0).path("message").path("content").asText("");
            return enforceWordLimit(summary.isBlank() ? fallbackSummary(item) : summary);
        } catch (Exception e) {
            log.warn("OpenAI summarizer error: {}", e.getMessage());
            return fallbackSummary(item);
        }
    }

    private String fallbackSummary(RawNewsItem item) {
        String base = item.title();
        if (item.content() != null && !item.content().isBlank()) {
            base = item.content().replaceAll("<[^>]+>", " ").trim();
        }
        return enforceWordLimit(base);
    }

    private String enforceWordLimit(String text) {
        String[] words = text.trim().split("\\s+");
        if (words.length <= MAX_WORDS) {
            return text.trim();
        }
        return String.join(" ", java.util.Arrays.copyOf(words, MAX_WORDS));
    }

    private String truncate(String text, int max) {
        if (text == null) {
            return "";
        }
        return text.length() <= max ? text : text.substring(0, max);
    }
}
