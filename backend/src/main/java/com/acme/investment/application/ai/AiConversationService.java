package com.acme.investment.application.ai;

import com.acme.investment.domain.ai.AiConversation;
import com.acme.investment.domain.ai.AiMessage;
import com.acme.investment.infrastructure.config.OpenAiProperties;
import com.acme.investment.infrastructure.persistence.UserEntity;
import com.acme.investment.infrastructure.persistence.UserJpaRepository;
import com.acme.investment.infrastructure.persistence.ai.AiConversationEntity;
import com.acme.investment.infrastructure.persistence.ai.AiConversationJpaRepository;
import com.acme.investment.infrastructure.persistence.ai.AiMessageEntity;
import com.acme.investment.infrastructure.persistence.portfolio.PortfolioEntity;
import com.acme.investment.infrastructure.persistence.portfolio.PortfolioJpaRepository;
import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.server.ResponseStatusException;
import java.net.URI;
import java.net.http.HttpClient;
import java.net.http.HttpRequest;
import java.net.http.HttpResponse;
import java.time.Duration;
import java.time.OffsetDateTime;
import java.util.List;
import java.util.Map;
import java.util.UUID;

@Service
public class AiConversationService {
    private final AiConversationJpaRepository conversationRepo;
    private final UserJpaRepository userRepo;
    private final PortfolioJpaRepository portfolioRepo;
    private final OpenAiProperties openAiProperties;
    private final ObjectMapper objectMapper;
    private final HttpClient httpClient = HttpClient.newBuilder()
            .connectTimeout(Duration.ofSeconds(10)).build();

    public AiConversationService(AiConversationJpaRepository conversationRepo,
                                 UserJpaRepository userRepo,
                                 PortfolioJpaRepository portfolioRepo,
                                 OpenAiProperties openAiProperties,
                                 ObjectMapper objectMapper) {
        this.conversationRepo = conversationRepo;
        this.userRepo = userRepo;
        this.portfolioRepo = portfolioRepo;
        this.openAiProperties = openAiProperties;
        this.objectMapper = objectMapper;
    }

    @Transactional(readOnly = true)
    public List<AiConversation> list(UUID userId) {
        requirePremium(userId);
        return conversationRepo.findByUserIdOrderByUpdatedAtDesc(userId).stream()
                .map(this::toDomain).toList();
    }

    @Transactional
    public AiConversation create(UUID userId, UUID portfolioId, String title) {
        requirePremium(userId);
        UserEntity user = userRepo.findById(userId).orElseThrow();
        AiConversationEntity entity = new AiConversationEntity();
        entity.setUser(user);
        entity.setTitle(title == null || title.isBlank() ? "Portfolio chat" : title);
        if (portfolioId != null) {
            PortfolioEntity portfolio = portfolioRepo.findById(portfolioId)
                    .filter(p -> p.getUser().getId().equals(userId))
                    .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND));
            entity.setPortfolio(portfolio);
        }
        return toDomain(conversationRepo.save(entity));
    }

    @Transactional
    public AiConversation sendMessage(UUID conversationId, UUID userId, String content) {
        requirePremium(userId);
        AiConversationEntity conversation = conversationRepo.findById(conversationId)
                .filter(c -> c.getUser().getId().equals(userId))
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND));

        AiMessageEntity userMsg = new AiMessageEntity();
        userMsg.setConversation(conversation);
        userMsg.setRole("USER");
        userMsg.setContent(content);
        conversation.getMessages().add(userMsg);

        String reply = generateReply(content);
        AiMessageEntity assistantMsg = new AiMessageEntity();
        assistantMsg.setConversation(conversation);
        assistantMsg.setRole("ASSISTANT");
        assistantMsg.setContent(reply);
        assistantMsg.setModel(openAiProperties.getModel());
        conversation.getMessages().add(assistantMsg);
        conversation.setUpdatedAt(OffsetDateTime.now());

        return toDomain(conversationRepo.save(conversation));
    }

    private String generateReply(String userContent) {
        if (!openAiProperties.isConfigured()) {
            return "AI assistant is not configured. This is an informational tool only — not financial advice.";
        }
        try {
            String body = objectMapper.writeValueAsString(Map.of(
                    "model", openAiProperties.getModel(),
                    "messages", new Object[]{
                            Map.of("role", "system", "content",
                                    "You are a portfolio assistant. Cite sources when stating facts. "
                                            + "Never give investment advice or guarantee returns."),
                            Map.of("role", "user", "content", userContent)
                    },
                    "max_tokens", 500
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
                return "Unable to generate response at this time. Not financial advice.";
            }
            JsonNode root = objectMapper.readTree(response.body());
            return root.path("choices").path(0).path("message").path("content").asText(
                    "Unable to generate response. Not financial advice.");
        } catch (Exception e) {
            return "Unable to generate response at this time. Not financial advice.";
        }
    }

    private void requirePremium(UUID userId) {
        UserEntity user = userRepo.findById(userId).orElseThrow();
        String role = user.getRole();
        if (!"PREMIUM".equals(role) && !"ADMIN".equals(role)) {
            throw new ResponseStatusException(HttpStatus.FORBIDDEN, "Premium subscription required");
        }
    }

    private AiConversation toDomain(AiConversationEntity entity) {
        List<AiMessage> messages = entity.getMessages().stream()
                .map(m -> new AiMessage(m.getId(), m.getRole(), m.getContent(), m.getCreatedAt()))
                .toList();
        UUID portfolioId = entity.getPortfolio() != null ? entity.getPortfolio().getId() : null;
        return new AiConversation(entity.getId(), portfolioId, entity.getTitle(),
                entity.getCreatedAt(), messages);
    }
}
