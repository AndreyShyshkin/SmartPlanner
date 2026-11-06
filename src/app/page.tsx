'use client';

import React, { useState, useEffect } from 'react';
import { usePlannerStore } from '@/store/usePlannerStore';
import { HeaderNav } from '@/components/layout/HeaderNav';
import { WelcomeScreen } from '@/components/welcome/WelcomeScreen';
import { PlannerCanvas } from '@/components/planner/PlannerCanvas';
import { PlannerToolbar } from '@/components/planner/PlannerToolbar';
import { RoomInspector } from '@/components/planner/RoomInspector';
import { DoorInspector } from '@/components/planner/DoorInspector';
import { AppleHomeView } from '@/components/devices/AppleHomeView';
import { SimulationView } from '@/components/simulation/SimulationView';
import { ScenesModal } from '@/components/automations/ScenesModal';
import { AutomationsModal } from '@/components/automations/AutomationsModal';
import { DeviceInspectorModal } from '@/components/devices/DeviceInspectorModal';

export default function Home() {
  const { activeTab, selectedEntity, setSelectedEntity, devices } = usePlannerStore();
  const [isInPlanner, setIsInPlanner] = useState(false);
  const [isScenesModalOpen, setIsScenesModalOpen] = useState(false);
  const [isAutomationsModalOpen, setIsAutomationsModalOpen] = useState(false);

  const selectedDevice =
    selectedEntity.type === 'device' && selectedEntity.id
      ? devices.get(selectedEntity.id) || null
      : null;

  // Initialize with sample template once if needed
  useEffect(() => {
    // If not already loaded
  }, []);

  if (!isInPlanner) {
    return <WelcomeScreen onEnterPlanner={() => setIsInPlanner(true)} />;
  }

  return (
    <main className="relative w-screen h-screen overflow-hidden flex flex-col bg-[#F5F5F7] select-none font-sans">
      {/* Top Header Navigation */}
      <HeaderNav
        onBackToWelcome={() => setIsInPlanner(false)}
        onOpenScenesModal={() => setIsScenesModalOpen(true)}
        onOpenAutomationsModal={() => setIsAutomationsModalOpen(true)}
      />

      {/* Main Tab View Area */}
      <div className="relative flex-1 w-full h-[calc(100vh-4rem)] overflow-hidden">
        {/* Tab 1: Layout Planner */}
        {activeTab === 'planner' && (
          <div className="relative w-full h-full">
            <PlannerToolbar />
            <PlannerCanvas />
            <RoomInspector />
            <DoorInspector />
          </div>
        )}

        {/* Tab 2: Smart Devices (Apple Home) */}
        {activeTab === 'devices' && (
          <AppleHomeView
            onOpenScenesModal={() => setIsScenesModalOpen(true)}
            onOpenAutomationsModal={() => setIsAutomationsModalOpen(true)}
          />
        )}

        {/* Tab 3: Interactive Simulation */}
        {activeTab === 'simulation' && <SimulationView />}
      </div>

      {/* Modals */}
      <DeviceInspectorModal
        device={selectedDevice}
        onClose={() => setSelectedEntity({ type: null, id: null })}
      />
      <ScenesModal
        isOpen={isScenesModalOpen}
        onClose={() => setIsScenesModalOpen(false)}
      />
      <AutomationsModal
        isOpen={isAutomationsModalOpen}
        onClose={() => setIsAutomationsModalOpen(false)}
      />
    </main>
  );
}
