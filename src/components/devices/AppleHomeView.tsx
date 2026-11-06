'use client';

import React, { useState } from 'react';
import { usePlannerStore } from '@/store/usePlannerStore';
import { ISmartDevice } from '@/domain/interfaces/ISmartDevice';
import { DeviceType } from '@/domain/types';
import { DeviceCard } from './DeviceCard';
import { DeviceCatalogModal } from './DeviceCatalogModal';
import { DeviceInspectorModal } from './DeviceInspectorModal';
import { DeviceGroupsModal } from './DeviceGroupsModal';
import {
  Plus,
  Sparkles,
  Cpu,
  Layers,
  Thermometer,
  ShieldCheck,
  Zap,
} from 'lucide-react';

interface AppleHomeViewProps {
  onOpenScenesModal: () => void;
  onOpenAutomationsModal: () => void;
}

export const AppleHomeView: React.FC<AppleHomeViewProps> = ({
  onOpenScenesModal,
  onOpenAutomationsModal,
}) => {
  const {
    devices,
    rooms,
    doors,
    addDevice,
    setActiveTab,
  } = usePlannerStore();

  const [selectedRoomId, setSelectedRoomId] = useState<string | null>(null);
  const [isCatalogOpen, setIsCatalogOpen] = useState(false);
  const [isGroupsOpen, setIsGroupsOpen] = useState(false);
  const [inspectingDevice, setInspectingDevice] = useState<ISmartDevice | null>(null);

  const deviceList = Array.from(devices.values());

  const filteredDevices = selectedRoomId
    ? deviceList.filter((d) => d.roomId === selectedRoomId)
    : deviceList;

  // Active statistics
  const activeCount = deviceList.filter((d) => d.getState().isOn).length;

  const handleDeviceSelectedFromCatalog = (type: DeviceType) => {
    // Drop the device into the center of the currently selected room, or center of the canvas
    let targetX = 8;
    let targetY = 8;

    if (type === 'door_sensor') {
      // If placing a door sensor, find a door if available
      const door = doors[0];
      if (door) {
        targetX = door.x;
        targetY = door.y;
      }
    } else if (selectedRoomId) {
      const room = rooms.find((r) => r.id === selectedRoomId);
      if (room && room.tiles.size > 0) {
        const center = room.getCenter();
        targetX = center.x;
        targetY = center.y;
      }
    } else if (rooms.length > 0 && rooms[0].tiles.size > 0) {
      const center = rooms[0].getCenter();
      targetX = center.x;
      targetY = center.y;
    }

    const newDev = addDevice(type, targetX, targetY);
    setInspectingDevice(newDev);
  };

  return (
    <div className="w-full h-full bg-[#F5F5F7] overflow-y-auto px-6 py-8 select-none">
      <div className="max-w-6xl mx-auto space-y-8">
        {/* Top Header / Actions Bar */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <h1 className="text-3xl font-bold tracking-tight text-zinc-900">
              Умный дом Apple Home
            </h1>
            <p className="text-xs text-zinc-500 mt-1 flex items-center gap-3">
              <span>{deviceList.length} устройств всего</span>
              <span>•</span>
              <span className="text-emerald-600 font-medium">
                {activeCount} включено сейчас
              </span>
            </p>
          </div>

          {/* Quick Action Buttons */}
          <div className="flex items-center gap-2 flex-wrap">
            {/* Scenes Button */}
            <button
              onClick={onOpenScenesModal}
              className="px-4 py-2.5 bg-white/80 hover:bg-white text-zinc-800 border border-black/10 rounded-2xl shadow-xs hover:shadow-apple font-semibold text-xs flex items-center gap-2 transition-all active:scale-95"
            >
              <Sparkles className="w-4 h-4 text-purple-500" /> Сценарии
            </button>

            {/* Automations Button */}
            <button
              onClick={onOpenAutomationsModal}
              className="px-4 py-2.5 bg-white/80 hover:bg-white text-zinc-800 border border-black/10 rounded-2xl shadow-xs hover:shadow-apple font-semibold text-xs flex items-center gap-2 transition-all active:scale-95"
            >
              <Cpu className="w-4 h-4 text-blue-500" /> Автоматизации
            </button>

            {/* Device Groups */}
            <button
              onClick={() => setIsGroupsOpen(true)}
              className="px-4 py-2.5 bg-white/80 hover:bg-white text-zinc-800 border border-black/10 rounded-2xl shadow-xs hover:shadow-apple font-semibold text-xs flex items-center gap-2 transition-all active:scale-95"
            >
              <Layers className="w-4 h-4 text-amber-500" /> Группы
            </button>

            {/* Plus Button (Add Device) */}
            <button
              onClick={() => setIsCatalogOpen(true)}
              className="px-5 py-2.5 bg-[#0071E3] hover:bg-blue-600 text-white rounded-2xl shadow-apple font-semibold text-xs flex items-center gap-2 transition-all active:scale-95"
            >
              <Plus className="w-4 h-4 stroke-[2.5]" /> Добавить устройство
            </button>
          </div>
        </div>

        {/* Room Filter Pills */}
        <div className="flex items-center gap-2 overflow-x-auto pb-2 scrollbar-none">
          <button
            onClick={() => setSelectedRoomId(null)}
            className={`px-4 py-2 rounded-2xl text-xs font-semibold whitespace-nowrap transition-all ${
              selectedRoomId === null
                ? 'bg-zinc-900 text-white shadow-sm'
                : 'bg-white/80 text-zinc-600 hover:bg-white border border-black/5'
            }`}
          >
            Все комнаты ({deviceList.length})
          </button>
          {rooms.map((room) => {
            const count = deviceList.filter((d) => d.roomId === room.id).length;
            const isSelected = selectedRoomId === room.id;
            return (
              <button
                key={room.id}
                onClick={() => setSelectedRoomId(room.id)}
                className={`px-4 py-2 rounded-2xl text-xs font-semibold whitespace-nowrap flex items-center gap-2 transition-all ${
                  isSelected
                    ? 'bg-zinc-900 text-white shadow-sm'
                    : 'bg-white/80 text-zinc-600 hover:bg-white border border-black/5'
                }`}
              >
                <span
                  className="w-2.5 h-2.5 rounded-full"
                  style={{ backgroundColor: room.color }}
                />
                {room.name} ({count})
              </button>
            );
          })}
        </div>

        {/* Devices Grid */}
        {filteredDevices.length === 0 ? (
          <div className="bg-white/60 border border-dashed border-black/10 rounded-3xl p-12 text-center flex flex-col items-center justify-center">
            <div className="p-4 bg-zinc-100 rounded-2xl mb-3">
              <Plus className="w-8 h-8 text-zinc-400" />
            </div>
            <h3 className="font-semibold text-zinc-800 text-sm">В этой категории нет устройств</h3>
            <p className="text-xs text-zinc-400 mt-1 max-w-sm">
              Нажмите кнопку «Добавить устройство», чтобы выбрать сенсор, лампу, климат или батарею.
            </p>
            <button
              onClick={() => setIsCatalogOpen(true)}
              className="mt-4 px-4 py-2 bg-[#0071E3] text-white rounded-xl text-xs font-semibold hover:bg-blue-600 transition-colors"
            >
              Открыть каталог
            </button>
          </div>
        ) : (
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4">
            {filteredDevices.map((dev) => (
              <DeviceCard
                key={dev.id}
                device={dev}
                onOpenSettings={(d) => setInspectingDevice(d)}
              />
            ))}
          </div>
        )}
      </div>

      {/* Catalog Modal */}
      <DeviceCatalogModal
        isOpen={isCatalogOpen}
        onClose={() => setIsCatalogOpen(false)}
        onDeviceSelected={handleDeviceSelectedFromCatalog}
      />

      {/* Inspector Modal */}
      <DeviceInspectorModal
        device={inspectingDevice}
        onClose={() => setInspectingDevice(null)}
      />

      {/* Groups Modal */}
      <DeviceGroupsModal
        isOpen={isGroupsOpen}
        onClose={() => setIsGroupsOpen(false)}
      />
    </div>
  );
};
