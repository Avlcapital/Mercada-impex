import { Navigate, useLocation } from "react-router-dom";
import { useAuth } from "./AuthContext";
export default function ProtectedRoute({ children }) {
  const { customer, loading } = useAuth();
  const location = useLocation();
  if (loading)
    return (
      <p className="section" role="status">
        Restoring your account...
      </p>
    );
  return customer ? (
    children
  ) : (
    <Navigate
      to="/login"
      replace
      state={{ from: `${location.pathname}${location.search}` }}
    />
  );
}
