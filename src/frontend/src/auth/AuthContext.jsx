import { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react';
import { api, getToken, setToken, setUnauthorizedHandler } from '../api/client';

const AuthContext = createContext(null);
const USER_KEY = 'warranty.user';

function readUser() {
  try { return JSON.parse(window.localStorage.getItem(USER_KEY)); } catch (_) { return null; }
}
function saveUser(user) {
  try {
    if (user) window.localStorage.setItem(USER_KEY, JSON.stringify(user));
    else window.localStorage.removeItem(USER_KEY);
  } catch (_) { /* bỏ qua */ }
}

export function AuthProvider({ children }) {
  const [user, setUser] = useState(() => (getToken() ? readUser() : null));

  const logout = useCallback(() => { setToken(null); saveUser(null); setUser(null); }, []);
  const login = useCallback(async (username, password) => {
    const result = await api.login(username, password);
    setToken(result.token);
    saveUser(result.user);
    setUser(result.user);
  }, []);

  // Token hết hạn hoặc bị từ chối ở bất kỳ lệnh gọi nào -> về màn hình đăng nhập.
  useEffect(() => { setUnauthorizedHandler(logout); }, [logout]);

  const value = useMemo(() => ({ user, login, logout }), [user, login, logout]);
  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export const useAuth = () => useContext(AuthContext);
