package com.chatapp.realtime_chat.dto;

import lombok.Data;

@Data
public class FriendRequestCreateRequest {
    private Long senderId;
    private Long receiverId;
}
