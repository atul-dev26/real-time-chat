import { createContext, useContext, useState, useEffect } from 'react';
import { authService, userService } from '../services/api';

const AuthContext = createContext();

export const useAuth = () => useContext(AuthContext);

export const AuthProvider = ({ children }) => {
    const [currentUser, setCurrentUser] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');
    const [darkMode, setDarkMode] = useState(() => {
        const saved = localStorage.getItem('darkMode');
        return saved ? JSON.parse(saved) : false;
    });

    useEffect(() => {
        const savedUser = localStorage.getItem('user');
        if (savedUser) {
            setCurrentUser(JSON.parse(savedUser));
        }
        setLoading(false);
    }, []);

    useEffect(() => {
        if (darkMode) {
            document.body.classList.add('dark-mode');
        } else {
            document.body.classList.remove('dark-mode');
        }
        localStorage.setItem('darkMode', JSON.stringify(darkMode));
    }, [darkMode]);

    useEffect(() => {
        if (!currentUser?.id) return;
        let isMounted = true;
        const ping = async () => {
            if (!isMounted) return;
            try {
                await userService.ping(currentUser.id);
            } catch (err) {
                // silent fail to avoid blocking UI
            }
        };
        ping();
        const intervalId = setInterval(ping, 15000);
        return () => {
            isMounted = false;
            clearInterval(intervalId);
        };
    }, [currentUser?.id]);

    const toggleDarkMode = () => setDarkMode(prev => !prev);

    const login = async (credentials) => {
        const user = await authService.login(credentials);
        setCurrentUser(user);
        return user;
    };

    const register = async (userData) => {
        return await authService.register(userData);
    };

    const logout = async () => {
        if (currentUser) {
            await authService.logout(currentUser.id);
        }
        setCurrentUser(null);
    };

    const updateUserProfile = async (user, profile) => {
        // profile contains { displayName, photoURL }
        // our backend expects { fullName, profilePicture }
        const updatedUser = await userService.updateProfile(user.id, {
            fullName: profile.displayName,
            profilePicture: profile.photoURL
        });

        // Update local state and storage
        const newUser = { ...currentUser, ...updatedUser };
        setCurrentUser(newUser);
        localStorage.setItem('user', JSON.stringify(newUser));
        return newUser;
    };

    const value = {
        currentUser,
        login,
        register,
        logout,
        updateUserProfile,
        darkMode,
        toggleDarkMode,
        error,
        setError
    };

    return (
        <AuthContext.Provider value={value}>
            {!loading && children}
        </AuthContext.Provider>
    );
};
