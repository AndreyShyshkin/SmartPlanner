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
    devices,
    deviceGroups,
    updateDevice,
    deleteDevice,
  } = usePlannerStore();

  if (!device) return null;

  const state = device.getState();
  const room = rooms.find((r) => r.id === device.roomId);

  const roomClimateDevices = Array.from(devices.values()).filter(
    (d) => d.roomId === device.roomId && (d.type === 'heater' || d.type === 'ac')
  );

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
              Назва пристрою
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
                <MapPin className="w-3.5 h-3.5" /> Кімната
              </label>
              <select
                value={device.roomId || ''}
                onChange={(e) =>
                  updateDevice(device.id, { roomId: e.target.value || null })
                }
                className="w-full px-3 py-2 bg-zinc-50 border border-black/10 rounded-xl text-xs font-medium text-zinc-900 focus:outline-none focus:ring-2 focus:ring-[#0071E3]"
              >
                <option value="">Без кімнати</option>
                {rooms.map((r) => (
                  <option key={r.id} value={r.id}>
                    {r.name}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="text-xs font-semibold text-zinc-500 mb-1.5 flex items-center gap-1">
                <FolderPlus className="w-3.5 h-3.5" /> Група
              </label>
              <select
                value={device.groupId || ''}
                onChange={(e) =>
                  updateDevice(device.id, { groupId: e.target.value || null })
                }
                className="w-full px-3 py-2 bg-zinc-50 border border-black/10 rounded-xl text-xs font-medium text-zinc-900 focus:outline-none focus:ring-2 focus:ring-[#0071E3]"
              >
                <option value="">Без групи</option>
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
                  <Sun className="w-4 h-4 text-amber-500" /> Яскравість: {state.brightness}%
                </span>
                <span className="text-xs text-zinc-400">
                  {state.isOn ? 'Увімкнено' : 'Вимкнено'}
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
                  Колір світіння
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
                  <Eye className="w-4 h-4 text-blue-500" /> Радіус виявлення:{' '}
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
                    Кут огляду (FOV): {state.fovAngle}°
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
                    <option value={180}>180° (Півсфера)</option>
                    <option value={360}>360° (Круговий)</option>
                  </select>
                </div>
                <div>
                  <label className="text-xs font-semibold text-zinc-500 mb-1 block">
                    Напрямок: {state.rotationAngle || 0}°
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
                🛡️ Стіни блокують видимість сенсора (Raycasting). Датчик не бачить крізь непрозорі стіни!
              </div>
            </div>
          )}

          {/* 3. Door Sensor Controls */}
          {device.type === 'door_sensor' && (
            <div className="bg-zinc-50 p-4 rounded-2xl border border-black/5 space-y-4">
              <div>
                <label className="text-xs font-semibold text-zinc-500 mb-1.5 block">
                  Прив’язані двері на плані
                </label>
                <select
                  value={state.doorId || ''}
                  onChange={(e) => handleStateChange({ doorId: e.target.value })}
                  className="w-full px-3 py-2 bg-white border border-black/10 rounded-xl text-xs font-medium"
                >
                  <option value="">Виберіть двері...</option>
                  {doors.map((d) => (
                    <option key={d.id} value={d.id}>
                      {d.name || 'Двері'} ({d.x}, {d.y}) - {d.orientation === 'horizontal' ? 'гориз.' : 'верт.'}
                    </option>
                  ))}
                </select>
              </div>

              <div className="p-2.5 bg-amber-50 rounded-xl border border-amber-100 text-[11px] text-amber-800">
                🚪 Спрацьовує автоматично при відкритті вибраних дверей або під час проходу віртуальної людини через дверний отвір.
              </div>
            </div>
          )}

          {/* 4. Thermostat Controls */}
          {device.type === 'thermostat' && (
            <div className="bg-zinc-50 p-4 rounded-2xl border border-black/5 space-y-4">
              {/* Climate Action Status Banner */}
              {state.isOn && state.mode !== 'off' && (
                <div
                  className={`p-3 rounded-xl border text-xs font-medium flex items-center gap-2 ${
                    state.climateActionState === 'heating'
                      ? 'bg-orange-50 border-orange-200 text-orange-900'
                      : state.climateActionState === 'cooling'
                      ? 'bg-cyan-50 border-cyan-200 text-cyan-900'
                      : 'bg-emerald-50 border-emerald-200 text-emerald-900'
                  }`}
                >
                  {state.climateActionState === 'heating' && (
                    <span>🔥 <strong>Обігрів активний</strong>: термостат увімкнув батарею для досягнення {state.targetTemperature}°C</span>
                  )}
                  {state.climateActionState === 'cooling' && (
                    <span>❄️ <strong>Охолодження активне</strong>: термостат увімкнув кондиціонер для зниження до {state.targetTemperature}°C</span>
                  )}
                  {(state.climateActionState === 'idle' || !state.climateActionState) && (
                    <span>✨ <strong>Комфорт</strong>: цільову температуру {state.targetTemperature}°C досягнуто (прилади в режимі очікування)</span>
                  )}
                </div>
              )}

              <div className="flex items-center justify-between">
                <span className="text-xs font-semibold text-zinc-700">
                  Цільова температура: {state.targetTemperature}°C
                </span>
                <span className="text-xs font-semibold text-zinc-500 bg-white px-2.5 py-1 rounded-lg border border-black/5">
                  Поточна: {state.currentTemperature?.toFixed(1) || 21}°C
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
                <label className="text-xs font-semibold text-zinc-500 mb-1.5 block">
                  Режим роботи клімату
                </label>
                <div className="grid grid-cols-4 gap-1.5">
                  {[
                    { id: 'auto', label: 'Авто' },
                    { id: 'heat', label: 'Обігрів' },
                    { id: 'cool', label: 'Охолодж.' },
                    { id: 'off', label: 'Вимк' },
                  ].map((item) => (
                    <button
                      key={item.id}
                      onClick={() => handleStateChange({ mode: item.id, isOn: item.id !== 'off' })}
                      className={`py-2 rounded-xl text-xs font-semibold transition-all ${
                        state.mode === item.id
                          ? 'bg-[#0071E3] text-white shadow-xs'
                          : 'bg-white border border-black/10 text-zinc-600 hover:bg-zinc-100'
                      }`}
                    >
                      {item.label}
                    </button>
                  ))}
                </div>
              </div>

              {/* Direct Link with Radiators & AC */}
              <div className="pt-3 border-t border-black/5 space-y-2.5">
                <div className="flex items-center justify-between">
                  <div>
                    <h4 className="text-xs font-bold text-zinc-800">
                      Прямий зв’язок із батареями та кондиціонером
                    </h4>
                    <p className="text-[11px] text-zinc-400">
                      Термостат сам регулює потужність приладів для підтримки температури
                    </p>
                  </div>
                  <input
                    type="checkbox"
                    checked={state.autoManageClimate !== false}
                    onChange={(e) => handleStateChange({ autoManageClimate: e.target.checked })}
                    className="w-4 h-4 rounded text-[#0071E3] focus:ring-[#0071E3]"
                  />
                </div>

                <div className="space-y-1.5">
                  {roomClimateDevices.length === 0 ? (
                    <p className="text-[11px] text-zinc-400 italic bg-white p-2.5 rounded-xl border border-black/5">
                      💡 У цій кімнаті поки немає батарей або кондиціонерів. Додайте їх на план кімнати «{room?.name || 'цієї'}», і термостат зв’яжеться з ними автоматично.
                    </p>
                  ) : (
                    roomClimateDevices.map((cd) => (
                      <div
                        key={cd.id}
                        className="px-3 py-2 bg-white rounded-xl border border-black/5 flex items-center justify-between text-xs"
                      >
                        <div className="flex items-center gap-2">
                          <span>{cd.type === 'heater' ? '♨️' : '❄️'}</span>
                          <span className="font-semibold text-zinc-800">{cd.name}</span>
                        </div>
                        <span
                          className={`text-[10px] font-semibold px-2 py-0.5 rounded-md ${
                            cd.getState().isOn
                              ? cd.type === 'heater'
                                ? 'bg-orange-100 text-orange-700'
                                : 'bg-cyan-100 text-cyan-700'
                              : 'bg-zinc-100 text-zinc-500'
                          }`}
                        >
                          {cd.getState().isOn ? 'Активно' : 'Очікування'}
                        </span>
                      </div>
                    ))
                  )}
                </div>
              </div>
            </div>
          )}

          {/* 5. Heater Controls */}
          {device.type === 'heater' && (
            <div className="bg-zinc-50 p-4 rounded-2xl border border-black/5 space-y-4">
              <div className="flex items-center justify-between">
                <span className="text-xs font-semibold text-zinc-700 flex items-center gap-1.5">
                  <Flame className="w-4 h-4 text-red-500" /> Потужність обігріву:{' '}
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
                  <Blinds className="w-4 h-4 text-indigo-500" /> Відкриття штор:{' '}
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
                  <Wind className="w-4 h-4 text-cyan-500" /> Цільова температура: {state.targetTemp}°C
                </span>
                <span className="text-xs font-semibold text-zinc-500">
                  {state.isOn ? 'Увімкнено' : 'Вимкнено'}
                </span>
              </div>
              <input
                type="range"
                min="16"
                max="30"
                step="1"
                value={state.targetTemp || 21}
                onChange={(e) =>
                  handleStateChange({ targetTemp: Number(e.target.value) })
                }
                className="w-full accent-[#0071E3]"
              />

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-[11px] font-semibold text-zinc-500 mb-1 block">
                    Режим кондиціонера
                  </label>
                  <select
                    value={state.mode || 'cool'}
                    onChange={(e) => handleStateChange({ mode: e.target.value })}
                    className="w-full px-2.5 py-1.5 bg-white border border-black/10 rounded-xl text-xs font-semibold"
                  >
                    <option value="cool">❄️ Охолодження</option>
                    <option value="heat">🔥 Обігрів</option>
                    <option value="fan">💨 Вентиляція</option>
                    <option value="dry">💧 Осушення</option>
                  </select>
                </div>
                <div>
                  <label className="text-[11px] font-semibold text-zinc-500 mb-1 block">
                    Швидкість обдуву
                  </label>
                  <select
                    value={state.fanSpeed || 'medium'}
                    onChange={(e) => handleStateChange({ fanSpeed: e.target.value })}
                    className="w-full px-2.5 py-1.5 bg-white border border-black/10 rounded-xl text-xs font-semibold"
                  >
                    <option value="low">Тихий (Low)</option>
                    <option value="medium">Середній (Med)</option>
                    <option value="high">Сильний (High)</option>
                    <option value="turbo">Турбо (Turbo)</option>
                  </select>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Footer Actions */}
        <div className="pt-4 border-t border-black/5 flex items-center justify-between">
          <button
            onClick={() => {
              if (confirm(`Видалити пристрій "${device.name}"?`)) {
                deleteDevice(device.id);
                onClose();
              }
            }}
            className="px-3 py-2 bg-red-50 hover:bg-red-100 text-red-600 rounded-xl text-xs font-semibold flex items-center gap-1.5 transition-colors"
          >
            <Trash2 className="w-4 h-4" /> Видалити пристрій
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
