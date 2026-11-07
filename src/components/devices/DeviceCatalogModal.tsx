'use client';

import React from 'react';
import { usePlannerStore } from '@/store/usePlannerStore';
import { DeviceType } from '@/domain/types';
import {
  X,
  Lightbulb,
  Activity,
  DoorOpen,
  Thermometer,
  Flame,
  Blinds,
  Wind,
  Zap,
} from 'lucide-react';

interface DeviceCatalogModalProps {
  isOpen: boolean;
  onClose: () => void;
  onDeviceSelected: (type: DeviceType) => void;
}

interface DeviceCatalogItem {
  type: DeviceType;
  title: string;
  category: string;
  description: string;
  icon: React.ReactNode;
  badge?: string;
}

export const DeviceCatalogModal: React.FC<DeviceCatalogModalProps> = ({
  isOpen,
  onClose,
  onDeviceSelected,
}) => {
  if (!isOpen) return null;

  const catalog: DeviceCatalogItem[] = [
    {
      type: 'light',
      title: 'Розумна лампа',
      category: 'Освітлення',
      description: 'Регулювання яскравості, палітри RGB та керування сценаріями освітлення.',
      icon: <Lightbulb className="w-6 h-6 text-yellow-500" />,
    },
    {
      type: 'motion',
      title: 'Датчик руху',
      category: 'Безпека та датчики',
      description: 'Фіксація людей з урахуванням геометрії стін (промінь не проходить крізь стіни) та радіусом, що налаштовується.',
      icon: <Activity className="w-6 h-6 text-blue-500" />,
      badge: 'Raycast FOV',
    },
    {
      type: 'door_sensor',
      title: 'Датчик відкриття дверей',
      category: 'Безпека та датчики',
      description: 'Монтується тільки на дверний отвір. Спрацьовує під час проходу людини крізь двері.',
      icon: <DoorOpen className="w-6 h-6 text-amber-500" />,
      badge: 'Тільки двері',
    },
    {
      type: 'thermostat',
      title: 'Термостат',
      category: 'Клімат',
      description: 'Контроль цільової температури, відображення поточної температури в кімнаті.',
      icon: <Thermometer className="w-6 h-6 text-orange-500" />,
    },
    {
      type: 'heater',
      title: 'Розумна батарея (радіатор)',
      category: 'Опалення',
      description: 'Регулює потужність обігріву та динамічно підвищує температуру в приміщенні.',
      icon: <Flame className="w-6 h-6 text-red-500" />,
    },
    {
      type: 'curtains',
      title: 'Розумні штори',
      category: 'Комфорт',
      description: 'Електропривід карниза з точним відсотком відкриття та інтеграцією в сценарії.',
      icon: <Blinds className="w-6 h-6 text-indigo-500" />,
    },
    {
      type: 'ac',
      title: 'Кондиціонер',
      category: 'Клімат',
      description: 'Охолодження та вентиляція приміщення, вибір швидкості обдуву та цільової температури.',
      icon: <Wind className="w-6 h-6 text-cyan-500" />,
    },
    {
      type: 'socket',
      title: 'Розумна розетка',
      category: 'Енергія',
      description: 'Контроль живлення приладів та моніторинг енергоспоживання у ватах.',
      icon: <Zap className="w-6 h-6 text-amber-400" />,
    },
  ];

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="relative w-full max-w-2xl bg-white/95 backdrop-blur-2xl border border-black/10 rounded-3xl shadow-2xl p-6 overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between pb-4 border-b border-black/5">
          <div>
            <h2 className="text-xl font-bold text-zinc-900">Каталог пристроїв Apple Home</h2>
            <p className="text-xs text-zinc-500 mt-0.5">
              Виберіть пристрій для розміщення на 2D плані розумного будинку
            </p>
          </div>
          <button
            onClick={onClose}
            className="p-2 rounded-full hover:bg-zinc-100 text-zinc-400 hover:text-zinc-700 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Catalog Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3 max-h-[60vh] overflow-y-auto py-4 pr-1">
          {catalog.map((item) => (
            <div
              key={item.type}
              onClick={() => {
                onDeviceSelected(item.type);
                onClose();
              }}
              className="group p-4 bg-zinc-50 hover:bg-white hover:shadow-apple border border-black/5 rounded-2xl transition-all cursor-pointer flex flex-col justify-between"
            >
              <div>
                <div className="flex items-center justify-between mb-2">
                  <div className="p-2.5 bg-white rounded-xl shadow-xs border border-black/5 group-hover:scale-110 transition-transform">
                    {item.icon}
                  </div>
                  {item.badge && (
                    <span className="px-2 py-0.5 bg-blue-50 text-blue-600 rounded-full text-[10px] font-semibold border border-blue-100">
                      {item.badge}
                    </span>
                  )}
                </div>
                <h3 className="font-semibold text-zinc-900 text-sm group-hover:text-[#0071E3] transition-colors">
                  {item.title}
                </h3>
                <p className="text-xs text-zinc-500 mt-1 leading-relaxed">
                  {item.description}
                </p>
              </div>

              <div className="mt-4 pt-3 border-t border-black/5 flex items-center justify-between">
                <span className="text-[11px] font-medium text-zinc-400 uppercase tracking-wider">
                  {item.category}
                </span>
                <span className="text-xs font-semibold text-[#0071E3] group-hover:translate-x-1 transition-transform">
                  Розмістити →
                </span>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};
