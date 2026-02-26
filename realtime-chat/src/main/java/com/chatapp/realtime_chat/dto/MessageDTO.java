package com.chatapp.realtime_chat.dto;

import jakarta.validation.constraints.NotNull;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;
import java.time.LocalDateTime;
import com.chatapp.realtime_chat.model.MessageType;

@Data
@NoArgsConstructor
@AllArgsConstructor
public class MessageDTO {
    private Long id;

    @NotNull(message = "Sender ID is required")
    private Long senderId;

    private String senderUsername;

    @NotNull(message = "Receiver ID is required")
    private Long receiverId;

    private String receiverUsername;

    private String content;

    private String imageUrl;

    private MessageType type;
    private LocalDateTime timestamp;
    private Boolean isRead;
}
