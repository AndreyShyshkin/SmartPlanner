'use client';

import React, { useState, useEffect } from 'react';
import { usePlannerStore } from '@/store/usePlannerStore';
import { Automation } from '@/domain/automations/Automation';
import {
  MotionTrigger,
  DoorTrigger,
  PresenceTrigger,
  TemperatureTrigger,
  TimeTrigger,
  DeviceStateTrigger,
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
  UserCheck,
  UserX,
  Thermometer,
  Clock,
  ToggleLeft,
  ToggleRight,
  Lightbulb,
  Blinds,
  Zap,
  Flame,
  Wind,
} from 'lucide-react';

interface AutomationsModalProps {
  isOpen: boolean;
  onClose: () => void;
}

type TriggerCategory = 'device' | 'time' | 'person_left' | 'person_arrived';

export const AutomationsModal: React.FC<AutomationsModalProps> = ({ isOpen, onClose }) => {
  const {
    automations,
    devices,
    rooms,
    scenes,
    deviceGroups,
    addAutomation,
    deleteAutomation,
    toggleAutomation,
  } = usePlannerStore();

  const [isCreating, setIsCreating] = useState(false);
  const [autoName, setAutoName] = useState('');

  // 4 Main Trigger Categories
  const [triggerCategory, setTriggerCategory] = useState<TriggerCategory>('device');

  // Trigger Device State
  const [selectedTriggerDeviceId, setSelectedTriggerDeviceId] = useState('');
  const [motionEvent, setMotionEvent] = useState<'detect' | 'clear'>('detect');
  const [doorEvent, setDoorEvent] = useState<'open' | 'close'>('open');
  const [tempOperator, setTempOperator] = useState<'greater' | 'less'>('greater');
  const [tempThreshold, setTempThreshold] = useState(23);
  const [powerEvent, setPowerEvent] = useState<'on' | 'off'>('on');
  const [curtainEvent, setCurtainEvent] = useState<'open' | 'close'>('open');

  // Time Trigger State
  const [timeHour, setTimeHour] = useState(22);
  const [timeMinute, setTimeMinute] = useState(0);
  const [timeComparison, setTimeComparison] = useState<'after' | 'before' | 'exact'>('after');

  // Action Builder State
  const [actionKind, setActionKind] = useState<'device' | 'group' | 'scene'>('device');
  const [targetDeviceId, setTargetDeviceId] = useState('');
  const [targetGroupId, setTargetGroupId] = useState('');
  const [targetSceneId, setTargetSceneId] = useState('');
  const [devicePower, setDevicePower] = useState(true);
  const [lightBrightness, setLightBrightness] = useState(100);
  const [lightColor, setLightColor] = useState('#FFD60A');

  const deviceList = Array.from(devices.values());

  // Default selection when devices load
  useEffect(() => {
    if (deviceList.length > 0 && !selectedTriggerDeviceId) {
      setSelectedTriggerDeviceId(deviceList[0].id);
    }
    if (deviceList.length > 0 && !targetDeviceId) {
      setTargetDeviceId(deviceList[0].id);
    }
  }, [deviceList, selectedTriggerDeviceId, targetDeviceId]);

  if (!isOpen) return null;

  const currentTriggerDev = devices.get(selectedTriggerDeviceId) || deviceList[0];

  const handleCreate = (e: React.FormEvent) => {
    e.preventDefault();
    if (!autoName.trim()) return;

    // 1. Build Trigger based on Category
    let trigger: any;

    if (triggerCategory === 'device') {
      if (!currentTriggerDev) {
        alert('Пожалуйста, выберите устройство для условия');
        return;
      }

      if (currentTriggerDev.type === 'motion') {
        trigger = new MotionTrigger(currentTriggerDev.id, motionEvent === 'detect');
      } else if (currentTriggerDev.type === 'door_sensor') {
        trigger = new DoorTrigger(currentTriggerDev.id, doorEvent === 'open');
      } else if (currentTriggerDev.type === 'thermostat' || currentTriggerDev.type === 'heater') {
        trigger = new TemperatureTrigger(currentTriggerDev.id, tempOperator, tempThreshold);
      } else if (currentTriggerDev.type === 'curtains') {
        trigger = new DeviceStateTrigger(
          currentTriggerDev.id,
          'openPercentage',
          curtainEvent === 'open' ? 100 : 0,
          `«${currentTriggerDev.name}»: шторы ${curtainEvent === 'open' ? 'открыты' : 'закрыты'}`
        );
      } else {
        // Light, Socket, AC, etc.
        trigger = new DeviceStateTrigger(
          currentTriggerDev.id,
          'isOn',
          powerEvent === 'on',
          `«${currentTriggerDev.name}»: ${powerEvent === 'on' ? 'включено' : 'выключено'}`
        );
      }
    } else if (triggerCategory === 'time') {
      trigger = new TimeTrigger(timeHour, timeComparison, timeMinute);
    } else if (triggerCategory === 'person_left') {
      trigger = new PresenceTrigger(false);
    } else if (triggerCategory === 'person_arrived') {
      trigger = new PresenceTrigger(true);
    }

    // 2. Build Actions
    const actions: any[] = [];
    if (actionKind === 'device') {
      const devId = targetDeviceId || deviceList[0]?.id;
      if (devId) {
        const targetDev = devices.get(devId);
        const patch: Record<string, any> = { isOn: devicePower };
        if (targetDev?.type === 'light') {
          patch.brightness = lightBrightness;
          patch.color = lightColor;
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
      alert('Пожалуйста, выберите целевое действие');
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
              <h2 className="text-lg font-bold text-zinc-900">Автоматизации умного дома</h2>
              <p className="text-xs text-zinc-400">
                Создание гибких правил ЕСЛИ (Устройство, Время, Человек) → ТО (Действие)
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
                <p className="text-[11px] text-zinc-400 mt-1">
                  Нажмите кнопку ниже, чтобы настроить реакцию на датчики или уход/приход
                </p>
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
                        ЕСЛИ: {auto.trigger.getDescription(devices)}
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
            {/* Automation Name */}
            <div>
              <label className="text-xs font-semibold text-zinc-500 mb-1.5 block">
                Название правила
              </label>
              <input
                type="text"
                required
                value={autoName}
                onChange={(e) => setAutoName(e.target.value)}
                placeholder="Например: Включить свет когда кто-то вошел в комнату"
                className="w-full px-3 py-2 bg-zinc-50 border border-black/10 rounded-xl text-sm font-medium text-zinc-900 focus:outline-none focus:ring-2 focus:ring-[#0071E3]"
              />
            </div>

            {/* 1. IF (TRIGGER SECTION) */}
            <div className="p-4 bg-blue-50/40 rounded-2xl border border-blue-100 space-y-3.5">
              <span className="text-xs font-bold text-blue-700 uppercase tracking-wider block">
                1. ЕСЛИ (Условие срабатывания)
              </span>

              {/* 4 Main Category Buttons */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                {[
                  {
                    id: 'device',
                    label: 'Устройство',
                    icon: <Activity className="w-4 h-4" />,
                  },
                  {
                    id: 'time',
                    label: 'Время',
                    icon: <Clock className="w-4 h-4" />,
                  },
                  {
                    id: 'person_left',
                    label: 'Человек ушел',
                    icon: <UserX className="w-4 h-4" />,
                  },
                  {
                    id: 'person_arrived',
                    label: 'Человек пришел',
                    icon: <UserCheck className="w-4 h-4" />,
                  },
                ].map((item) => (
                  <button
                    key={item.id}
                    type="button"
                    onClick={() => setTriggerCategory(item.id as TriggerCategory)}
                    className={`py-2 px-3 rounded-xl text-xs font-semibold flex items-center justify-center gap-1.5 transition-all ${
                      triggerCategory === item.id
                        ? 'bg-[#0071E3] text-white shadow-xs'
                        : 'bg-white border border-black/10 text-zinc-600 hover:bg-zinc-100'
                    }`}
                  >
                    {item.icon} {item.label}
                  </button>
                ))}
              </div>

              {/* Case 1: УСТРОЙСТВО */}
              {triggerCategory === 'device' && (
                <div className="space-y-3 pt-2">
                  <div>
                    <label className="text-[11px] font-semibold text-zinc-500 mb-1 block">
                      Выберите устройство
                    </label>
                    <select
                      value={selectedTriggerDeviceId}
                      onChange={(e) => setSelectedTriggerDeviceId(e.target.value)}
                      className="w-full px-3 py-2 bg-white border border-black/10 rounded-xl text-xs font-semibold text-zinc-900"
                    >
                      {deviceList.map((d) => {
                        const room = rooms.find((r) => r.id === d.roomId);
                        return (
                          <option key={d.id} value={d.id}>
                            {d.name} ({room ? room.name : 'Вне комнаты'}) — {d.type}
                          </option>
                        );
                      })}
                    </select>
                  </div>

                  {/* Tailored Condition based on Device Type */}
                  {currentTriggerDev && (
                    <div className="bg-white p-3 rounded-xl border border-black/5 space-y-2">
                      <span className="text-[11px] font-bold text-zinc-600 uppercase tracking-wider block">
                        Событие для {currentTriggerDev.name}:
                      </span>

                      {/* A. Motion Sensor */}
                      {currentTriggerDev.type === 'motion' && (
                        <div className="grid grid-cols-2 gap-2">
                          <button
                            type="button"
                            onClick={() => setMotionEvent('detect')}
                            className={`p-2.5 rounded-xl text-xs font-semibold flex items-center justify-center gap-1.5 transition-all ${
                              motionEvent === 'detect'
                                ? 'bg-blue-600 text-white shadow-xs'
                                : 'bg-zinc-100 text-zinc-700 hover:bg-zinc-200'
                            }`}
                          >
                            <Activity className="w-3.5 h-3.5" /> Засёк человека
                          </button>
                          <button
                            type="button"
                            onClick={() => setMotionEvent('clear')}
                            className={`p-2.5 rounded-xl text-xs font-semibold flex items-center justify-center gap-1.5 transition-all ${
                              motionEvent === 'clear'
                                ? 'bg-blue-600 text-white shadow-xs'
                                : 'bg-zinc-100 text-zinc-700 hover:bg-zinc-200'
                            }`}
                          >
                            Больше не видит человека
                          </button>
                        </div>
                      )}

                      {/* B. Door Sensor */}
                      {currentTriggerDev.type === 'door_sensor' && (
                        <div className="grid grid-cols-2 gap-2">
                          <button
                            type="button"
                            onClick={() => setDoorEvent('open')}
                            className={`p-2.5 rounded-xl text-xs font-semibold flex items-center justify-center gap-1.5 transition-all ${
                              doorEvent === 'open'
                                ? 'bg-amber-600 text-white shadow-xs'
                                : 'bg-zinc-100 text-zinc-700 hover:bg-zinc-200'
                            }`}
                          >
                            <DoorOpen className="w-3.5 h-3.5" /> Дверь открылась
                          </button>
                          <button
                            type="button"
                            onClick={() => setDoorEvent('close')}
                            className={`p-2.5 rounded-xl text-xs font-semibold flex items-center justify-center gap-1.5 transition-all ${
                              doorEvent === 'close'
                                ? 'bg-amber-600 text-white shadow-xs'
                                : 'bg-zinc-100 text-zinc-700 hover:bg-zinc-200'
                            }`}
                          >
                            Дверь закрылась
                          </button>
                        </div>
                      )}

                      {/* C. Thermostat / Temperature / Heater */}
                      {(currentTriggerDev.type === 'thermostat' ||
                        currentTriggerDev.type === 'heater') && (
                        <div className="grid grid-cols-2 gap-3">
                          <div>
                            <label className="text-[11px] font-medium text-zinc-500 mb-1 block">
                              Условие температуры
                            </label>
                            <select
                              value={tempOperator}
                              onChange={(e) => setTempOperator(e.target.value as any)}
                              className="w-full px-2.5 py-1.5 bg-zinc-50 border border-black/10 rounded-xl text-xs font-semibold"
                            >
                              <option value="greater">Температура больше (&gt;)</option>
                              <option value="less">Температура меньше (&lt;)</option>
                            </select>
                          </div>
                          <div>
                            <label className="text-[11px] font-medium text-zinc-500 mb-1 block">
                              Порог температуры: {tempThreshold}°C
                            </label>
                            <input
                              type="number"
                              step="0.5"
                              value={tempThreshold}
                              onChange={(e) => setTempThreshold(Number(e.target.value))}
                              className="w-full px-2.5 py-1.5 bg-zinc-50 border border-black/10 rounded-xl text-xs font-semibold"
                            />
                          </div>
                        </div>
                      )}

                      {/* D. Curtains */}
                      {currentTriggerDev.type === 'curtains' && (
                        <div className="grid grid-cols-2 gap-2">
                          <button
                            type="button"
                            onClick={() => setCurtainEvent('open')}
                            className={`p-2.5 rounded-xl text-xs font-semibold transition-all ${
                              curtainEvent === 'open'
                                ? 'bg-indigo-600 text-white shadow-xs'
                                : 'bg-zinc-100 text-zinc-700 hover:bg-zinc-200'
                            }`}
                          >
                            Шторы открылись
                          </button>
                          <button
                            type="button"
                            onClick={() => setCurtainEvent('close')}
                            className={`p-2.5 rounded-xl text-xs font-semibold transition-all ${
                              curtainEvent === 'close'
                                ? 'bg-indigo-600 text-white shadow-xs'
                                : 'bg-zinc-100 text-zinc-700 hover:bg-zinc-200'
                            }`}
                          >
                            Шторы закрылись
                          </button>
                        </div>
                      )}

                      {/* E. Lights, Sockets, AC */}
                      {currentTriggerDev.type !== 'motion' &&
                        currentTriggerDev.type !== 'door_sensor' &&
                        currentTriggerDev.type !== 'thermostat' &&
                        currentTriggerDev.type !== 'heater' &&
                        currentTriggerDev.type !== 'curtains' && (
                          <div className="grid grid-cols-2 gap-2">
                            <button
                              type="button"
                              onClick={() => setPowerEvent('on')}
                              className={`p-2.5 rounded-xl text-xs font-semibold transition-all ${
                                powerEvent === 'on'
                                  ? 'bg-blue-600 text-white shadow-xs'
                                  : 'bg-zinc-100 text-zinc-700 hover:bg-zinc-200'
                              }`}
                            >
                              Включилось
                            </button>
                            <button
                              type="button"
                              onClick={() => setPowerEvent('off')}
                              className={`p-2.5 rounded-xl text-xs font-semibold transition-all ${
                                powerEvent === 'off'
                                  ? 'bg-blue-600 text-white shadow-xs'
                                  : 'bg-zinc-100 text-zinc-700 hover:bg-zinc-200'
                              }`}
                            >
                              Выключилось
                            </button>
                          </div>
                        )}
                    </div>
                  )}
                </div>
              )}

              {/* Case 2: ВРЕМЯ */}
              {triggerCategory === 'time' && (
                <div className="space-y-3 pt-2 bg-white p-3.5 rounded-xl border border-black/5">
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="text-[11px] font-semibold text-zinc-500 mb-1 block">
                        Условие времени
                      </label>
                      <select
                        value={timeComparison}
                        onChange={(e) => setTimeComparison(e.target.value as any)}
                        className="w-full px-2.5 py-1.5 bg-zinc-50 border border-black/10 rounded-xl text-xs font-semibold"
                      >
                        <option value="after">После указанного времени</option>
                        <option value="before">До указанного времени</option>
                        <option value="exact">Ровно в указанное время</option>
                      </select>
                    </div>

                    <div>
                      <label className="text-[11px] font-semibold text-zinc-500 mb-1 block">
                        Время:{' '}
                        <span className="font-bold text-[#0071E3]">
                          {String(timeHour).padStart(2, '0')}:
                          {String(timeMinute).padStart(2, '0')}
                        </span>
                      </label>
                      <div className="flex items-center gap-2">
                        <input
                          type="number"
                          min="0"
                          max="23"
                          value={timeHour}
                          onChange={(e) => setTimeHour(Math.min(23, Math.max(0, Number(e.target.value))))}
                          className="w-16 px-2 py-1 bg-zinc-50 border border-black/10 rounded-lg text-xs font-semibold text-center"
                          placeholder="Час"
                        />
                        <span>:</span>
                        <input
                          type="number"
                          min="0"
                          max="59"
                          step="5"
                          value={timeMinute}
                          onChange={(e) => setTimeMinute(Math.min(59, Math.max(0, Number(e.target.value))))}
                          className="w-16 px-2 py-1 bg-zinc-50 border border-black/10 rounded-lg text-xs font-semibold text-center"
                          placeholder="Мин"
                        />
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {/* Case 3: ЧЕЛОВЕК УШЕЛ */}
              {triggerCategory === 'person_left' && (
                <div className="p-3 bg-white rounded-xl border border-black/5 flex items-center gap-3">
                  <div className="p-2.5 bg-rose-50 text-rose-600 rounded-xl">
                    <UserX className="w-5 h-5" />
                  </div>
                  <div>
                    <h4 className="text-xs font-bold text-zinc-900">Человек уходит из дома</h4>
                    <p className="text-[11px] text-zinc-500 leading-relaxed">
                      Автоматизация мгновенно сработает, когда в симуляции переключается статус на «Вне дома».
                    </p>
                  </div>
                </div>
              )}

              {/* Case 4: ЧЕЛОВЕК ПРИШЕЛ */}
              {triggerCategory === 'person_arrived' && (
                <div className="p-3 bg-white rounded-xl border border-black/5 flex items-center gap-3">
                  <div className="p-2.5 bg-emerald-50 text-emerald-600 rounded-xl">
                    <UserCheck className="w-5 h-5" />
                  </div>
                  <div>
                    <h4 className="text-xs font-bold text-zinc-900">Человек возвращается домой</h4>
                    <p className="text-[11px] text-zinc-500 leading-relaxed">
                      Автоматизация мгновенно сработает, когда в симуляции статус становится «Человек дома».
                    </p>
                  </div>
                </div>
              )}
            </div>

            {/* 2. THEN (ACTIONS SECTION) */}
            <div className="p-4 bg-emerald-50/40 rounded-2xl border border-emerald-100 space-y-3.5">
              <span className="text-xs font-bold text-emerald-700 uppercase tracking-wider block">
                2. ТО (Выполнить действие)
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
                      {deviceList.map((d) => (
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
                        {s.name} ({s.actions.length} действий)
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
                Сохранить правило
              </button>
            </div>
          </form>
        )}
      </div>
    </div>
  );
};
