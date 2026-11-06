'use client';

import React, { useEffect } from 'react';
import { usePlannerStore } from '@/store/usePlannerStore';
import { SimulationCanvas } from './SimulationCanvas';
import {
  Play,
  Pause,
  Sun,
  Moon,
  Sunset,
  Sunrise,
  Thermometer,
  User,
  UserX,
  Zap,
  Activity,
  History,
  Trash2,
  Sliders,
} from 'lucide-react';

export const SimulationView: React.FC = () => {
  const {
    isSimulationRunning,
    timeOfDayHours,
    ambientTemperature,
    isPersonHome,
    simulationLogs,
    devices,
    setSimulationRunning,
    setTimeOfDayHours,
    setAmbientTemperature,
    setIsPersonHome,
    clearSimulationLogs,
    stepSimulation,
  } = usePlannerStore();

  // Run simulation evaluation tick every 400ms
  useEffect(() => {
    const timer = setInterval(() => {
      stepSimulation();
    }, 400);
    return () => clearInterval(timer);
  }, [stepSimulation]);

  const activeSensors = Array.from(devices.values()).filter(
    (d) =>
      (d.type === 'motion' && (d.getState() as any).isDetecting) ||
      (d.type === 'door_sensor' && (d.getState() as any).isOpen)
  );

  return (
    <div className="relative w-full h-full flex flex-col overflow-hidden bg-[#F5F5F7]">
      {/* 2D Canvas Area */}
      <div className="flex-1 relative w-full h-full">
        <SimulationCanvas />

        {/* Floating Top Hint Overlay */}
        <div className="absolute top-4 left-1/2 -translate-x-1/2 z-20 bg-white/90 backdrop-blur-xl border border-black/10 px-4 py-2 rounded-2xl shadow-apple flex items-center gap-4 text-xs">
          <div className="flex items-center gap-1.5 text-zinc-700 font-medium">
            <span className="p-1 bg-blue-50 text-blue-600 rounded-md font-bold">WASD</span>
            или перетаскивайте человечка мышкой
          </div>
          <span className="text-zinc-300">|</span>
          <div className="flex items-center gap-1.5 text-zinc-500">
            Клик по устройству или двери на плане переключает их
          </div>
        </div>

        {/* Live Active Sensors Banner */}
        {activeSensors.length > 0 && (
          <div className="absolute top-4 left-6 z-20 flex flex-col gap-1.5 animate-fadeIn">
            {activeSensors.map((s) => (
              <div
                key={s.id}
                className="px-3 py-1.5 bg-blue-600/90 text-white rounded-xl text-xs font-semibold backdrop-blur-md shadow-apple flex items-center gap-2"
              >
                <Activity className="w-3.5 h-3.5 animate-pulse" />
                <span>{s.name}: {s.getStatusSummary()}</span>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Bottom HUD: Time, Temperature, Presence & Event Log */}
      <div className="h-44 bg-white/95 backdrop-blur-2xl border-t border-black/10 px-6 py-3 flex flex-col md:flex-row items-stretch gap-6 select-none shadow-2xl z-20">
        {/* Column 1: Presence & Environment Controls */}
        <div className="w-full md:w-80 flex flex-col justify-between border-r border-black/5 pr-4">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-zinc-400 uppercase tracking-wider">
              Параметры симуляции
            </span>
            {/* Person Presence Toggle */}
            <button
              onClick={() => {
                setIsPersonHome(!isPersonHome);
                stepSimulation();
              }}
              className={`px-3 py-1 rounded-xl text-xs font-semibold flex items-center gap-1.5 transition-all ${
                isPersonHome
                  ? 'bg-emerald-500 text-white shadow-xs'
                  : 'bg-zinc-200 text-zinc-600'
              }`}
            >
              {isPersonHome ? (
                <>
                  <User className="w-3.5 h-3.5" /> Человек дома
                </>
              ) : (
                <>
                  <UserX className="w-3.5 h-3.5" /> Вне дома
                </>
              )}
            </button>
          </div>

          {/* Time of Day */}
          <div className="mt-2 space-y-1">
            <div className="flex items-center justify-between text-xs">
              <span className="font-medium text-zinc-600 flex items-center gap-1.5">
                <Sun className="w-3.5 h-3.5 text-amber-500" /> Время суток
              </span>
              <span className="font-bold text-zinc-900">
                {String(Math.floor(timeOfDayHours)).padStart(2, '0')}:
                {String(Math.floor((timeOfDayHours % 1) * 60)).padStart(2, '0')}
              </span>
            </div>
            <input
              type="range"
              min="0"
              max="24"
              step="0.5"
              value={timeOfDayHours}
              onChange={(e) => {
                setTimeOfDayHours(Number(e.target.value));
                stepSimulation();
              }}
              className="w-full accent-[#0071E3]"
            />
            {/* Quick time presets */}
            <div className="flex items-center justify-between pt-0.5">
              {[
                { h: 7, label: 'Утро', icon: <Sunrise className="w-3 h-3 text-orange-400" /> },
                { h: 14, label: 'День', icon: <Sun className="w-3 h-3 text-amber-500" /> },
                { h: 19, label: 'Вечер', icon: <Sunset className="w-3 h-3 text-rose-500" /> },
                { h: 23, label: 'Ночь', icon: <Moon className="w-3 h-3 text-indigo-400" /> },
              ].map((p) => (
                <button
                  key={p.h}
                  onClick={() => {
                    setTimeOfDayHours(p.h);
                    stepSimulation();
                  }}
                  className={`px-2 py-0.5 rounded-lg text-[10px] font-semibold flex items-center gap-1 transition-all ${
                    Math.floor(timeOfDayHours) === p.h
                      ? 'bg-zinc-900 text-white'
                      : 'text-zinc-500 hover:bg-zinc-100'
                  }`}
                >
                  {p.icon} {p.label}
                </button>
              ))}
            </div>
          </div>

          {/* Temperature */}
          <div className="mt-2">
            <div className="flex items-center justify-between text-xs">
              <span className="font-medium text-zinc-600 flex items-center gap-1.5">
                <Thermometer className="w-3.5 h-3.5 text-rose-500" /> Температура на улице
              </span>
              <span className="font-bold text-zinc-900">{ambientTemperature.toFixed(1)}°C</span>
            </div>
            <input
              type="range"
              min="-15"
              max="35"
              step="0.5"
              value={ambientTemperature}
              onChange={(e) => {
                setAmbientTemperature(Number(e.target.value));
                stepSimulation();
              }}
              className="w-full accent-[#0071E3]"
            />
          </div>
        </div>

        {/* Column 2: Live Automations & Event Logger */}
        <div className="flex-1 flex flex-col justify-between overflow-hidden">
          <div className="flex items-center justify-between pb-1 border-b border-black/5">
            <div className="flex items-center gap-2">
              <History className="w-4 h-4 text-[#0071E3]" />
              <span className="text-xs font-bold text-zinc-800">
                Журнал событий автоматизаций (Live Feed)
              </span>
            </div>
            <button
              onClick={clearSimulationLogs}
              title="Очистить журнал"
              className="p-1 rounded-lg hover:bg-zinc-100 text-zinc-400 hover:text-zinc-700 transition-colors"
            >
              <Trash2 className="w-3.5 h-3.5" />
            </button>
          </div>

          <div className="flex-1 overflow-y-auto space-y-1.5 py-1.5 pr-2">
            {simulationLogs.length === 0 ? (
              <p className="text-xs text-zinc-400 italic py-2">
                События пока не происходили. Попробуйте переместить человечка к датчику движения или открыть дверь!
              </p>
            ) : (
              simulationLogs.map((log) => {
                const date = new Date(log.timestamp);
                const timeStr = date.toLocaleTimeString([], {
                  hour: '2-digit',
                  minute: '2-digit',
                  second: '2-digit',
                });
                return (
                  <div
                    key={log.id}
                    className="p-2 bg-blue-50/50 border border-blue-100/60 rounded-xl text-xs flex items-center justify-between animate-fadeIn"
                  >
                    <div className="flex items-center gap-2">
                      <Zap className="w-3.5 h-3.5 text-amber-500 flex-shrink-0" />
                      <span className="text-zinc-800 font-medium">{log.description}</span>
                    </div>
                    <span className="text-[10px] text-zinc-400 font-mono ml-2 whitespace-nowrap">
                      {timeStr}
                    </span>
                  </div>
                );
              })
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
