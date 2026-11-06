'use client';

import React from 'react';
import { ISmartDevice } from '@/domain/interfaces/ISmartDevice';
import { usePlannerStore } from '@/store/usePlannerStore';
import {
  Lightbulb,
  Activity,
  DoorOpen,
  Thermometer,
  Flame,
  Blinds,
  Wind,
  Zap,
} from 'lucide-react';

interface DeviceCardProps {
  device: ISmartDevice;
  onOpenSettings: (device: ISmartDevice) => void;
}

export const DeviceCard: React.FC<DeviceCardProps> = ({ device, onOpenSettings }) => {
  const { toggleDevice, rooms, deviceGroups } = usePlannerStore();
  const state = device.getState();
  const isOn = Boolean(state.isOn);

  const room = rooms.find((r) => r.id === device.roomId);
  const group = deviceGroups.find((g) => g.id === device.groupId);

  const renderIcon = () => {
    const iconClass = 'w-6 h-6 transition-transform duration-300';
    switch (device.type) {
      case 'light':
        return (
          <Lightbulb
            className={iconClass}
            style={{ color: isOn ? (state.color || '#FFD60A') : '#8E8E93' }}
          />
        );
      case 'motion':
        return (
          <Activity
            className={`${iconClass} ${state.isDetecting ? 'text-blue-500 animate-pulse' : 'text-zinc-400'}`}
          />
        );
      case 'door_sensor':
        return (
          <DoorOpen
            className={`${iconClass} ${state.isOpen ? 'text-amber-500' : 'text-zinc-400'}`}
          />
        );
      case 'thermostat':
        return <Thermometer className={`${iconClass} ${isOn ? 'text-orange-500' : 'text-zinc-400'}`} />;
      case 'heater':
        return <Flame className={`${iconClass} ${isOn ? 'text-red-500 animate-bounce' : 'text-zinc-400'}`} />;
      case 'curtains':
        return (
          <Blinds
            className={`${iconClass} ${state.openPercentage > 0 ? 'text-blue-500' : 'text-zinc-400'}`}
          />
        );
      case 'ac':
        return <Wind className={`${iconClass} ${isOn ? 'text-cyan-500 animate-spin' : 'text-zinc-400'}`} />;
      case 'socket':
        return <Zap className={`${iconClass} ${isOn ? 'text-yellow-500' : 'text-zinc-400'}`} />;
      default:
        return <Lightbulb className={iconClass} />;
    }
  };

  return (
    <div
      onClick={() => onOpenSettings(device)}
      className={`group relative flex flex-col justify-between p-4 rounded-3xl transition-all duration-300 cursor-pointer select-none border ${
        isOn
          ? 'bg-white shadow-apple hover:shadow-apple-hover border-black/10'
          : 'bg-zinc-100/70 hover:bg-zinc-100 border-black/5 text-zinc-500'
      }`}
    >
      <div className="flex items-start justify-between">
        {/* Toggle Icon button */}
        <button
          onClick={(e) => {
            e.stopPropagation();
            toggleDevice(device.id);
          }}
          title={isOn ? 'Выключить' : 'Включить'}
          className={`p-3 rounded-2xl transition-all duration-300 ${
            isOn
              ? 'bg-zinc-100 shadow-sm active:scale-90 group-hover:scale-105'
              : 'bg-zinc-200/80 active:scale-90 group-hover:scale-105'
          }`}
        >
          {renderIcon()}
        </button>

        {/* Status indicator dot */}
        <div className="flex items-center gap-1.5">
          {group && (
            <span
              className="px-2 py-0.5 rounded-full text-[10px] font-semibold text-white shadow-xs"
              style={{ backgroundColor: group.color || '#0071E3' }}
            >
              {group.name}
            </span>
          )}
          <span
            className={`w-2.5 h-2.5 rounded-full transition-colors ${
              isOn ? 'bg-emerald-500 ring-4 ring-emerald-500/20' : 'bg-zinc-300'
            }`}
          />
        </div>
      </div>

      <div className="mt-4">
        <h4 className="font-semibold text-zinc-900 text-sm truncate group-hover:text-[#0071E3] transition-colors">
          {device.name}
        </h4>
        <div className="flex items-center justify-between mt-1">
          <span className="text-xs text-zinc-500 truncate">
            {room ? room.name : 'Вне комнаты'}
          </span>
          <span className="text-xs font-medium text-zinc-700">
            {device.getStatusSummary()}
          </span>
        </div>
      </div>
    </div>
  );
};
