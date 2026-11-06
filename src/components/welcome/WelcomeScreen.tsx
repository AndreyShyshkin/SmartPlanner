'use client';

import React, { useRef } from 'react';
import { usePlannerStore } from '@/store/usePlannerStore';
import {
  Home,
  PlusCircle,
  Upload,
  ArrowRight,
  ShieldCheck,
  Cpu,
  Layers,
  Sparkles,
  FileCode,
  Compass,
} from 'lucide-react';

interface WelcomeScreenProps {
  onEnterPlanner: () => void;
}

export const WelcomeScreen: React.FC<WelcomeScreenProps> = ({ onEnterPlanner }) => {
  const { loadTemplate, loadProjectJSON } = usePlannerStore();
  const fileInputRef = useRef<HTMLInputElement | null>(null);

  const handleStartPreset = (preset: 'apartment' | 'studio' | 'empty') => {
    loadTemplate(preset);
    onEnterPlanner();
  };

  const handleImportFile = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      const content = event.target?.result as string;
      const success = loadProjectJSON(content);
      if (success) {
        onEnterPlanner();
      } else {
        alert('Не удалось загрузить файл проекта JSON. Проверьте формат файла.');
      }
    };
    reader.readAsText(file);
    e.target.value = '';
  };

  return (
    <div className="relative min-h-screen w-full bg-[#F5F5F7] text-zinc-900 flex flex-col justify-between selection:bg-blue-100 selection:text-blue-900 select-none overflow-y-auto">
      {/* Hidden file input */}
      <input
        ref={fileInputRef}
        type="file"
        accept=".json"
        onChange={handleImportFile}
        className="hidden"
      />

      {/* Decorative background glow */}
      <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[700px] h-[350px] bg-gradient-to-b from-blue-400/15 to-transparent blur-3xl pointer-events-none" />

      {/* Main Container */}
      <div className="relative max-w-5xl mx-auto px-6 pt-16 pb-12 flex-1 flex flex-col justify-center">
        {/* Brand Hero */}
        <div className="text-center max-w-2xl mx-auto space-y-4">
          <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-white/80 border border-black/10 text-xs font-semibold text-zinc-700 shadow-xs mb-2">
            <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
            2D Планер Умного Дома • Apple Home Edition
          </div>

          <h1 className="text-4xl sm:text-5xl md:text-6xl font-bold tracking-tight text-zinc-950">
            Проектируйте дом. <br />
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-[#0071E3] via-blue-600 to-indigo-600">
              Управляйте в реальном времени.
            </span>
          </h1>

          <p className="text-sm sm:text-base text-zinc-500 leading-relaxed max-w-xl mx-auto">
            Интерактивный планер с матричной сеткой комнат, умными устройствами Apple Home, сценариями, IF-THEN автоматизациями и физической симуляцией видимости через стены.
          </p>
        </div>

        {/* Primary Action Cards: Create New or Load Existing */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mt-12 max-w-3xl mx-auto w-full">
          {/* Card 1: Create New Plan */}
          <div className="bg-white/90 backdrop-blur-xl border border-black/10 rounded-3xl p-6 shadow-apple hover:shadow-apple-hover transition-all flex flex-col justify-between group">
            <div>
              <div className="w-12 h-12 rounded-2xl bg-blue-50 border border-blue-100 flex items-center justify-center text-[#0071E3] mb-4 group-hover:scale-105 transition-transform">
                <PlusCircle className="w-6 h-6 stroke-[2.2]" />
              </div>

              <h2 className="text-xl font-bold text-zinc-900">Создать новый план</h2>
              <p className="text-xs text-zinc-500 mt-1 leading-relaxed">
                Начните с готового смарт-шаблона с датчиками и правилами, или спроектируйте планировку с чистого листа.
              </p>
            </div>

            {/* Template options */}
            <div className="mt-6 space-y-2.5">
              <button
                onClick={() => handleStartPreset('apartment')}
                className="w-full p-3 bg-zinc-50 hover:bg-blue-50/70 border border-black/5 hover:border-blue-200 rounded-2xl text-left transition-all flex items-center justify-between group/btn"
              >
                <div>
                  <span className="text-xs font-bold text-zinc-900 block group-hover/btn:text-[#0071E3] transition-colors">
                    2-Комнатная квартира (Рекомендуется)
                  </span>
                  <span className="text-[11px] text-zinc-400">
                    Гостиная, спальня, кухня, датчики, свет, сценарии
                  </span>
                </div>
                <ArrowRight className="w-4 h-4 text-zinc-400 group-hover/btn:text-[#0071E3] group-hover/btn:translate-x-1 transition-all" />
              </button>

              <button
                onClick={() => handleStartPreset('empty')}
                className="w-full p-3 bg-zinc-50 hover:bg-zinc-100 border border-black/5 rounded-2xl text-left transition-all flex items-center justify-between group/btn"
              >
                <div>
                  <span className="text-xs font-bold text-zinc-900 block">
                    Чистый холст
                  </span>
                  <span className="text-[11px] text-zinc-400">
                    Пустая матричная сетка для свободного черчения
                  </span>
                </div>
                <ArrowRight className="w-4 h-4 text-zinc-400 group-hover/btn:translate-x-1 transition-all" />
              </button>
            </div>
          </div>

          {/* Card 2: Load Existing Plan */}
          <div
            onClick={() => fileInputRef.current?.click()}
            className="bg-white/90 backdrop-blur-xl border-2 border-dashed border-black/15 hover:border-[#0071E3] rounded-3xl p-6 shadow-apple hover:shadow-apple-hover transition-all flex flex-col justify-between cursor-pointer group"
          >
            <div>
              <div className="w-12 h-12 rounded-2xl bg-amber-50 border border-amber-100 flex items-center justify-center text-amber-600 mb-4 group-hover:scale-105 transition-transform">
                <Upload className="w-6 h-6 stroke-[2.2]" />
              </div>

              <h2 className="text-xl font-bold text-zinc-900">Загрузить имеющийся план</h2>
              <p className="text-xs text-zinc-500 mt-1 leading-relaxed">
                Импортируйте сохраненный проект из файла <code className="text-[11px] bg-zinc-100 px-1.5 py-0.5 rounded font-mono">.json</code> со всеми комнатами, стенами, устройствами и автоматизациями.
              </p>
            </div>

            <div className="mt-8 p-6 bg-zinc-50 rounded-2xl border border-black/5 text-center group-hover:bg-blue-50/40 transition-colors">
              <FileCode className="w-8 h-8 text-zinc-400 mx-auto mb-2 group-hover:text-[#0071E3] transition-colors" />
              <span className="text-xs font-semibold text-zinc-700 block">
                Нажмите для выбора файла JSON
              </span>
              <span className="text-[11px] text-zinc-400 mt-0.5 block">
                или перетащите файл сюда
              </span>
            </div>
          </div>
        </div>

        {/* Feature Highlights Pills */}
        <div className="mt-14 grid grid-cols-2 md:grid-cols-4 gap-4 max-w-4xl mx-auto w-full">
          <div className="bg-white/70 border border-black/5 p-4 rounded-2xl flex items-center gap-3">
            <div className="p-2 bg-blue-50 text-blue-600 rounded-xl">
              <Compass className="w-4 h-4" />
            </div>
            <div>
              <h4 className="text-xs font-semibold text-zinc-900">Матричная сетка</h4>
              <p className="text-[11px] text-zinc-400">Область, кисть, ластик</p>
            </div>
          </div>

          <div className="bg-white/70 border border-black/5 p-4 rounded-2xl flex items-center gap-3">
            <div className="p-2 bg-purple-50 text-purple-600 rounded-xl">
              <ShieldCheck className="w-4 h-4" />
            </div>
            <div>
              <h4 className="text-xs font-semibold text-zinc-900">Raycast сенсоры</h4>
              <p className="text-[11px] text-zinc-400">Стены блокируют обзор</p>
            </div>
          </div>

          <div className="bg-white/70 border border-black/5 p-4 rounded-2xl flex items-center gap-3">
            <div className="p-2 bg-emerald-50 text-emerald-600 rounded-xl">
              <Cpu className="w-4 h-4" />
            </div>
            <div>
              <h4 className="text-xs font-semibold text-zinc-900">IF-THEN правила</h4>
              <p className="text-[11px] text-zinc-400">Сценарии и триггеры</p>
            </div>
          </div>

          <div className="bg-white/70 border border-black/5 p-4 rounded-2xl flex items-center gap-3">
            <div className="p-2 bg-amber-50 text-amber-600 rounded-xl">
              <FileCode className="w-4 h-4" />
            </div>
            <div>
              <h4 className="text-xs font-semibold text-zinc-900">OOP & SOLID</h4>
              <p className="text-[11px] text-zinc-400">Чистая архитектура</p>
            </div>
          </div>
        </div>
      </div>

      {/* Footer */}
      <footer className="py-4 text-center text-xs text-zinc-400 border-t border-black/5">
        SmartPlanner • Next.js + Tailwind + Zustand • Apple Home Minimalism
      </footer>
    </div>
  );
};
