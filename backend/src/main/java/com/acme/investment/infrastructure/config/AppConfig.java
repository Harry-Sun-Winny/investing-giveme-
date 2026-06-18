package com.acme.investment.infrastructure.config;

import org.springframework.boot.context.properties.EnableConfigurationProperties;
import org.springframework.context.annotation.Configuration;

@Configuration
@EnableConfigurationProperties({NewsProperties.class, OpenAiProperties.class})
public class AppConfig {}
