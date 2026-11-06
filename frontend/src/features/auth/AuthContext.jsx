import { createContext, useContext, useEffect, useState } from "react";
import { request } from "../../api";
/* eslint-disable react-refresh/only-export-components */
const AuthContext = createContext();
export function AuthProvider({ children }) {
  const [customer, setCustomer] = useState(null);
  const [loading, setLoading] = useState(true);
  useEffect(() => {
    request("/auth/me")
      .then((x) => setCustomer(x.customer))
      .catch(() => setCustomer(null))
      .finally(() => setLoading(false));
  }, []);
  useEffect(() => {
    const clear = () => setCustomer(null);
    window.addEventListener("mercada:unauthorized", clear);
    return () => window.removeEventListener("mercada:unauthorized", clear);
  }, []);
  const authenticate = async (mode, values) => {
    const result = await request(`/auth/${mode}`, {
      method: "POST",
      body: JSON.stringify(values),
    });
    setCustomer(result.customer);
    return result.customer;
  };
  const logout = async () => {
    try {
      await request("/auth/logout", { method: "POST" });
    } finally {
      setCustomer(null);
    }
  };
  return (
    <AuthContext.Provider value={{ customer, loading, authenticate, logout }}>
      {children}
    </AuthContext.Provider>
  );
}
export const useAuth = () => useContext(AuthContext);
