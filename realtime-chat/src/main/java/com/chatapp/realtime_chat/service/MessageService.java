package com.chatapp.realtime_chat.service;

import com.chatapp.realtime_chat.dto.MessageDTO;
import com.chatapp.realtime_chat.model.Message;
import com.chatapp.realtime_chat.model.MessageType;
import com.chatapp.realtime_chat.model.User;
import com.chatapp.realtime_chat.repository.MessageRepository;
import com.chatapp.realtime_chat.repository.UserRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;
import java.util.List;
import java.util.stream.Collectors;

@Service
public class MessageService {

    @Autowired
    private MessageRepository messageRepository; // here we injected message repository to interact with database like
                                                 // save and retrieve messages

    @Autowired
    private org.springframework.messaging.simp.SimpMessagingTemplate messagingTemplate;

    @Autowired
    private UserRepository userRepository;

    @Autowired
    private FriendRequestService friendRequestService;

    public MessageDTO sendMessage(Long senderId, Long receiverId, String content, String imageUrl, MessageType type) {

        // this finds the sender from databse
        User sender = userRepository.findById(senderId).orElseThrow(() -> new RuntimeException("Sender not found"));

        // this finds the receiver from database
        User receiver = userRepository.findById(receiverId)
                .orElseThrow(() -> new RuntimeException("Receiver not found"));

        if (!friendRequestService.canChat(senderId, receiverId)) {
            throw new RuntimeException("Chat is only available after request acceptance");
        }

        if ((content == null || content.trim().isEmpty()) && (imageUrl == null || imageUrl.trim().isEmpty())) {
            throw new RuntimeException("Message must include text or an image");
        }

        MessageType resolvedType = type;
        if (resolvedType == null) {
            resolvedType = (imageUrl != null && !imageUrl.trim().isEmpty()) ? MessageType.IMAGE : MessageType.TEXT;
        }

        // this is to create a new message
        Message message = new Message();
        message.setSender(sender);
        message.setReceiver(receiver);
        message.setContent(content);
        message.setImageUrl(imageUrl);
        message.setType(resolvedType);
        message.setRead(false); // when message is sent its unread by default

        Message savedMessage = messageRepository.save(message); // save message to database

        // convert saved message to MessageDTO
        MessageDTO messageDTO = convertToDTO(savedMessage);

        // Send to receiver via WebSocket
        messagingTemplate.convertAndSend("/topic/messages." + receiverId, messageDTO);

        return messageDTO;
    }

    private MessageDTO convertToDTO(Message message) {
        MessageDTO dto = new MessageDTO();
        dto.setId(message.getId());
        dto.setSenderId(message.getSender().getId()); // Keep as Long
        dto.setSenderUsername(message.getSender().getUsername());
        dto.setReceiverId(message.getReceiver().getId());
        dto.setReceiverUsername(message.getReceiver().getUsername());
        dto.setContent(message.getContent());
        dto.setImageUrl(message.getImageUrl());
        dto.setType(message.getType());
        dto.setTimestamp(message.getTimestamp());
        dto.setIsRead(message.isRead());
        return dto;
    }

    public List<MessageDTO> getConversation(Long user1Id, Long user2Id) {

        // this mainly gets all the meesages between two users
        User user1 = userRepository.findById(user1Id).orElseThrow(() -> new RuntimeException("User 1 not found"));
        User user2 = userRepository.findById(user2Id).orElseThrow(() -> new RuntimeException("User 2 not found"));

        if (!friendRequestService.canChat(user1Id, user2Id)) {
            throw new RuntimeException("Chat is only available after request acceptance");
        }

        List<Message> messages = messageRepository.findConversationBetweenUsers(user1, user2);

        // then convert each meessage to messagedto
        return messages.stream().map(this::convertToDTO).collect(Collectors.toList()); // here messages will be showed
                                                                                       // in chronlogically order afer
                                                                                       // converting into dto format
    }

    public void markAsRead(Long messageId) {

        // this method gets the meesage by id from databse and set its isread field to
        // true and updates the databse settings
        Message message = messageRepository.findById(messageId)
                .orElseThrow(() -> new RuntimeException("Message not found"));

        if (!message.isRead()) {
            message.setRead(true);
            messageRepository.save(message);

            // Notify sender that message was read
            MessageDTO readReceipt = new MessageDTO();
            readReceipt.setSenderId(message.getReceiver().getId()); // The reader
            readReceipt.setReceiverId(message.getSender().getId()); // The original sender
            readReceipt.setType(MessageType.READ_RECEIPT);
            readReceipt.setId(message.getId());

            messagingTemplate.convertAndSend("/topic/messages." + message.getSender().getId(), readReceipt);
        }
    }

    public long getUnreadCount(Long userId) {
        return messageRepository.countUnreadMessages(userId);
    }

    public long getUnreadCountFromSender(Long receiverId, Long senderId) {
        return messageRepository.countByReceiverIdAndSenderIdAndIsReadFalse(receiverId, senderId);
    }

    public void markConversationAsRead(Long receiverId, Long senderId) {
        messageRepository.markConversationAsRead(receiverId, senderId);

        // Notify the original sender (senderId) that the receiver (receiverId) read
        // their messages
        MessageDTO readReceipt = new MessageDTO();
        readReceipt.setSenderId(receiverId); // The reader
        readReceipt.setReceiverId(senderId); // The original sender
        readReceipt.setType(MessageType.READ_RECEIPT);

        messagingTemplate.convertAndSend("/topic/messages." + senderId, readReceipt);
    }

}
