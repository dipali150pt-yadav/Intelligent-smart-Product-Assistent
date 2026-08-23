import React, { useState } from "react";
import {
  Sparkles,
  ShieldCheck,
  Lock,
  Mail,
  User,
  AtSign,
  Eye,
  EyeOff,
  ArrowRight,
  Zap,
  CheckCircle2,
  AlertCircle,
  Cpu,
  Layers,
} from "lucide-react";
import { loginWithCredentials, registerWithCredentials, loginWithDemo } from "../auth";

export function LoginPage({ onLoginSuccess }) {
  const [tab, setTab] = useState("signin"); // "signin" | "register"
  const [identifier, setIdentifier] = useState("");
  const [password, setPassword] = useState("");
  
  // Registration states
  const [name, setName] = useState("");
  const [username, setUsername] = useState("");
  const [email, setEmail] = useState("");
  const [role, setRole] = useState("user");
  
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const handleSignIn = async (e) => {
    e.preventDefault();
    if (!identifier.trim() || !password) {
      setError("Please enter your username/email and password.");
      return;
    }

    try {
      setLoading(true);
      setError("");
      const data = await loginWithCredentials(identifier.trim(), password);
      onLoginSuccess(data.user);
    } catch (err) {
      setError(err.message || "Invalid username/email or password.");
    } finally {
      setLoading(false);
    }
  };

  const handleRegister = async (e) => {
    e.preventDefault();
    if (!name.trim() || !email.trim() || !password) {
      setError("Please fill in all required fields.");
      return;
    }
    if (password.length < 6) {
      setError("Password must be at least 6 characters long.");
      return;
    }

    try {
      setLoading(true);
      setError("");
      const data = await registerWithCredentials({
        name: name.trim(),
        username: username.trim(),
        email: email.trim(),
        password,
        role,
      });
      onLoginSuccess(data.user);
    } catch (err) {
      setError(err.message || "Registration failed. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  const handleDemoLogin = async (demoRole) => {
    try {
      setLoading(true);
      setError("");
      const data = await loginWithDemo(demoRole);
      onLoginSuccess(data.user);
    } catch (err) {
      setError(err.message || "Demo login failed.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={styles.pageContainer}>
      {/* Ambient background glows */}
      <div style={styles.ambientGlowTop} />
      <div style={styles.ambientGlowBottom} />

      <div style={styles.loginCard}>
        {/* Header Branding */}
        <div style={styles.header}>
          <div style={styles.logoBadge}>
            <Cpu size={24} color="#6366f1" />
          </div>
          <h1 style={styles.title}>Intelligent Support AI</h1>
          <p style={styles.subtitle}>
            Version-Aware Technical Assistant & Multimodal RAG Engine
          </p>
        </div>

        {/* Tab Switcher */}
        <div style={styles.tabContainer}>
          <button
            type="button"
            style={{
              ...styles.tabButton,
              ...(tab === "signin" ? styles.tabButtonActive : {}),
            }}
            onClick={() => {
              setTab("signin");
              setError("");
            }}
          >
            Sign In
          </button>
          <button
            type="button"
            style={{
              ...styles.tabButton,
              ...(tab === "register" ? styles.tabButtonActive : {}),
            }}
            onClick={() => {
              setTab("register");
              setError("");
            }}
          >
            Create Account
          </button>
        </div>

        {/* Error notification alert */}
        {error && (
          <div style={styles.errorAlert}>
            <AlertCircle size={18} style={{ flexShrink: 0 }} />
            <span>{error}</span>
          </div>
        )}

        {/* Sign In Form */}
        {tab === "signin" && (
          <form onSubmit={handleSignIn} style={styles.form}>
            <div style={styles.inputGroup}>
              <label style={styles.label}>Username or Email</label>
              <div style={styles.inputWrapper}>
                <User size={17} style={styles.inputIcon} />
                <input
                  type="text"
                  placeholder="admin, user, or your email"
                  value={identifier}
                  onChange={(e) => setIdentifier(e.target.value)}
                  style={styles.input}
                  required
                  autoFocus
                />
              </div>
            </div>

            <div style={styles.inputGroup}>
              <label style={styles.label}>Password</label>
              <div style={styles.inputWrapper}>
                <Lock size={17} style={styles.inputIcon} />
                <input
                  type={showPassword ? "text" : "password"}
                  placeholder="••••••••"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  style={styles.input}
                  required
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  style={styles.eyeBtn}
                  tabIndex={-1}
                >
                  {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                </button>
              </div>
            </div>

            <button
              type="submit"
              disabled={loading}
              style={{
                ...styles.submitBtn,
                ...(loading ? { opacity: 0.7, cursor: "not-allowed" } : {}),
              }}
            >
              {loading ? (
                <span>Authenticating…</span>
              ) : (
                <>
                  <span>Sign In</span>
                  <ArrowRight size={18} />
                </>
              )}
            </button>
          </form>
        )}

        {/* Create Account Form */}
        {tab === "register" && (
          <form onSubmit={handleRegister} style={styles.form}>
            <div style={styles.inputGroup}>
              <label style={styles.label}>Full Name</label>
              <div style={styles.inputWrapper}>
                <User size={17} style={styles.inputIcon} />
                <input
                  type="text"
                  placeholder="Jane Doe"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  style={styles.input}
                  required
                />
              </div>
            </div>

            <div style={styles.inputGroup}>
              <label style={styles.label}>Username (Optional)</label>
              <div style={styles.inputWrapper}>
                <AtSign size={17} style={styles.inputIcon} />
                <input
                  type="text"
                  placeholder="janedoe"
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  style={styles.input}
                />
              </div>
            </div>

            <div style={styles.inputGroup}>
              <label style={styles.label}>Email Address</label>
              <div style={styles.inputWrapper}>
                <Mail size={17} style={styles.inputIcon} />
                <input
                  type="email"
                  placeholder="jane@company.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  style={styles.input}
                  required
                />
              </div>
            </div>

            <div style={styles.inputGroup}>
              <label style={styles.label}>Password</label>
              <div style={styles.inputWrapper}>
                <Lock size={17} style={styles.inputIcon} />
                <input
                  type={showPassword ? "text" : "password"}
                  placeholder="At least 6 characters"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  style={styles.input}
                  required
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  style={styles.eyeBtn}
                  tabIndex={-1}
                >
                  {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                </button>
              </div>
            </div>

            <div style={styles.inputGroup}>
              <label style={styles.label}>Account Role</label>
              <div style={styles.roleSelector}>
                <button
                  type="button"
                  style={{
                    ...styles.roleOption,
                    ...(role === "user" ? styles.roleOptionActive : {}),
                  }}
                  onClick={() => setRole("user")}
                >
                  <User size={15} />
                  <span>Standard User</span>
                </button>
                <button
                  type="button"
                  style={{
                    ...styles.roleOption,
                    ...(role === "admin" ? styles.roleOptionActive : {}),
                  }}
                  onClick={() => setRole("admin")}
                >
                  <ShieldCheck size={15} />
                  <span>Support Admin</span>
                </button>
              </div>
            </div>

            <button
              type="submit"
              disabled={loading}
              style={{
                ...styles.submitBtn,
                ...(loading ? { opacity: 0.7, cursor: "not-allowed" } : {}),
              }}
            >
              {loading ? (
                <span>Creating Account…</span>
              ) : (
                <>
                  <span>Create Account</span>
                  <ArrowRight size={18} />
                </>
              )}
            </button>
          </form>
        )}

        {/* Clean minimal helper footer */}
        <div style={styles.cleanFooter}>
          <span>Demo credentials: <strong>admin</strong> / <strong>admin123</strong> or <strong>user</strong> / <strong>user123</strong></span>
        </div>
      </div>
    </div>
  );
}

const styles = {
  pageContainer: {
    minHeight: "100vh",
    width: "100vw",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#0b0f17",
    position: "relative",
    overflow: "hidden",
    padding: "24px",
    fontFamily: "'Plus Jakarta Sans', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif",
  },
  ambientGlowTop: {
    position: "absolute",
    top: "-15%",
    left: "50%",
    transform: "translateX(-50%)",
    width: "600px",
    height: "400px",
    background: "radial-gradient(circle, rgba(99, 102, 241, 0.18) 0%, rgba(99, 102, 241, 0) 70%)",
    filter: "blur(60px)",
    pointerEvents: "none",
  },
  ambientGlowBottom: {
    position: "absolute",
    bottom: "-10%",
    right: "15%",
    width: "500px",
    height: "350px",
    background: "radial-gradient(circle, rgba(6, 182, 212, 0.12) 0%, rgba(6, 182, 212, 0) 70%)",
    filter: "blur(60px)",
    pointerEvents: "none",
  },
  loginCard: {
    width: "100%",
    maxWidth: "460px",
    background: "rgba(18, 24, 36, 0.85)",
    backdropFilter: "blur(20px)",
    border: "1px solid rgba(255, 255, 255, 0.1)",
    borderRadius: "20px",
    padding: "36px 32px",
    boxShadow: "0 20px 50px rgba(0, 0, 0, 0.5), 0 0 30px rgba(99, 102, 241, 0.1)",
    position: "relative",
    zIndex: 10,
  },
  header: {
    textAlign: "center",
    marginBottom: "24px",
  },
  logoBadge: {
    width: "52px",
    height: "52px",
    margin: "0 auto 16px auto",
    borderRadius: "14px",
    background: "linear-gradient(135deg, rgba(99, 102, 241, 0.2) 0%, rgba(139, 92, 246, 0.2) 100%)",
    border: "1px solid rgba(99, 102, 241, 0.3)",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    boxShadow: "0 0 20px rgba(99, 102, 241, 0.25)",
  },
  title: {
    fontSize: "1.45rem",
    fontWeight: 700,
    color: "#f8fafc",
    letterSpacing: "-0.02em",
    marginBottom: "6px",
  },
  subtitle: {
    fontSize: "0.83rem",
    color: "#94a3b8",
    lineHeight: 1.4,
  },
  tabContainer: {
    display: "flex",
    background: "rgba(11, 15, 23, 0.7)",
    padding: "4px",
    borderRadius: "10px",
    border: "1px solid rgba(255, 255, 255, 0.06)",
    marginBottom: "20px",
    gap: "4px",
  },
  tabButton: {
    flex: 1,
    padding: "8px 12px",
    borderRadius: "8px",
    border: "none",
    background: "transparent",
    color: "#94a3b8",
    fontSize: "0.85rem",
    fontWeight: 600,
    cursor: "pointer",
    transition: "all 0.2s ease",
  },
  tabButtonActive: {
    background: "rgba(99, 102, 241, 0.25)",
    color: "#f8fafc",
    border: "1px solid rgba(99, 102, 241, 0.4)",
    boxShadow: "0 2px 8px rgba(0, 0, 0, 0.2)",
  },
  errorAlert: {
    display: "flex",
    alignItems: "center",
    gap: "10px",
    background: "rgba(244, 63, 94, 0.15)",
    border: "1px solid rgba(244, 63, 94, 0.3)",
    borderRadius: "8px",
    padding: "10px 14px",
    color: "#fda4af",
    fontSize: "0.82rem",
    marginBottom: "16px",
  },
  form: {
    display: "flex",
    flexDirection: "column",
    gap: "16px",
  },
  inputGroup: {
    display: "flex",
    flexDirection: "column",
    gap: "6px",
  },
  label: {
    fontSize: "0.8rem",
    fontWeight: 600,
    color: "#cbd5e1",
  },
  inputWrapper: {
    position: "relative",
    display: "flex",
    alignItems: "center",
  },
  inputIcon: {
    position: "absolute",
    left: "14px",
    color: "#64748b",
    pointerEvents: "none",
  },
  input: {
    width: "100%",
    padding: "11px 40px 11px 40px",
    background: "rgba(11, 15, 23, 0.8)",
    border: "1px solid rgba(255, 255, 255, 0.1)",
    borderRadius: "10px",
    color: "#f8fafc",
    fontSize: "0.88rem",
    outline: "none",
    transition: "border-color 0.2s, box-shadow 0.2s",
  },
  eyeBtn: {
    position: "absolute",
    right: "12px",
    background: "none",
    border: "none",
    color: "#64748b",
    cursor: "pointer",
    display: "flex",
    alignItems: "center",
    padding: "4px",
  },
  roleSelector: {
    display: "grid",
    gridTemplateColumns: "1fr 1fr",
    gap: "8px",
  },
  roleOption: {
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    gap: "8px",
    padding: "9px 12px",
    borderRadius: "8px",
    border: "1px solid rgba(255, 255, 255, 0.08)",
    background: "rgba(11, 15, 23, 0.6)",
    color: "#94a3b8",
    fontSize: "0.82rem",
    fontWeight: 500,
    cursor: "pointer",
    transition: "all 0.2s",
  },
  roleOptionActive: {
    background: "rgba(99, 102, 241, 0.2)",
    borderColor: "rgba(99, 102, 241, 0.5)",
    color: "#e0e7ff",
    fontWeight: 600,
  },
  submitBtn: {
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    gap: "8px",
    width: "100%",
    padding: "12px",
    marginTop: "4px",
    background: "linear-gradient(135deg, #6366f1 0%, #8b5cf6 100%)",
    border: "none",
    borderRadius: "10px",
    color: "#ffffff",
    fontSize: "0.92rem",
    fontWeight: 600,
    cursor: "pointer",
    boxShadow: "0 4px 15px rgba(99, 102, 241, 0.4)",
    transition: "transform 0.15s, box-shadow 0.15s",
  },
  cleanFooter: {
    marginTop: "24px",
    paddingTop: "16px",
    borderTop: "1px solid rgba(255, 255, 255, 0.08)",
    textAlign: "center",
    fontSize: "0.78rem",
    color: "#64748b",
  },
};
