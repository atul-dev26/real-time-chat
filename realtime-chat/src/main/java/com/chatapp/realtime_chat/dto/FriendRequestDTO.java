package com.chatapp.realtime_chat.dto;

import com.chatapp.realtime_chat.model.FriendRequestStatus;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDateTime;

@Data
@NoArgsConstructor
@AllArgsConstructor
public class FriendRequestDTO {
    private Long id;
    private Long senderId;
    private String senderUsername;
    private String senderFullName;
    private String senderProfilePicture;
    private Long receiverId;
    private String receiverUsername;
    private String receiverFullName;
    private String receiverProfilePicture;
    private FriendRequestStatus status;
    private LocalDateTime createdAt;
    private LocalDateTime respondedAt;
}
