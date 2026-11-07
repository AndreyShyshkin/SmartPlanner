'use client';

import React, { useRef } from 'react';
import { usePlannerStore, AppTab } from '@/store/usePlannerStore';
import {
  Home,
  LayoutGrid,
  Cpu,
  PlayCircle,
  Download,
  Upload,
  RotateCcw,
  Sparkles,
} from 'lucide-react';

interface HeaderNavProps {
  onBackToWelcome: () => void;
  onOpenScenesModal: () => void;
  onOpenAutomationsModal: () => void;
}

export const HeaderNav: React.FC<HeaderNavProps> = ({
  onBackToWelcome,
  onOpenScenesModal,
  onOpenAutomationsModal,
}) => {
  const {
    activeTab,
    setActiveTab,
    exportProjectJSON,
    loadProjectJSON,
  } = usePlannerStore();

  const fileInputRef = useRef<HTMLInputElement | null>(null);

  const tabs: { id: AppTab; label: string; icon: React.ReactNode }[] = [
    { id: 'planner', label: 'Планування', icon: <LayoutGrid className="w-4 h-4" /> },
    { id: 'devices', label: 'Розумні пристрої', icon: <Cpu className="w-4 h-4" /> },
    { id: 'simulation', label: 'Симуляція', icon: <PlayCircle className="w-4 h-4" /> },
  ];

  const handleExport = () => {
    const jsonStr = exportProjectJSON();
    const blob = new Blob([jsonStr], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `smart-home-plan-${new Date().toISOString().slice(0, 10)}.json`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  const handleImportFile = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      const content = event.target?.result as string;
      const success = loadProjectJSON(content);
      if (success) {
        alert('Проєкт успішно завантажено!');
      } else {
        alert('Помилка під час читання файлу проєкту JSON.');
      }
    };
    reader.readAsText(file);
    e.target.value = '';
  };

  return (
    <header className="h-16 w-full bg-white/80 backdrop-blur-xl border-b border-black/10 px-6 flex items-center justify-between select-none z-30">
      {/* Brand logo & back to home */}
      <div className="flex items-center gap-3">
        <button
          onClick={onBackToWelcome}
          title="Повернутися на головний екран"
          className="flex items-center gap-2 px-3 py-1.5 rounded-xl hover:bg-zinc-100 transition-all text-zinc-900 group"
        >
          <div className="w-8 h-8 rounded-xl bg-[#0071E3] flex items-center justify-center text-white shadow-sm group-hover:scale-105 transition-transform">
            <Home className="w-4 h-4 stroke-[2.5]" />
          </div>
          <div className="text-left hidden sm:block">
            <span className="font-bold text-sm tracking-tight block leading-none">
              SmartPlanner
            </span>
            <span className="text-[10px] text-zinc-400 font-medium leading-none">
              2D Apple Home Studio
            </span>
          </div>
        </button>
      </div>

      {/* Segmented Center Navigation Tabs (3 Main Modes) */}
      <nav className="flex items-center bg-zinc-100/90 p-1 rounded-2xl border border-black/5 shadow-inner">
        {tabs.map((tab) => {
          const isActive = activeTab === tab.id;
          return (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`px-4 py-1.5 rounded-xl text-xs font-semibold flex items-center gap-2 transition-all duration-200 ${
                isActive
                  ? 'bg-white text-zinc-900 shadow-sm'
                  : 'text-zinc-500 hover:text-zinc-900 hover:bg-white/50'
              }`}
            >
              {tab.icon}
              <span>{tab.label}</span>
            </button>
          );
        })}
      </nav>

      {/* Right side Project Persistence & Shortcuts */}
      <div className="flex items-center gap-2">
        {/* Hidden file input */}
        <input
          ref={fileInputRef}
          type="file"
          accept=".json"
          onChange={handleImportFile}
          className="hidden"
        />

        {/* Import JSON */}
        <button
          onClick={() => fileInputRef.current?.click()}
          title="Завантажити проєкт з JSON"
          className="p-2 text-zinc-600 hover:text-zinc-950 hover:bg-zinc-100 rounded-xl text-xs font-medium flex items-center gap-1.5 transition-colors"
        >
          <Upload className="w-4 h-4" />
          <span className="hidden md:inline">Завантажити</span>
        </button>

        {/* Export JSON */}
        <button
          onClick={handleExport}
          title="Зберегти проєкт у JSON"
          className="px-3.5 py-1.5 bg-zinc-900 hover:bg-zinc-800 text-white rounded-xl text-xs font-semibold flex items-center gap-1.5 transition-all shadow-xs active:scale-95"
        >
          <Download className="w-3.5 h-3.5" />
          <span>Експорт JSON</span>
        </button>
      </div>
    </header>
  );
};
