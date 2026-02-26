import axios from 'axios';

const API_BASE_URL = 'http://localhost:8080/api';
const FILE_BASE_URL = API_BASE_URL.replace('/api', '');

const api = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Add a request interceptor to include the JWT token in every request
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

export const authService = {
  login: async (credentials) => {
    const response = await api.post('/auth/login', credentials);
    if (response.data.accessToken) {
      localStorage.setItem('token', response.data.accessToken);
      localStorage.setItem('user', JSON.stringify(response.data));
    }
    return response.data;
  },
  register: async (userData) => {
    const response = await api.post('/auth/register', userData);
    return response.data;
  },
  logout: async (userId) => {
    try {
      await api.post(`/auth/logout/${userId}`);
    } catch (error) {
      console.error('Logout API call failed:', error);
    }
    localStorage.removeItem('token');
    localStorage.removeItem('user');
  }
};

export const userService = {
  getAllUsers: async () => {
    const response = await api.get('/users/all');
    return response.data;
  },
  getContacts: async (userId) => {
    const response = await api.get(`/requests/contacts/${userId}`);
    return response.data;
  },
  getOnlineUsers: async () => {
    const response = await api.get('/users/online');
    return response.data;
  },
  searchUsers: async (query, excludeUserId) => {
    const safeQuery = encodeURIComponent(query);
    const response = await api.get(`/users/lookup/${safeQuery}`, {
      params: { excludeUserId }
    });
    return response.data;
  },
  ping: async (userId) => {
    const response = await api.put(`/users/${userId}/ping`);
    return response.data;
  },
  updateProfile: async (id, profileData) => {
    const response = await api.put(`/users/${id}`, profileData);
    return response.data;
  }
};

export const requestService = {
  sendRequest: async (senderId, receiverId) => {
    const response = await api.post('/requests', { senderId, receiverId });
    return response.data;
  },
  getIncomingRequests: async (userId) => {
    const response = await api.get(`/requests/incoming/${userId}`);
    return response.data;
  },
  getOutgoingRequests: async (userId) => {
    const response = await api.get(`/requests/outgoing/${userId}`);
    return response.data;
  },
  acceptRequest: async (requestId, userId) => {
    const response = await api.put(`/requests/${requestId}/accept`, { userId });
    return response.data;
  },
  rejectRequest: async (requestId, userId) => {
    const response = await api.put(`/requests/${requestId}/reject`, { userId });
    return response.data;
  }
};

export const groupService = {
  createGroup: async (name, creatorId, memberIds) => {
    const response = await api.post('/groups', { name, creatorId, memberIds });
    return response.data;
  },
  getGroups: async (userId) => {
    const response = await api.get(`/groups/user/${userId}`);
    return response.data;
  },
  getGroupMessages: async (groupId, userId) => {
    const response = await api.get(`/groups/${groupId}/messages`, {
      params: { userId }
    });
    return response.data;
  },
  sendGroupMessage: async (groupId, payload) => {
    const response = await api.post(`/groups/${groupId}/messages`, payload);
    return response.data;
  }
};

export const uploadService = {
  uploadImage: async (file) => {
    const formData = new FormData();
    formData.append('file', file);
    const response = await api.post('/uploads', formData, {
      headers: { 'Content-Type': 'multipart/form-data' }
    });
    const payload = response.data;
    if (payload?.url && !payload.url.startsWith('http')) {
      payload.url = `${FILE_BASE_URL}${payload.url}`;
    }
    return payload;
  }
};

export const messageService = {
  getConversation: async (user1Id, user2Id) => {
    const response = await api.get(`/messages/conversation/${user1Id}/${user2Id}`);
    return response.data;
  },
  markAsRead: async (messageId) => {
    const response = await api.put(`/messages/${messageId}/read`);
    return response.data;
  },
  getUnreadCountPerSender: async (receiverId, senderId) => {
    const response = await api.get(`/messages/unread/${receiverId}/${senderId}`);
    return response.data;
  },
  markConversationAsRead: async (receiverId, senderId) => {
    const response = await api.put(`/messages/read/${receiverId}/${senderId}`);
    return response.data;
  }
};

export default api;
