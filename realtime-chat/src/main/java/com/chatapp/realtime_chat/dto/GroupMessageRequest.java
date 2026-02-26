package com.chatapp.realtime_chat.dto;

import com.chatapp.realtime_chat.model.MessageType;
import lombok.Data;

@Data
public class GroupMessageRequest {
    private Long senderId;
    private String content;
    private String imageUrl;
    private MessageType type;
}
