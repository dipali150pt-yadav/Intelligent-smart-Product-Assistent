import React, { useState, useEffect, useRef } from "react";
import { Send, Camera, Sparkles, AlertCircle, Loader2, FileUp, X, Check, BookOpen } from "lucide-react";
import { Sidebar } from "./components/Sidebar";
import { ChatMessage } from "./components/ChatMessage";
import { VisionModal } from "./components/VisionModal";
import { DocumentUploadModal } from "./components/DocumentUploadModal";
import { UserProfile } from "./components/UserProfile";
import {
  fetchDevices,
  sendChatMessage,
  fetchConversations,
  fetchConversation,
  saveConversationApi,
  deleteConversationApi,
} from "./api";

const DEFAULT_WELCOME_MESSAGE = {
  role: "bot",
  content:
    "Hello! I am your **Intelligent Technical Support Assistant**.\n\nI can help you troubleshoot hardware devices with **strict version-accurate instructions**, or assist with general orders, returns, and support FAQs.\n\n*Upload a manual using the button above or type your technical question below!*",
  citations: [],
};

export function App({ user, onLogout }) {
  const [devices, setDevices] = useState([]);
  const [conversations, setConversations] = useState([]);
  const [activeConversationId, setActiveConversationId] = useState(null);
  const [activeProduct, setActiveProduct] = useState("");
  const [activeVersion, setActiveVersion] = useState("");

  const [messages, setMessages] = useState([DEFAULT_WELCOME_MESSAGE]);
  const [inputPrompt, setInputPrompt] = useState("");
  const [loading, setLoading] = useState(false);
  const [visualInspection, setVisualInspection] = useState("");
  const [isVisionOpen, setIsVisionOpen] = useState(false);
  const [isDocUploadOpen, setIsDocUploadOpen] = useState(false);

  const messagesEndRef = useRef(null);

  // Load devices and saved conversations on mount
  useEffect(() => {
    fetchDevices()
      .then((data) => setDevices(data.devices || []))
      .catch((err) => console.error("Could not load devices:", err));

    loadSavedConversations();
  }, []);

  const loadSavedConversations = async () => {
    try {
      const data = await fetchConversations();
      const list = data.conversations || [];
      setConversations(list);

      // Auto-load most recent conversation if available
      if (list.length > 0) {
        const first = list[0];
        setActiveConversationId(first.id);
        const convData = await fetchConversation(first.id);
        if (convData.conversation?.messages?.length > 0) {
          setMessages(convData.conversation.messages);
        }
      }
    } catch (err) {
      console.warn("Could not load conversations:", err);
    }
  };

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  const handleSelectConversation = async (convId) => {
    if (convId === activeConversationId) return;
    try {
      setLoading(true);
      setActiveConversationId(convId);
      const data = await fetchConversation(convId);
      if (data.conversation?.messages) {
        setMessages(data.conversation.messages);
      }
    } catch (err) {
      console.error("Failed to load conversation:", err);
    } finally {
      setLoading(false);
    }
  };

  const handleNewChat = () => {
    setActiveConversationId(null);
    setActiveProduct("");
    setActiveVersion("");
    setVisualInspection("");
    setInputPrompt("");
    setMessages([
      {
        role: "bot",
        content:
          "Starting a fresh new support session.\n\nAll prior conversation context has been reset. How can I assist you today?",
        citations: [],
      },
    ]);
  };

  const handleDeleteConversation = async (convId) => {
    try {
      await deleteConversationApi(convId);
      setConversations((prev) => prev.filter((c) => c.id !== convId));
      if (activeConversationId === convId) {
        handleNewChat();
      }
    } catch (err) {
      console.error("Failed to delete conversation:", err);
    }
  };

  const handleSend = async (e) => {
    if (e) e.preventDefault();
    const query = inputPrompt.trim();
    if (!query || loading) return;

    const userMsg = {
      role: "user",
      content: query,
      visualInfo: visualInspection,
    };

    const newMessages = [...messages, userMsg];
    setMessages(newMessages);
    setInputPrompt("");
    const attachedVisual = visualInspection;
    setVisualInspection("");
    setLoading(true);

    let convId = activeConversationId;
    if (!convId) {
      convId = `conv-${Date.now()}`;
      setActiveConversationId(convId);
    }

    // Auto generate title from first query
    const title = query.length > 35 ? query.slice(0, 35) + "…" : query;

    try {
      // Build brief history context
      const historyContext = newMessages
        .filter((m, idx) => idx > 0 && (m.role === "user" || m.role === "bot"))
        .slice(-4)
        .map((m) => ({
          role: m.role === "bot" ? "assistant" : "user",
          content: m.content,
        }));

      const res = await sendChatMessage({
        question: query,
        history: historyContext,
        activeProduct: activeProduct || null,
        activeVersion: activeVersion || null,
        visualInfo: attachedVisual,
      });

      const botMsg = {
        role: "bot",
        content: res.answer,
        citations: res.citations || [],
        escalated: res.escalated || false,
        interactionId: res.interactionId,
      };

      const finalMessages = [...newMessages, botMsg];
      setMessages(finalMessages);

      // Persist conversation to backend SQLite
      await saveConversationApi({
        id: convId,
        title,
        messages: finalMessages,
      });

      // Update conversations sidebar list
      setConversations((prev) => {
        const exists = prev.find((c) => c.id === convId);
        if (exists) {
          return prev.map((c) => (c.id === convId ? { ...c, title, updated_at: new Date().toISOString() } : c));
        } else {
          return [{ id: convId, title, updated_at: new Date().toISOString() }, ...prev];
        }
      });
    } catch (err) {
      const errorMsg = {
        role: "bot",
        content: `⚠️ Error: ${err.message || "Failed to reach backend service."}`,
        escalated: true,
      };
      const fallbackMessages = [...newMessages, errorMsg];
      setMessages(fallbackMessages);

      try {
        await saveConversationApi({
          id: convId,
          title,
          messages: fallbackMessages,
        });

        setConversations((prev) => {
          const exists = prev.find((c) => c.id === convId);
          if (exists) {
            return prev.map((c) => (c.id === convId ? { ...c, title, updated_at: new Date().toISOString() } : c));
          } else {
            return [{ id: convId, title, updated_at: new Date().toISOString() }, ...prev];
          }
        });
      } catch (saveErr) {
        console.warn("Could not save fallback conversation:", saveErr);
      }
    } finally {
      setLoading(false);
    }
  };

  const handleUploadSuccess = async (uploadedInfo) => {
    fetchDevices()
      .then((data) => setDevices(data.devices || []))
      .catch((err) => console.error("Could not load devices:", err));

    if (uploadedInfo?.productId) {
      // Lock context to this uploaded product manual!
      setActiveProduct(uploadedInfo.productId);
      if (uploadedInfo.hardwareVersion) {
        setActiveVersion(uploadedInfo.hardwareVersion);
      }

      const uploadNotice = {
        role: "bot",
        content: `📄 **Manual Uploaded & Active**: Documentation for **${
          uploadedInfo.productName || uploadedInfo.productId
        }** ${
          uploadedInfo.hardwareVersion ? `(${uploadedInfo.hardwareVersion})` : ""
        } is now active in this chat.\n\nAsk any question (e.g. *"describe it"*, *"setup guide"*, *"troubleshooting"*) to search this manual.`,
        citations: [],
      };

      const updated = [...messages, uploadNotice];
      setMessages(updated);

      let convId = activeConversationId || `conv-${Date.now()}`;
      setActiveConversationId(convId);
      const title = `Manual: ${uploadedInfo.productName || uploadedInfo.productId}`;

      try {
        await saveConversationApi({
          id: convId,
          title,
          messages: updated,
        });

        setConversations((prev) => {
          const exists = prev.find((c) => c.id === convId);
          if (exists) {
            return prev.map((c) => (c.id === convId ? { ...c, title, updated_at: new Date().toISOString() } : c));
          } else {
            return [{ id: convId, title, updated_at: new Date().toISOString() }, ...prev];
          }
        });
      } catch (e) {
        console.warn("Could not save upload notice:", e);
      }
    }
  };

  const activeDeviceObj = devices.find((d) => d.id === activeProduct);
  const activeProductDisplayName = activeDeviceObj?.name || (activeProduct ? activeProduct.toUpperCase() : "");

  return (
    <div className="app-container">
      {/* Clean Sidebar with Chat History */}
      <Sidebar
        conversations={conversations}
        activeConversationId={activeConversationId}
        onSelectConversation={handleSelectConversation}
        onNewChat={handleNewChat}
        onDeleteConversation={handleDeleteConversation}
        onOpenDocUpload={() => setIsDocUploadOpen(true)}
      />

      <main className="chat-main">
        {/* Clean Header with Active Manual Indicator */}
        <header className="chat-header">
          <div className="active-context-badge">
            {activeProduct ? (
              <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                <BookOpen size={15} color="#818cf8" />
                <span>
                  Active Manual: <strong>{activeProductDisplayName}</strong>{" "}
                  {activeVersion ? `(${activeVersion})` : ""}
                </span>
                <button
                  type="button"
                  title="Clear active manual filter"
                  onClick={() => {
                    setActiveProduct("");
                    setActiveVersion("");
                  }}
                  style={{
                    background: "rgba(255,255,255,0.1)",
                    border: "none",
                    borderRadius: "50%",
                    width: "18px",
                    height: "18px",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    cursor: "pointer",
                    color: "#94a3b8",
                    marginLeft: "4px",
                  }}
                >
                  <X size={12} />
                </button>
              </div>
            ) : (
              <div style={{ display: "flex", alignItems: "center", gap: "6px" }}>
                <Sparkles size={15} color="var(--accent-cyan)" />
                <span>Auto-Detect Product Knowledge Base</span>
              </div>
            )}
          </div>

          <div className="header-actions">
            <button
              className="btn-primary"
              onClick={() => setIsDocUploadOpen(true)}
              style={{ padding: "6px 12px", fontSize: "0.8rem" }}
              title="Upload PDF Manual"
            >
              <FileUp size={15} />
              <span>Upload PDF</span>
            </button>

            <button
              className="btn-icon"
              onClick={() => setIsVisionOpen(true)}
              title="Upload hardware diagnostic photo"
            >
              <Camera size={18} />
            </button>

            <UserProfile user={user} onLogout={onLogout} />
          </div>
        </header>

        {/* Message Feed */}
        <div className="messages-container">
          {messages.map((msg, i) => (
            <ChatMessage key={i} message={msg} />
          ))}
          {loading && (
            <div className="message-wrapper bot">
              <div className="avatar bot">
                <Loader2 size={18} className="animate-spin" />
              </div>
              <div className="message-bubble" style={{ color: "var(--text-muted)", fontStyle: "italic" }}>
                Searching verified documentation for {activeProductDisplayName || "your inquiry"}...
              </div>
            </div>
          )}
          <div ref={messagesEndRef} />
        </div>

        {visualInspection && (
          <div
            style={{
              padding: "8px 32px",
              display: "flex",
              alignItems: "center",
              justifyContent: "space-between",
              background: "rgba(6, 182, 212, 0.08)",
              borderTop: "1px solid rgba(6, 182, 212, 0.2)",
              fontSize: "0.82rem",
              color: "#38bdf8",
            }}
          >
            <span>📸 Visual hardware analysis ready to send with your message</span>
            <button
              style={{ background: "none", border: "none", color: "var(--text-muted)", cursor: "pointer" }}
              onClick={() => setVisualInspection("")}
            >
              Remove
            </button>
          </div>
        )}

        {/* Chat Input Bar */}
        <div className="chat-input-container">
          <form className="input-box" onSubmit={handleSend}>
            <button
              type="button"
              className="btn-icon"
              style={{ width: "32px", height: "32px" }}
              onClick={() => setIsDocUploadOpen(true)}
              title="Upload and index PDF Manual"
            >
              <FileUp size={16} />
            </button>
            <button
              type="button"
              className="btn-icon"
              style={{ width: "32px", height: "32px" }}
              onClick={() => setIsVisionOpen(true)}
              title="Attach hardware photo"
            >
              <Camera size={16} />
            </button>
            <input
              type="text"
              placeholder={
                activeProduct
                  ? `Ask questions about ${activeProductDisplayName}...`
                  : "Ask about product troubleshooting, hardware setup, or support..."
              }
              value={inputPrompt}
              onChange={(e) => setInputPrompt(e.target.value)}
              disabled={loading}
              autoFocus
            />
            <button
              type="submit"
              className="btn-send"
              disabled={loading || !inputPrompt.trim()}
              title="Send Message"
            >
              <Send size={16} />
            </button>
          </form>
        </div>
      </main>

      <DocumentUploadModal
        isOpen={isDocUploadOpen}
        onClose={() => setIsDocUploadOpen(false)}
        onUploadSuccess={handleUploadSuccess}
        devices={devices}
      />

      <VisionModal
        isOpen={isVisionOpen}
        onClose={() => setIsVisionOpen(false)}
        onAttachInspection={(finding) => setVisualInspection(finding)}
      />
    </div>
  );
}

export default App;
