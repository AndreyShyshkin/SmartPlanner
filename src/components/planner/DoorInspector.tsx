'use client';

import React from 'react';
import { usePlannerStore } from '@/store/usePlannerStore';
import { X, Trash2, DoorOpen, DoorClosed } from 'lucide-react';

export const DoorInspector: React.FC = () => {
  const { doors, selectedEntity, setSelectedEntity, toggleDoor, deleteDoor } = usePlannerStore();

  if (selectedEntity.type !== 'door' || !selectedEntity.id) {
    return null;
  }

  const door = doors.find((d) => d.id === selectedEntity.id);
  if (!door) return null;

  return (
    <div className="absolute top-20 right-6 z-30 w-72 bg-white/95 backdrop-blur-xl border border-black/10 rounded-2xl shadow-apple-hover p-5 animate-in fade-in slide-in-from-right-4 duration-200">
      <div className="flex items-center justify-between pb-3 border-b border-black/5">
        <div className="flex items-center gap-2">
          <DoorOpen className="w-4 h-4 text-[#0071E3]" />
          <h3 className="font-semibold text-zinc-900 text-sm">{door.name || 'Дверной проем'}</h3>
        </div>
        <button
          onClick={() => setSelectedEntity({ type: null, id: null })}
          className="p-1 rounded-lg hover:bg-zinc-100 text-zinc-400 hover:text-zinc-700 transition-colors"
        >
          <X className="w-4 h-4" />
        </button>
      </div>

      <div className="mt-4 space-y-4">
        {/* Toggle Door State */}
        <div className="bg-zinc-50 rounded-xl p-3 border border-black/5 flex items-center justify-between">
          <span className="text-xs font-medium text-zinc-600">Положение створки</span>
          <button
            onClick={() => toggleDoor(door.id)}
            className={`px-3 py-1.5 rounded-lg text-xs font-semibold flex items-center gap-1.5 transition-all ${
              door.isOpen
                ? 'bg-blue-600 text-white shadow-sm'
                : 'bg-zinc-200 text-zinc-700 hover:bg-zinc-300'
            }`}
          >
            {door.isOpen ? (
              <>
                <DoorOpen className="w-3.5 h-3.5" /> Открыта
              </>
            ) : (
              <>
                <DoorClosed className="w-3.5 h-3.5" /> Закрыта
              </>
            )}
          </button>
        </div>

        {/* Orientation & Position */}
        <div className="text-xs text-zinc-500 space-y-1">
          <div>Ориентация: <span className="font-semibold text-zinc-700">{door.orientation === 'horizontal' ? 'Горизонтальная' : 'Вертикальная'}</span></div>
          <div>Координаты: <span className="font-semibold text-zinc-700">({door.x}, {door.y})</span></div>
        </div>

        <button
          onClick={() => {
            deleteDoor(door.id);
          }}
          className="w-full mt-2 py-2.5 px-3 bg-red-50 hover:bg-red-100 text-red-600 rounded-xl text-xs font-semibold flex items-center justify-center gap-2 transition-colors active:scale-[0.98]"
        >
          <Trash2 className="w-4 h-4" /> Удалить дверь
        </button>
      </div>
    </div>
  );
};
