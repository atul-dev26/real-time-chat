package com.chatapp.realtime_chat.repository;

import com.chatapp.realtime_chat.model.FriendRequest;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface FriendRequestRepository extends JpaRepository<FriendRequest, Long> {

    @Query("select fr from FriendRequest fr where (fr.sender.id = :user1 and fr.receiver.id = :user2) or (fr.sender.id = :user2 and fr.receiver.id = :user1)")
    Optional<FriendRequest> findBetweenUsers(@Param("user1") Long user1, @Param("user2") Long user2);

    @Query("select case when count(fr) > 0 then true else false end from FriendRequest fr where fr.status = 'ACCEPTED' and ((fr.sender.id = :user1 and fr.receiver.id = :user2) or (fr.sender.id = :user2 and fr.receiver.id = :user1))")
    boolean existsAcceptedBetween(@Param("user1") Long user1, @Param("user2") Long user2);

    List<FriendRequest> findByReceiverIdOrderByCreatedAtDesc(Long receiverId);

    List<FriendRequest> findBySenderIdOrderByCreatedAtDesc(Long senderId);

    @Query("select fr from FriendRequest fr where fr.status = 'ACCEPTED' and (fr.sender.id = :userId or fr.receiver.id = :userId)")
    List<FriendRequest> findAcceptedByUserId(@Param("userId") Long userId);
}
