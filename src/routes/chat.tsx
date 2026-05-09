import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useRef, useState } from "react";
import { PageShell } from "@/components/PageShell";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Sparkles, Send, Loader2, Trash2, Bot, User as UserIcon } from "lucide-react";
import { toast } from "sonner";

export const Route = createFileRoute("/chat")({
  head: () => ({
    meta: [
      { title: "Nexoras AI Chat — Study Smarter with AI" },
      { name: "description", content: "Chat with Nexoras AI for instant help with studies, concepts, planning, and career advice." },
    ],
  }),
  component: ChatPage,
});

type Msg = { id: string; role: "user" | "assistant"; content: string };

const STORAGE_KEY = "nexoras.chat.history.v1";

function loadHistory(): Msg[] {
  if (typeof window === "undefined") return [];
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

function ChatPage() {
  const [messages, setMessages] = useState<Msg[]>([]);
  const [input, setInput] = useState("");
  const [isStreaming, setIsStreaming] = useState(false);
  const [hydrated, setHydrated] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const abortRef = useRef<AbortController | null>(null);

  useEffect(() => {
    setMessages(loadHistory());
    setHydrated(true);
  }, []);

  useEffect(() => {
    if (!hydrated) return;
    try {
      window.localStorage.setItem(STORAGE_KEY, JSON.stringify(messages));
    } catch {
      /* ignore quota */
    }
  }, [messages, hydrated]);

  useEffect(() => {
    scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight, behavior: "smooth" });
  }, [messages, isStreaming]);

  useEffect(() => {
    if (!isStreaming) textareaRef.current?.focus();
  }, [isStreaming]);

  async function send() {
    const text = input.trim();
    if (!text || isStreaming) return;
    const userMsg: Msg = { id: crypto.randomUUID(), role: "user", content: text };
    const assistantId = crypto.randomUUID();
    const next = [...messages, userMsg];
    setMessages([...next, { id: assistantId, role: "assistant", content: "" }]);
    setInput("");
    setIsStreaming(true);

    const controller = new AbortController();
    abortRef.current = controller;

    try {
      const res = await fetch("/api/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          messages: next.map((m) => ({ role: m.role, content: m.content })),
        }),
        signal: controller.signal,
      });

      if (!res.ok || !res.body) {
        let err = `Request failed (${res.status})`;
        try {
          const j = await res.json();
          if (j?.error) err = j.error;
        } catch {/* ignore */}
        throw new Error(err);
      }

      const reader = res.body.getReader();
      const decoder = new TextDecoder();
      let acc = "";
      while (true) {
        const { done, value } = await reader.read();
        if (done) break;
        acc += decoder.decode(value, { stream: true });
        setMessages((prev) =>
          prev.map((m) => (m.id === assistantId ? { ...m, content: acc } : m)),
        );
      }
      if (!acc.trim()) {
        setMessages((prev) =>
          prev.map((m) =>
            m.id === assistantId
              ? { ...m, content: "_(No response received. Please try again.)_" }
              : m,
          ),
        );
      }
    } catch (e) {
      const msg = e instanceof Error ? e.message : "Something went wrong";
      toast.error(msg);
      setMessages((prev) => prev.filter((m) => m.id !== assistantId));
    } finally {
      setIsStreaming(false);
      abortRef.current = null;
    }
  }

  function stop() {
    abortRef.current?.abort();
    setIsStreaming(false);
  }

  function clearChat() {
    setMessages([]);
    try {
      window.localStorage.removeItem(STORAGE_KEY);
    } catch {/* ignore */}
    toast.success("Chat cleared");
  }

  function handleKeyDown(e: React.KeyboardEvent<HTMLTextAreaElement>) {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      void send();
    }
  }

  const suggestions = [
    "Explain Big-O notation with examples",
    "Make a 7-day exam revision plan for physics",
    "Summarize the French Revolution in bullet points",
    "Help me write a resume bullet for a React internship",
  ];

  return (
    <PageShell>
      <div className="mx-auto flex h-[calc(100vh-5rem)] max-w-4xl flex-col px-4 py-6 lg:px-8">
        <div className="mb-4 flex items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <div className="grid h-10 w-10 place-items-center rounded-xl bg-gradient-primary shadow-glow">
              <Sparkles className="h-5 w-5 text-primary-foreground" />
            </div>
            <div>
              <h1 className="font-display text-xl font-bold leading-tight">Nexoras AI Chat</h1>
              <p className="text-xs text-muted-foreground">Your AI study companion · Powered by OpenAI</p>
            </div>
          </div>
          <Button
            variant="outline"
            size="sm"
            onClick={clearChat}
            disabled={messages.length === 0 || isStreaming}
          >
            <Trash2 className="h-4 w-4" /> Clear
          </Button>
        </div>

        <div
          ref={scrollRef}
          className="glass flex-1 overflow-y-auto rounded-2xl p-4 sm:p-6"
        >
          {messages.length === 0 ? (
            <div className="flex h-full flex-col items-center justify-center text-center">
              <div className="grid h-16 w-16 place-items-center rounded-2xl bg-gradient-primary shadow-glow">
                <Bot className="h-8 w-8 text-primary-foreground" />
              </div>
              <h2 className="mt-4 font-display text-2xl font-bold">
                Ask me <span className="text-gradient">anything</span>
              </h2>
              <p className="mt-2 max-w-md text-sm text-muted-foreground">
                Get instant help with studies, concepts, planning, summaries, and career questions.
              </p>
              <div className="mt-6 grid w-full max-w-2xl gap-2 sm:grid-cols-2">
                {suggestions.map((s) => (
                  <button
                    key={s}
                    onClick={() => setInput(s)}
                    className="rounded-xl border border-border bg-background/40 p-3 text-left text-sm text-muted-foreground transition-colors hover:border-accent/40 hover:bg-secondary/60 hover:text-foreground"
                  >
                    {s}
                  </button>
                ))}
              </div>
            </div>
          ) : (
            <div className="space-y-5">
              {messages.map((m) => (
                <MessageBubble key={m.id} msg={m} streaming={isStreaming && m.role === "assistant" && m.id === messages[messages.length - 1]?.id} />
              ))}
            </div>
          )}
        </div>

        <div className="mt-4">
          <div className="glass-strong flex items-end gap-2 rounded-2xl border border-border/60 p-2">
            <Textarea
              ref={textareaRef}
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder="Message Nexoras AI… (Shift+Enter for newline)"
              rows={1}
              className="min-h-[44px] max-h-40 resize-none border-0 bg-transparent shadow-none focus-visible:ring-0"
              disabled={isStreaming}
            />
            {isStreaming ? (
              <Button onClick={stop} variant="outline" size="icon" aria-label="Stop">
                <Loader2 className="h-4 w-4 animate-spin" />
              </Button>
            ) : (
              <Button
                onClick={send}
                size="icon"
                aria-label="Send"
                disabled={!input.trim()}
                className="bg-gradient-primary text-primary-foreground shadow-glow"
              >
                <Send className="h-4 w-4" />
              </Button>
            )}
          </div>
          <p className="mt-2 text-center text-[11px] text-muted-foreground">
            Conversations are stored in your browser only. Nexoras AI may make mistakes—verify important info.
          </p>
        </div>
      </div>
    </PageShell>
  );
}

function MessageBubble({ msg, streaming }: { msg: Msg; streaming: boolean }) {
  const isUser = msg.role === "user";
  return (
    <div className={`flex gap-3 ${isUser ? "flex-row-reverse" : ""}`}>
      <div
        className={`grid h-8 w-8 shrink-0 place-items-center rounded-lg ${
          isUser ? "bg-secondary/70 text-foreground" : "bg-gradient-primary text-primary-foreground shadow-glow"
        }`}
      >
        {isUser ? <UserIcon className="h-4 w-4" /> : <Bot className="h-4 w-4" />}
      </div>
      <div
        className={`max-w-[85%] rounded-2xl px-4 py-3 text-sm leading-relaxed ${
          isUser
            ? "bg-primary/15 text-foreground"
            : "border border-border/60 bg-background/40 text-foreground"
        }`}
      >
        {msg.content ? (
          <div className="whitespace-pre-wrap break-words">{msg.content}</div>
        ) : streaming ? (
          <TypingDots />
        ) : null}
        {streaming && msg.content ? (
          <span className="ml-0.5 inline-block h-3 w-1.5 translate-y-0.5 animate-pulse bg-accent align-baseline" />
        ) : null}
      </div>
    </div>
  );
}

function TypingDots() {
  return (
    <div className="flex items-center gap-1 py-1">
      <span className="h-2 w-2 animate-bounce rounded-full bg-accent [animation-delay:-0.3s]" />
      <span className="h-2 w-2 animate-bounce rounded-full bg-accent [animation-delay:-0.15s]" />
      <span className="h-2 w-2 animate-bounce rounded-full bg-accent" />
    </div>
  );
}
