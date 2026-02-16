import { createContext, useState, useEffect, useContext } from 'react';
import axios from 'axios';
import { API_URL } from '../apiConfig';

const AuthContext = createContext();

export const useAuth = () => useContext(AuthContext);

export const AuthProvider = ({ children }) => {
    const [user, setUser] = useState(null);
    const [loading, setLoading] = useState(true);

    // Check if user is logged in (from local storage)
    useEffect(() => {
        const userInfo = JSON.parse(localStorage.getItem('userInfo'));
        if (userInfo) {
            setUser(userInfo);
        }
        setLoading(false);
    }, []);

    // Login function
    const login = async (email, password) => {
        try {
            const config = {
                headers: {
                    'Content-Type': 'application/json',
                },
            };

            const { data } = await axios.post(`${API_URL}/auth/login`, { email, password }, config);

            console.log('Login success:', data);
            localStorage.setItem('user', JSON.stringify(data));
            localStorage.setItem('userInfo', JSON.stringify(data));
            localStorage.setItem('token', data.token); // Store token separately for easier access
            setUser(data);
            return { success: true };
        } catch (error) {
            console.error("Login error:", error.response?.data?.message || error.message);
            return {
                success: false,
                message: error.response && error.response.data.message ? error.response.data.message : error.message
            };
        }
    };

    // Register function
    const register = async (userData) => {
        try {
            const config = {
                headers: {
                    'Content-Type': 'application/json',
                },
            };

            const { data } = await axios.post(`${API_URL}/auth/register`, userData, config);

            console.log('Register success:', data);
            localStorage.setItem('user', JSON.stringify(data));
            localStorage.setItem('userInfo', JSON.stringify(data));
            localStorage.setItem('token', data.token);
            setUser(data);
            return { success: true };
        } catch (error) {
            console.error("Registraion Error:", error.response?.data?.message || error.message);
            return {
                success: false,
                message: error.response && error.response.data.message ? error.response.data.message : error.message
            };
        }
    }

    // Logout function
    const logout = () => {
        localStorage.removeItem('userInfo');
        localStorage.removeItem('token');
        setUser(null);
    };

    const value = {
        user,
        loading,
        login,
        register,
        logout,
    };

    return (
        <AuthContext.Provider value={value}>
            {!loading && children}
        </AuthContext.Provider>
    );
};
