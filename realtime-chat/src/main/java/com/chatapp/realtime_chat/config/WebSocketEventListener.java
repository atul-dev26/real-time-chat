package com.chatapp.realtime_chat.config;

import com.chatapp.realtime_chat.service.UserService;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.context.event.EventListener;
import org.springframework.messaging.simp.stomp.StompHeaderAccessor;
import org.springframework.stereotype.Component;
import org.springframework.web.socket.messaging.SessionDisconnectEvent;

import java.util.Map;

@Component
@RequiredArgsConstructor
@Slf4j
public class WebSocketEventListener {

    private final UserService userService;

    @EventListener
    public void handleWebSocketDisconnectListener(SessionDisconnectEvent event) {
        StompHeaderAccessor headerAccessor = StompHeaderAccessor.wrap(event.getMessage());

        Map<String, Object> attributes = headerAccessor.getSessionAttributes();
        if (attributes != null) {
            Long userId = (Long) attributes.get("userId");

            if (userId != null) {
                log.info("User disconnected via WebSocket: {}", userId);

                // Set status to offline in DB and broadcast to others
                // UserService.setUserOffline already handles the broadcasting
                userService.setUserOffline(userId);
            }
        }
    }
}
