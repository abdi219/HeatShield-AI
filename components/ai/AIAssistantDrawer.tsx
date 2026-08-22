"use client";

import React, { useState, useRef, useEffect } from "react";
import { useAppStore } from "@/lib/store";
import { AIChatMessage } from "@/types";
import {
  X,
  Send,
  Trash2,
  Copy,
  Check,
  Bot,
  User,
  Maximize2,
  Minimize2,
  Plus,
  History,
  MessageSquare,
} from "lucide-react";

export function AIAssistantDrawer() {
  const {
    isAIAssistantOpen,
    setIsAIAssistantOpen,
    mapStyle,
    temperatureUnit,
    selectedLocation,
    selectedCity,
    fastestRoute,
    coolRoute,
    origin,
    destination,
    travelMode,
    selectedRouteId,
    simulationResult,
    simulationInterventions,
    activeTab,
    aiMessages,
    addAIMessage,
    isAIStreaming,
    setIsAIStreaming,
    aiSessions,
    activeSessionId,
    createNewChatSession,
    loadChatSession,
    deleteChatSession,
  } = useAppStore();

  const [inputQuery, setInputQuery] = useState("");
  const [copiedIndex, setCopiedIndex] = useState<number | null>(null);
  const [isExpanded, setIsExpanded] = useState(false);
  const [showSuggestions, setShowSuggestions] = useState(true);
  const [showHistory, setShowHistory] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement | null>(null);
  const inputRef = useRef<HTMLInputElement | null>(null);

  const isSatellite = mapStyle === "satellite";
  const unitSymbol = temperatureUnit === "celsius" ? "°C" : "°F";

  const formatTemp = (tempC: number) =>
    temperatureUnit === "fahrenheit" ? (tempC * 1.8 + 32).toFixed(1) : tempC.toFixed(1);

  // Auto-scroll on new messages or streaming chunks
  useEffect(() => {
    if (!showHistory) {
      messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
    }
  }, [aiMessages, isAIStreaming, showHistory]);

  // Focus input when opened
  useEffect(() => {
    if (isAIAssistantOpen && !showHistory) {
      setTimeout(() => inputRef.current?.focus(), 150);
    }
  }, [isAIAssistantOpen, showHistory]);

  if (!isAIAssistantOpen) return null;

  // Active Context Object
  const currentContext = {
    location: selectedLocation
      ? {
          lat: selectedLocation.lat,
          lng: selectedLocation.lng,
          address: selectedLocation.address,
          cityName: selectedCity,
          assessment: selectedLocation.data,
        }
      : undefined,
    routes:
      fastestRoute && coolRoute
        ? {
            originName: origin?.name || "Point A",
            destinationName: destination?.name || "Point B",
            travelMode,
            fastestRoute,
            coolRoute,
            selectedRouteId,
          }
        : undefined,
    simulation: simulationResult
      ? {
          result: simulationResult,
          interventions: simulationInterventions,
        }
      : undefined,
    activeTab,
  };

  // Clean, simple, conversational questions
  const suggestionChips = (() => {
    if (activeTab === "routes" && coolRoute) {
      return [
        "Why is the Cool Route better?",
        "How much heat do I avoid on this route?",
        "Is it safe to walk here right now?",
      ];
    }
    if (activeTab === "simulator" && simulationResult) {
      return [
        `How can we cool down ${simulationResult.locationName}?`,
        "How do trees reduce street heat?",
        "What is the best cooling plan here?",
      ];
    }
    if (selectedLocation?.data) {
      return [
        "Why is this street so hot?",
        "How can we cool this neighborhood?",
        "Is it safe to walk outside right now?",
      ];
    }
    return [
      `Where are the hottest areas in ${selectedCity}?`,
      "How do street temperatures affect pedestrians?",
      "How can cities design cooler walking paths?",
    ];
  })();

  const handleSendMessage = async (textToSend?: string) => {
    const query = (textToSend || inputQuery).trim();
    if (!query || isAIStreaming) return;

    setInputQuery("");
    setShowSuggestions(false);
    setShowHistory(false);

    // Add user message
    const userMsg: AIChatMessage = {
      id: `user-${Date.now()}`,
      role: "user",
      content: query,
      timestamp: new Date().toISOString(),
    };
    addAIMessage(userMsg);

    // Prepare assistant placeholder message
    const assistantMsgId = `assistant-${Date.now()}`;
    const assistantMsg: AIChatMessage = {
      id: assistantMsgId,
      role: "assistant",
      content: "",
      timestamp: new Date().toISOString(),
    };
    addAIMessage(assistantMsg);
    setIsAIStreaming(true);

    try {
      const history = [...aiMessages, userMsg].map((m) => ({
        role: m.role,
        content: m.content,
      }));

      const res = await fetch("/api/ai/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          messages: history,
          context: currentContext,
        }),
      });

      if (!res.ok || !res.body) {
        throw new Error("Failed to connect to AI streaming engine");
      }

      const reader = res.body.getReader();
      const decoder = new TextDecoder();
      let streamedText = "";

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;

        const chunk = decoder.decode(value, { stream: true });
        streamedText += chunk;

        // Update the assistant message in state
        useAppStore.setState((state) => ({
          aiMessages: state.aiMessages.map((m) =>
            m.id === assistantMsgId ? { ...m, content: streamedText } : m
          ),
        }));
      }
    } catch (error) {
      console.error("AI Assistant streaming error:", error);
      useAppStore.setState((state) => ({
        aiMessages: state.aiMessages.map((m) =>
          m.id === assistantMsgId
            ? {
                ...m,
                content:
                  "### Connection Notice\nI encountered a temporary connection delay. Please ask your question again.",
              }
            : m
        ),
      }));
    } finally {
      setIsAIStreaming(false);
    }
  };

  const handleCopyMessage = (content: string, index: number) => {
    navigator.clipboard.writeText(content);
    setCopiedIndex(index);
    setTimeout(() => setCopiedIndex(null), 2000);
  };

  const handleNewChat = () => {
    createNewChatSession();
    setShowHistory(false);
    setShowSuggestions(true);
  };

  // Helper to parse bold, italic, code, strip LaTeX tokens, and clean emojis (Pure Monochrome)
  const renderInlineText = (text: string) => {
    // Strip emojis
    let clean = text.replace(/[\uD83C-\uDBFF\uDC00-\uDFFF\u2600-\u27BF]/g, "");
    
    // Strip raw LaTeX formatting tokens if present
    clean = clean
      .replace(/\\\[/g, "")
      .replace(/\\\]/g, "")
      .replace(/\\\(/g, "")
      .replace(/\\\)/g, "")
      .replace(/\\text\{([^}]+)\}/g, "$1")
      .replace(/\\frac\{([^}]+)\}\{([^}]+)\}/g, "$1 / $2")
      .replace(/\\approx/g, "≈")
      .replace(/\\times/g, "×");

    // Split on **bold**
    const boldParts = clean.split(/(\*\*.*?\*\*)/g);
    return boldParts.map((bPart, i) => {
      if (bPart.startsWith("**") && bPart.endsWith("**")) {
        return (
          <strong
            key={`b-${i}`}
            className={`font-bold ${
              isSatellite ? "text-white" : "text-slate-950"
            }`}
          >
            {bPart.slice(2, -2)}
          </strong>
        );
      }

      // Split on *italic* or *(italic)*
      const italicParts = bPart.split(/(\*.*?\*)/g);
      return italicParts.map((iPart, j) => {
        if (iPart.startsWith("*") && iPart.endsWith("*") && iPart.length > 2) {
          return (
            <span key={`it-${i}-${j}`} className="italic opacity-85">
              {iPart.slice(1, -1)}
            </span>
          );
        }

        // Split on `code`
        const codeParts = iPart.split(/(`.*?`)/g);
        return codeParts.map((cPart, k) => {
          if (cPart.startsWith("`") && cPart.endsWith("`")) {
            return (
              <code
                key={`c-${i}-${j}-${k}`}
                className={`px-1.5 py-0.5 rounded font-mono text-[11px] ${
                  isSatellite
                    ? "bg-white/10 text-white border border-white/20"
                    : "bg-slate-200/80 text-slate-800 border border-slate-300"
                }`}
              >
                {cPart.slice(1, -1)}
              </code>
            );
          }
          return cPart;
        });
      });
    });
  };

  // Pure Monochrome (Black & White) theme classes
  const drawerBg = isSatellite
    ? "bg-[#0B0F17]/98 backdrop-blur-3xl border-l border-white/10 text-white shadow-2xl"
    : "bg-white border-l border-slate-200 text-slate-900 shadow-2xl";
  const subcardBg = isSatellite ? "bg-white/5 border-b border-white/10" : "bg-slate-50 border-b border-slate-200";
  const textPrimary = isSatellite ? "text-white" : "text-slate-900";
  const textSecondary = isSatellite ? "text-white/90" : "text-slate-700";
  const textMuted = isSatellite ? "text-white/60" : "text-slate-400";
  const border = isSatellite ? "border-white/10" : "border-slate-200";

  // Width class with expand option
  const drawerWidth = isExpanded
    ? "w-full sm:w-[680px] md:w-[760px] lg:w-[840px]"
    : "w-full sm:w-[480px] md:w-[540px] lg:w-[580px]";

  return (
    <div
      className={`fixed top-0 right-0 h-full ${drawerWidth} z-[1200] flex flex-col transition-all duration-300 ease-in-out animate-in slide-in-from-right-full ${drawerBg}`}
    >
      {/* ── 1. Drawer Header ── */}
      <div className={`p-3.5 border-b flex items-center justify-between shrink-0 ${border}`}>
        <div className="flex items-center gap-2.5">
          <div className={`w-8 h-8 rounded-lg flex items-center justify-center shadow-sm ${
            isSatellite ? "bg-white/10 text-white border border-white/20" : "bg-slate-900 text-white"
          }`}>
            <Bot className="w-4 h-4" />
          </div>
          <div>
            <h3 className={`text-xs font-bold tracking-tight ${textPrimary}`}>
              HeatShield AI Copilot
            </h3>
            <p className={`text-[10px] font-mono block ${textMuted}`}>
              Urban Heat Advisor
            </p>
          </div>
        </div>

        <div className="flex items-center gap-1">
          {/* New Chat Button */}
          <button
            type="button"
            onClick={handleNewChat}
            title="Start New Chat Session"
            className={`px-2.5 py-1.5 rounded-lg text-xs font-medium transition-all flex items-center gap-1 ${
              isSatellite
                ? "bg-white/10 hover:bg-white/20 text-white border border-white/15"
                : "bg-slate-100 hover:bg-slate-200 text-slate-800 border border-slate-200"
            }`}
          >
            <Plus className="w-3.5 h-3.5" />
            <span className="text-[11px]">New</span>
          </button>

          {/* History Button */}
          {aiSessions.length > 0 && (
            <button
              type="button"
              onClick={() => setShowHistory(!showHistory)}
              title="View Chat Sessions History"
              className={`p-1.5 rounded-lg transition-all ${
                showHistory
                  ? isSatellite
                    ? "bg-white text-slate-950 font-bold"
                    : "bg-slate-900 text-white"
                  : isSatellite
                  ? "hover:bg-white/10 text-white/80"
                  : "hover:bg-slate-100 text-slate-600"
              }`}
            >
              <History className="w-4 h-4" />
            </button>
          )}

          {/* Width Expand / Collapse Button */}
          <button
            type="button"
            onClick={() => setIsExpanded(!isExpanded)}
            title={isExpanded ? "Compact View" : "Expand Drawer"}
            className={`p-1.5 rounded-lg transition-all hidden sm:flex items-center text-xs ${
              isSatellite
                ? "hover:bg-white/10 text-white/80 hover:text-white"
                : "hover:bg-slate-100 text-slate-600 hover:text-slate-900"
            }`}
          >
            {isExpanded ? <Minimize2 className="w-4 h-4" /> : <Maximize2 className="w-4 h-4" />}
          </button>

          <button
            type="button"
            onClick={() => setIsAIAssistantOpen(false)}
            title="Close Assistant"
            className={`p-1.5 rounded-lg transition-all ${
              isSatellite ? "hover:bg-white/10 text-white/70 hover:text-white" : "hover:bg-slate-100 text-slate-600"
            }`}
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* ── Optional History Panel Overlay ── */}
      {showHistory ? (
        <div className="flex-1 overflow-y-auto p-4 space-y-3 scrollbar-thin">
          <div className="flex items-center justify-between pb-2 border-b border-white/10">
            <span className={`text-xs font-bold uppercase tracking-wider ${textMuted}`}>
              Saved Chat Sessions ({aiSessions.length})
            </span>
            <button
              type="button"
              onClick={() => setShowHistory(false)}
              className={`text-[11px] font-mono ${textMuted} hover:opacity-100`}
            >
              Close History ✕
            </button>
          </div>

          <div className="space-y-2">
            {aiSessions.map((session) => (
              <div
                key={session.id}
                className={`p-3 rounded-xl border flex items-center justify-between gap-3 transition-all cursor-pointer ${
                  activeSessionId === session.id
                    ? isSatellite
                      ? "bg-white/15 border-white/30 text-white"
                      : "bg-slate-100 border-slate-300 text-slate-950 font-bold"
                    : isSatellite
                    ? "bg-white/5 border-white/10 hover:bg-white/10 text-white/90"
                    : "bg-white border-slate-200 hover:bg-slate-50 text-slate-800"
                }`}
                onClick={() => {
                  loadChatSession(session.id);
                  setShowHistory(false);
                }}
              >
                <div className="min-w-0 flex-1 flex items-center gap-2.5">
                  <MessageSquare className="w-4 h-4 shrink-0 opacity-70" />
                  <div className="truncate">
                    <p className="text-xs font-semibold truncate">{session.title}</p>
                    <span className={`text-[10px] font-mono block ${textMuted}`}>
                      {new Date(session.updatedAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })} • {session.messages.length} messages
                    </span>
                  </div>
                </div>

                <button
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation();
                    deleteChatSession(session.id);
                  }}
                  title="Delete Session"
                  className={`p-1.5 rounded-lg opacity-60 hover:opacity-100 transition-opacity ${
                    isSatellite ? "hover:bg-white/20 text-white" : "hover:bg-slate-200 text-slate-600"
                  }`}
                >
                  <Trash2 className="w-3.5 h-3.5" />
                </button>
              </div>
            ))}
          </div>
        </div>
      ) : (
        <>
          {/* ── 2. Live Telemetry Grounding Header ── */}
          <div className={`px-4 py-2 border-b shrink-0 flex items-center justify-between text-xs ${subcardBg} ${border}`}>
            <div className="truncate pr-2">
              <span className={`text-[9px] font-mono font-bold uppercase tracking-wider block ${
                isSatellite ? "text-white/60" : "text-slate-500"
              }`}>
                Active Spatial Grounding
              </span>
              <span className={`text-[11px] font-mono font-bold truncate block ${textPrimary}`}>
                {selectedLocation?.address && selectedLocation?.data
                  ? `${selectedLocation.address} (${formatTemp(selectedLocation.data.surfaceTemp)}${unitSymbol})`
                  : coolRoute
                  ? `Route: ${origin?.name || "A"} -> ${destination?.name || "B"} (-${coolRoute.exposureReductionPct}% Heat)`
                  : simulationResult
                  ? `Simulation: ${simulationResult.locationName} (-${simulationResult.temperatureReductionDelta}°C)`
                  : `${selectedCity} Regional Baseline`}
              </span>
            </div>

            <span className={`text-[10px] font-mono shrink-0 px-2 py-0.5 rounded-md border font-semibold ${
              isSatellite ? "bg-white/10 text-white border-white/20" : "bg-white text-slate-800 border-slate-200"
            }`}>
              {selectedLocation?.data ? `HRS: ${selectedLocation.data.score}/100` : selectedCity}
            </span>
          </div>

          {/* ── 3. Chat Messages Body ── */}
          <div className="flex-1 overflow-y-auto p-4 space-y-4 scrollbar-thin">
            {aiMessages.map((msg, index) => {
              const isUser = msg.role === "user";
              const isAwaitingChunk = !isUser && !msg.content && isAIStreaming;

              return (
                <div
                  key={msg.id}
                  className={`flex gap-2.5 ${isUser ? "justify-end" : "justify-start"}`}
                >
                  {!isUser && (
                    <div className={`w-7 h-7 rounded-lg flex items-center justify-center shrink-0 mt-0.5 border ${
                      isSatellite
                        ? "bg-white/10 text-white border-white/20"
                        : "bg-slate-900 text-white border-slate-800"
                    }`}>
                      <Bot className="w-4 h-4" />
                    </div>
                  )}

                  <div className={`relative group max-w-[90%] rounded-2xl px-4 py-3 text-xs shadow-sm ${
                    isUser
                      ? isSatellite
                        ? "bg-white text-slate-950 font-bold rounded-br-none shadow-lg"
                        : "bg-slate-900 text-white rounded-br-none shadow-slate-900/10 font-medium"
                      : isSatellite
                      ? "bg-white/5 text-white border border-white/15 rounded-bl-none shadow-lg leading-relaxed"
                      : "bg-white text-slate-800 border border-slate-200 rounded-bl-none shadow-sm leading-relaxed"
                  }`}>
                    {/* If awaiting first token: render sleek typing animation inside card */}
                    {isAwaitingChunk ? (
                      <div className="flex items-center gap-1.5 py-1 px-0.5 text-xs font-mono">
                        <span className="w-2 h-2 rounded-full bg-white animate-bounce" />
                        <span className="w-2 h-2 rounded-full bg-white animate-bounce [animation-delay:0.2s]" />
                        <span className="w-2 h-2 rounded-full bg-white animate-bounce [animation-delay:0.4s]" />
                        <span className={`text-[11px] ml-2 ${isSatellite ? "text-white/80" : "text-slate-500"}`}>
                          Analyzing street microclimate...
                        </span>
                      </div>
                    ) : (
                      /* Render formatted markdown (Pure Monochrome) */
                      <div className="space-y-2 break-words">
                        {msg.content.split("\n").map((line, lIdx) => {
                          const trimmed = line.trim();
                          if (!trimmed) return <div key={lIdx} className="h-1" />;

                          // Filter out raw LaTeX math blocks
                          if (trimmed.startsWith("\\[") || trimmed.startsWith("\\]") || trimmed.startsWith("\\(") || trimmed.startsWith("\\)")) {
                            return null;
                          }

                          // Headers
                          if (trimmed.startsWith("#### ")) {
                            return (
                              <h5
                                key={lIdx}
                                className={`font-bold text-xs pt-2 pb-0.5 tracking-tight ${
                                  isSatellite ? "text-white font-bold" : "text-slate-950 font-bold"
                                }`}
                              >
                                {renderInlineText(trimmed.replace(/^####\s+/, ""))}
                              </h5>
                            );
                          }
                          if (trimmed.startsWith("### ")) {
                            return (
                              <h4
                                key={lIdx}
                                className={`font-extrabold text-[13px] pt-2 pb-0.5 border-b tracking-tight ${
                                  isSatellite
                                    ? "text-white border-white/10 font-extrabold"
                                    : "text-slate-950 border-slate-100 font-extrabold"
                                }`}
                              >
                                {renderInlineText(trimmed.replace(/^###\s+/, ""))}
                              </h4>
                            );
                          }
                          if (trimmed.startsWith("## ")) {
                            return (
                              <h3
                                key={lIdx}
                                className={`font-extrabold text-sm pt-2.5 pb-1 border-b tracking-tight ${
                                  isSatellite
                                    ? "text-white border-white/15 font-extrabold"
                                    : "text-slate-950 border-slate-200 font-extrabold"
                                }`}
                              >
                                {renderInlineText(trimmed.replace(/^##\s+/, ""))}
                              </h3>
                            );
                          }
                          if (trimmed.startsWith("# ")) {
                            return (
                              <h2
                                key={lIdx}
                                className={`font-extrabold text-base pt-3 pb-1 border-b tracking-tight ${
                                  isSatellite
                                    ? "text-white border-white/20 font-extrabold"
                                    : "text-slate-950 border-slate-200 font-extrabold"
                                }`}
                              >
                                {renderInlineText(trimmed.replace(/^#\s+/, ""))}
                              </h2>
                            );
                          }

                          // Bullet points
                          if (trimmed.startsWith("- ") || trimmed.startsWith("* ")) {
                            return (
                              <div key={lIdx} className="flex items-start gap-2 pl-1">
                                <span className={`shrink-0 leading-tight font-bold ${
                                  isSatellite ? "text-white/80" : "text-slate-500"
                                }`}>•</span>
                                <span className="leading-relaxed">
                                  {renderInlineText(trimmed.replace(/^[-*]\s+/, ""))}
                                </span>
                              </div>
                            );
                          }

                          // Numbered lists
                          const numMatch = trimmed.match(/^(\d+)\.\s+(.*)/);
                          if (numMatch) {
                            return (
                              <div key={lIdx} className="flex items-start gap-2 pl-1">
                                <span className={`font-mono font-bold shrink-0 text-[10px] mt-0.5 ${
                                  isSatellite ? "text-white font-bold" : "text-slate-900 font-bold"
                                }`}>
                                  {numMatch[1]}.
                                </span>
                                <span className="leading-relaxed">
                                  {renderInlineText(numMatch[2])}
                                </span>
                              </div>
                            );
                          }

                          // Table separator rows (e.g. |---|---|)
                          if (trimmed.startsWith("|") && trimmed.includes("---")) {
                            return null;
                          }

                          // Table data rows
                          if (trimmed.startsWith("|") && trimmed.endsWith("|")) {
                            const cells = trimmed
                              .split("|")
                              .slice(1, -1)
                              .map((c) => c.trim());
                            return (
                              <div
                                key={lIdx}
                                className={`grid grid-flow-col auto-cols-fr gap-2 py-2 px-3 rounded-lg text-[11px] font-mono border ${
                                  isSatellite
                                    ? "bg-white/5 border-white/15 text-white"
                                    : "bg-slate-50 border-slate-200 text-slate-800"
                                }`}
                              >
                                {cells.map((cell, cIdx) => (
                                  <span key={cIdx} className="leading-tight font-medium">
                                    {renderInlineText(cell)}
                                  </span>
                                ))}
                              </div>
                            );
                          }

                          return <p key={lIdx} className="leading-relaxed">{renderInlineText(line)}</p>;
                        })}
                      </div>
                    )}

                    {/* Copy Button for Assistant responses */}
                    {!isUser && msg.content && (
                      <button
                        type="button"
                        onClick={() => handleCopyMessage(msg.content, index)}
                        title="Copy response"
                        className={`absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity p-1.5 rounded-lg border shadow-xs ${
                          isSatellite
                            ? "bg-white/10 text-white border-white/20 hover:bg-white/20"
                            : "bg-white text-slate-700 border-slate-200 hover:bg-slate-100"
                        }`}
                      >
                        {copiedIndex === index ? (
                          <Check className="w-3.5 h-3.5 text-white" />
                        ) : (
                          <Copy className="w-3.5 h-3.5" />
                        )}
                      </button>
                    )}
                  </div>

                  {isUser && (
                    <div className={`w-7 h-7 rounded-lg flex items-center justify-center shrink-0 mt-0.5 ${
                      isSatellite ? "bg-white text-slate-950 font-bold" : "bg-slate-900 text-white"
                    }`}>
                      <User className="w-4 h-4" />
                    </div>
                  )}
                </div>
              );
            })}

            <div ref={messagesEndRef} />
          </div>

          {/* ── 4. Suggested Questions (Clean Typography Pills) ── */}
          {showSuggestions ? (
            <div className={`p-3 border-t space-y-2 shrink-0 ${border}`}>
              <div className="flex items-center justify-between">
                <span className={`text-[9px] font-mono font-bold uppercase tracking-wider block ${textMuted}`}>
                  Suggested Questions
                </span>
                <button
                  type="button"
                  onClick={() => setShowSuggestions(false)}
                  className={`text-[10px] font-mono ${textMuted} hover:opacity-100`}
                >
                  Hide ✕
                </button>
              </div>
              <div className="flex flex-wrap gap-1.5">
                {suggestionChips.map((chip, idx) => (
                  <button
                    key={idx}
                    type="button"
                    onClick={() => handleSendMessage(chip)}
                    disabled={isAIStreaming}
                    className={`px-3.5 py-1.5 rounded-xl text-[11px] font-medium border text-left transition-all truncate max-w-full ${
                      isSatellite
                        ? "bg-white/10 hover:bg-white/20 text-white border-white/20 shadow-sm"
                        : "bg-white hover:bg-slate-100 text-slate-800 border-slate-200 shadow-xs"
                    }`}
                  >
                    <span className="truncate">{chip}</span>
                  </button>
                ))}
              </div>
            </div>
          ) : (
            <div className={`px-4 py-2 border-t shrink-0 flex justify-end ${border}`}>
              <button
                type="button"
                onClick={() => setShowSuggestions(true)}
                className={`text-[10px] font-mono transition-colors ${
                  isSatellite ? "text-white/70 hover:text-white" : "text-slate-500 hover:text-slate-900"
                }`}
              >
                Suggested Questions ▾
              </button>
            </div>
          )}

          {/* ── 5. Chat Input Bar ── */}
          <div className={`p-3.5 border-t shrink-0 ${drawerBg} ${border}`}>
            <form
              onSubmit={(e) => {
                e.preventDefault();
                handleSendMessage();
              }}
              className="flex items-center gap-2"
            >
              <input
                ref={inputRef}
                type="text"
                placeholder="Ask about street temperatures, shade routes, or cooling..."
                value={inputQuery}
                onChange={(e) => setInputQuery(e.target.value)}
                disabled={isAIStreaming}
                className={`flex-1 px-4 py-2 text-xs rounded-xl border focus:outline-none transition-all shadow-xs ${
                  isSatellite
                    ? "bg-white/5 text-white border-white/15 placeholder-white/40 focus:border-white/40"
                    : "bg-slate-50 text-slate-900 border-slate-300 placeholder-slate-400 focus:border-slate-800"
                }`}
              />
              <button
                type="submit"
                disabled={!inputQuery.trim() || isAIStreaming}
                className={`p-2.5 rounded-xl font-bold shadow-md disabled:opacity-40 disabled:cursor-not-allowed transition-all ${
                  isSatellite
                    ? "bg-white hover:bg-slate-200 text-slate-950"
                    : "bg-slate-900 hover:bg-slate-800 text-white"
                }`}
              >
                <Send className="w-4 h-4" />
              </button>
            </form>
          </div>
        </>
      )}
    </div>
  );
}
