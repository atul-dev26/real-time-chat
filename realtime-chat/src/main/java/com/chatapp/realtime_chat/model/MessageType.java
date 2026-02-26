package com.chatapp.realtime_chat.model;

public enum MessageType {
    // using this type of enum will help frontend to easily identify the type of
    // message and render it accordingly
    TEXT,
    IMAGE,
    FILE,
    SYSTEM,
    JOIN,
    LEAVE,
    READ_RECEIPT,
    FORCE_LOGOUT,
    TYPING,
    STOP_TYPING
}
