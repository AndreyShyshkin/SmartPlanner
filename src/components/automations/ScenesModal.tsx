'use client';

import React, { useState } from 'react';
import { usePlannerStore } from '@/store/usePlannerStore';
import { Scene } from '@/domain/automations/Scene';
import {
  X,
  Plus,
  Play,
  Trash2,
  Edit2,
  Sparkles,
  Moon,
  Sun,
  Film,
  Shield,
  Coffee,
  Check,
} from 'lucide-react';

interface ScenesModalProps {
  isOpen: boolean;
  onClose: () => void;
}

const SCENE_ICONS: Record<string, React.ReactNode> = {
  Sparkles: <Sparkles className="w-5 h-5 text-amber-500" />,
  Moon: <Moon className="w-5 h-5 text-indigo-500" />,
  Sun: <Sun className="w-5 h-5 text-orange-500" />,
  Film: <Film className="w-5 h-5 text-red-500" />,
  Shield: <Shield className="w-5 h-5 text-emerald-500" />,
  Coffee: <Coffee className="w-5 h-5 text-amber-700" />,
};

export const ScenesModal: React.FC<ScenesModalProps> = ({ isOpen, onClose }) => {
  const { scenes, devices, triggerScene, addScene, deleteScene } = usePlannerStore();

  const [isCreating, setIsCreating] = useState(false);
  const [sceneName, setSceneName] = useState('');
  const [selectedIcon, setSelectedIcon] = useState('Sparkles');
  const [deviceActions, setDeviceActions] = useState<
    { deviceId: string; statePatch: Record<string, any> }[]
  >([]);

  if (!isOpen) return null;

  const handleExecute = (sceneId: string) => {
    triggerScene(sceneId);
  };

  const handleSaveScene = (e: React.FormEvent) => {
    e.preventDefault();
    if (!sceneName.trim()) return;

    const newScene = new Scene(
      `scene_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`,
      sceneName.trim(),
      selectedIcon,
      '#0071E3',
      deviceActions
    );

    addScene(newScene);
    setIsCreating(false);
    setSceneName('');
    setDeviceActions([]);
  };

  const toggleDeviceInScene = (deviceId: string, defaultPatch: Record<string, any>) => {
    const exists = deviceActions.find((a) => a.deviceId === deviceId);
    if (exists) {
      setDeviceActions(deviceActions.filter((a) => a.deviceId !== deviceId));
    } else {
      setDeviceActions([...deviceActions, { deviceId, statePatch: defaultPatch }]);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="relative w-full max-w-xl bg-white/95 backdrop-blur-2xl border border-black/10 rounded-3xl shadow-2xl p-6 overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between pb-4 border-b border-black/5">
          <div className="flex items-center gap-2.5">
            <div className="p-2 bg-purple-50 rounded-xl">
              <Sparkles className="w-5 h-5 text-purple-600" />
            </div>
            <div>
              <h2 className="text-lg font-bold text-zinc-900">Сценарии умного дома</h2>
              <p className="text-xs text-zinc-400">
                Запуск набора действий на нескольких устройствах в один клик
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

        {/* Content */}
        {!isCreating ? (
          <div className="py-4 space-y-3 max-h-[60vh] overflow-y-auto pr-1">
            {scenes.length === 0 ? (
              <div className="text-center py-10 bg-zinc-50 rounded-2xl border border-dashed border-black/10">
                <Sparkles className="w-8 h-8 text-zinc-300 mx-auto mb-2" />
                <p className="text-xs text-zinc-500">У вас пока нет настроенных сценариев</p>
              </div>
            ) : (
              scenes.map((scene) => (
                <div
                  key={scene.id}
                  className="p-4 bg-zinc-50 hover:bg-zinc-100/80 border border-black/5 rounded-2xl transition-all flex items-center justify-between group"
                >
                  <div className="flex items-center gap-3.5">
                    <div className="p-2.5 bg-white rounded-xl shadow-xs border border-black/5">
                      {SCENE_ICONS[scene.icon] || <Sparkles className="w-5 h-5 text-purple-500" />}
                    </div>
                    <div>
                      <h4 className="font-semibold text-zinc-900 text-sm">{scene.name}</h4>
                      <p className="text-xs text-zinc-500">
                        {scene.actions.length} устройств задействовано
                      </p>
                    </div>
                  </div>

                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => handleExecute(scene.id)}
                      className="px-4 py-2 bg-[#0071E3] hover:bg-blue-600 text-white rounded-xl text-xs font-semibold flex items-center gap-1.5 transition-all active:scale-95 shadow-sm"
                    >
                      <Play className="w-3.5 h-3.5 fill-current" /> Запустить
                    </button>
                    <button
                      onClick={() => deleteScene(scene.id)}
                      className="p-2 rounded-xl text-zinc-400 hover:text-red-600 hover:bg-red-50 transition-colors"
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
              <Plus className="w-4 h-4" /> Создать новый сценарий
            </button>
          </div>
        ) : (
          <form onSubmit={handleSaveScene} className="py-4 space-y-4 max-h-[60vh] overflow-y-auto pr-1">
            <div>
              <label className="text-xs font-semibold text-zinc-500 mb-1.5 block">
                Название сценария
              </label>
              <input
                type="text"
                required
                value={sceneName}
                onChange={(e) => setSceneName(e.target.value)}
                placeholder="Например: Романтический ужин или Спокойной ночи"
                className="w-full px-3 py-2 bg-zinc-50 border border-black/10 rounded-xl text-sm font-medium text-zinc-900 focus:outline-none focus:ring-2 focus:ring-[#0071E3]"
              />
            </div>

            <div>
              <label className="text-xs font-semibold text-zinc-500 mb-1.5 block">
                Иконка сценария
              </label>
              <div className="flex items-center gap-2">
                {Object.keys(SCENE_ICONS).map((iconKey) => (
                  <button
                    key={iconKey}
                    type="button"
                    onClick={() => setSelectedIcon(iconKey)}
                    className={`p-2.5 rounded-xl border transition-all ${
                      selectedIcon === iconKey
                        ? 'border-[#0071E3] bg-blue-50/50 shadow-xs'
                        : 'border-black/5 bg-zinc-50 hover:bg-zinc-100'
                    }`}
                  >
                    {SCENE_ICONS[iconKey]}
                  </button>
                ))}
              </div>
            </div>

            <div>
              <label className="text-xs font-semibold text-zinc-500 mb-2 block">
                Выберите устройства и их состояние для этого сценария:
              </label>
              <div className="space-y-2">
                {Array.from(devices.values()).map((dev) => {
                  const action = deviceActions.find((a) => a.deviceId === dev.id);
                  const isIncluded = Boolean(action);

                  return (
                    <div
                      key={dev.id}
                      className={`p-3 rounded-xl border transition-all ${
                        isIncluded
                          ? 'border-[#0071E3] bg-blue-50/20'
                          : 'border-black/5 bg-zinc-50'
                      }`}
                    >
                      <div className="flex items-center justify-between">
                        <label className="flex items-center gap-2 cursor-pointer">
                          <input
                            type="checkbox"
                            checked={isIncluded}
                            onChange={() =>
                              toggleDeviceInScene(dev.id, {
                                isOn: true,
                                ...(dev.type === 'light' ? { brightness: 80, color: '#FF9500' } : {}),
                                ...(dev.type === 'curtains' ? { openPercentage: 0 } : {}),
                              })
                            }
                            className="rounded text-[#0071E3] focus:ring-[#0071E3]"
                          />
                          <span className="text-xs font-semibold text-zinc-900">{dev.name}</span>
                        </label>
                        <span className="text-[11px] text-zinc-400 uppercase">{dev.type}</span>
                      </div>

                      {isIncluded && (
                        <div className="mt-2.5 pt-2 border-t border-black/5 flex items-center gap-3 text-xs">
                          {dev.type === 'light' && (
                            <>
                              <button
                                type="button"
                                onClick={() =>
                                  setDeviceActions(
                                    deviceActions.map((a) =>
                                      a.deviceId === dev.id
                                        ? {
                                            ...a,
                                            statePatch: {
                                              ...a.statePatch,
                                              isOn: !a.statePatch.isOn,
                                            },
                                          }
                                        : a
                                    )
                                  )
                                }
                                className={`px-2 py-1 rounded-md text-[11px] font-semibold ${
                                  action?.statePatch.isOn
                                    ? 'bg-amber-100 text-amber-800'
                                    : 'bg-zinc-200 text-zinc-700'
                                }`}
                              >
                                {action?.statePatch.isOn ? 'Включить' : 'Выключить'}
                              </button>
                            </>
                          )}

                          {dev.type === 'curtains' && (
                            <div className="flex items-center gap-1.5">
                              <span className="text-[11px] text-zinc-500">Положение:</span>
                              <button
                                type="button"
                                onClick={() =>
                                  setDeviceActions(
                                    deviceActions.map((a) =>
                                      a.deviceId === dev.id
                                        ? { ...a, statePatch: { openPercentage: 0, isOn: false } }
                                        : a
                                    )
                                  )
                                }
                                className={`px-2 py-0.5 rounded text-[11px] font-medium ${
                                  action?.statePatch.openPercentage === 0
                                    ? 'bg-zinc-800 text-white'
                                    : 'bg-zinc-200'
                                }`}
                              >
                                Закрыть
                              </button>
                              <button
                                type="button"
                                onClick={() =>
                                  setDeviceActions(
                                    deviceActions.map((a) =>
                                      a.deviceId === dev.id
                                        ? { ...a, statePatch: { openPercentage: 100, isOn: true } }
                                        : a
                                    )
                                  )
                                }
                                className={`px-2 py-0.5 rounded text-[11px] font-medium ${
                                  action?.statePatch.openPercentage === 100
                                    ? 'bg-zinc-800 text-white'
                                    : 'bg-zinc-200'
                                }`}
                              >
                                Открыть
                              </button>
                            </div>
                          )}
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>

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
                Сохранить сценарий
              </button>
            </div>
          </form>
        )}
      </div>
    </div>
  );
};
