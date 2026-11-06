'use client';

import React, { useState } from 'react';
import { usePlannerStore, PlannerTool } from '@/store/usePlannerStore';
import { DeviceCatalogModal } from '@/components/devices/DeviceCatalogModal';
import {
  MousePointer,
  SquareDashed,
  Paintbrush,
  Eraser,
  DoorOpen,
  ZoomIn,
  ZoomOut,
  Maximize2,
  Columns,
  Rows,
  Plus,
} from 'lucide-react';

const ROOM_COLORS = [
  '#0071E3', // Apple Blue
  '#34C759', // Apple Green
  '#FF9500', // Apple Orange
  '#AF52DE', // Apple Purple
  '#FF2D55', // Apple Pink
  '#5856D6', // Apple Indigo
  '#5AC8FA', // Apple Teal
  '#FFCC00', // Apple Yellow
];

export const PlannerToolbar: React.FC = () => {
  const {
    activeTool,
    setActiveTool,
    activeRoomColor,
    setActiveRoomColor,
    doorOrientation,
    setDoorOrientation,
    zoom,
    setZoom,
    setPanOffset,
    setPlacingDeviceType,
    centerView,
  } = usePlannerStore();

  const [isCatalogOpen, setIsCatalogOpen] = useState(false);

  const tools: { id: PlannerTool; label: string; icon: React.ReactNode }[] = [
    {
      id: 'select',
      label: 'Выбор и перемещение',
      icon: <MousePointer className="w-5 h-5" />,
    },
    {
      id: 'room_rect',
      label: 'Комната областью (прямоугольник)',
      icon: <SquareDashed className="w-5 h-5" />,
    },
    {
      id: 'brush',
      label: 'Кисть (точечное рисование)',
      icon: <Paintbrush className="w-5 h-5" />,
    },
    {
      id: 'eraser',
      label: 'Ластик (точечное удаление)',
      icon: <Eraser className="w-5 h-5" />,
    },
    {
      id: 'door',
      label: 'Добавить дверь (только на стены)',
      icon: <DoorOpen className="w-5 h-5" />,
    },
  ];

  return (
    <div className="absolute top-4 left-1/2 -translate-x-1/2 z-20 flex items-center gap-3 bg-white/90 backdrop-blur-xl border border-black/10 px-4 py-2.5 rounded-2xl shadow-apple transition-all">
      {/* Tool Buttons */}
      <div className="flex items-center gap-1.5 border-r border-black/10 pr-3">
        {tools.map((t) => {
          const isActive = activeTool === t.id;
          return (
            <button
              key={t.id}
              onClick={() => setActiveTool(t.id)}
              title={t.label}
              className={`p-2.5 rounded-xl transition-all flex items-center justify-center relative ${
                isActive
                  ? 'bg-[#0071E3] text-white shadow-md shadow-blue-500/20'
                  : 'text-zinc-600 hover:text-zinc-950 hover:bg-zinc-100/80 active:scale-95'
              }`}
            >
              {t.icon}
            </button>
          );
        })}
      </div>

      {/* Add Smart Device directly from Planner */}
      <div className="border-r border-black/10 pr-3">
        <button
          onClick={() => setIsCatalogOpen(true)}
          className="px-3 py-1.5 bg-blue-50 hover:bg-blue-100 text-[#0071E3] rounded-xl text-xs font-semibold flex items-center gap-1.5 transition-all active:scale-95 shadow-xs"
          title="Добавить умное устройство на план"
        >
          <Plus className="w-3.5 h-3.5 stroke-[2.5]" />
          <span>Устройство</span>
        </button>
      </div>

      {/* Door Orientation toggle (only when door tool active) */}
      {activeTool === 'door' && (
        <div className="flex items-center gap-1 border-r border-black/10 pr-3 animate-fadeIn">
          <button
            onClick={() => setDoorOrientation('horizontal')}
            title="Горизонтальная дверь"
            className={`px-2.5 py-1.5 rounded-lg text-xs font-medium flex items-center gap-1.5 transition-all ${
              doorOrientation === 'horizontal'
                ? 'bg-zinc-900 text-white'
                : 'text-zinc-600 hover:bg-zinc-100'
            }`}
          >
            <Rows className="w-4 h-4" /> Гориз.
          </button>
          <button
            onClick={() => setDoorOrientation('vertical')}
            title="Вертикальная дверь"
            className={`px-2.5 py-1.5 rounded-lg text-xs font-medium flex items-center gap-1.5 transition-all ${
              doorOrientation === 'vertical'
                ? 'bg-zinc-900 text-white'
                : 'text-zinc-600 hover:bg-zinc-100'
            }`}
          >
            <Columns className="w-4 h-4" /> Верт.
          </button>
        </div>
      )}

      {/* Room Colors (when creating or painting rooms) */}
      {(activeTool === 'room_rect' || activeTool === 'brush') && (
        <div className="flex items-center gap-1.5 border-r border-black/10 pr-3 animate-fadeIn">
          {ROOM_COLORS.map((c) => (
            <button
              key={c}
              onClick={() => setActiveRoomColor(c)}
              className={`w-6 h-6 rounded-full transition-transform ${
                activeRoomColor === c ? 'scale-125 ring-2 ring-black/20 ring-offset-2' : 'hover:scale-110'
              }`}
              style={{ backgroundColor: c }}
            />
          ))}
        </div>
      )}

      {/* Zoom controls */}
      <div className="flex items-center gap-1 text-zinc-600">
        <button
          onClick={() => setZoom(zoom - 0.15)}
          title="Отдалить"
          className="p-1.5 rounded-lg hover:bg-zinc-100 hover:text-zinc-950 transition-all active:scale-95"
        >
          <ZoomOut className="w-4 h-4" />
        </button>
        <span className="text-xs font-medium w-12 text-center text-zinc-500">
          {Math.round(zoom * 100)}%
        </span>
        <button
          onClick={() => setZoom(zoom + 0.15)}
          title="Приблизить"
          className="p-1.5 rounded-lg hover:bg-zinc-100 hover:text-zinc-950 transition-all active:scale-95"
        >
          <ZoomIn className="w-4 h-4" />
        </button>
        <button
          onClick={() => {
            setZoom(1);
            centerView();
          }}
          title="По центру (Сбросить масштаб)"
          className="p-1.5 rounded-lg hover:bg-zinc-100 hover:text-zinc-950 transition-all active:scale-95 ml-1"
        >
          <Maximize2 className="w-3.5 h-3.5" />
        </button>
      </div>

      {/* Catalog modal triggered from Planner */}
      <DeviceCatalogModal
        isOpen={isCatalogOpen}
        onClose={() => setIsCatalogOpen(false)}
        onDeviceSelected={(type) => {
          setPlacingDeviceType(type);
          setIsCatalogOpen(false);
        }}
      />
    </div>
  );
};
