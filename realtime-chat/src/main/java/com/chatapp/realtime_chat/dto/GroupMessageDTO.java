package com.chatapp.realtime_chat.dto;

import com.chatapp.realtime_chat.model.MessageType;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDateTime;

@Data
@NoArgsConstructor
@AllArgsConstructor
public class GroupMessageDTO {
    private Long id;
    private Long groupId;
    private Long senderId;
    private String senderUsername;
    private String content;
    private String imageUrl;
    private MessageType type;
    private LocalDateTime timestamp;
}
