package com.acme.investment.infrastructure.news;

import com.acme.investment.infrastructure.persistence.asset.AssetEntity;
import com.acme.investment.infrastructure.persistence.asset.AssetJpaRepository;
import java.math.BigDecimal;
import java.util.ArrayList;
import java.util.List;
import java.util.Locale;
import org.springframework.stereotype.Component;

@Component
public class NewsTagger {
    private final AssetJpaRepository assetRepo;

    public NewsTagger(AssetJpaRepository assetRepo) {
        this.assetRepo = assetRepo;
    }

    public TagResult tag(String title, String summary, String content) {
        String haystack = ((title == null ? "" : title) + " "
                + (summary == null ? "" : summary) + " "
                + (content == null ? "" : content)).toUpperCase(Locale.ROOT);

        List<AssetEntity> matchedAssets = new ArrayList<>();
        for (AssetEntity asset : assetRepo.findAll()) {
            if (haystack.contains(asset.getSymbol().toUpperCase())
                    || haystack.contains(asset.getName().toUpperCase(Locale.ROOT))) {
                matchedAssets.add(asset);
            }
        }

        List<TaggedTopic> tags = new ArrayList<>();
        addTagIfMatch(tags, haystack, "earnings", "EARNINGS");
        addTagIfMatch(tags, haystack, "regulation", "REGULATION");
        addTagIfMatch(tags, haystack, "etf", "ETF");
        addTagIfMatch(tags, haystack, "fed", "MACRO");
        addTagIfMatch(tags, haystack, "inflation", "MACRO");

        return new TagResult(matchedAssets, tags);
    }

    private void addTagIfMatch(List<TaggedTopic> tags, String haystack, String keyword, String tag) {
        if (haystack.contains(keyword.toUpperCase(Locale.ROOT))) {
            tags.add(new TaggedTopic(tag, BigDecimal.valueOf(0.85)));
        }
    }

    public record TagResult(List<AssetEntity> assets, List<TaggedTopic> tags) {}

    public record TaggedTopic(String tag, BigDecimal confidence) {}
}
