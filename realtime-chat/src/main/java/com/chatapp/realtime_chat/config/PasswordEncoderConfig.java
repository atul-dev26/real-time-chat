package com.chatapp.realtime_chat.config;

import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.security.crypto.bcrypt.BCryptPasswordEncoder;
import org.springframework.security.crypto.password.PasswordEncoder;

@Configuration // This tells Spring that this class contains configuration
public class PasswordEncoderConfig {

    @Bean // This creates a PasswordEncoder object that Spring will manage and inject
          // where needed
    public PasswordEncoder passwordEncoder() {
        // BCryptPasswordEncoder with strength 10 (default)
        // Strength 10 means it will hash the password 2^10 (1024) times
        // Higher = more secure but slower. 10 is a good balance.
        return new BCryptPasswordEncoder(10);
    }
}
