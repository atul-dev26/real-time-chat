
package com.chatapp.realtime_chat.controller;

import com.chatapp.realtime_chat.dto.UserDTO;
import com.chatapp.realtime_chat.service.UserService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.HttpStatus;
import org.springframework.http.HttpStatusCode;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/users")
public class UserController {

    @Autowired
    private UserService userService;

    // here we will create api endpoints for users
    @GetMapping("/all")
    public ResponseEntity<List<UserDTO>> getAllUsers() {
        List<UserDTO> users = userService.getAllUsers();
        return ResponseEntity.ok(users);
    }

    @GetMapping("/online")
    public ResponseEntity<List<UserDTO>> getOnlineUsers() {
        List<UserDTO> onlineUsers = userService.getOnlineUsers();
        return ResponseEntity.ok(onlineUsers); 
    }

    @PutMapping("/{userId}/online")
    public ResponseEntity<String> setUserOnline(@PathVariable Long userId) {
        userService.setUserOnline(userId);
        return ResponseEntity.ok("User is now online");
    }

    @PutMapping("/{userId}/offline")
    public ResponseEntity<String> setUserOffline(@PathVariable Long userId) {
        userService.setUserOffline(userId);
        return ResponseEntity.ok("User is now offline");
    }

    @PutMapping("/{userId}")
    public ResponseEntity<UserDTO> updateProfile(
            @PathVariable Long userId,
            @RequestBody UserDTO userUpdate) {
        UserDTO updatedUser = userService.updateProfile(userId, userUpdate.getFullName(),
                userUpdate.getProfilePicture());
        return ResponseEntity.ok(updatedUser);
    }

    @PutMapping("/{userId}/ping")
    public ResponseEntity<String> pingUser(@PathVariable Long userId) {
        userService.pingUser(userId);
        return ResponseEntity.ok("pong");
    }

    @GetMapping("/search")
    public ResponseEntity<List<UserDTO>> searchUsers(
            @RequestParam("query") String query,
            @RequestParam(value = "excludeUserId", required = false) Long excludeUserId) {
        return ResponseEntity.ok(userService.searchUsers(query, excludeUserId));
    }

    @GetMapping("/lookup/{username}")
    public ResponseEntity<List<UserDTO>> lookupUsers(
            @PathVariable("username") String username,
            @RequestParam(value = "excludeUserId", required = false) Long excludeUserId) {
        return ResponseEntity.ok(userService.searchUsers(username, excludeUserId));
    }
}
