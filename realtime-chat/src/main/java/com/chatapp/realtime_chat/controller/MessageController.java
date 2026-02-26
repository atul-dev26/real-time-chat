package com.chatapp.realtime_chat.controller;

import com.chatapp.realtime_chat.dto.MessageDTO;
import com.chatapp.realtime_chat.model.MessageType;
import com.chatapp.realtime_chat.service.MessageService;
import jakarta.validation.Valid;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/messages")
public class MessageController {

    @Autowired
    private MessageService messageService;

    @PostMapping("/send")
    public ResponseEntity<MessageDTO> sendMessage(@Valid @RequestBody MessageDTO messageDTO) {
        MessageDTO message = messageService.sendMessage(
                messageDTO.getSenderId(),
                messageDTO.getReceiverId(),
                messageDTO.getContent(),
                messageDTO.getImageUrl(),
                messageDTO.getType() != null ? messageDTO.getType() : MessageType.TEXT);
        return ResponseEntity.ok(message);
    }

    @GetMapping("/conversation/{user1Id}/{user2Id}")
    public ResponseEntity<List<MessageDTO>> getConversation(@PathVariable Long user1Id, @PathVariable Long user2Id) {
        List<MessageDTO> messages = messageService.getConversation(user1Id, user2Id);
        return ResponseEntity.ok(messages);
    }

    @PutMapping("/{messageId}/read")
    public ResponseEntity<String> markAsRead(@PathVariable Long messageId) {
        messageService.markAsRead(messageId);
        return ResponseEntity.ok("Message marked as read");
    }

    @GetMapping("/unread/{userId}")
    public ResponseEntity<Long> getUnreadCount(@PathVariable Long userId) {
        long count = messageService.getUnreadCount(userId);
        return ResponseEntity.ok(count);
    }

    @GetMapping("/unread/{receiverId}/{senderId}")
    public ResponseEntity<Long> getUnreadCountFromSender(@PathVariable Long receiverId, @PathVariable Long senderId) {
        long count = messageService.getUnreadCountFromSender(receiverId, senderId);
        return ResponseEntity.ok(count);
    }

    @PutMapping("/read/{receiverId}/{senderId}")
    public ResponseEntity<String> markConversationAsRead(@PathVariable Long receiverId, @PathVariable Long senderId) {
        messageService.markConversationAsRead(receiverId, senderId);
        return ResponseEntity.ok("Conversation marked as read");
    }
}
