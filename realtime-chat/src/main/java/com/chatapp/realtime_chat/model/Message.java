package com.chatapp.realtime_chat.model;

import jakarta.persistence.*;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;
import java.time.LocalDateTime;


@Entity
@Table(name = "messages")
@Data
@NoArgsConstructor
@AllArgsConstructor
public class Message {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne // many messages can be sent by one user
    @JoinColumn(name = "sender_id", nullable = false)
    private User sender;

    @ManyToOne
    @JoinColumn(name = "receiver_id", nullable = false)
    private User receiver;    // here we are trying to create relationship between user and message and each message will have a sender and receiver 

    @Column(length = 5000)
    private String content;

    @Column(length = 1024)
    private String imageUrl;

    @Enumerated(EnumType.STRING)
    private MessageType type = MessageType.TEXT; // default message type is TEXT

    private LocalDateTime timestamp;

    @Column(nullable = false)
    private boolean isRead = false; // default is unread

    @PrePersist
    protected void onCreate() {
        this.timestamp = LocalDateTime.now(); // set timestamp before persisting
    }
}
