import { useEffect, useRef, useState } from "react";
import AppLayout from "../../components/layout/AppLayout";
import { api } from "../../lib/api";
import Message from "../../components/chat/Message";
import Button from "../../components/ui/Button";
import { Select, TextArea } from "../../components/ui/Input";
import styles from "./Chat.module.scss";

export default function Chat() {
  const [message, setMessage] = useState("");
  const [list, setList] = useState([]);
  const [provider, setProvider] = useState("OPENAI");
  const [convId, setConvId] = useState(null);
  const [projects, setProjects] = useState([]);
  const [projectId, setProjectId] = useState("");
  const [pending, setPending] = useState(false);
  const abortRef = useRef(null);

  useEffect(() => {
    (async () => {
      try {
        const { data } = await api.get("/projects");
        setProjects(data);
      } catch { }
      try {
        const { data } = await api.get("/settings");
        if (data?.defaultProvider) setProvider(data.defaultProvider);
      } catch { }
    })();
  }, []);

  async function send() {
    if (!message.trim()) return;
    const userText = message;
    setMessage("");
    // push user + placeholder assistant
    setList((l) => [
      ...l,
      { role: "user", content: userText, ts: Date.now() },
      { role: "assistant", content: "", ts: Date.now() },
    ]);
    setPending(true);
    try {
      const controller = new AbortController();
      abortRef.current = controller;
      const { getBackendBaseUrl } = await import('../../lib/baseUrl')
      const base = getBackendBaseUrl();
      const res = await fetch(base + "/chat?stream=1", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Accept: "text/event-stream",
          Authorization: `Bearer ${localStorage.getItem("token")}`,
        },
        body: JSON.stringify({
          message: userText,
          provider,
          projectId: projectId || undefined,
          conversationId: convId || undefined,
        }),
        signal: controller.signal,
      });
      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        throw new Error(data?.error?.message || "Request failed");
      }
      const reader = res.body.getReader();
      const decoder = new TextDecoder();
      let buffer = "";
      const append = (t) => {
        setList((l) => {
          const copy = [...l];
          const idx = copy.length - 1;
          copy[idx] = { ...copy[idx], content: (copy[idx].content || "") + t };
          return copy;
        });
      };
      while (true) {
        const { value, done } = await reader.read();
        if (done) break;
        buffer += decoder.decode(value, { stream: true });
        let sep;
        while ((sep = buffer.indexOf("\n\n")) !== -1) {
          const chunk = buffer.slice(0, sep);
          buffer = buffer.slice(sep + 2);
          const line = chunk.trim();
          if (!line.startsWith("data:")) continue;
          const dataStr = line.slice(5).trim();
          if (dataStr === "[DONE]") break;
          try {
            const obj = JSON.parse(dataStr);
            if (obj?.token) append(obj.token);
          } catch {
            append(dataStr);
          }
        }
      }
    } catch (e) {
      if (e.name !== "AbortError") {
        setList((l) => {
          const copy = [...l];
          const idx = copy.length - 1;
          copy[idx] = { ...copy[idx], content: (copy[idx].content || "") + "\n\n" + (e.message || "Request failed") };
          return copy;
        });
      }
    } finally {
      setPending(false);
    }
  }
  function stop() {
    abortRef.current?.abort();
    setPending(false);
  }

  const listRef = useRef(null);
  useEffect(() => {
    listRef.current?.scrollTo({
      top: listRef.current.scrollHeight,
      behavior: "smooth",
    });
  }, [list]);

  return (
    <AppLayout title="Chat">
      <div className={styles.chatControls}>
        <div className={styles.controlGroup}>
          <label>Provider</label>
          <Select value={provider} onChange={(e) => setProvider(e.target.value)}>
            <option>OPENAI</option>
            <option>DEEPSEEK</option>
            <option>GEMINI</option>
            <option>PERPLEXITY</option>
            <option>ANTHROPIC</option>
            <option>MISTRAL</option>
            <option>OPENROUTER</option>
            <option>GROQ</option>
          </Select>
        </div>
        <div className={styles.controlGroup}>
          <label>Project</label>
          <Select
            value={projectId}
            onChange={(e) => setProjectId(e.target.value)}
          >
            <option value="">None</option>
            {projects.map((p) => (
              <option key={p.id} value={p.id}>
                {p.name}
              </option>
            ))}
          </Select>
        </div>
      </div>

      <div className={styles.chatContainer}>
        <div ref={listRef} className={styles.messageList}>
          {list.length === 0 ? (
            <div className={styles.emptyState}>
              <div className={styles.icon}>💬</div>
              <h3>Start a Conversation</h3>
              <p>Ask me anything and I'll help you!</p>
            </div>
          ) : (
            list.map((m, i) => {
              const isLast = i === list.length - 1
              const showTyping = isLast && m.role === 'assistant' && pending && !m.content
              return (
                <Message
                  key={i}
                  role={m.role}
                  content={m.content}
                  ts={m.ts || Date.now()}
                  typing={showTyping}
                />
              )
            })
          )}
        </div>

        <div className={styles.inputArea}>
          <div className={styles.inputWrapper}>
            <TextArea
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              placeholder="Ask anything... (Press Enter to send, Shift+Enter for new line)"
              onKeyDown={(e) => {
                if (e.key === "Enter" && !e.shiftKey) {
                  e.preventDefault();
                  send();
                }
              }}
            />
            <div className={styles.buttonGroup}>
              {pending ? (
                <Button variant="ghost" onClick={stop}>
                  ⏹ Stop
                </Button>
              ) : (
                <Button onClick={send} disabled={!message.trim()}>
                  📤 Send
                </Button>
              )}
            </div>
          </div>
        </div>
      </div>
    </AppLayout>
  );
}
