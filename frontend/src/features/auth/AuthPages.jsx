import { useState } from "react";
import { Link, Navigate, useLocation, useNavigate } from "react-router-dom";
import { useAuth } from "./AuthContext";
function AuthForm({ mode }) {
  const { customer, authenticate } = useAuth();
  const [error, setError] = useState("");
  const location = useLocation(),
    navigate = useNavigate();
  const register = mode === "register";
  if (customer)
    return <Navigate to={location.state?.from || "/account/orders"} replace />;
  async function submit(event) {
    event.preventDefault();
    setError("");
    const data = Object.fromEntries(new FormData(event.currentTarget));
    try {
      await authenticate(mode, data);
      navigate(location.state?.from || "/account/orders", { replace: true });
    } catch (e) {
      setError(e.message);
    }
  }
  return (
    <section className="section checkout">
      <div>
        <p className="eyebrow">Customer account</p>
        <h1>{register ? "Create your account" : "Welcome back"}</h1>
        <p>Your orders stay private and available only to you.</p>
      </div>
      <form onSubmit={submit}>
        {register && (
          <label>
            Full name
            <input name="name" required minLength="2" />
          </label>
        )}
        <label>
          Email
          <input name="email" type="email" required autoComplete="email" />
        </label>
        <label>
          Password
          <input
            name="password"
            type="password"
            required
            minLength="10"
            autoComplete={register ? "new-password" : "current-password"}
          />
        </label>
        {error && (
          <p className="error" role="alert">
            {error}
          </p>
        )}
        <button>{register ? "Create account" : "Sign in"}</button>
        <p>
          {register ? "Already registered?" : "New customer?"}{" "}
          <Link to={register ? "/login" : "/register"} state={location.state}>
            {register ? "Sign in" : "Create an account"}
          </Link>
        </p>
      </form>
    </section>
  );
}
export const Login = () => <AuthForm mode="login" />;
export const Register = () => <AuthForm mode="register" />;
