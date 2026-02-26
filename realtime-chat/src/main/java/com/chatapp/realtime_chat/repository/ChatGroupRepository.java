package com.chatapp.realtime_chat.repository;

import com.chatapp.realtime_chat.model.ChatGroup;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface ChatGroupRepository extends JpaRepository<ChatGroup, Long> {

    @Query("select distinct g from ChatGroup g join GroupMember gm on gm.group.id = g.id where gm.user.id = :userId")
    List<ChatGroup> findGroupsForUser(@Param("userId") Long userId);
}
