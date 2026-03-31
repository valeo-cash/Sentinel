"use client";

import { useState, useRef, useEffect, useCallback } from "react";
import {
  Send,
  Loader2,
  Shield,
  AlertTriangle,
  CheckCircle2,
} from "lucide-react";

interface Message {
  id: string;
  role: "user" | "assistant";
  content: string;
  actions?: ActionResult[];
  timestamp: Date;
}

interface ActionResult {
  type: string;
  success: boolean;
  message: string;
  details?: Record<string, unknown>;
}

const STARTERS = [
  "What did my agents spend today?",
  "Show me anything unusual",
  "Which agent costs the most?",
  "Summarize this week for my CFO",
];

const DATA_PATTERN =
  /(\$[\d,.]+(?:\/\w+)?|[\d.]+%|[a-z][\w-]*(?:-[\w-]+)+|https?:\/\/\S+|[\w.-]+\.\w{2,}(?:\/\S*)?)/gi;

function formatAssistantContent(text: string) {
  const parts = text.split(DATA_PATTERN);
  return parts.map((part, i) => {
    if (DATA_PATTERN.test(part)) {
      DATA_PATTERN.lastIndex = 0;
      return (
        <code
          key={i}
          className="rounded bg-accent/8 px-1 py-0.5 font-mono text-[0.8125rem] text-accent"
        >
          {part}
        </code>
      );
    }
    DATA_PATTERN.lastIndex = 0;
    return part;
  });
}

export default function AskSentinelPage() {
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [conversationId, setConversationId] = useState<string | null>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLTextAreaElement>(null);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, isLoading]);

  useEffect(() => {
    if (inputRef.current) {
      inputRef.current.style.height = "auto";
      inputRef.current.style.height = `${Math.min(inputRef.current.scrollHeight, 120)}px`;
    }
  }, [input]);

  const sendMessage = useCallback(
    async (text?: string) => {
      const messageText = text || input.trim();
      if (!messageText || isLoading) return;

      const userMessage: Message = {
        id: `local_${Date.now()}`,
        role: "user",
        content: messageText,
        timestamp: new Date(),
      };

      setMessages((prev) => [...prev, userMessage]);
      setInput("");
      setIsLoading(true);

      try {
        const history = messages.map((m) => ({
          role: m.role,
          content: m.content,
        }));

        const res = await fetch("/api/v1/chat", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            message: messageText,
            conversationId,
            history,
          }),
        });

        if (!res.ok) throw new Error("Request failed");

        const data = await res.json();

        if (data.conversationId && !conversationId) {
          setConversationId(data.conversationId);
        }

        setMessages((prev) => [
          ...prev,
          {
            id: `local_${Date.now()}_resp`,
            role: "assistant",
            content: data.message,
            actions: data.actions,
            timestamp: new Date(),
          },
        ]);
      } catch {
        setMessages((prev) => [
          ...prev,
          {
            id: `err_${Date.now()}`,
            role: "assistant",
            content: "Something went wrong. Please try again.",
            timestamp: new Date(),
          },
        ]);
      } finally {
        setIsLoading(false);
        inputRef.current?.focus();
      }
    },
    [input, isLoading, messages, conversationId]
  );

  const handleKeyDown = useCallback(
    (e: React.KeyboardEvent) => {
      if (e.key === "Enter" && !e.shiftKey) {
        e.preventDefault();
        sendMessage();
      }
    },
    [sendMessage]
  );

  const inputBar = (
    <div className="px-4 pb-8 pt-4">
      <div className="mx-auto flex max-w-3xl items-end gap-3 border-b border-border pb-2">
        <textarea
          ref={inputRef}
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={handleKeyDown}
          placeholder="Ask Sentinel..."
          rows={1}
          className="flex-1 border-none bg-transparent text-base text-foreground placeholder:text-muted/60 resize-none focus:outline-none"
        />
        <button
          onClick={() => sendMessage()}
          disabled={!input.trim() || isLoading}
          className="mb-0.5 flex h-8 w-8 items-center justify-center rounded-lg text-muted transition-colors hover:bg-accent/10 hover:text-accent disabled:opacity-20 disabled:cursor-not-allowed"
        >
          {isLoading ? (
            <Loader2 className="h-4 w-4 animate-spin" />
          ) : (
            <Send className="h-4 w-4" />
          )}
        </button>
      </div>
    </div>
  );

  if (messages.length === 0) {
    return (
      <div className="-m-6 flex h-[calc(100vh-3.5rem)] flex-col">
        <div className="flex flex-1 flex-col items-center justify-center px-4">
          <div className="mb-6 flex h-20 w-20 items-center justify-center rounded-2xl bg-accent/10 shadow-[0_0_40px_-8px] shadow-accent/20">
            <Shield className="h-10 w-10 text-accent" />
          </div>
          <h1 className="mb-1.5 text-3xl font-light text-foreground">
            Ask Sentinel
          </h1>
          <p className="mb-10 text-sm text-muted/70">
            Your AI financial analyst for agent payments
          </p>

          <div className="flex w-full max-w-sm flex-col items-center gap-1">
            {STARTERS.map((q) => (
              <button
                key={q}
                onClick={() => sendMessage(q)}
                className="w-full py-2.5 text-center text-sm text-muted transition-all hover:text-foreground hover:underline hover:underline-offset-4 hover:decoration-accent/40"
              >
                {q}
              </button>
            ))}
          </div>
        </div>

        {inputBar}
      </div>
    );
  }

  return (
    <div className="-m-6 flex h-[calc(100vh-3.5rem)] flex-col">
      <div className="flex-1 space-y-1.5 overflow-y-auto px-4 py-6">
        <div className="mx-auto max-w-3xl space-y-1.5">
          {messages.map((msg) => (
            <div key={msg.id}>
              {msg.role === "user" ? (
                <div className="flex justify-end">
                  <div className="max-w-[80%] rounded-full bg-accent/10 px-4 py-2">
                    <span className="text-sm text-foreground">
                      {msg.content}
                    </span>
                  </div>
                </div>
              ) : (
                <div className="flex items-start gap-2.5 py-2">
                  <Shield className="mt-0.5 h-4 w-4 shrink-0 text-accent/60" />
                  <div className="min-w-0 text-sm leading-relaxed text-foreground/90 whitespace-pre-wrap">
                    {formatAssistantContent(msg.content)}
                  </div>
                </div>
              )}

              {msg.actions && msg.actions.length > 0 && (
                <div className="ml-6.5 mt-1.5 space-y-1">
                  {msg.actions.map((action, i) => (
                    <div
                      key={i}
                      className={`border-l-2 py-1 pl-3 text-sm ${
                        action.success
                          ? "border-emerald-500 text-emerald-400"
                          : "border-red-500 text-red-400"
                      }`}
                    >
                      <div className="flex items-center gap-1.5">
                        {action.success ? (
                          <CheckCircle2 className="h-3.5 w-3.5" />
                        ) : (
                          <AlertTriangle className="h-3.5 w-3.5" />
                        )}
                        <span className="font-medium capitalize">
                          {action.type.replace(/_/g, " ")}
                        </span>
                      </div>
                      <p className="mt-0.5 text-xs opacity-70">
                        {action.message}
                      </p>
                    </div>
                  ))}
                </div>
              )}
            </div>
          ))}

          {isLoading && (
            <div className="flex items-start gap-2.5 py-2">
              <Shield className="mt-0.5 h-4 w-4 shrink-0 text-accent/60" />
              <span className="text-sm text-accent animate-pulse">▊</span>
            </div>
          )}

          <div ref={messagesEndRef} />
        </div>
      </div>

      {inputBar}
    </div>
  );
}
