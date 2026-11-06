'use client';

import React, { useState } from 'react';
import { usePlannerStore } from '@/store/usePlannerStore';
import { Automation } from '@/domain/automations/Automation';
import {
  MotionTrigger,
  DoorTrigger,
  PresenceTrigger,
  TemperatureTrigger,
  TimeTrigger,
} from '@/domain/automations/triggers';
import {
  SetDeviceStateAction,
  SetGroupStateAction,
  RunSceneAction,
} from '@/domain/automations/actions';
import {
  X,
  Plus,
  Trash2,
  Cpu,
  ArrowRight,
  Sparkles,
  Layers,
  Activity,
  DoorOpen,
  UserX,
  Thermometer,
  Clock,
  ToggleLeft,
  ToggleRight,
} from 'lucide-react';

interface AutomationsModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const AutomationsModal: React.FC<AutomationsModalProps> = ({ isOpen, onClose }) => {
  const {
    automations,
    devices,
    scenes,
    deviceGroups,
    addAutomation,
    deleteAutomation,
    toggleAutomation,
  } = usePlannerStore();

  const [isCreating, setIsCreating] = useState(false);
  const [autoName, setAutoName] = useState('');

  // Trigger builder state
  const [triggerType, setTriggerType] = useState<
    'motion' | 'door' | 'presence' | 'temperature' | 'time'
  >('motion');
  const [selectedSensorId, setSelectedSensorId] = useState('');
  const [mustDetect, setMustDetect] = useState(true);
  const [isHome, setIsHome] = useState(false);
  const [tempOperator, setTempOperator] = useState<'greater' | 'less'>('greater');
  const [tempThreshold, setTempThreshold] = useState(24);
  const [timeHour, setTimeHour] = useState(22);

  // Action builder state
  const [actionKind, setActionKind] = useState<'device' | 'group' | 'scene'>('device');
  const [targetDeviceId, setTargetDeviceId] = useState('');
  const [targetGroupId, setTargetGroupId] = useState('');
  const [targetSceneId, setTargetSceneId] = useState('');
  const [devicePower, setDevicePower] = useState(true);
  const [lightBrightness, setLightBrightness] = useState(100);

  if (!isOpen) return null;

  const motionSensors = Array.from(devices.values()).filter((d) => d.type === 'motion');
  const doorSensors = Array.from(devices.values()).filter((d) => d.type === 'door_sensor');
  const temperatureSensors = Array.from(devices.values()).filter(
    (d) => d.type === 'thermostat' || d.type === 'heater'
  );

  const handleCreate = (e: React.FormEvent) => {
    e.preventDefault();
    if (!autoName.trim()) return;

    // Build Trigger
    let trigger: any;
    if (triggerType === 'motion') {
      const devId = selectedSensorId || motionSensors[0]?.id;
      if (!devId) {
        alert('Пожалуйста, добавьте датчик движения на план');
        return;
      }
      trigger = new MotionTrigger(devId, mustDetect);
    } else if (triggerType === 'door') {
      const devId = selectedSensorId || doorSensors[0]?.id;
      if (!devId) {
        alert('Пожалуйста, добавьте датчик открытия двери на план');
        return;
      }
      trigger = new DoorTrigger(devId, mustDetect);
    } else if (triggerType === 'presence') {
      trigger = new PresenceTrigger(isHome);
    } else if (triggerType === 'temperature') {
      const devId = selectedSensorId || temperatureSensors[0]?.id || 'ambient';
      trigger = new TemperatureTrigger(devId, tempOperator, tempThreshold);
    } else if (triggerType === 'time') {
      trigger = new TimeTrigger(timeHour, 'after');
    }

    // Build Actions
    const actions: any[] = [];
    if (actionKind === 'device') {
      const devId = targetDeviceId || Array.from(devices.values())[0]?.id;
      if (devId) {
        const targetDev = devices.get(devId);
        const patch: Record<string, any> = { isOn: devicePower };
        if (targetDev?.type === 'light') {
          patch.brightness = lightBrightness;
        } else if (targetDev?.type === 'curtains') {
          patch.openPercentage = devicePower ? 100 : 0;
        }
        actions.push(new SetDeviceStateAction(devId, patch));
      }
    } else if (actionKind === 'group') {
      const grpId = targetGroupId || deviceGroups[0]?.id;
      if (grpId) {
        actions.push(new SetGroupStateAction(grpId, { isOn: devicePower }));
      }
    } else if (actionKind === 'scene') {
      const scnId = targetSceneId || scenes[0]?.id;
      if (scnId) {
        actions.push(new RunSceneAction(scnId));
      }
    }

    if (actions.length === 0) {
      alert('Выберите целевое действие');
      return;
    }

    const auto = new Automation(
      `auto_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`,
      autoName.trim(),
      trigger,
      actions,
      true
    );

    addAutomation(auto);
    setIsCreating(false);
    setAutoName('');
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="relative w-full max-w-2xl bg-white/95 backdrop-blur-2xl border border-black/10 rounded-3xl shadow-2xl p-6 overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between pb-4 border-b border-black/5">
          <div className="flex items-center gap-2.5">
            <div className="p-2 bg-blue-50 rounded-xl">
              <Cpu className="w-5 h-5 text-[#0071E3]" />
            </div>
            <div>
              <h2 className="text-lg font-bold text-zinc-900">Автоматизации (IF → THEN)</h2>
              <p className="text-xs text-zinc-400">
                Создавайте правила умного дома по датчикам, присутствию и времени
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 rounded-full hover:bg-zinc-100 text-zinc-400 hover:text-zinc-700 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {!isCreating ? (
          <div className="py-4 space-y-3 max-h-[60vh] overflow-y-auto pr-1">
            {automations.length === 0 ? (
              <div className="text-center py-10 bg-zinc-50 rounded-2xl border border-dashed border-black/10">
                <Cpu className="w-8 h-8 text-zinc-300 mx-auto mb-2" />
                <p className="text-xs text-zinc-500">Нет созданных автоматизаций</p>
              </div>
            ) : (
              automations.map((auto) => (
                <div
                  key={auto.id}
                  className={`p-4 rounded-2xl border transition-all flex items-center justify-between group ${
                    auto.isEnabled
                      ? 'bg-zinc-50 border-black/5 hover:bg-zinc-100/70'
                      : 'bg-zinc-50/50 border-black/5 opacity-60'
                  }`}
                >
                  <div className="space-y-1 pr-3">
                    <div className="flex items-center gap-2">
                      <span className="font-semibold text-sm text-zinc-900">{auto.name}</span>
                    </div>
                    <div className="flex items-center gap-2 text-xs text-zinc-500 flex-wrap">
                      <span className="font-medium text-blue-600 bg-blue-50 px-2 py-0.5 rounded-md">
                        ЕСЛИ: {auto.trigger.getDescription()}
                      </span>
                      <ArrowRight className="w-3.5 h-3.5 text-zinc-400" />
                      <span className="font-medium text-emerald-600 bg-emerald-50 px-2 py-0.5 rounded-md">
                        ТО: {auto.actions.map((a) => a.getDescription()).join('; ')}
                      </span>
                    </div>
                  </div>

                  <div className="flex items-center gap-2 flex-shrink-0">
                    <button
                      onClick={() => toggleAutomation(auto.id)}
                      className={`p-1 rounded-lg transition-colors ${
                        auto.isEnabled ? 'text-emerald-600' : 'text-zinc-400'
                      }`}
                      title={auto.isEnabled ? 'Активно' : 'Выключено'}
                    >
                      {auto.isEnabled ? (
                        <ToggleRight className="w-7 h-7" />
                      ) : (
                        <ToggleLeft className="w-7 h-7" />
                      )}
                    </button>
                    <button
                      onClick={() => deleteAutomation(auto.id)}
                      className="p-1.5 rounded-lg text-zinc-400 hover:text-red-600 hover:bg-red-50 transition-colors"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              ))
            )}

            <button
              onClick={() => setIsCreating(true)}
              className="w-full mt-3 py-3 border-2 border-dashed border-black/10 hover:border-[#0071E3] text-zinc-600 hover:text-[#0071E3] rounded-2xl text-xs font-semibold flex items-center justify-center gap-2 transition-colors"
            >
              <Plus className="w-4 h-4" /> Добавить новую автоматизацию
            </button>
          </div>
        ) : (
          <form onSubmit={handleCreate} className="py-4 space-y-4 max-h-[60vh] overflow-y-auto pr-1">
            {/* Name */}
            <div>
              <label className="text-xs font-semibold text-zinc-500 mb-1.5 block">
                Название автоматизации
              </label>
              <input
                type="text"
                required
                value={autoName}
                onChange={(e) => setAutoName(e.target.value)}
                placeholder="Например: Включить свет при входе в комнату"
                className="w-full px-3 py-2 bg-zinc-50 border border-black/10 rounded-xl text-sm font-medium text-zinc-900 focus:outline-none focus:ring-2 focus:ring-[#0071E3]"
              />
            </div>

            {/* IF - TRIGGER */}
            <div className="p-4 bg-blue-50/40 rounded-2xl border border-blue-100 space-y-3">
              <span className="text-xs font-bold text-blue-700 uppercase tracking-wider block">
                ЕСЛИ (Условие срабатывания)
              </span>

              <div className="grid grid-cols-2 sm:grid-cols-5 gap-1.5">
                {[
                  { id: 'motion', label: 'Движение', icon: <Activity className="w-3.5 h-3.5" /> },
                  { id: 'door', label: 'Дверь', icon: <DoorOpen className="w-3.5 h-3.5" /> },
                  { id: 'presence', label: 'Присутствие', icon: <UserX className="w-3.5 h-3.5" /> },
                  { id: 'temperature', label: 'Температура', icon: <Thermometer className="w-3.5 h-3.5" /> },
                  { id: 'time', label: 'Время', icon: <Clock className="w-3.5 h-3.5" /> },
                ].map((item) => (
                  <button
                    key={item.id}
                    type="button"
                    onClick={() => setTriggerType(item.id as any)}
                    className={`py-2 px-2.5 rounded-xl text-xs font-semibold flex items-center justify-center gap-1.5 transition-all ${
                      triggerType === item.id
                        ? 'bg-[#0071E3] text-white shadow-xs'
                        : 'bg-white border border-black/10 text-zinc-600 hover:bg-zinc-100'
                    }`}
                  >
                    {item.icon} {item.label}
                  </button>
                ))}
              </div>

              {/* Motion Trigger Config */}
              {triggerType === 'motion' && (
                <div className="grid grid-cols-2 gap-3 pt-2">
                  <div>
                    <label className="text-[11px] font-semibold text-zinc-500 mb-1 block">
                      Датчик движения
                    </label>
                    <select
                      value={selectedSensorId}
                      onChange={(e) => setSelectedSensorId(e.target.value)}
                      className="w-full px-2.5 py-1.5 bg-white border border-black/10 rounded-xl text-xs font-medium"
                    >
                      {motionSensors.map((s) => (
                        <option key={s.id} value={s.id}>
                          {s.name}
                        </option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <label className="text-[11px] font-semibold text-zinc-500 mb-1 block">
                      Событие
                    </label>
                    <select
                      value={mustDetect ? 'true' : 'false'}
                      onChange={(e) => setMustDetect(e.target.value === 'true')}
                      className="w-full px-2.5 py-1.5 bg-white border border-black/10 rounded-xl text-xs font-medium"
                    >
                      <option value="true">Обнаружено движение</option>
                      <option value="false">Движение прекратилось</option>
                    </select>
                  </div>
                </div>
              )}

              {/* Door Trigger Config */}
              {triggerType === 'door' && (
                <div className="grid grid-cols-2 gap-3 pt-2">
                  <div>
                    <label className="text-[11px] font-semibold text-zinc-500 mb-1 block">
                      Датчик открытия
                    </label>
                    <select
                      value={selectedSensorId}
                      onChange={(e) => setSelectedSensorId(e.target.value)}
                      className="w-full px-2.5 py-1.5 bg-white border border-black/10 rounded-xl text-xs font-medium"
                    >
                      {doorSensors.map((s) => (
                        <option key={s.id} value={s.id}>
                          {s.name}
                        </option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <label className="text-[11px] font-semibold text-zinc-500 mb-1 block">
                      Состояние двери
                    </label>
                    <select
                      value={mustDetect ? 'true' : 'false'}
                      onChange={(e) => setMustDetect(e.target.value === 'true')}
                      className="w-full px-2.5 py-1.5 bg-white border border-black/10 rounded-xl text-xs font-medium"
                    >
                      <option value="true">Дверь открылась</option>
                      <option value="false">Дверь закрылась</option>
                    </select>
                  </div>
                </div>
              )}

              {/* Presence Trigger Config */}
              {triggerType === 'presence' && (
                <div className="pt-2">
                  <label className="text-[11px] font-semibold text-zinc-500 mb-1 block">
                    Статус жильца
                  </label>
                  <select
                    value={isHome ? 'true' : 'false'}
                    onChange={(e) => setIsHome(e.target.value === 'true')}
                    className="w-full px-2.5 py-1.5 bg-white border border-black/10 rounded-xl text-xs font-medium"
                  >
                    <option value="false">Человек ушел из дома (Не дома)</option>
                    <option value="true">Человек вернулся домой</option>
                  </select>
                </div>
              )}

              {/* Temperature Trigger Config */}
              {triggerType === 'temperature' && (
                <div className="grid grid-cols-3 gap-2 pt-2">
                  <div>
                    <label className="text-[11px] font-semibold text-zinc-500 mb-1 block">
                      Сенсор / Комната
                    </label>
                    <select
                      value={selectedSensorId}
                      onChange={(e) => setSelectedSensorId(e.target.value)}
                      className="w-full px-2.5 py-1.5 bg-white border border-black/10 rounded-xl text-xs font-medium"
                    >
                      <option value="ambient">Общая температура дома</option>
                      {temperatureSensors.map((s) => (
                        <option key={s.id} value={s.id}>
                          {s.name}
                        </option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <label className="text-[11px] font-semibold text-zinc-500 mb-1 block">
                      Условие
                    </label>
                    <select
                      value={tempOperator}
                      onChange={(e) => setTempOperator(e.target.value as any)}
                      className="w-full px-2.5 py-1.5 bg-white border border-black/10 rounded-xl text-xs font-medium"
                    >
                      <option value="greater">Больше чем (&gt;)</option>
                      <option value="less">Меньше чем (&lt;)</option>
                    </select>
                  </div>
                  <div>
                    <label className="text-[11px] font-semibold text-zinc-500 mb-1 block">
                      Порог (°C): {tempThreshold}
                    </label>
                    <input
                      type="number"
                      value={tempThreshold}
                      onChange={(e) => setTempThreshold(Number(e.target.value))}
                      className="w-full px-2.5 py-1 bg-white border border-black/10 rounded-xl text-xs font-medium"
                    />
                  </div>
                </div>
              )}

              {/* Time Trigger Config */}
              {triggerType === 'time' && (
                <div className="pt-2">
                  <label className="text-[11px] font-semibold text-zinc-500 mb-1 block">
                    Время суток: {timeHour}:00
                  </label>
                  <input
                    type="range"
                    min="0"
                    max="23"
                    value={timeHour}
                    onChange={(e) => setTimeHour(Number(e.target.value))}
                    className="w-full accent-[#0071E3]"
                  />
                </div>
              )}
            </div>

            {/* THEN - ACTIONS */}
            <div className="p-4 bg-emerald-50/40 rounded-2xl border border-emerald-100 space-y-3">
              <span className="text-xs font-bold text-emerald-700 uppercase tracking-wider block">
                ТО (Выполнить действие)
              </span>

              <div className="grid grid-cols-3 gap-2">
                {[
                  { id: 'device', label: 'Устройство' },
                  { id: 'group', label: 'Группа устройств' },
                  { id: 'scene', label: 'Запустить сценарий' },
                ].map((item) => (
                  <button
                    key={item.id}
                    type="button"
                    onClick={() => setActionKind(item.id as any)}
                    className={`py-2 px-2 rounded-xl text-xs font-semibold transition-all ${
                      actionKind === item.id
                        ? 'bg-emerald-600 text-white shadow-xs'
                        : 'bg-white border border-black/10 text-zinc-600 hover:bg-zinc-100'
                    }`}
                  >
                    {item.label}
                  </button>
                ))}
              </div>

              {/* Target Device */}
              {actionKind === 'device' && (
                <div className="grid grid-cols-2 gap-3 pt-2">
                  <div>
                    <label className="text-[11px] font-semibold text-zinc-500 mb-1 block">
                      Выберите устройство
                    </label>
                    <select
                      value={targetDeviceId}
                      onChange={(e) => setTargetDeviceId(e.target.value)}
                      className="w-full px-2.5 py-1.5 bg-white border border-black/10 rounded-xl text-xs font-medium"
                    >
                      {Array.from(devices.values()).map((d) => (
                        <option key={d.id} value={d.id}>
                          {d.name} ({d.type})
                        </option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <label className="text-[11px] font-semibold text-zinc-500 mb-1 block">
                      Действие
                    </label>
                    <select
                      value={devicePower ? 'on' : 'off'}
                      onChange={(e) => setDevicePower(e.target.value === 'on')}
                      className="w-full px-2.5 py-1.5 bg-white border border-black/10 rounded-xl text-xs font-medium"
                    >
                      <option value="on">Включить / Открыть</option>
                      <option value="off">Выключить / Закрыть</option>
                    </select>
                  </div>
                </div>
              )}

              {/* Target Group */}
              {actionKind === 'group' && (
                <div className="grid grid-cols-2 gap-3 pt-2">
                  <div>
                    <label className="text-[11px] font-semibold text-zinc-500 mb-1 block">
                      Группа устройств
                    </label>
                    <select
                      value={targetGroupId}
                      onChange={(e) => setTargetGroupId(e.target.value)}
                      className="w-full px-2.5 py-1.5 bg-white border border-black/10 rounded-xl text-xs font-medium"
                    >
                      {deviceGroups.map((g) => (
                        <option key={g.id} value={g.id}>
                          {g.name}
                        </option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <label className="text-[11px] font-semibold text-zinc-500 mb-1 block">
                      Действие
                    </label>
                    <select
                      value={devicePower ? 'on' : 'off'}
                      onChange={(e) => setDevicePower(e.target.value === 'on')}
                      className="w-full px-2.5 py-1.5 bg-white border border-black/10 rounded-xl text-xs font-medium"
                    >
                      <option value="on">Включить всю группу</option>
                      <option value="off">Выключить всю группу</option>
                    </select>
                  </div>
                </div>
              )}

              {/* Target Scene */}
              {actionKind === 'scene' && (
                <div className="pt-2">
                  <label className="text-[11px] font-semibold text-zinc-500 mb-1 block">
                    Выберите сценарий
                  </label>
                  <select
                    value={targetSceneId}
                    onChange={(e) => setTargetSceneId(e.target.value)}
                    className="w-full px-2.5 py-1.5 bg-white border border-black/10 rounded-xl text-xs font-medium"
                  >
                    {scenes.map((s) => (
                      <option key={s.id} value={s.id}>
                        {s.name}
                      </option>
                    ))}
                  </select>
                </div>
              )}
            </div>

            {/* Footer Buttons */}
            <div className="pt-3 border-t border-black/5 flex items-center justify-end gap-2">
              <button
                type="button"
                onClick={() => setIsCreating(false)}
                className="px-4 py-2 text-zinc-600 hover:bg-zinc-100 rounded-xl text-xs font-semibold transition-colors"
              >
                Отмена
              </button>
              <button
                type="submit"
                className="px-5 py-2 bg-[#0071E3] hover:bg-blue-600 text-white rounded-xl text-xs font-semibold transition-all active:scale-95 shadow-sm"
              >
                Создать правило
              </button>
            </div>
          </form>
        )}
      </div>
    </div>
  );
};
