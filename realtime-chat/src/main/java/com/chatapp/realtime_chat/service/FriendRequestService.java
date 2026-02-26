package com.chatapp.realtime_chat.service;

import com.chatapp.realtime_chat.dto.FriendRequestDTO;
import com.chatapp.realtime_chat.dto.UserDTO;
import com.chatapp.realtime_chat.model.FriendRequest;
import com.chatapp.realtime_chat.model.FriendRequestStatus;
import com.chatapp.realtime_chat.model.User;
import com.chatapp.realtime_chat.model.UserStatus;
import com.chatapp.realtime_chat.repository.FriendRequestRepository;
import com.chatapp.realtime_chat.repository.UserRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;

import java.time.LocalDateTime;
import java.util.List;
import java.util.stream.Collectors;

@Service
public class FriendRequestService {

    @Autowired
    private FriendRequestRepository friendRequestRepository;

    @Autowired
    private UserRepository userRepository;

    public FriendRequestDTO sendRequest(Long senderId, Long receiverId) {
        if (senderId == null || receiverId == null) {
            throw new RuntimeException("Sender and receiver are required");
        }
        if (senderId.equals(receiverId)) {
            throw new RuntimeException("You cannot send a request to yourself");
        }

        User sender = userRepository.findById(senderId)
                .orElseThrow(() -> new RuntimeException("Sender not found"));
        User receiver = userRepository.findById(receiverId)
                .orElseThrow(() -> new RuntimeException("Receiver not found"));

        FriendRequest existing = friendRequestRepository.findBetweenUsers(senderId, receiverId).orElse(null);
        if (existing != null) {
            if (existing.getStatus() == FriendRequestStatus.PENDING) {
                if (existing.getSender().getId().equals(senderId)) {
                    throw new RuntimeException("Request already sent");
                }
                throw new RuntimeException("You already have a pending request from this user");
            }
            if (existing.getStatus() == FriendRequestStatus.ACCEPTED) {
                throw new RuntimeException("You are already connected");
            }
            if (existing.getStatus() == FriendRequestStatus.REJECTED) {
                existing.setSender(sender);
                existing.setReceiver(receiver);
                existing.setStatus(FriendRequestStatus.PENDING);
                existing.setRespondedAt(null);
                existing.setCreatedAt(LocalDateTime.now());
                return convertToDTO(friendRequestRepository.save(existing));
            }
        }

        FriendRequest request = FriendRequest.builder()
                .sender(sender)
                .receiver(receiver)
                .status(FriendRequestStatus.PENDING)
                .build();

        return convertToDTO(friendRequestRepository.save(request));
    }

    public FriendRequestDTO acceptRequest(Long requestId, Long receiverId) {
        FriendRequest request = friendRequestRepository.findById(requestId)
                .orElseThrow(() -> new RuntimeException("Request not found"));

        if (!request.getReceiver().getId().equals(receiverId)) {
            throw new RuntimeException("You can only accept requests sent to you");
        }
        if (request.getStatus() != FriendRequestStatus.PENDING) {
            throw new RuntimeException("Request is no longer pending");
        }

        request.setStatus(FriendRequestStatus.ACCEPTED);
        request.setRespondedAt(LocalDateTime.now());
        return convertToDTO(friendRequestRepository.save(request));
    }

    public FriendRequestDTO rejectRequest(Long requestId, Long receiverId) {
        FriendRequest request = friendRequestRepository.findById(requestId)
                .orElseThrow(() -> new RuntimeException("Request not found"));

        if (!request.getReceiver().getId().equals(receiverId)) {
            throw new RuntimeException("You can only reject requests sent to you");
        }
        if (request.getStatus() != FriendRequestStatus.PENDING) {
            throw new RuntimeException("Request is no longer pending");
        }

        request.setStatus(FriendRequestStatus.REJECTED);
        request.setRespondedAt(LocalDateTime.now());
        return convertToDTO(friendRequestRepository.save(request));
    }

    public List<FriendRequestDTO> getIncomingRequests(Long userId) {
        return friendRequestRepository.findByReceiverIdOrderByCreatedAtDesc(userId)
                .stream()
                .map(this::convertToDTO)
                .collect(Collectors.toList());
    }

    public List<FriendRequestDTO> getOutgoingRequests(Long userId) {
        return friendRequestRepository.findBySenderIdOrderByCreatedAtDesc(userId)
                .stream()
                .map(this::convertToDTO)
                .collect(Collectors.toList());
    }

    public List<UserDTO> getContacts(Long userId) {
        return friendRequestRepository.findAcceptedByUserId(userId)
                .stream()
                .map(request -> request.getSender().getId().equals(userId)
                        ? request.getReceiver()
                        : request.getSender())
                .map(this::convertToUserDTO)
                .collect(Collectors.toList());
    }

    public boolean canChat(Long user1Id, Long user2Id) {
        if (user1Id == null || user2Id == null) return false;
        if (user1Id.equals(user2Id)) return true;
        return friendRequestRepository.existsAcceptedBetween(user1Id, user2Id);
    }

    private FriendRequestDTO convertToDTO(FriendRequest request) {
        FriendRequestDTO dto = new FriendRequestDTO();
        dto.setId(request.getId());
        dto.setSenderId(request.getSender().getId());
        dto.setSenderUsername(request.getSender().getUsername());
        dto.setSenderFullName(request.getSender().getFullName());
        dto.setSenderProfilePicture(request.getSender().getProfilePicture());
        dto.setReceiverId(request.getReceiver().getId());
        dto.setReceiverUsername(request.getReceiver().getUsername());
        dto.setReceiverFullName(request.getReceiver().getFullName());
        dto.setReceiverProfilePicture(request.getReceiver().getProfilePicture());
        dto.setStatus(request.getStatus());
        dto.setCreatedAt(request.getCreatedAt());
        dto.setRespondedAt(request.getRespondedAt());
        return dto;
    }

    private UserDTO convertToUserDTO(User user) {
        UserDTO dto = new UserDTO();
        dto.setId(user.getId());
        dto.setUsername(user.getUsername());
        dto.setEmail(null);
        dto.setFullName(user.getFullName());
        dto.setProfilePicture(user.getProfilePicture());
        dto.setIsOnline(user.getStatus() == UserStatus.ONLINE);
        return dto;
    }
}
