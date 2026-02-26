package com.chatapp.realtime_chat.dto;

import lombok.Data;

import java.util.List;

@Data
public class GroupCreateRequest {
    private String name;
    private Long creatorId;
    private List<Long> memberIds;
}
