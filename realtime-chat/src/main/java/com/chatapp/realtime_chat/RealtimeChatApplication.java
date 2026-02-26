package com.chatapp.realtime_chat;

import org.springframework.boot.SpringApplication;
import org.springframework.boot.autoconfigure.SpringBootApplication;
import org.springframework.scheduling.annotation.EnableScheduling;

@SpringBootApplication
@EnableScheduling
public class RealtimeChatApplication {

    public static void main(String[] args) {
        SpringApplication.run(RealtimeChatApplication.class, args);
    }

}
