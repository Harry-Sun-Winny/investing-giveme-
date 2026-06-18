package com.acme.investment.infrastructure.config;

import org.springframework.boot.context.properties.ConfigurationProperties;

@ConfigurationProperties(prefix = "openai")
public class OpenAiProperties {
    private String apiKey = "";
    private String model = "gpt-4o-mini";

    public String getApiKey() { return apiKey; }
    public void setApiKey(String apiKey) { this.apiKey = apiKey; }
    public String getModel() { return model; }
    public void setModel(String model) { this.model = model; }

    public boolean isConfigured() {
        return apiKey != null && !apiKey.isBlank();
    }
}
