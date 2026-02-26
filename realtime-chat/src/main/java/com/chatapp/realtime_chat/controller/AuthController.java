package com.chatapp.realtime_chat.controller;

import com.chatapp.realtime_chat.dto.AuthResponse;
import com.chatapp.realtime_chat.dto.LoginRequest;
import com.chatapp.realtime_chat.dto.RegisterRequest;
import com.chatapp.realtime_chat.service.UserService;
import jakarta.validation.Valid;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

@RestController // it tells that this class is a controller and will handle HTTP requests and
                // will return json responses
@RequestMapping("/api/auth") // this is the base url for all the endpoints in this controller
public class AuthController {
    @Autowired
    private UserService userService;

    @PostMapping("/register") // this endpoint will handle user registration requests at /api/auth/register
    public ResponseEntity<AuthResponse> register(@Valid @RequestBody RegisterRequest request) {
        System.out.println("Processing registration for: " + request.getUsername());
        AuthResponse response = userService.register(request);
        return ResponseEntity.status(HttpStatus.CREATED).body(response);
    }

    @PostMapping("/login")
    public ResponseEntity<AuthResponse> login(@Valid @RequestBody LoginRequest request) {
        System.out.println("Processing login for: " + request.getUsernameOrEmail());
        AuthResponse response = userService.login(request);
        return ResponseEntity.ok(response);
    }

    @PostMapping("/logout/{userId}")
    public ResponseEntity<String> logout(@PathVariable Long userId) {
        System.out.println("Processing logout for user ID: " + userId);
        userService.logout(userId);
        return ResponseEntity.ok("Logged out successfully");
    }

}
