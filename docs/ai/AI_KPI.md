# AI Quality KPIs

Measurable targets for all AI-generated content. Violations are logged and counted in monitoring.

## News Summary KPIs

| KPI | Target | Measurement | Action on fail |
|-----|--------|-------------|----------------|
| Summary length | ≤ 150 words | Word count after generation | Reject, retry once, then store without summary |
| Source present | 100% | `source` field non-empty in metadata | Reject |
| Publication date present | 100% | `publicationDate` non-null | Reject |
| Source URL present | 100% | Original article URL stored | Reject |
| No investment advice | 100% | Regex + LLM classifier on output | Reject, flag for moderator |
| No price predictions as fact | 100% | Pattern match ("will reach", "guaranteed") | Reject, flag for moderator |
| Factual accuracy | > 95% | Weekly human review sample (n=50) | Retrain prompt, alert team |
| Latency | p95 < 8s | Timer on summarizer call | Scale timeout, alert ops |

## News Tagging KPIs

| KPI | Target | Measurement |
|-----|--------|-------------|
| Asset match precision | > 90% | Human review: tagged asset actually mentioned |
| Asset match recall | > 80% | Human review: mentioned assets are tagged |
| Confidence threshold | ≥ 0.7 | Only persist tags above threshold |
| False positive rate | < 5% | Tagged asset not in article body |

## Portfolio Analysis KPIs

| KPI | Target | Measurement |
|-----|--------|-------------|
| Citations per analysis | ≥ 1 | Count `ai_analysis_citations` rows |
| Citation has URL | 100% | Non-empty url field |
| Citation has publication date | 100% | Non-null date |
| Risk score range | 0–100 | DB check constraint |
| No buy/sell recommendations | 100% | Classifier on output text |
| Uncertainty stated | When applicable | Manual review sample |

## AI Chat KPIs (planned)

| KPI | Target |
|-----|--------|
| Response latency p95 | < 12s |
| Citation on factual claims | 100% |
| Conversation context window | Last 10 messages + portfolio snapshot |
| Moderator flag rate | < 2% of messages |

## Automated Validation Pipeline

```
AI Output
  → wordCount(summary) <= 150?
  → hasSource && hasPublicationDate && hasUrl?
  → adviceClassifier(output) == SAFE?
  → predictionClassifier(output) == SAFE?
  → PASS → persist
  → FAIL → log violation metric, retry or quarantine
```

## Prompt Versioning

| Field | Storage |
|-------|---------|
| prompt_version | Stored on each AI output record |
| model | Stored on each AI output record (`gpt-4o-mini`, etc.) |

When KPI fails spike after a prompt change, rollback to previous `prompt_version`.

## Review Process

| Frequency | Activity |
|-----------|----------|
| Daily | Automated KPI dashboard review |
| Weekly | Human sample review (50 summaries, 20 analyses) |
| Monthly | KPI report to stakeholders, prompt tuning |

## Monitoring Dashboard Metrics

```
news.ai.summary.word_count_avg
news.ai.summary.kpi_violation_rate
news.ai.tagger.precision (from weekly review)
news.ai.summarizer.latency_p95
ai.analysis.citation_count_avg
ai.analysis.advice_violation_count
```

Alert if `kpi_violation_rate > 5%` over 1-hour window.

## UI Requirements

Every AI-generated content in the UI must display:

1. "AI-generated" badge
2. Source name and publication date (news)
3. "Not financial advice" disclaimer
4. Link to original source

These are product requirements, not just backend KPIs.
