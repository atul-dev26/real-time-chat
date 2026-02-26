import { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { userService, messageService, requestService, uploadService } from '../../services/api';
import { connectWebSocket, sendPrivateMessage, sendTypingStatus, disconnectWebSocket } from '../../services/websocket';
import { useAuth } from '../../contexts/AuthContext';
import EmojiPicker from 'emoji-picker-react';
import './Chat.css';

const Chat = () => {
    const { currentUser: user, logout } = useAuth();
    const navigate = useNavigate();
    const resolveImageUrl = (url) => {
        if (!url) return '';
        return url.startsWith('http') ? url : `http://localhost:8080${url}`;
    };
    const [users, setUsers] = useState([]);
    const [selectedUser, setSelectedUser] = useState(null);
    const [messages, setMessages] = useState([]);
    const [newMessage, setNewMessage] = useState('');
    const [unreadCounts, setUnreadCounts] = useState({}); // {userId: count}
    const [searchQuery, setSearchQuery] = useState('');
    const [typingUsers, setTypingUsers] = useState({});
    const [pendingRequests, setPendingRequests] = useState(0);
    const [selectedImage, setSelectedImage] = useState(null);
    const [uploading, setUploading] = useState(false);
    const [showEmojiPicker, setShowEmojiPicker] = useState(false);
    const messagesEndRef = useRef(null);
    const selectedUserRef = useRef(null);
    const typingTimeoutRef = useRef(null);
    const lastTypingSentRef = useRef(0);
    const lastChatUserRef = useRef(null);

    // Update ref whenever selectedUser changes
    useEffect(() => {
        selectedUserRef.current = selectedUser;
    }, [selectedUser]);

    useEffect(() => {
        // Initial data fetch
        const fetchUsers = async () => {
            try {
                const [contacts, incomingRequests] = await Promise.all([
                    userService.getContacts(user.id),
                    requestService.getIncomingRequests(user.id)
                ]);
                const filteredUsers = contacts.filter(u => u.id !== user.id);
                setUsers(filteredUsers);
                const pendingCount = incomingRequests.filter(r => r.status === 'PENDING').length;
                setPendingRequests(pendingCount);

                // Fetch unread counts for each user
                const counts = {};
                for (const u of filteredUsers) {
                    const count = await messageService.getUnreadCountPerSender(user.id, u.id);
                    counts[u.id] = count;
                }
                setUnreadCounts(counts);
            } catch (err) {
                console.error('Failed to fetch users or unread counts', err);
            }
        };

        fetchUsers();
        const intervalId = setInterval(fetchUsers, 15000);

        // Connect to WebSocket
        connectWebSocket(
            user.id,
            (msg) => {
                // Handle incoming message - only add if it's from the currently selected user
                const currentSelected = selectedUserRef.current;

                if (msg.type === 'TYPING' || msg.type === 'STOP_TYPING') {
                    if (msg.senderId) {
                        setTypingUsers(prev => ({
                            ...prev,
                            [msg.senderId]: msg.type === 'TYPING'
                        }));
                    }
                    return;
                }

                if (msg.type === 'READ_RECEIPT') {
                    // Update message status
                    if (currentSelected && msg.receiverId === user.id && msg.senderId === currentSelected.id) {
                        // If I am receiving a read receipt from the user I am chatting with, update my messages
                        setMessages(prev => prev.map(m =>
                            m.senderId === user.id ? { ...m, isRead: true } : m
                        ));
                    }
                    return;
                }

                if (msg.type === 'FORCE_LOGOUT') {
                    logout();
                    navigate('/login');
                    alert(msg.content);
                    return;
                }

                if (currentSelected && (msg.senderId === currentSelected.id || msg.senderId === user.id)) {
                    setMessages(prev => {
                        // Prevent duplicates
                        if (msg.id && prev.some(m => m.id === msg.id)) return prev;
                        // Mark as read if we are viewing this chat
                        if (msg.senderId !== user.id) {
                            messageService.markAsRead(msg.id);
                        }
                        return [...prev, msg];
                    });
                } else {
                    // Increment unread count for the sender if NOT me and NOT currently selected
                    if (msg.senderId !== user.id) {
                        setUnreadCounts(prev => ({
                            ...prev,
                            [msg.senderId]: (prev[msg.senderId] || 0) + 1
                        }));
                    }
                }
            },
            (update) => {
                // Handle status updates (joined/left)
                if (update.type === 'JOIN') {
                    if (update.senderId === user.id) return;
                    setUsers(prevUsers => prevUsers.map(u =>
                        u.id === update.senderId ? { ...u, isOnline: true } : u
                    ));
                } else if (update.type === 'LEAVE') {
                    setUsers(prevUsers => prevUsers.map(u =>
                        u.id === update.senderId ? { ...u, isOnline: false } : u
                    ));
                    setTypingUsers(prev => ({
                        ...prev,
                        [update.senderId]: false
                    }));
                }
            }
        );

        return () => {
            clearInterval(intervalId);
            disconnectWebSocket(user.id, user.username);
        };
    }, [user]);

    useEffect(() => {
        // Fetch conversation when a user is selected
        if (selectedUser) {
            const fetchConversation = async () => {
                try {
                    const history = await messageService.getConversation(user.id, selectedUser.id);
                    setMessages(history);

                    // Mark as read in backend
                    await messageService.markConversationAsRead(user.id, selectedUser.id);

                    // Reset unread count locally
                    setUnreadCounts(prev => ({
                        ...prev,
                        [selectedUser.id]: 0
                    }));
                } catch (err) {
                    console.error('Failed to fetch conversation', err);
                }
            };
            fetchConversation();
        }
    }, [selectedUser, user.id]);

    useEffect(() => {
        const previous = lastChatUserRef.current;
        if (previous && previous.id !== selectedUser?.id) {
            sendTypingStatus({
                senderId: user.id,
                receiverId: previous.id,
                senderUsername: user.username,
                type: 'STOP_TYPING',
                timestamp: new Date().toISOString()
            });
        }
        lastChatUserRef.current = selectedUser;
        if (typingTimeoutRef.current) {
            clearTimeout(typingTimeoutRef.current);
            typingTimeoutRef.current = null;
        }
    }, [selectedUser, user.id, user.username]);

    useEffect(() => {
        // Scroll to bottom whenever messages change
        messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }, [messages]);

    const handleSendMessage = async (e) => {
        e.preventDefault();
        if (!selectedUser) return;
        if (!newMessage.trim() && !selectedImage) return;

        setUploading(true);
        try {
            let imageUrl = null;
            if (selectedImage) {
                const upload = await uploadService.uploadImage(selectedImage);
                imageUrl = upload.url;
            }

            const msgDTO = {
                senderId: user.id,
                receiverId: selectedUser.id,
                content: newMessage,
                imageUrl,
                type: imageUrl ? 'IMAGE' : 'TEXT',
                senderUsername: user.username,
                timestamp: new Date().toISOString()
            };

            sendPrivateMessage(msgDTO);
            sendTypingStatus({
                senderId: user.id,
                receiverId: selectedUser.id,
                senderUsername: user.username,
                type: 'STOP_TYPING',
                timestamp: new Date().toISOString()
            });
            setMessages(prev => [...prev, msgDTO]);
            setNewMessage('');
            setSelectedImage(null);
        } catch (err) {
            console.error('Failed to send message', err);
        } finally {
            setUploading(false);
        }
    };

    const handleInputChange = (e) => {
        const value = e.target.value;
        setNewMessage(value);

        if (!selectedUser) return;

        const now = Date.now();
        const shouldSendTyping = now - lastTypingSentRef.current > 1200;

        if (value.trim().length > 0) {
            if (shouldSendTyping) {
                sendTypingStatus({
                    senderId: user.id,
                    receiverId: selectedUser.id,
                    senderUsername: user.username,
                    type: 'TYPING',
                    timestamp: new Date().toISOString()
                });
                lastTypingSentRef.current = now;
            }

            if (typingTimeoutRef.current) clearTimeout(typingTimeoutRef.current);
            typingTimeoutRef.current = setTimeout(() => {
                sendTypingStatus({
                    senderId: user.id,
                    receiverId: selectedUser.id,
                    senderUsername: user.username,
                    type: 'STOP_TYPING',
                    timestamp: new Date().toISOString()
                });
                typingTimeoutRef.current = null;
            }, 1500);
        } else {
            if (typingTimeoutRef.current) {
                clearTimeout(typingTimeoutRef.current);
                typingTimeoutRef.current = null;
            }
            sendTypingStatus({
                senderId: user.id,
                receiverId: selectedUser.id,
                senderUsername: user.username,
                type: 'STOP_TYPING',
                timestamp: new Date().toISOString()
            });
        }
    };

    const handleEmojiClick = (emojiData) => {
        if (!emojiData?.emoji) return;
        setNewMessage(prev => prev + emojiData.emoji);
        setShowEmojiPicker(false);
    };

    const handleCloseChat = () => {
        if (selectedUser) {
            sendTypingStatus({
                senderId: user.id,
                receiverId: selectedUser.id,
                senderUsername: user.username,
                type: 'STOP_TYPING',
                timestamp: new Date().toISOString()
            });
        }
        setSelectedUser(null);
        setMessages([]);
    };

    const filteredUsers = users.filter(u =>
        u.username.toLowerCase().includes(searchQuery.toLowerCase()) ||
        (u.fullName && u.fullName.toLowerCase().includes(searchQuery.toLowerCase()))
    );

    return (
        <div className="chat-dashboard glass">
            <div className="chat-sidebar">
                <div className="sidebar-header">
                    <div className="user-profile">
                        <div className="avatar" onClick={() => navigate('/profile')} style={{ cursor: 'pointer' }}>
                            {user.profilePicture ? (
                                <img src={user.profilePicture} alt="Profile" style={{ width: '100%', height: '100%', borderRadius: '50%' }} />
                            ) : (
                                user.username.charAt(0).toUpperCase()
                            )}
                        </div>
                        <div className="user-info">
                            <h3 onClick={() => navigate('/profile')} style={{ cursor: 'pointer' }}>{user.fullName || user.username}</h3>
                            <p><span className="status-dot"></span>Online</p>
                        </div>
                    </div>
                    <div style={{ display: 'flex', gap: '8px', marginTop: '15px' }}>
                        <button className="action-btn" onClick={() => navigate('/discover')} style={{ flex: 1 }}>
                            Add Friend
                        </button>
                        <button className="action-btn with-badge" onClick={() => navigate('/notifications')} style={{ flex: 1 }}>
                            Requests
                            {pendingRequests > 0 && (
                                <span className="action-badge">
                                    {pendingRequests > 99 ? '99+' : pendingRequests}
                                </span>
                            )}
                        </button>
                        <button className="action-btn" onClick={() => navigate('/groups')} style={{ flex: 1 }}>
                            Groups
                        </button>
                    </div>
                    <div style={{ display: 'flex', gap: '8px', marginTop: '10px' }}>
                        <button className="logout-btn" onClick={() => navigate('/profile')} style={{ flex: 1, background: 'rgba(255,255,255,0.05)' }}>Profile</button>
                        <button className="logout-btn" onClick={logout} style={{ flex: 1 }}>Sign Out</button>
                    </div>
                </div>

                <div className="search-box">
                    <div className="input-wrapper" style={{ padding: '8px 15px', borderRadius: '15px' }}>
                        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" style={{ marginRight: '8px', opacity: 0.6 }}>
                            <circle cx="11" cy="11" r="8"></circle>
                            <line x1="21" y1="21" x2="16.65" y2="16.65"></line>
                        </svg>
                        <input
                            type="text"
                            placeholder="Search contacts..."
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                            style={{ padding: '5px 0', fontSize: '0.9rem' }}
                        />
                    </div>
                </div>

                <div className="user-list">
                    <p style={{ marginBottom: '15px', fontSize: '0.8rem', color: 'var(--text-secondary)' }}>CONVERSATIONS</p>
                    {filteredUsers.length > 0 ? (
                        filteredUsers.map(u => (
                        <div
                            key={u.id}
                            className={`user-item ${selectedUser?.id === u.id ? 'active' : ''}`}
                            onClick={() => setSelectedUser(u)}
                        >
                            <div className="avatar" style={{ width: '40px', height: '40px', fontSize: '1rem', background: u.isOnline ? 'linear-gradient(135deg, #10b981, #059669)' : 'rgba(255,255,255,0.1)' }}>
                                {u.profilePicture ? (
                                    <img src={u.profilePicture} alt={u.username} style={{ width: '100%', height: '100%', borderRadius: '50%' }} />
                                ) : (
                                    u.username.charAt(0).toUpperCase()
                                )}
                            </div>
                            <div className="user-info" style={{ marginLeft: '12px' }}>
                                <h4 style={{ fontSize: '0.95rem' }}>{u.username}</h4>
                                <p
                                    className={typingUsers[u.id] ? 'user-typing' : ''}
                                    style={{ fontSize: '0.8rem', color: typingUsers[u.id] ? 'var(--neu-accent)' : (u.isOnline ? '#10b981' : 'var(--text-secondary)') }}
                                >
                                    {typingUsers[u.id] ? 'Typing…' : (u.isOnline ? 'Online' : 'Offline')}
                                </p>
                            </div>
                            {unreadCounts[u.id] > 0 && (
                                <div className="unread-badge">
                                    {unreadCounts[u.id]}
                                </div>
                            )}
                        </div>
                        ))
                    ) : (
                        <div className="empty-contact">
                            No contacts yet. Use Add Friend to send a request.
                        </div>
                    )}
                </div>
            </div>

            <div className="chat-main">
                {selectedUser ? (
                    <>
                        <div className="chat-header">
                            <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                                <div className="avatar" style={{ width: '36px', height: '36px', fontSize: '1rem' }}>
                                    {selectedUser.profilePicture ? (
                                        <img src={selectedUser.profilePicture} alt={selectedUser.username} style={{ width: '100%', height: '100%', borderRadius: '50%' }} />
                                    ) : (
                                        selectedUser.username.charAt(0).toUpperCase()
                                    )}
                                </div>
                                <div>
                                    <h3 style={{ fontSize: '1rem' }}>{selectedUser.fullName || selectedUser.username}</h3>
                                    <p style={{ fontSize: '0.75rem', color: selectedUser.isOnline ? '#10b981' : 'var(--text-secondary)' }}>
                                        {selectedUser.isOnline ? 'Active now' : 'Last seen recently'}
                                    </p>
                                </div>
                            </div>
                            <button className="close-chat-btn" onClick={handleCloseChat} title="Close Chat">
                                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                    <line x1="18" y1="6" x2="6" y2="18"></line>
                                    <line x1="6" y1="6" x2="18" y2="18"></line>
                                </svg>
                            </button>
                        </div>

                        <div className="messages-container">
                            {messages.map((msg, idx) => (
                                <div
                                    key={idx}
                                    className={`message-bubble ${msg.senderId === user.id ? 'message-sent' : 'message-received'}`}
                                >
                                    {msg.imageUrl && (
                                        <img className="message-image" src={resolveImageUrl(msg.imageUrl)} alt="Attachment" />
                                    )}
                                    {msg.content && <div className="message-text">{msg.content}</div>}
                                    <span className="message-time">
                                        {new Date(msg.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                                        {msg.senderId === user.id && (
                                            <span className={`message-status ${msg.isRead ? 'read' : 'sent'}`}>
                                                {msg.isRead ? (
                                                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><polyline points="20 6 9 17 4 12"></polyline></svg>
                                                ) : (
                                                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><polyline points="20 6 9 17 4 12"></polyline></svg>
                                                )}
                                            </span>
                                        )}
                                    </span>
                                </div>
                            ))}
                            <div ref={messagesEndRef} />
                        </div>

                        {selectedUser && typingUsers[selectedUser.id] && (
                            <div className="typing-status-area">
                                <div className="typing-bubble">
                                    <span className="typing-label">{selectedUser.fullName || selectedUser.username} is typing</span>
                                    <span className="typing-dots">
                                        <span></span>
                                        <span></span>
                                        <span></span>
                                    </span>
                                </div>
                            </div>
                        )}

                        <form className="chat-input-area" onSubmit={handleSendMessage}>
                            {selectedImage && (
                                <div className="image-chip">
                                    <span>{selectedImage.name}</span>
                                    <button type="button" onClick={() => setSelectedImage(null)}>Remove</button>
                                </div>
                            )}
                            <div className="input-wrapper">
                                <label className="icon-btn" title="Attach image">
                                    <input
                                        type="file"
                                        accept="image/*"
                                        onChange={(e) => setSelectedImage(e.target.files?.[0] || null)}
                                    />
                                    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                        <path d="M21 15V7a2 2 0 0 0-2-2H5a2 2 0 0 0-2 2v8" />
                                        <path d="M16 5l-8 8 4 4 8-8" />
                                    </svg>
                                </label>
                                <button
                                    type="button"
                                    className="icon-btn"
                                    title="Add emoji"
                                    onClick={() => setShowEmojiPicker(prev => !prev)}
                                >
                                    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                        <circle cx="12" cy="12" r="10" />
                                        <path d="M8 14s1.5 2 4 2 4-2 4-2" />
                                        <line x1="9" y1="9" x2="9.01" y2="9" />
                                        <line x1="15" y1="9" x2="15.01" y2="9" />
                                    </svg>
                                </button>
                                <input
                                    type="text"
                                    placeholder="Type a message..."
                                    value={newMessage}
                                    onChange={handleInputChange}
                                />
                                <button type="submit" className="btn-primary send-btn" disabled={uploading}>
                                    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><line x1="22" y1="2" x2="11" y2="13"></line><polygon points="22 2 15 22 11 13 2 9 22 2"></polygon></svg>
                                </button>
                            </div>
                            {showEmojiPicker && (
                                <div className="emoji-popover">
                                    <EmojiPicker onEmojiClick={handleEmojiClick} />
                                </div>
                            )}
                        </form>
                    </>
                ) : (
                    <div className="empty-chat">
                        <div className="glass-card" style={{ padding: '40px', borderRadius: '30px' }}>
                            <svg width="60" height="60" viewBox="0 0 24 24" fill="none" stroke="var(--accent-primary)" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" style={{ marginBottom: '20px' }}><path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"></path></svg>
                            <h2>Select a contact</h2>
                            <p>Start a conversation with someone from your contact list.</p>
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
};

export default Chat;
