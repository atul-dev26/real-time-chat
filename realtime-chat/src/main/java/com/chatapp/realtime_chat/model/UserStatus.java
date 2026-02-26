package com.chatapp.realtime_chat.model;

public enum UserStatus {
    // we have used enum instead of class because we want fixed set of constants i.e 3 types of user status and this will prevent from stporing any other 
    OFFLINE,
    ONLINE,
    AWAY
}
