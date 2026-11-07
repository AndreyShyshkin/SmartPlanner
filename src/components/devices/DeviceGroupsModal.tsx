'use client';

import React, { useState } from 'react';
import { usePlannerStore } from '@/store/usePlannerStore';
import { X, Plus, Trash2, Folder, Check } from 'lucide-react';

interface DeviceGroupsModalProps {
  isOpen: boolean;
  onClose: () => void;
}

const GROUP_COLORS = [
  '#0071E3',
  '#34C759',
  '#FF9500',
  '#AF52DE',
  '#FF2D55',
  '#5856D6',
  '#5AC8FA',
];

export const DeviceGroupsModal: React.FC<DeviceGroupsModalProps> = ({
  isOpen,
  onClose,
}) => {
  const { deviceGroups, devices, addGroup, deleteGroup, assignDeviceToGroup } = usePlannerStore();
  const [newGroupName, setNewGroupName] = useState('');
  const [newGroupColor, setNewGroupColor] = useState(GROUP_COLORS[0]);

  if (!isOpen) return null;

  const handleCreateGroup = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newGroupName.trim()) return;
    addGroup(newGroupName.trim(), newGroupColor);
    setNewGroupName('');
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="relative w-full max-w-lg bg-white/95 backdrop-blur-2xl border border-black/10 rounded-3xl shadow-2xl p-6 overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between pb-4 border-b border-black/5">
          <div className="flex items-center gap-2">
            <Folder className="w-5 h-5 text-[#0071E3]" />
            <h2 className="text-lg font-bold text-zinc-900">Групи пристроїв</h2>
          </div>
          <button
            onClick={onClose}
            className="p-2 rounded-full hover:bg-zinc-100 text-zinc-400 hover:text-zinc-700 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Existing Groups List */}
        <div className="my-4 space-y-3 max-h-[50vh] overflow-y-auto pr-1">
          {deviceGroups.length === 0 ? (
            <p className="text-xs text-zinc-400 text-center py-4">Немає створених груп</p>
          ) : (
            deviceGroups.map((group) => {
              const groupDevices = Array.from(devices.values()).filter(
                (d) => d.groupId === group.id
              );
              return (
                <div
                  key={group.id}
                  className="p-3.5 bg-zinc-50 border border-black/5 rounded-2xl flex items-center justify-between"
                >
                  <div className="flex items-center gap-3">
                    <span
                      className="w-3.5 h-3.5 rounded-full ring-2 ring-black/10"
                      style={{ backgroundColor: group.color || '#0071E3' }}
                    />
                    <div>
                      <h4 className="font-semibold text-xs text-zinc-900">{group.name}</h4>
                      <span className="text-[11px] text-zinc-400">
                        {groupDevices.length} пристроїв у групі
                      </span>
                    </div>
                  </div>
                  <button
                    onClick={() => deleteGroup(group.id)}
                    className="p-1.5 rounded-lg text-zinc-400 hover:text-red-600 hover:bg-red-50 transition-colors"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              );
            })
          )}
        </div>

        {/* Create new group */}
        <form onSubmit={handleCreateGroup} className="pt-4 border-t border-black/5 space-y-3">
          <span className="text-xs font-semibold text-zinc-600 block">Створити нову групу</span>
          <div className="flex gap-2">
            <input
              type="text"
              value={newGroupName}
              onChange={(e) => setNewGroupName(e.target.value)}
              placeholder="Назва (наприклад: Освітлення кухні)"
              className="flex-1 px-3 py-2 bg-zinc-50 border border-black/10 rounded-xl text-xs font-medium text-zinc-900 focus:outline-none focus:ring-2 focus:ring-[#0071E3]"
            />
            <button
              type="submit"
              className="px-4 py-2 bg-[#0071E3] hover:bg-blue-600 text-white rounded-xl text-xs font-semibold flex items-center gap-1.5 transition-all active:scale-95 shadow-sm"
            >
              <Plus className="w-4 h-4" /> Додати
            </button>
          </div>

          <div className="flex items-center gap-2 pt-1">
            {GROUP_COLORS.map((c) => (
              <button
                key={c}
                type="button"
                onClick={() => setNewGroupColor(c)}
                className={`w-6 h-6 rounded-full transition-transform ${
                  newGroupColor === c ? 'scale-125 ring-2 ring-black/20 ring-offset-2' : 'hover:scale-110'
                }`}
                style={{ backgroundColor: c }}
              />
            ))}
          </div>
        </form>
      </div>
    </div>
  );
};
