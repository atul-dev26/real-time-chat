import SockJS from 'sockjs-client';
import Stomp from 'stompjs';

let stompClient = null;
const groupSubscriptions = new Map();

export const connectWebSocket = (userId, onMessageReceived, onStatusUpdate) => {
    const socket = new SockJS('http://localhost:8080/ws');
    stompClient = Stomp.over(socket);

    // Disable logging for a cleaner console
    stompClient.debug = null;

    stompClient.connect({}, () => {
        console.log('Connected to WebSocket - Setting up subscriptions');

        if (!stompClient || !stompClient.connected) {
            console.error('WebSocket connection lost during setup');
            return;
        }

        // Subscribe to private messages on a specific topic
        try {
            stompClient.subscribe(`/topic/messages.${userId}`, (payload) => {
                const message = JSON.parse(payload.body);
                onMessageReceived(message);
            });

            // Subscribe to public updates (joins, leaves, etc)
            stompClient.subscribe('/topic/public', (payload) => {
                const update = JSON.parse(payload.body);
                onStatusUpdate(update);
            });

            console.log('Subscriptions successful');
        } catch (subError) {
            console.error('Subscription error:', subError);
        }

        // Notify server that user is online
        const userJson = localStorage.getItem('user');
        if (userJson) {
            const user = JSON.parse(userJson);
            stompClient.send("/app/chat.addUser", {}, JSON.stringify({
                senderId: userId,
                senderUsername: user.username,
                type: 'JOIN'
            }));
        }
    }, (error) => {
        console.error('WebSocket Connection Error:', error);
    });
};

export const sendPrivateMessage = (messageDTO) => {
    if (stompClient && stompClient.connected) {
        stompClient.send("/app/chat.sendPrivateMessage", {}, JSON.stringify(messageDTO));
    } else {
        console.error('Cannot send message: WebSocket not connected');
    }
};

export const sendGroupMessage = (messageDTO) => {
    if (stompClient && stompClient.connected) {
        stompClient.send("/app/chat.sendGroupMessage", {}, JSON.stringify(messageDTO));
    } else {
        console.error('Cannot send group message: WebSocket not connected');
    }
};

export const sendTypingStatus = (messageDTO) => {
    if (stompClient && stompClient.connected) {
        stompClient.send("/app/chat.typing", {}, JSON.stringify(messageDTO));
    }
};

export const subscribeToGroup = (groupId, onGroupMessage) => {
    if (!stompClient || !stompClient.connected) return;
    if (groupSubscriptions.has(groupId)) return;
    const subscription = stompClient.subscribe(`/topic/groups.${groupId}`, (payload) => {
        const message = JSON.parse(payload.body);
        onGroupMessage(message);
    });
    groupSubscriptions.set(groupId, subscription);
};

export const unsubscribeFromGroup = (groupId) => {
    const subscription = groupSubscriptions.get(groupId);
    if (subscription) {
        subscription.unsubscribe();
        groupSubscriptions.delete(groupId);
    }
};

export const disconnectWebSocket = (userId, username) => {
    if (stompClient && stompClient.connected) {
        stompClient.send("/app/chat.removeUser", {}, JSON.stringify({
            senderId: userId,
            senderUsername: username,
            type: 'LEAVE'
        }));
        groupSubscriptions.forEach((subscription) => subscription.unsubscribe());
        groupSubscriptions.clear();
        stompClient.disconnect();
    }
};
