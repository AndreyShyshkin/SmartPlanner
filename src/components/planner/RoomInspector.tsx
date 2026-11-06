'use client';

import React from 'react';
import { usePlannerStore } from '@/store/usePlannerStore';
import { X, Trash2, Palette, Type, Square } from 'lucide-react';

const PALETTE = [
  '#0071E3',
  '#34C759',
  '#FF9500',
  '#AF52DE',
  '#FF2D55',
  '#5856D6',
  '#5AC8FA',
  '#FFCC00',
];

export const RoomInspector: React.FC = () => {
  const { rooms, selectedEntity, setSelectedEntity, updateRoom, deleteRoom } = usePlannerStore();

  if (selectedEntity.type !== 'room' || !selectedEntity.id) {
    return null;
  }

  const room = rooms.find((r) => r.id === selectedEntity.id);
  if (!room) return null;

  const areaSqMeters = (room.getArea() * 0.25).toFixed(1);

  return (
    <div className="absolute top-20 right-6 z-30 w-80 bg-white/95 backdrop-blur-xl border border-black/10 rounded-2xl shadow-apple-hover p-5 animate-in fade-in slide-in-from-right-4 duration-200">
      <div className="flex items-center justify-between pb-3 border-b border-black/5">
        <div className="flex items-center gap-2">
          <div
            className="w-3.5 h-3.5 rounded-full ring-2 ring-black/10"
            style={{ backgroundColor: room.color }}
          />
          <h3 className="font-semibold text-zinc-900 text-sm">Свойства комнаты</h3>
        </div>
        <button
          onClick={() => setSelectedEntity({ type: null, id: null })}
          className="p-1 rounded-lg hover:bg-zinc-100 text-zinc-400 hover:text-zinc-700 transition-colors"
        >
          <X className="w-4 h-4" />
        </button>
      </div>

      <div className="mt-4 space-y-4">
        {/* Name input */}
        <div>
          <label className="text-xs font-medium text-zinc-500 mb-1.5 flex items-center gap-1.5">
            <Type className="w-3.5 h-3.5" /> Название
          </label>
          <input
            type="text"
            value={room.name}
            onChange={(e) => updateRoom(room.id, { name: e.target.value })}
            placeholder="Например: Спальня"
            className="w-full px-3 py-2 bg-zinc-50 border border-black/10 rounded-xl text-sm font-medium text-zinc-900 focus:outline-none focus:ring-2 focus:ring-[#0071E3] transition-all"
          />
        </div>

        {/* Color picker */}
        <div>
          <label className="text-xs font-medium text-zinc-500 mb-2 flex items-center gap-1.5">
            <Palette className="w-3.5 h-3.5" /> Цвет подсветки
          </label>
          <div className="grid grid-cols-4 gap-2">
            {PALETTE.map((c) => (
              <button
                key={c}
                onClick={() => updateRoom(room.id, { color: c })}
                className={`h-8 rounded-xl transition-all ${
                  room.color === c ? 'ring-2 ring-black/30 scale-105' : 'hover:scale-105 opacity-80 hover:opacity-100'
                }`}
                style={{ backgroundColor: c }}
              />
            ))}
          </div>
        </div>

        {/* Area statistics */}
        <div className="bg-zinc-50 rounded-xl p-3 border border-black/5 flex items-center justify-between">
          <div className="flex items-center gap-2 text-zinc-500 text-xs">
            <Square className="w-4 h-4 text-zinc-400" />
            <span>Площадь</span>
          </div>
          <span className="font-semibold text-sm text-zinc-800">{areaSqMeters} м²</span>
        </div>

        <div className="text-xs text-zinc-400 italic">
          💡 Подсказка: зажмите и потяните комнату на холсте, чтобы переместить её вместе с устройствами.
        </div>

        {/* Delete Room Button */}
        <button
          onClick={() => {
            if (confirm(`Удалить комнату "${room.name}"?`)) {
              deleteRoom(room.id);
            }
          }}
          className="w-full mt-2 py-2.5 px-3 bg-red-50 hover:bg-red-100 text-red-600 rounded-xl text-xs font-semibold flex items-center justify-center gap-2 transition-colors active:scale-[0.98]"
        >
          <Trash2 className="w-4 h-4" /> Удалить комнату
        </button>
      </div>
    </div>
  );
};
