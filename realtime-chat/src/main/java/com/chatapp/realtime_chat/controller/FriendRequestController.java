package com.chatapp.realtime_chat.controller;

import com.chatapp.realtime_chat.dto.FriendRequestActionRequest;
import com.chatapp.realtime_chat.dto.FriendRequestCreateRequest;
import com.chatapp.realtime_chat.dto.FriendRequestDTO;
import com.chatapp.realtime_chat.dto.UserDTO;
import com.chatapp.realtime_chat.service.FriendRequestService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/requests")
public class FriendRequestController {

    @Autowired
    private FriendRequestService friendRequestService;

    @PostMapping
    public ResponseEntity<FriendRequestDTO> sendRequest(@RequestBody FriendRequestCreateRequest request) {
        FriendRequestDTO response = friendRequestService.sendRequest(request.getSenderId(), request.getReceiverId());
        return ResponseEntity.ok(response);
    }

    @PutMapping("/{requestId}/accept")
    public ResponseEntity<FriendRequestDTO> acceptRequest(
            @PathVariable Long requestId,
            @RequestBody FriendRequestActionRequest actionRequest) {
        FriendRequestDTO response = friendRequestService.acceptRequest(requestId, actionRequest.getUserId());
        return ResponseEntity.ok(response);
    }

    @PutMapping("/{requestId}/reject")
    public ResponseEntity<FriendRequestDTO> rejectRequest(
            @PathVariable Long requestId,
            @RequestBody FriendRequestActionRequest actionRequest) {
        FriendRequestDTO response = friendRequestService.rejectRequest(requestId, actionRequest.getUserId());
        return ResponseEntity.ok(response);
    }

    @GetMapping("/incoming/{userId}")
    public ResponseEntity<List<FriendRequestDTO>> getIncoming(@PathVariable Long userId) {
        return ResponseEntity.ok(friendRequestService.getIncomingRequests(userId));
    }

    @GetMapping("/outgoing/{userId}")
    public ResponseEntity<List<FriendRequestDTO>> getOutgoing(@PathVariable Long userId) {
        return ResponseEntity.ok(friendRequestService.getOutgoingRequests(userId));
    }

    @GetMapping("/contacts/{userId}")
    public ResponseEntity<List<UserDTO>> getContacts(@PathVariable Long userId) {
        return ResponseEntity.ok(friendRequestService.getContacts(userId));
    }
}
