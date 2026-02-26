import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { groupService, uploadService, userService } from '../../services/api';
import { connectWebSocket, disconnectWebSocket, sendGroupMessage, subscribeToGroup, unsubscribeFromGroup } from '../../services/websocket';
import { useAuth } from '../../contexts/AuthContext';
import EmojiPicker from 'emoji-picker-react';
import './Groups.css';

const Groups = () => {
    const { currentUser: user } = useAuth();
    const navigate = useNavigate();
    const [groups, setGroups] = useState([]);
    const [contacts, setContacts] = useState([]);
    const [selectedGroup, setSelectedGroup] = useState(null);
    const [messages, setMessages] = useState([]);
    const [groupName, setGroupName] = useState('');
    const [selectedMembers, setSelectedMembers] = useState([]);
    const [newMessage, setNewMessage] = useState('');
    const [selectedImage, setSelectedImage] = useState(null);
    const [uploading, setUploading] = useState(false);
    const [showEmojiPicker, setShowEmojiPicker] = useState(false);
    const [error, setError] = useState('');

    const resolveImageUrl = (url) => {
        if (!url) return '';
        return url.startsWith('http') ? url : `http://localhost:8080${url}`;
    };

    const loadGroups = async () => {
        try {
            const [groupData, contactData] = await Promise.all([
                groupService.getGroups(user.id),
                userService.getContacts(user.id)
            ]);
            setGroups(groupData);
            setContacts(contactData);
        } catch (err) {
            console.error('Failed to load groups', err);
        }
    };

    useEffect(() => {
        loadGroups();
        connectWebSocket(user.id, () => {}, () => {});
        return () => disconnectWebSocket(user.id, user.username);
    }, [user.id, user.username]);

    useEffect(() => {
        const loadMessages = async () => {
            if (!selectedGroup) return;
            try {
                const history = await groupService.getGroupMessages(selectedGroup.id, user.id);
                setMessages(history);
            } catch (err) {
                console.error('Failed to fetch group messages', err);
            }
        };

        if (selectedGroup) {
            loadMessages();
            subscribeToGroup(selectedGroup.id, (msg) => {
                setMessages(prev => {
                    if (msg.id && prev.some(m => m.id === msg.id)) return prev;
                    return [...prev, msg];
                });
            });
        }

        return () => {
            if (selectedGroup) {
                unsubscribeFromGroup(selectedGroup.id);
            }
        };
    }, [selectedGroup, user.id]);

    const handleCreateGroup = async (e) => {
        e.preventDefault();
        setError('');
        if (!groupName.trim()) {
            setError('Group name is required.');
            return;
        }
        try {
            await groupService.createGroup(groupName.trim(), user.id, selectedMembers);
            setGroupName('');
            setSelectedMembers([]);
            await loadGroups();
        } catch (err) {
            const msg = err.response?.data?.message || err.response?.data?.error || 'Failed to create group.';
            setError(msg);
        }
    };

    const handleSendMessage = async (e) => {
        e.preventDefault();
        if (!selectedGroup) return;
        if (!newMessage.trim() && !selectedImage) return;

        setUploading(true);
        try {
            let imageUrl = null;
            if (selectedImage) {
                const upload = await uploadService.uploadImage(selectedImage);
                imageUrl = upload.url;
            }

            const payload = {
                groupId: selectedGroup.id,
                senderId: user.id,
                senderUsername: user.username,
                content: newMessage,
                imageUrl,
                type: imageUrl ? 'IMAGE' : 'TEXT',
                timestamp: new Date().toISOString()
            };

            sendGroupMessage(payload);
            setNewMessage('');
            setSelectedImage(null);
        } catch (err) {
            console.error('Failed to send group message', err);
        } finally {
            setUploading(false);
        }
    };

    const handleEmojiClick = (emojiData) => {
        if (!emojiData?.emoji) return;
        setNewMessage(prev => prev + emojiData.emoji);
        setShowEmojiPicker(false);
    };

    return (
        <div className="groups-dashboard glass">
            <div className="groups-sidebar">
                <div className="groups-header">
                    <h3>Groups</h3>
                    <button className="groups-btn" onClick={() => navigate('/')}>Back</button>
                </div>

                <form className="group-create" onSubmit={handleCreateGroup}>
                    <input
                        type="text"
                        placeholder="Group name"
                        value={groupName}
                        onChange={(e) => setGroupName(e.target.value)}
                    />
                    <div className="member-list">
                        {contacts.map(contact => (
                            <label key={contact.id} className="member-item">
                                <input
                                    type="checkbox"
                                    checked={selectedMembers.includes(contact.id)}
                                    onChange={(e) => {
                                        if (e.target.checked) {
                                            setSelectedMembers(prev => [...prev, contact.id]);
                                        } else {
                                            setSelectedMembers(prev => prev.filter(id => id !== contact.id));
                                        }
                                    }}
                                />
                                <span>{contact.username}</span>
                            </label>
                        ))}
                    </div>
                    {error && <div className="groups-error">{error}</div>}
                    <button className="groups-btn primary" type="submit">Create Group</button>
                </form>

                <div className="group-list">
                    {groups.length === 0 ? (
                        <div className="groups-empty">No groups yet.</div>
                    ) : (
                        groups.map(group => (
                            <div
                                key={group.id}
                                className={`group-item ${selectedGroup?.id === group.id ? 'active' : ''}`}
                                onClick={() => setSelectedGroup(group)}
                            >
                                <h4>{group.name}</h4>
                                <p>{group.memberCount} members</p>
                            </div>
                        ))
                    )}
                </div>
            </div>

            <div className="groups-main">
                {selectedGroup ? (
                    <>
                        <div className="group-chat-header">
                            <div>
                                <h2>{selectedGroup.name}</h2>
                                <p>{selectedGroup.memberCount} members</p>
                            </div>
                        </div>

                        <div className="group-messages">
                            {messages.map((msg, idx) => (
                                <div key={idx} className={`group-message ${msg.senderId === user.id ? 'sent' : 'received'}`}>
                                    <div className="group-message-meta">{msg.senderUsername}</div>
                                    {msg.imageUrl && (
                                        <img className="group-image" src={resolveImageUrl(msg.imageUrl)} alt="Attachment" />
                                    )}
                                    {msg.content && <div className="group-text">{msg.content}</div>}
                                </div>
                            ))}
                        </div>

                        <form className="group-input" onSubmit={handleSendMessage}>
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
                                    placeholder="Write a message..."
                                    value={newMessage}
                                    onChange={(e) => setNewMessage(e.target.value)}
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
                    <div className="groups-empty-state">
                        <h2>Select a group</h2>
                        <p>Create a group or select one to start chatting.</p>
                    </div>
                )}
            </div>
        </div>
    );
};

export default Groups;
