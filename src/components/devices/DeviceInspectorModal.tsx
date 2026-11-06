'use client';

import React from 'react';
import { ISmartDevice } from '@/domain/interfaces/ISmartDevice';
import { usePlannerStore } from '@/store/usePlannerStore';
import {
  X,
  Trash2,
  Sliders,
  FolderPlus,
  MapPin,
  Sun,
  Eye,
  SlidersHorizontal,
  Flame,
  Blinds,
  Wind,
} from 'lucide-react';

interface DeviceInspectorModalProps {
  device: ISmartDevice | null;
  onClose: () => void;
}

const COLOR_PRESETS = [
  '#FFD60A', // Warm Light
  '#FFFFFF', // Daylight White
  '#FF9500', // Amber
  '#FF3B30', // Red / Crimson
  '#AF52DE', // Violet / Purple
  '#0071E3', // Apple Blue
  '#34C759', // Green
  '#5AC8FA', // Cyan
];

export const DeviceInspectorModal: React.FC<DeviceInspectorModalProps> = ({
  device,
  onClose,
}) => {
  const {
    rooms,
    doors,
    deviceGroups,
    updateDevice,
    deleteDevice,
  } = usePlannerStore();

  if (!device) return null;

  const state = device.getState();
  const room = rooms.find((r) => r.id === device.roomId);

  const handleStateChange = (patch: Record<string, any>) => {
    updateDevice(device.id, { state: patch });
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="relative w-full max-w-lg bg-white/95 backdrop-blur-2xl border border-black/10 rounded-3xl shadow-2xl p-6 overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between pb-4 border-b border-black/5">
          <div className="flex items-center gap-3">
            <div className="p-2.5 bg-zinc-100 rounded-2xl shadow-xs">
              <Sliders className="w-5 h-5 text-[#0071E3]" />
            </div>
            <div>
              <h2 className="text-lg font-bold text-zinc-900">{device.name}</h2>
              <span className="text-xs text-zinc-500 capitalize">
                Тип: {device.type.replace('_', ' ')}
              </span>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 rounded-full hover:bg-zinc-100 text-zinc-400 hover:text-zinc-700 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Form Body */}
        <div className="space-y-4 max-h-[65vh] overflow-y-auto py-4 pr-1">
          {/* Rename */}
          <div>
            <label className="text-xs font-semibold text-zinc-500 mb-1.5 block">
              Название устройства
            </label>
            <input
              type="text"
              value={device.name}
              onChange={(e) => updateDevice(device.id, { name: e.target.value })}
              className="w-full px-3 py-2 bg-zinc-50 border border-black/10 rounded-xl text-sm font-medium text-zinc-900 focus:outline-none focus:ring-2 focus:ring-[#0071E3]"
            />
          </div>

          {/* Room & Group Assignment */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-xs font-semibold text-zinc-500 mb-1.5 flex items-center gap-1">
                <MapPin className="w-3.5 h-3.5" /> Комната
              </label>
              <select
                value={device.roomId || ''}
                onChange={(e) =>
                  updateDevice(device.id, { roomId: e.target.value || null })
                }
                className="w-full px-3 py-2 bg-zinc-50 border border-black/10 rounded-xl text-xs font-medium text-zinc-900 focus:outline-none focus:ring-2 focus:ring-[#0071E3]"
              >
                <option value="">Без комнаты</option>
                {rooms.map((r) => (
                  <option key={r.id} value={r.id}>
                    {r.name}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="text-xs font-semibold text-zinc-500 mb-1.5 flex items-center gap-1">
                <FolderPlus className="w-3.5 h-3.5" /> Группа
              </label>
              <select
                value={device.groupId || ''}
                onChange={(e) =>
                  updateDevice(device.id, { groupId: e.target.value || null })
                }
                className="w-full px-3 py-2 bg-zinc-50 border border-black/10 rounded-xl text-xs font-medium text-zinc-900 focus:outline-none focus:ring-2 focus:ring-[#0071E3]"
              >
                <option value="">Без группы</option>
                {deviceGroups.map((g) => (
                  <option key={g.id} value={g.id}>
                    {g.name}
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* Device Type-Specific Controls */}
          {/* 1. Light Controls */}
          {device.type === 'light' && (
            <div className="bg-zinc-50 p-4 rounded-2xl border border-black/5 space-y-4">
              <div className="flex items-center justify-between">
                <span className="text-xs font-semibold text-zinc-700 flex items-center gap-1.5">
                  <Sun className="w-4 h-4 text-amber-500" /> Яркость: {state.brightness}%
                </span>
                <span className="text-xs text-zinc-400">
                  {state.isOn ? 'Включено' : 'Выключено'}
                </span>
              </div>
              <input
                type="range"
                min="0"
                max="100"
                value={state.brightness || 0}
                onChange={(e) =>
                  handleStateChange({
                    brightness: Number(e.target.value),
                    isOn: Number(e.target.value) > 0,
                  })
                }
                className="w-full accent-[#0071E3]"
              />

              <div>
                <label className="text-xs font-semibold text-zinc-500 mb-2 block">
                  Цвет свечения
                </label>
                <div className="flex items-center gap-2">
                  {COLOR_PRESETS.map((color) => (
                    <button
                      key={color}
                      onClick={() => handleStateChange({ color })}
                      className={`w-7 h-7 rounded-full transition-transform ${
                        state.color === color
                          ? 'scale-125 ring-2 ring-black/20 ring-offset-2'
                          : 'hover:scale-110'
                      }`}
                      style={{ backgroundColor: color }}
                    />
                  ))}
                </div>
              </div>
            </div>
          )}

          {/* 2. Motion Sensor Controls */}
          {device.type === 'motion' && (
            <div className="bg-zinc-50 p-4 rounded-2xl border border-black/5 space-y-4">
              <div className="flex items-center justify-between">
                <span className="text-xs font-semibold text-zinc-700 flex items-center gap-1.5">
                  <Eye className="w-4 h-4 text-blue-500" /> Радиус обнаружения:{' '}
                  {state.detectionRadius} плиток
                </span>
              </div>
              <input
                type="range"
                min="1"
                max="8"
                step="0.5"
                value={state.detectionRadius || 3.5}
                onChange={(e) =>
                  handleStateChange({ detectionRadius: Number(e.target.value) })
                }
                className="w-full accent-[#0071E3]"
              />

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-xs font-semibold text-zinc-500 mb-1 block">
                    Угол обзора (FOV): {state.fovAngle}°
                  </label>
                  <select
                    value={state.fovAngle || 360}
                    onChange={(e) =>
                      handleStateChange({ fovAngle: Number(e.target.value) })
                    }
                    className="w-full px-2.5 py-1.5 bg-white border border-black/10 rounded-xl text-xs font-medium"
                  >
                    <option value={90}>90° (Сектор)</option>
                    <option value={120}>120° (Широкий)</option>
                    <option value={180}>180° (Полусфера)</option>
                    <option value={360}>360° (Круговой)</option>
                  </select>
                </div>
                <div>
                  <label className="text-xs font-semibold text-zinc-500 mb-1 block">
                    Направление: {state.rotationAngle || 0}°
                  </label>
                  <input
                    type="range"
                    min="0"
                    max="360"
                    step="15"
                    value={state.rotationAngle || 0}
                    onChange={(e) =>
                      handleStateChange({ rotationAngle: Number(e.target.value) })
                    }
                    className="w-full accent-[#0071E3]"
                  />
                </div>
              </div>

              <div className="p-2.5 bg-blue-50 rounded-xl border border-blue-100 text-[11px] text-blue-700">
                🛡️ Стены блокируют видимость сенсора (Raycasting). Датчик не видит сквозь непрозрачные стены!
              </div>
            </div>
          )}

          {/* 3. Door Sensor Controls */}
          {device.type === 'door_sensor' && (
            <div className="bg-zinc-50 p-4 rounded-2xl border border-black/5 space-y-4">
              <div>
                <label className="text-xs font-semibold text-zinc-500 mb-1.5 block">
                  Привязанная дверь на плане
                </label>
                <select
                  value={state.doorId || ''}
                  onChange={(e) => handleStateChange({ doorId: e.target.value })}
                  className="w-full px-3 py-2 bg-white border border-black/10 rounded-xl text-xs font-medium"
                >
                  <option value="">Выберите дверь...</option>
                  {doors.map((d) => (
                    <option key={d.id} value={d.id}>
                      {d.name || 'Дверь'} ({d.x}, {d.y}) - {d.orientation}
                    </option>
                  ))}
                </select>
              </div>

              <div className="p-2.5 bg-amber-50 rounded-xl border border-amber-100 text-[11px] text-amber-800">
                🚪 Срабатывает автоматически при открытии выбранной двери или при проходе виртуального человека через дверной проем.
              </div>
            </div>
          )}

          {/* 4. Thermostat Controls */}
          {device.type === 'thermostat' && (
            <div className="bg-zinc-50 p-4 rounded-2xl border border-black/5 space-y-4">
              <div className="flex items-center justify-between">
                <span className="text-xs font-semibold text-zinc-700">
                  Целевая температура: {state.targetTemperature}°C
                </span>
                <span className="text-xs text-zinc-400">
                  Текущая: {state.currentTemperature?.toFixed(1) || 21}°C
                </span>
              </div>
              <input
                type="range"
                min="16"
                max="30"
                step="0.5"
                value={state.targetTemperature || 22}
                onChange={(e) =>
                  handleStateChange({ targetTemperature: Number(e.target.value) })
                }
                className="w-full accent-[#0071E3]"
              />

              <div>
                <label className="text-xs font-semibold text-zinc-500 mb-1 block">
                  Режим работы
                </label>
                <div className="grid grid-cols-4 gap-1.5">
                  {['off', 'heat', 'cool', 'auto'].map((mode) => (
                    <button
                      key={mode}
                      onClick={() => handleStateChange({ mode, isOn: mode !== 'off' })}
                      className={`py-1.5 rounded-lg text-xs font-semibold uppercase ${
                        state.mode === mode
                          ? 'bg-[#0071E3] text-white shadow-xs'
                          : 'bg-white border border-black/10 text-zinc-600 hover:bg-zinc-100'
                      }`}
                    >
                      {mode}
                    </button>
                  ))}
                </div>
              </div>
            </div>
          )}

          {/* 5. Heater Controls */}
          {device.type === 'heater' && (
            <div className="bg-zinc-50 p-4 rounded-2xl border border-black/5 space-y-4">
              <div className="flex items-center justify-between">
                <span className="text-xs font-semibold text-zinc-700 flex items-center gap-1.5">
                  <Flame className="w-4 h-4 text-red-500" /> Мощность обогрева:{' '}
                  {state.powerLevel}%
                </span>
              </div>
              <input
                type="range"
                min="0"
                max="100"
                step="5"
                value={state.powerLevel || 0}
                onChange={(e) =>
                  handleStateChange({
                    powerLevel: Number(e.target.value),
                    isOn: Number(e.target.value) > 0,
                  })
                }
                className="w-full accent-[#0071E3]"
              />
            </div>
          )}

          {/* 6. Curtains Controls */}
          {device.type === 'curtains' && (
            <div className="bg-zinc-50 p-4 rounded-2xl border border-black/5 space-y-4">
              <div className="flex items-center justify-between">
                <span className="text-xs font-semibold text-zinc-700 flex items-center gap-1.5">
                  <Blinds className="w-4 h-4 text-indigo-500" /> Открытие штор:{' '}
                  {state.openPercentage}%
                </span>
              </div>
              <input
                type="range"
                min="0"
                max="100"
                step="5"
                value={state.openPercentage || 0}
                onChange={(e) =>
                  handleStateChange({
                    openPercentage: Number(e.target.value),
                    isOn: Number(e.target.value) > 0,
                  })
                }
                className="w-full accent-[#0071E3]"
              />
            </div>
          )}

          {/* 7. AC Controls */}
          {device.type === 'ac' && (
            <div className="bg-zinc-50 p-4 rounded-2xl border border-black/5 space-y-4">
              <div className="flex items-center justify-between">
                <span className="text-xs font-semibold text-zinc-700 flex items-center gap-1.5">
                  <Wind className="w-4 h-4 text-cyan-500" /> Охлаждение: {state.targetTemp}°C
                </span>
              </div>
              <input
                type="range"
                min="16"
                max="28"
                step="1"
                value={state.targetTemp || 21}
                onChange={(e) =>
                  handleStateChange({ targetTemp: Number(e.target.value) })
                }
                className="w-full accent-[#0071E3]"
              />
            </div>
          )}
        </div>

        {/* Footer Actions */}
        <div className="pt-4 border-t border-black/5 flex items-center justify-between">
          <button
            onClick={() => {
              if (confirm(`Удалить устройство "${device.name}"?`)) {
                deleteDevice(device.id);
                onClose();
              }
            }}
            className="px-3 py-2 bg-red-50 hover:bg-red-100 text-red-600 rounded-xl text-xs font-semibold flex items-center gap-1.5 transition-colors"
          >
            <Trash2 className="w-4 h-4" /> Удалить устройство
          </button>
          <button
            onClick={onClose}
            className="px-5 py-2 bg-zinc-900 hover:bg-zinc-800 text-white rounded-xl text-xs font-semibold transition-colors"
          >
            Готово
          </button>
        </div>
      </div>
    </div>
  );
};
