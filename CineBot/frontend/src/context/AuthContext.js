import React, { createContext, useState, useEffect, useCallback } from 'react';

const AuthContext = createContext();

export const AuthProvider = ({ children }) => {
    const [user, setUser] = useState(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        try {
            // Check if the user is already logged in 
            const storedUser = localStorage.getItem('user');
            if (storedUser && storedUser !== "undefined") {
                setUser(JSON.parse(storedUser));
            }
        } catch (error) {
            // Handle parsing errors
            console.error("Error parsing user data from localStorage:", error);
            // Clear corrupted data
            localStorage.removeItem('user');
        } finally {
            setLoading(false);
        }
    }, []);

    const login = useCallback((userData) => {
        setUser(userData);
        localStorage.setItem('user', JSON.stringify(userData));
    }, []);

    const logout = useCallback(() => {
        setUser(null);
        localStorage.removeItem('user');
        localStorage.removeItem('token');
    }, []);

    // Provide both the auth state and loading state
    return (
        <AuthContext.Provider value={{ user, login, logout, loading }}>
            {children}
        </AuthContext.Provider>
    );
};

export const useAuth = () => React.useContext(AuthContext);