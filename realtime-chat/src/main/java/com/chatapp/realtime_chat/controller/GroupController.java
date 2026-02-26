package com.chatapp.realtime_chat.controller;

import com.chatapp.realtime_chat.dto.GroupCreateRequest;
import com.chatapp.realtime_chat.dto.GroupDTO;
import com.chatapp.realtime_chat.dto.GroupMessageDTO;
import com.chatapp.realtime_chat.dto.GroupMessageRequest;
import com.chatapp.realtime_chat.model.MessageType;
import com.chatapp.realtime_chat.service.GroupService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.messaging.simp.SimpMessagingTemplate;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/groups")
public class GroupController {

    @Autowired
    private GroupService groupService;

    @Autowired
    private SimpMessagingTemplate messagingTemplate;

    @PostMapping
    public ResponseEntity<GroupDTO> createGroup(@RequestBody GroupCreateRequest request) {
        GroupDTO group = groupService.createGroup(request.getName(), request.getCreatorId(), request.getMemberIds());
        return ResponseEntity.ok(group);
    }

    @GetMapping("/user/{userId}")
    public ResponseEntity<List<GroupDTO>> getGroups(@PathVariable Long userId) {
        return ResponseEntity.ok(groupService.getGroupsForUser(userId));
    }

    @GetMapping("/{groupId}/messages")
    public ResponseEntity<List<GroupMessageDTO>> getMessages(
            @PathVariable Long groupId,
            @RequestParam("userId") Long userId) {
        return ResponseEntity.ok(groupService.getGroupMessages(groupId, userId));
    }

    @PostMapping("/{groupId}/messages")
    public ResponseEntity<GroupMessageDTO> sendMessage(
            @PathVariable Long groupId,
            @RequestBody GroupMessageRequest request) {
        MessageType type = request.getType() != null ? request.getType() : MessageType.TEXT;
        GroupMessageDTO message = groupService.sendGroupMessage(groupId, request.getSenderId(), request.getContent(), request.getImageUrl(), type);
        messagingTemplate.convertAndSend("/topic/groups." + groupId, message);
        return ResponseEntity.ok(message);
    }
}
