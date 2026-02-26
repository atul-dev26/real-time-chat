package com.chatapp.realtime_chat.service;

import com.chatapp.realtime_chat.dto.GroupDTO;
import com.chatapp.realtime_chat.dto.GroupMessageDTO;
import com.chatapp.realtime_chat.model.*;
import com.chatapp.realtime_chat.repository.ChatGroupRepository;
import com.chatapp.realtime_chat.repository.GroupMemberRepository;
import com.chatapp.realtime_chat.repository.GroupMessageRepository;
import com.chatapp.realtime_chat.repository.UserRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.ArrayList;
import java.util.List;
import java.util.stream.Collectors;

@Service
public class GroupService {

    @Autowired
    private ChatGroupRepository chatGroupRepository;

    @Autowired
    private GroupMemberRepository groupMemberRepository;

    @Autowired
    private GroupMessageRepository groupMessageRepository;

    @Autowired
    private UserRepository userRepository;

    @Autowired
    private FriendRequestService friendRequestService;


    @Transactional
    public GroupDTO createGroup(String name, Long creatorId, List<Long> memberIds) {
        if (name == null || name.trim().isEmpty()) {
            throw new RuntimeException("Group name is required");
        }
        User creator = userRepository.findById(creatorId)
                .orElseThrow(() -> new RuntimeException("Creator not found"));

        ChatGroup group = ChatGroup.builder()
                .name(name.trim())
                .createdBy(creator)
                .build();
        ChatGroup savedGroup = chatGroupRepository.save(group);

        List<GroupMember> members = new ArrayList<>();
        members.add(GroupMember.builder()
                .group(savedGroup)
                .user(creator)
                .role(GroupRole.ADMIN)
                .build());

        if (memberIds != null) {
            for (Long memberId : memberIds) {
                if (memberId == null || memberId.equals(creatorId)) continue;
                if (!friendRequestService.canChat(creatorId, memberId)) {
                    throw new RuntimeException("You can only add accepted contacts to a group");
                }
                User member = userRepository.findById(memberId)
                        .orElseThrow(() -> new RuntimeException("User not found"));
                members.add(GroupMember.builder()
                        .group(savedGroup)
                        .user(member)
                        .role(GroupRole.MEMBER)
                        .build());
            }
        }
        groupMemberRepository.saveAll(members);

        return toGroupDTO(savedGroup, members.size());
    }

    public List<GroupDTO> getGroupsForUser(Long userId) {
        return chatGroupRepository.findGroupsForUser(userId)
                .stream()
                .map(group -> toGroupDTO(group, (int) groupMemberRepository.countByGroupId(group.getId())))
                .collect(Collectors.toList());
    }

    public List<GroupMessageDTO> getGroupMessages(Long groupId, Long userId) {
        if (!isMember(groupId, userId)) {
            throw new RuntimeException("You are not a member of this group");
        }
        return groupMessageRepository.findByGroupIdOrderByTimestampAsc(groupId)
                .stream()
                .map(this::toGroupMessageDTO)
                .collect(Collectors.toList());
    }

    @Transactional
    public GroupMessageDTO sendGroupMessage(Long groupId, Long senderId, String content, String imageUrl, MessageType type) {
        if (!isMember(groupId, senderId)) {
            throw new RuntimeException("You are not a member of this group");
        }
        if ((content == null || content.trim().isEmpty()) && (imageUrl == null || imageUrl.trim().isEmpty())) {
            throw new RuntimeException("Message must include text or an image");
        }
        ChatGroup group = chatGroupRepository.findById(groupId)
                .orElseThrow(() -> new RuntimeException("Group not found"));
        User sender = userRepository.findById(senderId)
                .orElseThrow(() -> new RuntimeException("Sender not found"));

        MessageType resolvedType = type;
        if (resolvedType == null) {
            resolvedType = (imageUrl != null && !imageUrl.trim().isEmpty()) ? MessageType.IMAGE : MessageType.TEXT;
        }

        GroupMessage message = new GroupMessage();
        message.setGroup(group);
        message.setSender(sender);
        message.setContent(content);
        message.setImageUrl(imageUrl);
        message.setType(resolvedType);

        GroupMessage saved = groupMessageRepository.save(message);
        GroupMessageDTO dto = toGroupMessageDTO(saved);

        return dto;
    }

    private boolean isMember(Long groupId, Long userId) {
        return groupMemberRepository.findByGroupIdAndUserId(groupId, userId).isPresent();
    }

    private GroupDTO toGroupDTO(ChatGroup group, int memberCount) {
        GroupDTO dto = new GroupDTO();
        dto.setId(group.getId());
        dto.setName(group.getName());
        dto.setCreatedById(group.getCreatedBy().getId());
        dto.setCreatedByUsername(group.getCreatedBy().getUsername());
        dto.setMemberCount(memberCount);
        return dto;
    }

    private GroupMessageDTO toGroupMessageDTO(GroupMessage message) {
        GroupMessageDTO dto = new GroupMessageDTO();
        dto.setId(message.getId());
        dto.setGroupId(message.getGroup().getId());
        dto.setSenderId(message.getSender().getId());
        dto.setSenderUsername(message.getSender().getUsername());
        dto.setContent(message.getContent());
        dto.setImageUrl(message.getImageUrl());
        dto.setType(message.getType());
        dto.setTimestamp(message.getTimestamp());
        return dto;
    }
}
