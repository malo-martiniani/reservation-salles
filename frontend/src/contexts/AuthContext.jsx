import { createContext, useState, useEffect } from 'react';
import { authService } from '../services/api.js';

export const AuthContext = createContext(null);

function decodeTokenPayload(token) {
    try {
        const payloadBase64 = token.split('.')[1];
        if (!payloadBase64) return null;
        const normalized = payloadBase64.replace(/-/g, '+').replace(/_/g, '/');
        const payload = JSON.parse(window.atob(normalized));
        return payload;
    } catch {
        return null;
    }
}

export function AuthProvider({ children }) {
    const [user, setUser] = useState(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const token = localStorage.getItem('token');
        if (!token) {
            setLoading(false);
            return;
        }

        const payload = decodeTokenPayload(token);
        if (!payload?.id || !payload?.email) {
            localStorage.removeItem('token');
            setLoading(false);
            return;
        }

        const isExpired = payload.exp ? payload.exp * 1000 <= Date.now() : true;
        if (isExpired) {
            localStorage.removeItem('token');
            setLoading(false);
            return;
        }

        setUser({ id: payload.id, email: payload.email });
        setLoading(false);
    }, []);

    const login = async (email, password) => {
        const data = await authService.login(email, password);
        localStorage.setItem('token', data.token);
        setUser(data.user);
        return data;
    };

    const register = async (userData) => {
        const data = await authService.register(userData);
        localStorage.setItem('token', data.token);
        setUser(data.user);
        return data;
    };

    const logout = () => {
        localStorage.removeItem('token');
        setUser(null);
    };

    return (
        <AuthContext.Provider
            value={{
                user,
                loading,
                isAuthenticated: !!user,
                login,
                register,
                logout,
            }}
        >
            {children}
        </AuthContext.Provider>
    );
}