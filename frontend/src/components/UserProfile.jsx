import React, { useState } from "react";
import { LogOut, User, ChevronDown, ShieldCheck } from "lucide-react";

/**
 * Displays the logged-in user's name/email, role, and a logout button.
 */
export function UserProfile({ user, onLogout }) {
  const [open, setOpen] = useState(false);

  if (!user) return null;

  const displayName = user.name || user.username || user.email || "User";
  const email = user.email || "";
  const role = user.role || "user";
  const isAdmin = role === "admin" || (Array.isArray(user.roles) && user.roles.includes("admin"));

  const initials = displayName
    .split(" ")
    .map((w) => w[0])
    .join("")
    .toUpperCase()
    .slice(0, 2);

  return (
    <div style={{ position: "relative" }}>
      {/* Avatar trigger button */}
      <button
        onClick={() => setOpen((o) => !o)}
        title={displayName}
        style={{
          display: "flex",
          alignItems: "center",
          gap: "8px",
          background: "rgba(99,102,241,0.12)",
          border: "1px solid rgba(99,102,241,0.3)",
          borderRadius: "20px",
          padding: "4px 12px 4px 6px",
          cursor: "pointer",
          color: "var(--text-primary, #e2e8f0)",
          fontSize: "0.82rem",
          transition: "all 0.15s",
        }}
        onMouseEnter={(e) =>
          (e.currentTarget.style.background = "rgba(99,102,241,0.22)")
        }
        onMouseLeave={(e) =>
          (e.currentTarget.style.background = "rgba(99,102,241,0.12)")
        }
      >
        {/* Avatar circle */}
        <span
          style={{
            width: 26,
            height: 26,
            borderRadius: "50%",
            background: isAdmin
              ? "linear-gradient(135deg, #6366f1, #8b5cf6)"
              : "linear-gradient(135deg, #06b6d4, #3b82f6)",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            fontSize: "0.7rem",
            fontWeight: 700,
            color: "#fff",
            flexShrink: 0,
          }}
        >
          {initials}
        </span>
        <span
          style={{
            maxWidth: 130,
            overflow: "hidden",
            textOverflow: "ellipsis",
            whiteSpace: "nowrap",
            fontWeight: 500,
          }}
        >
          {displayName}
        </span>
        {isAdmin && (
          <span
            style={{
              background: "rgba(99, 102, 241, 0.25)",
              color: "#818cf8",
              fontSize: "0.65rem",
              padding: "1px 6px",
              borderRadius: "10px",
              fontWeight: 700,
            }}
          >
            ADMIN
          </span>
        )}
        <ChevronDown size={13} style={{ opacity: 0.6 }} />
      </button>

      {/* Dropdown */}
      {open && (
        <>
          {/* Backdrop to close on outside click */}
          <div
            style={{ position: "fixed", inset: 0, zIndex: 49 }}
            onClick={() => setOpen(false)}
          />
          <div
            style={{
              position: "absolute",
              right: 0,
              top: "calc(100% + 8px)",
              background: "#161f30",
              border: "1px solid rgba(255, 255, 255, 0.12)",
              borderRadius: "12px",
              padding: "14px",
              minWidth: 230,
              zIndex: 50,
              boxShadow: "0 10px 30px rgba(0,0,0,0.5)",
            }}
          >
            {/* User info */}
            <div
              style={{
                display: "flex",
                alignItems: "center",
                gap: "10px",
                marginBottom: "12px",
              }}
            >
              <span
                style={{
                  width: 38,
                  height: 38,
                  borderRadius: "50%",
                  background: isAdmin
                    ? "linear-gradient(135deg, #6366f1, #8b5cf6)"
                    : "linear-gradient(135deg, #06b6d4, #3b82f6)",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  fontSize: "0.9rem",
                  fontWeight: 700,
                  color: "#fff",
                  flexShrink: 0,
                }}
              >
                {initials}
              </span>
              <div style={{ overflow: "hidden" }}>
                <div
                  style={{
                    fontWeight: 600,
                    fontSize: "0.88rem",
                    color: "#f8fafc",
                    overflow: "hidden",
                    textOverflow: "ellipsis",
                    whiteSpace: "nowrap",
                  }}
                >
                  {displayName}
                </div>
                {email && (
                  <div
                    style={{
                      fontSize: "0.75rem",
                      color: "#94a3b8",
                      overflow: "hidden",
                      textOverflow: "ellipsis",
                      whiteSpace: "nowrap",
                    }}
                  >
                    {email}
                  </div>
                )}
                <div
                  style={{
                    display: "inline-flex",
                    alignItems: "center",
                    gap: "4px",
                    marginTop: "4px",
                    fontSize: "0.68rem",
                    color: isAdmin ? "#818cf8" : "#22d3ee",
                    background: isAdmin ? "rgba(99,102,241,0.15)" : "rgba(6,182,212,0.15)",
                    padding: "2px 6px",
                    borderRadius: "4px",
                    fontWeight: 600,
                  }}
                >
                  {isAdmin ? <ShieldCheck size={11} /> : <User size={11} />}
                  <span>{isAdmin ? "Support Administrator" : "Standard Client"}</span>
                </div>
              </div>
            </div>

            <div
              style={{
                height: 1,
                background: "rgba(255, 255, 255, 0.08)",
                margin: "10px 0",
              }}
            />

            {/* Logout button */}
            <button
              onClick={() => {
                setOpen(false);
                if (onLogout) onLogout();
              }}
              style={{
                display: "flex",
                alignItems: "center",
                gap: "8px",
                width: "100%",
                background: "none",
                border: "none",
                color: "#f87171",
                cursor: "pointer",
                padding: "8px 10px",
                borderRadius: "8px",
                fontSize: "0.85rem",
                fontWeight: 500,
                transition: "background 0.15s",
              }}
              onMouseEnter={(e) =>
                (e.currentTarget.style.background = "rgba(248,113,113,0.12)")
              }
              onMouseLeave={(e) =>
                (e.currentTarget.style.background = "none")
              }
            >
              <LogOut size={15} />
              Sign out
            </button>
          </div>
        </>
      )}
    </div>
  );
}

export default UserProfile;
