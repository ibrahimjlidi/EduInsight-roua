// src/pages/Login.jsx
import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import AuthShowcase from "../components/AuthShowcase";
import { loginUser } from "../api/authApi";
import { useAuth } from "../context/AuthContext";

function Login() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();
  const { login } = useAuth();
  
  const handleSubmit = async (e) => {
  e.preventDefault();
  setError("");
  setLoading(true);

  try {
    const data = await loginUser(email, password);

    login(data.user, data.token);

    // Redirection selon le rôle
    if (data.user.role === "admin") {
      navigate("/admin");
    } else if (data.user.role === "teacher") {
      navigate("/teacher/courses");
    } else {
      navigate("/student/courses");
    }

  } catch (err) {
    setError(err.response?.data?.message || err.message || "Login failed. Please try again.");
  } finally {
    setLoading(false);
  }
};

  return (
    <div className="min-h-screen bg-black flex items-center justify-center p-6">
      <div className="w-full max-w-6xl bg-slate-950 border border-slate-800 rounded-3xl flex overflow-hidden">
        <AuthShowcase />

        <div className="flex-1 p-10 flex flex-col justify-center">
          <p className="text-xs tracking-widest text-slate-500 mb-1">ACCESS PORTAL</p>
          <h2 className="text-3xl font-bold text-white mb-8">Welcome back</h2>

          {error && (
            <div className="bg-red-500/10 border border-red-500/30 text-red-400 text-sm rounded-lg px-4 py-2 mb-4">
              {error}
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-5">
            <div>
              <label className="text-sm text-slate-400">Email</label>
              <input
                type="email"
                placeholder="you@example.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                className="w-full mt-1 bg-slate-900 border border-slate-800 rounded-xl px-4 py-3 text-white placeholder-slate-600 focus:outline-none focus:ring-2 focus:ring-cyan-500"
              />
            </div>

            <div>
              <label className="text-sm text-slate-400">Password</label>
              <input
                type="password"
                placeholder="••••••••"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                className="w-full mt-1 bg-slate-900 border border-slate-800 rounded-xl px-4 py-3 text-white placeholder-slate-600 focus:outline-none focus:ring-2 focus:ring-cyan-500"
              />
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full bg-cyan-400 hover:bg-cyan-300 transition text-slate-950 font-semibold rounded-xl py-3 disabled:opacity-50"
            >
              {loading ? "Connexion..." : "Login"}
            </button>
          </form>

          <p className="text-slate-500 text-sm mt-6">
            Don't have an account?{" "}
            <Link to="/register" className="text-cyan-400 hover:underline">
              Create one
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
}

export default Login;
