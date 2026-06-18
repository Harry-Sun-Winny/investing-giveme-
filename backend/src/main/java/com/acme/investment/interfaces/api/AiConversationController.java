package com.acme.investment.interfaces.api;

import com.acme.investment.application.ai.AiConversationService;
import com.acme.investment.domain.ai.AiConversation;
import com.acme.investment.infrastructure.persistence.UserJpaRepository;
import org.springframework.http.HttpStatus;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.web.bind.annotation.*;
import java.util.List;
import java.util.UUID;

@RestController
@RequestMapping("/api/v1/ai/conversations")
public class AiConversationController {
    private final AiConversationService conversationService;
    private final UserJpaRepository userRepo;

    public AiConversationController(AiConversationService conversationService, UserJpaRepository userRepo) {
        this.conversationService = conversationService;
        this.userRepo = userRepo;
    }

    private UUID resolveUserId(UserDetails u) {
        return userRepo.findByEmail(u.getUsername()).orElseThrow().getId();
    }

    @GetMapping
    public List<AiConversation> list(@AuthenticationPrincipal UserDetails u) {
        return conversationService.list(resolveUserId(u));
    }

    @PostMapping
    @ResponseStatus(HttpStatus.CREATED)
    public AiConversation create(@RequestBody CreateConversationRequest req,
                                 @AuthenticationPrincipal UserDetails u) {
        return conversationService.create(resolveUserId(u), req.portfolioId(), req.title());
    }

    @PostMapping("/{id}/messages")
    public AiConversation sendMessage(@PathVariable UUID id,
                                      @RequestBody SendMessageRequest req,
                                      @AuthenticationPrincipal UserDetails u) {
        return conversationService.sendMessage(id, resolveUserId(u), req.content());
    }

    public record CreateConversationRequest(UUID portfolioId, String title) {}
    public record SendMessageRequest(String content) {}
}
