package com.chatapp.realtime_chat.controller;

import com.chatapp.realtime_chat.dto.MessageDTO;
import com.chatapp.realtime_chat.dto.GroupMessageDTO;
import com.chatapp.realtime_chat.service.MessageService;
import com.chatapp.realtime_chat.service.UserService;
import com.chatapp.realtime_chat.service.GroupService;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.messaging.handler.annotation.MessageMapping;
import org.springframework.messaging.simp.SimpMessageHeaderAccessor;
import org.springframework.messaging.simp.SimpMessagingTemplate;
import org.springframework.stereotype.Controller;

@Controller
public class WebSocketController {

    @Autowired
    private UserService userService;

    @Autowired
    private MessageService messageService;

    @Autowired
    private SimpMessagingTemplate messagingTemplate;

    @Autowired
    private GroupService groupService;

    @MessageMapping("/chat.sendPrivateMessage")
    public void sendPrivateMessage(MessageDTO messageDTO) {
        // Save message to database and send to receiver
        // Note: MessageService.sendMessage already calls
        // messagingTemplate.convertAndSend
        messageService.sendMessage(
                messageDTO.getSenderId(),
                messageDTO.getReceiverId(),
                messageDTO.getContent(),
                messageDTO.getImageUrl(),
                messageDTO.getType());
    }

    @MessageMapping("/chat.addUser")
    public void addUser(MessageDTO messageDTO, SimpMessageHeaderAccessor headerAccessor) {
        // Add user in web socket session
        if (headerAccessor.getSessionAttributes() != null) {
            headerAccessor.getSessionAttributes().put("userId", messageDTO.getSenderId());
            headerAccessor.getSessionAttributes().put("username", messageDTO.getSenderUsername());
        }

        // Set user online - UserService.setUserOnline handles the broadcasting
        userService.setUserOnline(messageDTO.getSenderId());
    }

    @MessageMapping("/chat.removeUser")
    public void removeUser(MessageDTO messageDTO) {
        // Set user offline - UserService.setUserOffline handles the broadcasting
        userService.setUserOffline(messageDTO.getSenderId());
    }

    @MessageMapping("/chat.typing")
    public void typingStatus(MessageDTO messageDTO) {
        // Forward typing status to the receiver without persisting
        if (messageDTO.getReceiverId() != null) {
            messagingTemplate.convertAndSend(
                    "/topic/messages." + messageDTO.getReceiverId(),
                    messageDTO);
        }
    }

    @MessageMapping("/chat.sendGroupMessage")
    public void sendGroupMessage(GroupMessageDTO messageDTO) {
        GroupMessageDTO saved = groupService.sendGroupMessage(
                messageDTO.getGroupId(),
                messageDTO.getSenderId(),
                messageDTO.getContent(),
                messageDTO.getImageUrl(),
                messageDTO.getType());
        messagingTemplate.convertAndSend("/topic/groups." + messageDTO.getGroupId(), saved);
    }
}
