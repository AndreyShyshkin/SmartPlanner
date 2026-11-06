'use client';

import React, { useRef, useEffect, useState, useCallback } from 'react';
import { usePlannerStore } from '@/store/usePlannerStore';
import { Point2D, CELL_SIZE } from '@/domain/types';
import { WallDetector } from '@/domain/layout/WallDetector';
import { Raycaster } from '@/domain/physics/Raycaster';

export const SimulationCanvas: React.FC = () => {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);

  const {
    gridWidth,
    gridHeight,
    zoom,
    panOffset,
    rooms,
    doors,
    devices,
    personPosition,
    isPersonHome,
    timeOfDayHours,
    setZoom,
    setPanOffset,
    centerView,
    setPersonPosition,
    toggleDevice,
    toggleDoor,
    stepSimulation,
  } = usePlannerStore();

  const [isDraggingAvatar, setIsDraggingAvatar] = useState(false);
  const [avatarTarget, setAvatarTarget] = useState<Point2D | null>(null);

  const pixelToGrid = useCallback(
    (clientX: number, clientY: number): { x: number; y: number } => {
      const canvas = canvasRef.current;
      if (!canvas) return { x: 0, y: 0 };
      const rect = canvas.getBoundingClientRect();
      const x = (clientX - rect.left - panOffset.x) / (CELL_SIZE * zoom);
      const y = (clientY - rect.top - panOffset.y) / (CELL_SIZE * zoom);
      return { x, y };
    },
    [panOffset, zoom]
  );

  // Resize canvas & auto-center on mount
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const resize = () => {
      const parent = canvas.parentElement;
      if (!parent) return;
      const dpr = window.devicePixelRatio || 1;
      canvas.width = parent.clientWidth * dpr;
      canvas.height = parent.clientHeight * dpr;
      canvas.style.width = `${parent.clientWidth}px`;
      canvas.style.height = `${parent.clientHeight}px`;

      // Auto-center floor plan on mount if not panned
      const currentOffset = usePlannerStore.getState().panOffset;
      if (currentOffset.x === 0 && currentOffset.y === 0) {
        centerView(parent.clientWidth, parent.clientHeight);
      }
    };

    resize();
    window.addEventListener('resize', resize);
    return () => window.removeEventListener('resize', resize);
  }, [centerView]);

  // Smooth wheel zoom and pan (trackpad pinch & scroll)
  const handleWheel = (e: React.WheelEvent<HTMLCanvasElement>) => {
    e.preventDefault();
    if (e.ctrlKey || e.metaKey) {
      const zoomFactor = e.deltaY < 0 ? 1.05 : 0.95;
      setZoom(zoom * zoomFactor);
    } else {
      setPanOffset({
        x: panOffset.x - e.deltaX,
        y: panOffset.y - e.deltaY,
      });
    }
  };

  // Keyboard navigation for avatar (WASD / Arrow Keys)
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (!personPosition || !isPersonHome) return;
      const speed = 0.5;
      let dx = 0;
      let dy = 0;

      if (e.key === 'ArrowUp' || e.key === 'w' || e.key === 'W') dy -= speed;
      if (e.key === 'ArrowDown' || e.key === 's' || e.key === 'S') dy += speed;
      if (e.key === 'ArrowLeft' || e.key === 'a' || e.key === 'A') dx -= speed;
      if (e.key === 'ArrowRight' || e.key === 'd' || e.key === 'D') dx += speed;

      if (dx !== 0 || dy !== 0) {
        e.preventDefault();
        const nextX = Math.max(0.5, Math.min(gridWidth - 0.5, personPosition.x + dx));
        const nextY = Math.max(0.5, Math.min(gridHeight - 0.5, personPosition.y + dy));
        setPersonPosition({ x: nextX, y: nextY });
        stepSimulation();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [personPosition, isPersonHome, gridWidth, gridHeight, setPersonPosition, stepSimulation]);

  // Smooth walking towards target point if clicked
  useEffect(() => {
    if (!avatarTarget || !personPosition || !isPersonHome) return;

    const interval = setInterval(() => {
      const dx = avatarTarget.x - personPosition.x;
      const dy = avatarTarget.y - personPosition.y;
      const dist = Math.hypot(dx, dy);

      if (dist < 0.2) {
        setAvatarTarget(null);
        return;
      }

      const step = Math.min(dist, 0.25);
      const nextX = personPosition.x + (dx / dist) * step;
      const nextY = personPosition.y + (dy / dist) * step;
      setPersonPosition({ x: nextX, y: nextY });
      stepSimulation();
    }, 30);

    return () => clearInterval(interval);
  }, [avatarTarget, personPosition, isPersonHome, setPersonPosition, stepSimulation]);

  // Main Simulation Render
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const dpr = window.devicePixelRatio || 1;
    ctx.save();
    ctx.scale(dpr, dpr);

    const width = canvas.width / dpr;
    const height = canvas.height / dpr;

    // Time of day ambient light calculation
    // 0:00 to 5:00 = dark night, 6:00-9:00 = sunrise/morning, 10:00-17:00 = daylight, 18:00-21:00 = sunset/dusk, 22:00-24:00 = night
    let ambientBg = '#F5F5F7';
    let ambientDarkness = 0; // 0 to 0.7
    if (timeOfDayHours >= 22 || timeOfDayHours < 6) {
      ambientBg = '#141416';
      ambientDarkness = 0.65;
    } else if (timeOfDayHours >= 18 && timeOfDayHours < 22) {
      ambientBg = '#222328';
      ambientDarkness = 0.45;
    } else if (timeOfDayHours >= 6 && timeOfDayHours < 8) {
      ambientBg = '#EFE9E2';
      ambientDarkness = 0.2;
    }

    ctx.fillStyle = ambientBg;
    ctx.fillRect(0, 0, width, height);

    ctx.save();
    ctx.translate(panOffset.x, panOffset.y);
    ctx.scale(zoom, zoom);

    const canvasPxWidth = gridWidth * CELL_SIZE;
    const canvasPxHeight = gridHeight * CELL_SIZE;

    // Floor plan background
    ctx.fillStyle = timeOfDayHours >= 20 || timeOfDayHours < 6 ? '#1C1C1E' : '#FFFFFF';
    ctx.fillRect(0, 0, canvasPxWidth, canvasPxHeight);

    // Subtle grid lines
    ctx.strokeStyle = timeOfDayHours >= 20 || timeOfDayHours < 6 ? 'rgba(255,255,255,0.05)' : '#F0F0F2';
    ctx.lineWidth = 1;
    ctx.beginPath();
    for (let x = 0; x <= gridWidth; x++) {
      ctx.moveTo(x * CELL_SIZE, 0);
      ctx.lineTo(x * CELL_SIZE, canvasPxHeight);
    }
    for (let y = 0; y <= gridHeight; y++) {
      ctx.moveTo(0, y * CELL_SIZE);
      ctx.lineTo(canvasPxWidth, y * CELL_SIZE);
    }
    ctx.stroke();

    const walls = WallDetector.extractWalls(rooms, doors);

    // 1. Draw Rooms with Ambient and Light Fill
    for (const room of rooms) {
      // Check if any light inside this room is turned on
      const roomLights = Array.from(devices.values()).filter(
        (d) => d.roomId === room.id && d.type === 'light' && d.getState().isOn
      );
      const isLit = roomLights.length > 0;
      const lightColor = isLit ? (roomLights[0].getState() as any).color || '#FFF3D0' : null;

      // Base room fill
      ctx.fillStyle = isLit ? lightColor + '30' : room.color + '15';
      for (const tile of room.getTilesList()) {
        ctx.fillRect(tile.x * CELL_SIZE, tile.y * CELL_SIZE, CELL_SIZE, CELL_SIZE);
      }

      // Room name & thermal info
      const center = room.getCenter();
      ctx.fillStyle = timeOfDayHours >= 20 || timeOfDayHours < 6 ? '#A1A1A6' : '#6E6E73';
      ctx.font = '600 11px -apple-system, BlinkMacSystemFont, "SF Pro Text", sans-serif';
      ctx.textAlign = 'center';
      ctx.fillText(room.name, center.x * CELL_SIZE, center.y * CELL_SIZE - 6);

      // Live Room Temperature & Climate Action Badge
      const liveTemp = room.customTemperature ?? 21.0;
      const roomThermostat = Array.from(devices.values()).find(
        (d) => d.roomId === room.id && d.type === 'thermostat'
      );
      const actionBadge = (roomThermostat?.getState() as any)?.climateActionState;
      let tempSuffix = '';
      if (actionBadge === 'heating') tempSuffix = ' 🔥 Обогрев';
      else if (actionBadge === 'cooling') tempSuffix = ' ❄️ Охлаждение';
      else if (roomThermostat && (roomThermostat.getState() as any).isOn) tempSuffix = ' ✨ Комфорт';

      const tempText = `🌡️ ${liveTemp.toFixed(1)}°C${tempSuffix}`;
      ctx.font = '500 10px -apple-system, BlinkMacSystemFont, sans-serif';
      ctx.fillText(tempText, center.x * CELL_SIZE, center.y * CELL_SIZE + 8);
    }

    // 2. Draw Motion Sensors Raycast Vision Field (Occluded by walls!)
    for (const dev of Array.from(devices.values())) {
      if (dev.type === 'motion') {
        const state = dev.getState() as any;
        const radius = (state.detectionRadius || 3.5) * CELL_SIZE;
        const fov = state.fovAngle || 360;
        const rotation = state.rotationAngle || 0;

        const poly = Raycaster.computeVisiblePolygon(
          { x: dev.x * CELL_SIZE, y: dev.y * CELL_SIZE },
          radius,
          walls.map((w) => ({
            startX: w.startX * CELL_SIZE,
            startY: w.startY * CELL_SIZE,
            endX: w.endX * CELL_SIZE,
            endY: w.endY * CELL_SIZE,
            isDoor: w.isDoor,
          })),
          fov,
          rotation,
          64
        );

        if (poly.length > 0) {
          ctx.beginPath();
          ctx.moveTo(dev.x * CELL_SIZE, dev.y * CELL_SIZE);
          for (const pt of poly) {
            ctx.lineTo(pt.x, pt.y);
          }
          ctx.closePath();

          // If sensor is actively detecting the person, vision cone turns vibrant glowing blue!
          if (state.isDetecting) {
            ctx.fillStyle = 'rgba(0, 113, 227, 0.35)';
            ctx.strokeStyle = 'rgba(0, 113, 227, 0.8)';
          } else {
            ctx.fillStyle = 'rgba(0, 113, 227, 0.08)';
            ctx.strokeStyle = 'rgba(0, 113, 227, 0.25)';
          }
          ctx.fill();
          ctx.lineWidth = 1.5;
          ctx.setLineDash([3, 3]);
          ctx.stroke();
          ctx.setLineDash([]);
        }
      }
    }

    // 3. Draw Room Walls
    ctx.strokeStyle = timeOfDayHours >= 20 || timeOfDayHours < 6 ? '#F5F5F7' : '#1D1D1F';
    ctx.lineWidth = 5;
    ctx.lineCap = 'round';
    for (const wall of walls) {
      if (wall.isDoor) continue;
      ctx.beginPath();
      ctx.moveTo(wall.startX * CELL_SIZE, wall.startY * CELL_SIZE);
      ctx.lineTo(wall.endX * CELL_SIZE, wall.endY * CELL_SIZE);
      ctx.stroke();
    }

    // 4. Draw Doors
    for (const door of doors) {
      const x = door.x * CELL_SIZE;
      const y = door.y * CELL_SIZE;

      ctx.save();
      ctx.translate(x, y);

      if (door.orientation === 'horizontal') {
        ctx.fillStyle = '#1D1D1F';
        ctx.fillRect(-2, -4, 4, 8);
        ctx.fillRect(CELL_SIZE - 2, -4, 4, 8);

        if (door.isOpen) {
          ctx.strokeStyle = '#34C759';
          ctx.lineWidth = 3;
          ctx.beginPath();
          ctx.moveTo(0, 0);
          ctx.lineTo(0, -CELL_SIZE);
          ctx.stroke();

          ctx.setLineDash([2, 3]);
          ctx.strokeStyle = 'rgba(52, 199, 89, 0.4)';
          ctx.beginPath();
          ctx.arc(0, 0, CELL_SIZE, -Math.PI / 2, 0, false);
          ctx.stroke();
          ctx.setLineDash([]);
        } else {
          ctx.strokeStyle = '#8E8E93';
          ctx.lineWidth = 3;
          ctx.beginPath();
          ctx.moveTo(0, 0);
          ctx.lineTo(CELL_SIZE, 0);
          ctx.stroke();
        }
      } else {
        ctx.fillStyle = '#1D1D1F';
        ctx.fillRect(-4, -2, 8, 4);
        ctx.fillRect(-4, CELL_SIZE - 2, 8, 4);

        if (door.isOpen) {
          ctx.strokeStyle = '#34C759';
          ctx.lineWidth = 3;
          ctx.beginPath();
          ctx.moveTo(0, 0);
          ctx.lineTo(-CELL_SIZE, 0);
          ctx.stroke();

          ctx.setLineDash([2, 3]);
          ctx.strokeStyle = 'rgba(52, 199, 89, 0.4)';
          ctx.beginPath();
          ctx.arc(0, 0, CELL_SIZE, Math.PI, 1.5 * Math.PI, true);
          ctx.stroke();
          ctx.setLineDash([]);
        } else {
          ctx.strokeStyle = '#8E8E93';
          ctx.lineWidth = 3;
          ctx.beginPath();
          ctx.moveTo(0, 0);
          ctx.lineTo(0, CELL_SIZE);
          ctx.stroke();
        }
      }
      ctx.restore();
    }

    // 5. Draw Devices with Dynamic Glow & Status
    for (const dev of Array.from(devices.values())) {
      const state = dev.getState();
      const dx = dev.x * CELL_SIZE;
      const dy = dev.y * CELL_SIZE;

      ctx.save();

      // Dynamic light halo if light is on
      if (dev.type === 'light' && state.isOn) {
        const radius = ((state.brightness || 80) / 100) * (CELL_SIZE * 2.5);
        const grad = ctx.createRadialGradient(dx, dy, 5, dx, dy, radius);
        grad.addColorStop(0, state.color ? state.color + '90' : 'rgba(255, 214, 10, 0.6)');
        grad.addColorStop(1, 'rgba(255, 214, 10, 0)');
        ctx.fillStyle = grad;
        ctx.beginPath();
        ctx.arc(dx, dy, radius, 0, Math.PI * 2);
        ctx.fill();
      }

      // Dynamic heater warmth aura if heater is on
      if (dev.type === 'heater' && state.isOn) {
        const radius = CELL_SIZE * 1.8;
        const grad = ctx.createRadialGradient(dx, dy, 4, dx, dy, radius);
        grad.addColorStop(0, 'rgba(255, 106, 0, 0.45)');
        grad.addColorStop(0.6, 'rgba(255, 69, 0, 0.18)');
        grad.addColorStop(1, 'rgba(255, 69, 0, 0)');
        ctx.fillStyle = grad;
        ctx.beginPath();
        ctx.arc(dx, dy, radius, 0, Math.PI * 2);
        ctx.fill();
      }

      // Dynamic AC cool breeze aura if AC is on
      if (dev.type === 'ac' && state.isOn) {
        const radius = CELL_SIZE * 2.2;
        const grad = ctx.createRadialGradient(dx, dy, 4, dx, dy, radius);
        grad.addColorStop(0, 'rgba(0, 180, 255, 0.45)');
        grad.addColorStop(0.6, 'rgba(0, 122, 255, 0.18)');
        grad.addColorStop(1, 'rgba(0, 122, 255, 0)');
        ctx.fillStyle = grad;
        ctx.beginPath();
        ctx.arc(dx, dy, radius, 0, Math.PI * 2);
        ctx.fill();
      }

      // Device badge
      ctx.shadowColor = 'rgba(0, 0, 0, 0.15)';
      ctx.shadowBlur = 8;
      ctx.shadowOffsetY = 2;

      ctx.fillStyle = state.isOn ? '#FFFFFF' : '#E5E5EA';
      ctx.strokeStyle = state.isOn ? '#0071E3' : '#AEAEB2';
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.arc(dx, dy, 14, 0, Math.PI * 2);
      ctx.fill();
      ctx.stroke();
      ctx.shadowColor = 'transparent';

      // Icon symbol
      ctx.font = '12px sans-serif';
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      const symbols: Record<string, string> = {
        light: '💡',
        motion: '👁️',
        door_sensor: '🚪',
        thermostat: '🌡️',
        heater: '♨️',
        curtains: '🪟',
        ac: '❄️',
        socket: '⚡',
      };
      ctx.fillText(symbols[dev.type] || '•', dx, dy + 1);

      ctx.restore();
    }

    // 6. Draw Virtual Human Avatar
    if (isPersonHome && personPosition) {
      const px = personPosition.x * CELL_SIZE;
      const py = personPosition.y * CELL_SIZE;

      ctx.save();
      // Outer pulse ring
      ctx.strokeStyle = 'rgba(0, 113, 227, 0.4)';
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.arc(px, py, 18, 0, Math.PI * 2);
      ctx.stroke();

      // Avatar circle
      ctx.shadowColor = 'rgba(0, 113, 227, 0.5)';
      ctx.shadowBlur = 12;
      ctx.fillStyle = '#0071E3';
      ctx.beginPath();
      ctx.arc(px, py, 12, 0, Math.PI * 2);
      ctx.fill();
      ctx.shadowColor = 'transparent';

      // Inner icon (Human silhouette / dot)
      ctx.fillStyle = '#FFFFFF';
      ctx.font = '700 11px -apple-system, BlinkMacSystemFont, sans-serif';
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.fillText('🚶', px, py);

      // Name tag pill
      ctx.font = '600 10px -apple-system, BlinkMacSystemFont, sans-serif';
      const tagText = 'Человек (Вы)';
      const tagWidth = ctx.measureText(tagText).width + 12;
      ctx.fillStyle = 'rgba(0, 0, 0, 0.75)';
      ctx.beginPath();
      ctx.roundRect(px - tagWidth / 2, py - 28, tagWidth, 16, 6);
      ctx.fill();
      ctx.fillStyle = '#FFFFFF';
      ctx.fillText(tagText, px, py - 20);

      ctx.restore();
    }

    // 7. Ambient night overlay
    if (ambientDarkness > 0) {
      ctx.fillStyle = `rgba(0, 0, 20, ${ambientDarkness * 0.45})`;
      ctx.fillRect(0, 0, canvasPxWidth, canvasPxHeight);
    }

    ctx.restore();
    ctx.restore();
  }, [
    gridWidth,
    gridHeight,
    zoom,
    panOffset,
    rooms,
    doors,
    devices,
    personPosition,
    isPersonHome,
    timeOfDayHours,
  ]);

  // Pointer event handlers for moving the avatar and clicking devices
  const handlePointerDown = (e: React.PointerEvent<HTMLCanvasElement>) => {
    const { x, y } = pixelToGrid(e.clientX, e.clientY);

    // 1. Check if clicked on Avatar
    if (isPersonHome && personPosition) {
      const distToPerson = Math.hypot(x - personPosition.x, y - personPosition.y);
      if (distToPerson <= 0.9) {
        setIsDraggingAvatar(true);
        return;
      }
    }

    // 2. Check if clicked on a Device (quick toggle in simulation)
    for (const dev of Array.from(devices.values())) {
      if (dev.containsPoint({ x, y })) {
        toggleDevice(dev.id);
        stepSimulation();
        return;
      }
    }

    // 3. Check if clicked on a Door
    for (const door of doors) {
      if (door.containsPoint({ x, y })) {
        toggleDoor(door.id);
        stepSimulation();
        return;
      }
    }

    // 4. Otherwise, set walk destination
    if (isPersonHome) {
      setAvatarTarget({ x, y });
    }
  };

  const handlePointerMove = (e: React.PointerEvent<HTMLCanvasElement>) => {
    if (!isDraggingAvatar) return;
    const { x, y } = pixelToGrid(e.clientX, e.clientY);
    const clampedX = Math.max(0.5, Math.min(gridWidth - 0.5, x));
    const clampedY = Math.max(0.5, Math.min(gridHeight - 0.5, y));
    setPersonPosition({ x: clampedX, y: clampedY });
    stepSimulation();
  };

  const handlePointerUp = () => {
    setIsDraggingAvatar(false);
  };

  return (
    <div className="relative w-full h-full overflow-hidden select-none bg-[#F5F5F7]">
      <canvas
        ref={canvasRef}
        onPointerDown={handlePointerDown}
        onPointerMove={handlePointerMove}
        onPointerUp={handlePointerUp}
        onWheel={handleWheel}
        className="w-full h-full touch-none cursor-pointer"
      />
    </div>
  );
};
