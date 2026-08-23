"use client";

import React from "react";
import { useAppStore } from "@/lib/store";
import {
  Compass,
  Navigation,
  Sliders,
  Sparkles,
  BookOpen,
} from "lucide-react";

export const MobileBottomDock: React.FC = () => {
  const {
    activeTab,
    setActiveTab,
    mapStyle,
    isAIAssistantOpen,
    setIsAIAssistantOpen,
  } = useAppStore();

  const isSatellite = mapStyle === "satellite";

  const NAV_ITEMS = [
    {
      id: "map" as const,
      label: "Map",
      icon: Compass,
      onClick: () => {
        setActiveTab("map");
        setIsAIAssistantOpen(false);
      },
      isActive: activeTab === "map" && !isAIAssistantOpen,
    },
    {
      id: "routes" as const,
      label: "Routes",
      icon: Navigation,
      onClick: () => {
        setActiveTab("routes");
        setIsAIAssistantOpen(false);
      },
      isActive: activeTab === "routes" && !isAIAssistantOpen,
    },
    {
      id: "simulator" as const,
      label: "Simulator",
      icon: Sliders,
      onClick: () => {
        setActiveTab("simulator");
        setIsAIAssistantOpen(false);
      },
      isActive: activeTab === "simulator" && !isAIAssistantOpen,
    },
    {
      id: "ai" as const,
      label: "AI Copilot",
      icon: Sparkles,
      onClick: () => {
        setIsAIAssistantOpen(!isAIAssistantOpen);
      },
      isActive: isAIAssistantOpen,
    },
    {
      id: "docs" as const,
      label: "Docs",
      icon: BookOpen,
      onClick: () => {
        setActiveTab("docs");
        setIsAIAssistantOpen(false);
      },
      isActive: activeTab === "docs" && !isAIAssistantOpen,
    },
  ];

  return (
    <div className={`fixed bottom-3 inset-x-3 z-[1100] flex md:hidden items-center justify-around p-1.5 rounded-2xl shadow-2xl backdrop-blur-2xl border transition-all duration-300 pointer-events-auto ${
      isSatellite
        ? "bg-white/15 backdrop-blur-xl border-white/30 text-white shadow-black/40"
        : "bg-white/95 backdrop-blur-md border-slate-200 text-slate-900 shadow-slate-300/60"
    }`}>
      {NAV_ITEMS.map((item) => {
        const Icon = item.icon;
        return (
          <button
            key={item.id}
            type="button"
            onClick={item.onClick}
            className={`flex-1 py-2 px-1 rounded-xl flex flex-col items-center justify-center gap-1 transition-all ${
              item.isActive
                ? isSatellite
                  ? "bg-white text-slate-950 font-extrabold shadow-md"
                  : "bg-slate-900 text-white font-extrabold shadow-md"
                : isSatellite
                ? "text-white/80 hover:text-white hover:bg-white/10 active:scale-95"
                : "text-slate-600 hover:text-slate-900 hover:bg-slate-100 active:scale-95"
            }`}
          >
            <Icon className="w-4 h-4" />
            <span className="text-[10px] font-medium tracking-tight leading-none">
              {item.label}
            </span>
          </button>
        );
      })}
    </div>
  );
};
