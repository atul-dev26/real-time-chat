package com.chatapp.realtime_chat.repository;

import com.chatapp.realtime_chat.model.Message;
import com.chatapp.realtime_chat.model.User;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;
import java.util.List;

@Repository
public interface MessageRepository extends JpaRepository<Message, Long> {

    // Find all messages in a conversation between two users
    @Query("SELECT m FROM Message m WHERE (m.sender = ?1 AND m.receiver = ?2) OR (m.sender = ?2 AND m.receiver = ?1) ORDER BY m.timestamp ASC")
    List<Message> findConversationBetweenUsers(User user1, User user2);

    // Count unread messages for a specific user (FIXED with @Query)
    @Query("SELECT COUNT(m) FROM Message m WHERE m.receiver.id = :userId AND m.isRead = false")
    long countUnreadMessages(@Param("userId") Long userId);

    // Find all messages sent to a specific user
    List<Message> findByReceiverOrderByTimestampDesc(User receiver);

    // Find all unread messages for a specific user (FIXED: IsRead with capital R)
    List<Message> findByReceiverAndIsReadFalse(User receiver);

    // Count unread messages from a specific sender to a specific receiver
    long countByReceiverIdAndSenderIdAndIsReadFalse(Long receiverId, Long senderId);

    // Mark messages as read in a conversation
    @org.springframework.data.jpa.repository.Modifying
    @org.springframework.transaction.annotation.Transactional
    @Query("UPDATE Message m SET m.isRead = true WHERE m.receiver.id = :receiverId AND m.sender.id = :senderId AND m.isRead = false")
    void markConversationAsRead(@Param("receiverId") Long receiverId, @Param("senderId") Long senderId);
}
