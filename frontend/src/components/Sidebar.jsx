import React from "react";
import { Cpu, Plus, MessageSquare, Trash2, Clock, Layers, Sparkles } from "lucide-react";

export function Sidebar({
  conversations = [],
  activeConversationId,
  onSelectConversation,
  onNewChat,
  onDeleteConversation,
  onOpenDocUpload,
}) {
  return (
    <aside className="sidebar">
      {/* Sidebar Header */}
      <div className="sidebar-header">
        <div className="logo-badge">
          <Cpu size={22} />
        </div>
        <div>
          <h1 className="sidebar-title">Support Assistant</h1>
          <p className="sidebar-subtitle">Hardware AI Intelligence</p>
        </div>
      </div>

      {/* Action Button: New Chat */}
      <div style={{ padding: "16px 16px 8px 16px" }}>
        <button
          className="btn-primary"
          onClick={onNewChat}
          style={{
            width: "100%",
            justifyContent: "center",
            padding: "10px 14px",
            borderRadius: "10px",
            fontSize: "0.9rem",
            fontWeight: 600,
            boxShadow: "0 2px 10px rgba(99, 102, 241, 0.3)",
          }}
        >
          <Plus size={18} />
          <span>New Chat</span>
        </button>
      </div>

      {/* Chat History Section */}
      <div
        className="sidebar-content"
        style={{
          flex: 1,
          overflowY: "auto",
          padding: "8px 12px",
          display: "flex",
          flexDirection: "column",
          gap: "4px",
        }}
      >
        <div
          style={{
            fontSize: "0.7rem",
            fontWeight: 700,
            textTransform: "uppercase",
            letterSpacing: "0.08em",
            color: "var(--text-muted, #64748b)",
            padding: "8px 8px 4px 8px",
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
          }}
        >
          <span>Chat History</span>
          {conversations.length > 0 && (
            <span
              style={{
                fontSize: "0.68rem",
                background: "rgba(255, 255, 255, 0.06)",
                padding: "1px 6px",
                borderRadius: "10px",
                color: "#94a3b8",
              }}
            >
              {conversations.length}
            </span>
          )}
        </div>

        {conversations.length === 0 ? (
          <div
            style={{
              padding: "24px 12px",
              textAlign: "center",
              color: "var(--text-muted, #64748b)",
              fontSize: "0.8rem",
              display: "flex",
              flexDirection: "column",
              alignItems: "center",
              gap: "8px",
            }}
          >
            <Clock size={24} style={{ opacity: 0.4 }} />
            <span>No saved chats yet.</span>
            <span style={{ fontSize: "0.72rem", opacity: 0.7 }}>
              Your conversations will appear here.
            </span>
          </div>
        ) : (
          conversations.map((conv) => {
            const isActive = conv.id === activeConversationId;
            return (
              <div
                key={conv.id}
                onClick={() => onSelectConversation(conv.id)}
                style={{
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "space-between",
                  padding: "9px 10px",
                  borderRadius: "8px",
                  cursor: "pointer",
                  fontSize: "0.84rem",
                  color: isActive ? "#ffffff" : "var(--text-secondary, #94a3b8)",
                  background: isActive
                    ? "rgba(99, 102, 241, 0.22)"
                    : "transparent",
                  border: isActive
                    ? "1px solid rgba(99, 102, 241, 0.45)"
                    : "1px solid transparent",
                  transition: "all 0.15s ease",
                  position: "relative",
                  group: "chat-item",
                }}
                onMouseEnter={(e) => {
                  if (!isActive) {
                    e.currentTarget.style.background = "rgba(255, 255, 255, 0.04)";
                    e.currentTarget.style.color = "#f8fafc";
                  }
                }}
                onMouseLeave={(e) => {
                  if (!isActive) {
                    e.currentTarget.style.background = "transparent";
                    e.currentTarget.style.color = "var(--text-secondary, #94a3b8)";
                  }
                }}
              >
                <div
                  style={{
                    display: "flex",
                    alignItems: "center",
                    gap: "10px",
                    overflow: "hidden",
                    flex: 1,
                    minWidth: 0,
                  }}
                >
                  <MessageSquare
                    size={15}
                    style={{
                      flexShrink: 0,
                      color: isActive ? "#818cf8" : "#64748b",
                    }}
                  />
                  <span
                    style={{
                      overflow: "hidden",
                      textOverflow: "ellipsis",
                      whiteSpace: "nowrap",
                      fontWeight: isActive ? 600 : 400,
                    }}
                    title={conv.title}
                  >
                    {conv.title || "Untitled Conversation"}
                  </span>
                </div>

                <button
                  type="button"
                  title="Delete Chat"
                  onClick={(e) => {
                    e.stopPropagation();
                    if (onDeleteConversation) {
                      onDeleteConversation(conv.id);
                    }
                  }}
                  style={{
                    background: "none",
                    border: "none",
                    color: "#64748b",
                    cursor: "pointer",
                    padding: "4px",
                    borderRadius: "4px",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    opacity: isActive ? 0.8 : 0.4,
                    transition: "all 0.15s",
                    marginLeft: "6px",
                    flexShrink: 0,
                  }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.color = "#f87171";
                    e.currentTarget.style.opacity = 1;
                    e.currentTarget.style.background = "rgba(248, 113, 113, 0.15)";
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.color = "#64748b";
                    e.currentTarget.style.opacity = isActive ? 0.8 : 0.4;
                    e.currentTarget.style.background = "none";
                  }}
                >
                  <Trash2 size={13} />
                </button>
              </div>
            );
          })
        )}
      </div>

      {/* Sidebar Footer: Upload Manual Action */}
      <div className="sidebar-footer" style={{ padding: "12px 16px" }}>
        <button
          className="btn-feedback"
          onClick={onOpenDocUpload}
          style={{
            width: "100%",
            justifyContent: "center",
            padding: "9px 12px",
            borderRadius: "8px",
            background: "rgba(99, 102, 241, 0.08)",
            borderColor: "rgba(99, 102, 241, 0.25)",
            color: "#818cf8",
            fontSize: "0.82rem",
          }}
        >
          <Layers size={15} />
          <span>Upload PDF Manual</span>
        </button>
      </div>
    </aside>
  );
}

export default Sidebar;
