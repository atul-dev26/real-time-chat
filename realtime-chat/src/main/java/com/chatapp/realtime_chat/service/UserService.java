package com.chatapp.realtime_chat.service;

import com.chatapp.realtime_chat.dto.AuthResponse;
import com.chatapp.realtime_chat.dto.LoginRequest;
import com.chatapp.realtime_chat.dto.MessageDTO;
import com.chatapp.realtime_chat.dto.RegisterRequest;
import com.chatapp.realtime_chat.model.MessageType;
import com.chatapp.realtime_chat.model.User;
import com.chatapp.realtime_chat.model.UserStatus;
import com.chatapp.realtime_chat.repository.UserRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.security.authentication.AuthenticationManager;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.messaging.simp.SimpMessagingTemplate;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.util.HashMap;
import java.util.Map;
import java.util.UUID;
import java.util.Optional;
import com.chatapp.realtime_chat.dto.UserDTO;
import java.util.List;
import java.util.stream.Collectors;
import org.springframework.scheduling.annotation.Scheduled;

@Service
public class UserService {
    @Autowired
    private UserRepository userRepository;

    @Autowired
    private PasswordEncoder passwordEncoder;

    @Autowired
    private JwtService jwtService;

    @Autowired
    private AuthenticationManager authenticationManager;

    @Autowired
    private SimpMessagingTemplate messagingTemplate;

    public AuthResponse register(RegisterRequest request) {
        if (userRepository.findByUsername(request.getUsername()).isPresent()) {
            throw new RuntimeException("Username already exists");
        }

        if (userRepository.findByEmail(request.getEmail()).isPresent()) {
            throw new RuntimeException("Email already exists");
        }

        User user = User.builder()
                .username(request.getUsername())
                .email(request.getEmail())
                .fullName(request.getFullName())
                .password(passwordEncoder.encode(request.getPassword()))
                .status(UserStatus.OFFLINE)
                .build();

        String sessionId = UUID.randomUUID().toString();
        user.setCurrentSessionId(sessionId);

        User savedUser = userRepository.save(user);

        Map<String, Object> claims = new HashMap<>();
        claims.put("sid", sessionId);

        String jwtToken = jwtService.generateToken(claims, savedUser);

        return AuthResponse.builder()
                .accessToken(jwtToken)
                .id(savedUser.getId())
                .username(savedUser.getUsername())
                .email(savedUser.getEmail())
                .fullName(savedUser.getFullName())
                .profilePicture(savedUser.getProfilePicture())
                .build();
    }

    public AuthResponse login(LoginRequest request) {
        // Find user first to get the correct username for authentication
        Optional<User> userOptional = userRepository.findByUsername(request.getUsernameOrEmail());
        if (userOptional.isEmpty()) {
            userOptional = userRepository.findByEmail(request.getUsernameOrEmail());
        }

        User user = userOptional
                .orElseThrow(() -> new RuntimeException("User not found: " + request.getUsernameOrEmail()));

        authenticationManager.authenticate(
                new UsernamePasswordAuthenticationToken(
                        user.getUsername(),
                        request.getPassword()));

        // Generate new session ID
        String sessionId = UUID.randomUUID().toString();

        // 1. Notify OLD session to logout (Before saving the new session ID,
        // technically the old session is still valid for this brief moment,
        // but we want to tell the SPECIFIC USER topic)
        // Actually, we can just send to the user's private channel.
        // The frontend subscribes to /topic/messages.{userId}

        MessageDTO logoutMessage = new MessageDTO();
        logoutMessage.setType(MessageType.FORCE_LOGOUT);
        logoutMessage.setContent("Logged out due to login on another device");
        logoutMessage.setReceiverId(user.getId());

        // We broadcast this BEFORE we change the session ID?
        // No, it doesn't matter, the websocket connection is already open.
        messagingTemplate.convertAndSend("/topic/messages." + user.getId(), logoutMessage);

        user.setCurrentSessionId(sessionId);
        user.setStatus(UserStatus.ONLINE);
        user.setLastSeen(LocalDateTime.now());
        userRepository.save(user);

        Map<String, Object> claims = new HashMap<>();
        claims.put("sid", sessionId);

        String jwtToken = jwtService.generateToken(claims, user);

        return AuthResponse.builder()
                .accessToken(jwtToken)
                .id(user.getId())
                .username(user.getUsername())
                .email(user.getEmail())
                .fullName(user.getFullName())
                .profilePicture(user.getProfilePicture())
                .build();
    }

    public List<UserDTO> getAllUsers() {
        List<User> users = userRepository.findAll();
        return users.stream()
                .map(this::convertToDTO)
                .collect(Collectors.toList());
    }

    public List<UserDTO> getOnlineUsers() {
        List<User> onlineUsers = userRepository.findByStatus(UserStatus.ONLINE);
        return onlineUsers.stream()
                .map(this::convertToDTO)
                .collect(Collectors.toList());
    }

    public List<UserDTO> searchUsers(String query, Long excludeUserId) {
        if (query == null || query.trim().isEmpty()) {
            return List.of();
        }
        List<User> users = userRepository.findByUsernameContainingIgnoreCase(query.trim());
        return users.stream()
                .filter(user -> excludeUserId == null || !user.getId().equals(excludeUserId))
                .map(user -> {
                    UserDTO dto = convertToDTO(user);
                    dto.setEmail(null);
                    return dto;
                })
                .collect(Collectors.toList());
    }

    @Transactional
    public void setUserOnline(Long userId) {
        User user = userRepository.findById(userId)
                .orElseThrow(() -> new RuntimeException("User not found"));

        user.setStatus(UserStatus.ONLINE);
        user.setLastSeen(LocalDateTime.now());
        userRepository.save(user);

        // Broadcast status change to all clients
        MessageDTO statusUpdate = new MessageDTO();
        statusUpdate.setType(MessageType.JOIN);
        statusUpdate.setSenderId(userId);
        statusUpdate.setSenderUsername(user.getUsername());
        statusUpdate.setContent(user.getUsername() + " is now online");
        messagingTemplate.convertAndSend("/topic/public", statusUpdate);
    }

    @Transactional
    public void setUserOffline(Long userId) {
        User user = userRepository.findById(userId)
                .orElseThrow(() -> new RuntimeException("User not found"));

        user.setStatus(UserStatus.OFFLINE);
        user.setLastSeen(LocalDateTime.now());
        userRepository.save(user);

        // Broadcast status change to all clients
        MessageDTO statusUpdate = new MessageDTO();
        statusUpdate.setType(MessageType.LEAVE);
        statusUpdate.setSenderId(userId);
        statusUpdate.setSenderUsername(user.getUsername());
        statusUpdate.setContent(user.getUsername() + " went offline");
        messagingTemplate.convertAndSend("/topic/public", statusUpdate);
    }

    @Transactional
    public void pingUser(Long userId) {
        User user = userRepository.findById(userId)
                .orElseThrow(() -> new RuntimeException("User not found"));

        boolean wasOffline = user.getStatus() != UserStatus.ONLINE;
        user.setStatus(UserStatus.ONLINE);
        user.setLastSeen(LocalDateTime.now());
        userRepository.save(user);

        if (wasOffline) {
            MessageDTO statusUpdate = new MessageDTO();
            statusUpdate.setType(MessageType.JOIN);
            statusUpdate.setSenderId(userId);
            statusUpdate.setSenderUsername(user.getUsername());
            statusUpdate.setContent(user.getUsername() + " is now online");
            messagingTemplate.convertAndSend("/topic/public", statusUpdate);
        }
    }

    @Transactional
    public void markInactiveUsersOffline(LocalDateTime cutoff) {
        List<User> inactiveUsers = userRepository.findByStatusAndLastSeenBefore(UserStatus.ONLINE, cutoff);
        for (User user : inactiveUsers) {
            user.setStatus(UserStatus.OFFLINE);
            user.setLastSeen(LocalDateTime.now());
            userRepository.save(user);

            MessageDTO statusUpdate = new MessageDTO();
            statusUpdate.setType(MessageType.LEAVE);
            statusUpdate.setSenderId(user.getId());
            statusUpdate.setSenderUsername(user.getUsername());
            statusUpdate.setContent(user.getUsername() + " went offline");
            messagingTemplate.convertAndSend("/topic/public", statusUpdate);
        }
    }

    public UserDTO updateProfile(Long userId, String fullName, String profilePicture) {
        User user = userRepository.findById(userId)
                .orElseThrow(() -> new RuntimeException("User not found"));

        if (fullName != null)
            user.setFullName(fullName);
        if (profilePicture != null)
            user.setProfilePicture(profilePicture);

        User savedUser = userRepository.save(user);
        return convertToDTO(savedUser);
    }

    @Transactional
    public void logout(Long userId) {
        User user = userRepository.findById(userId)
                .orElseThrow(() -> new RuntimeException("User not found"));

        user.setCurrentSessionId(null); // Clear session
        user.setStatus(UserStatus.OFFLINE);
        user.setLastSeen(LocalDateTime.now());
        userRepository.save(user);

        // Broadcast status change to all clients
        MessageDTO statusUpdate = new MessageDTO();
        statusUpdate.setType(MessageType.LEAVE);
        statusUpdate.setSenderId(userId);
        statusUpdate.setSenderUsername(user.getUsername());
        statusUpdate.setContent(user.getUsername() + " logged out");
        messagingTemplate.convertAndSend("/topic/public", statusUpdate);
    }

    @Scheduled(fixedDelay = 15000)
    public void sweepInactiveUsers() {
        LocalDateTime cutoff = LocalDateTime.now().minusSeconds(30);
        markInactiveUsersOffline(cutoff);
    }

    private UserDTO convertToDTO(User user) {
        UserDTO dto = new UserDTO();
        dto.setId(user.getId());
        dto.setUsername(user.getUsername());
        dto.setEmail(user.getEmail());
        dto.setFullName(user.getFullName());
        dto.setProfilePicture(user.getProfilePicture());
        dto.setIsOnline(user.getStatus() == UserStatus.ONLINE);
        return dto;
    }
}
