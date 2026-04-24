import { useCallback, useMemo, useState } from 'react';
import { loginUser, registerUser, updateMe } from '../api/authApi';
import AuthContext from './authContextValue';

const getStoredAuth = () => {
  const token = localStorage.getItem('mixup_token');
  const user = localStorage.getItem('mixup_user');

  return {
    token,
    user: user ? JSON.parse(user) : null,
  };
};

export const AuthProvider = ({ children }) => {
  const storedAuth = getStoredAuth();
  const [token, setToken] = useState(storedAuth.token);
  const [user, setUser] = useState(storedAuth.user);

  const persistAuth = (authData) => {
    localStorage.setItem('mixup_token', authData.token);
    localStorage.setItem('mixup_user', JSON.stringify(authData.user));
    setToken(authData.token);
    setUser(authData.user);
  };

  const login = useCallback(async (payload) => {
    const { data } = await loginUser(payload);
    persistAuth(data);
    return data;
  }, []);

  const register = useCallback(async (payload) => {
    const { data } = await registerUser(payload);
    persistAuth(data);
    return data;
  }, []);

  const updateProfile = useCallback(async (payload) => {
    const { data } = await updateMe(payload);
    localStorage.setItem('mixup_user', JSON.stringify(data.user));
    setUser(data.user);
    return data.user;
  }, []);

  const logout = useCallback(() => {
    localStorage.removeItem('mixup_token');
    localStorage.removeItem('mixup_user');
    setToken(null);
    setUser(null);
  }, []);

  const value = useMemo(
    () => ({
      token,
      user,
      isAuthenticated: Boolean(token),
      login,
      register,
      updateProfile,
      logout,
    }),
    [token, user, login, register, updateProfile, logout]
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};
