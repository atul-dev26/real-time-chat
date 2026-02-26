package com.chatapp.realtime_chat.dto;

import jakarta.validation.constraints.NotBlank;
import lombok.Data;

@Data
public class LoginRequest {
    @NotBlank(message = "Username or Email is required") // user can login with either username or email
    private String usernameOrEmail;

    @NotBlank(message = "Password is required")
    private String password;

}
