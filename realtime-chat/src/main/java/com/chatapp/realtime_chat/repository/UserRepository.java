package com.chatapp.realtime_chat.repository;

import com.chatapp.realtime_chat.model.User;
import com.chatapp.realtime_chat.model.UserStatus;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;
import java.util.List;
import java.util.Optional;


@Repository
public interface UserRepository extends JpaRepository<User, Long> {
    
    Optional<User> findByUsername(String username);
    
    Optional<User> findByEmail(String email);
    
    boolean existsByUsername(String username);
    
    boolean existsByEmail(String email);

    List<User> findByStatus(UserStatus status);

    List<User> findByUsernameContainingIgnoreCase(String username);

    List<User> findByStatusAndLastSeenBefore(UserStatus status, java.time.LocalDateTime lastSeen);

}


