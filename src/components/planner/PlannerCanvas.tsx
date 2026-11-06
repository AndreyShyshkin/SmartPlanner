'use client';

import React, { useRef, useEffect, useState, useCallback } from 'react';
import { usePlannerStore } from '@/store/usePlannerStore';
import { Point2D } from '@/domain/types';
import { WallDetector } from '@/domain/layout/WallDetector';
import { DeviceFactory } from '@/domain/devices/DeviceFactory';
import { X, Check, AlertCircle } from 'lucide-react';

export const PlannerCanvas: React.FC = () => {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);

  const {
    activeTab,
    gridWidth,
    gridHeight,
    zoom,
    panOffset,
    activeTool,
    rooms,
    doors,
    devices,
    activeRoomColor,
    selectedEntity,
    doorOrientation,
    personPosition,
    placingDeviceType,
    setPlacingDeviceType,
    setSelectedEntity,
    addRoom,
    addTilesToRoom,
    removeTilesFromRoom,
    moveRoom,
    addDoor,
    toggleDoor,
    addDevice,
    moveDevice,
    setPanOffset,
  } = usePlannerStore();

  // Interaction states
  const [isPointerDown, setIsPointerDown] = useState(false);
  const [dragStartCell, setDragStartCell] = useState<Point2D | null>(null);
  const [currentHoverCell, setCurrentHoverCell] = useState<Point2D | null>(null);
  const [currentHoverRaw, setCurrentHoverRaw] = useState<Point2D | null>(null);

  // Click vs Drag discrimination
  const [pointerDownScreenPos, setPointerDownScreenPos] = useState<Point2D | null>(null);
  const [hasMovedSignificantly, setHasMovedSignificantly] = useState(false);

  // Room dragging state
  const [dragRoomId, setDragRoomId] = useState<string | null>(null);
  const [dragRoomStartOffset, setDragRoomStartOffset] = useState<Point2D | null>(null);
  const [candidateRoomId, setCandidateRoomId] = useState<string | null>(null);

  // Device dragging state in planner
  const [dragDeviceId, setDragDeviceId] = useState<string | null>(null);
  const [dragDeviceOffset, setDragDeviceOffset] = useState<Point2D | null>(null);
  const [candidateDeviceId, setCandidateDeviceId] = useState<string | null>(null);

  // Canvas panning state
  const [isPanning, setIsPanning] = useState(false);
  const [panStart, setPanStart] = useState<Point2D>({ x: 0, y: 0 });

  // Grid cell sizing in pixels (base scale)
  const CELL_SIZE = 32;

  // Convert canvas pixel coordinates to grid cell coordinates
  const pixelToGrid = useCallback(
    (clientX: number, clientY: number): { cell: Point2D; raw: Point2D } => {
      const canvas = canvasRef.current;
      if (!canvas) return { cell: { x: 0, y: 0 }, raw: { x: 0, y: 0 } };

      const rect = canvas.getBoundingClientRect();
      const x = (clientX - rect.left - panOffset.x) / (CELL_SIZE * zoom);
      const y = (clientY - rect.top - panOffset.y) / (CELL_SIZE * zoom);

      return {
        cell: { x: Math.floor(x), y: Math.floor(y) },
        raw: { x, y },
      };
    },
    [panOffset, zoom]
  );

  // Keyboard shortcut to cancel placement mode (Escape)
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && placingDeviceType) {
        setPlacingDeviceType(null);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [placingDeviceType, setPlacingDeviceType]);

  // Resize canvas to parent container
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
    };

    resize();
    window.addEventListener('resize', resize);
    return () => window.removeEventListener('resize', resize);
  }, []);

  // Main Render Loop
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

    // Clear background
    ctx.fillStyle = '#F5F5F7';
    ctx.fillRect(0, 0, width, height);

    ctx.save();
    ctx.translate(panOffset.x, panOffset.y);
    ctx.scale(zoom, zoom);

    // 1. Draw Grid
    const canvasPxWidth = gridWidth * CELL_SIZE;
    const canvasPxHeight = gridHeight * CELL_SIZE;

    // Board shadow & white paper background
    ctx.shadowColor = 'rgba(0, 0, 0, 0.06)';
    ctx.shadowBlur = 20;
    ctx.shadowOffsetY = 4;
    ctx.fillStyle = '#FFFFFF';
    ctx.fillRect(0, 0, canvasPxWidth, canvasPxHeight);
    ctx.shadowColor = 'transparent';

    ctx.strokeStyle = '#E5E5EA';
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

    // 2. Draw Rooms
    for (const room of rooms) {
      const isSelected = selectedEntity.type === 'room' && selectedEntity.id === room.id;

      // Fill room tiles
      ctx.fillStyle = room.color + '26'; // 15% opacity hex
      for (const tile of room.getTilesList()) {
        ctx.fillRect(tile.x * CELL_SIZE, tile.y * CELL_SIZE, CELL_SIZE, CELL_SIZE);
      }

      // If selected, highlight room tiles border
      if (isSelected) {
        ctx.strokeStyle = room.color;
        ctx.lineWidth = 2;
        for (const tile of room.getTilesList()) {
          ctx.strokeRect(tile.x * CELL_SIZE + 1, tile.y * CELL_SIZE + 1, CELL_SIZE - 2, CELL_SIZE - 2);
        }
      }

      // Room label & area
      if (room.tiles.size > 0) {
        const center = room.getCenter();
        const centerX = center.x * CELL_SIZE;
        const centerY = center.y * CELL_SIZE;

        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';

        // Badge pill
        const nameText = room.name || 'Комната';
        const areaText = `${(room.getArea() * 0.25).toFixed(1)} м²`;
        ctx.font = '600 12px -apple-system, BlinkMacSystemFont, "SF Pro Text", sans-serif';
        const textWidth = Math.max(ctx.measureText(nameText).width, ctx.measureText(areaText).width);
        const pillWidth = textWidth + 18;
        const pillHeight = 34;

        ctx.fillStyle = 'rgba(255, 255, 255, 0.92)';
        ctx.shadowColor = 'rgba(0, 0, 0, 0.08)';
        ctx.shadowBlur = 8;
        ctx.shadowOffsetY = 2;

        const px = centerX - pillWidth / 2;
        const py = centerY - pillHeight / 2;
        ctx.beginPath();
        ctx.roundRect(px, py, pillWidth, pillHeight, 8);
        ctx.fill();
        ctx.shadowColor = 'transparent';

        // Room color dot
        ctx.fillStyle = room.color;
        ctx.beginPath();
        ctx.arc(px + 8, py + 12, 3.5, 0, Math.PI * 2);
        ctx.fill();

        // Text
        ctx.fillStyle = '#1D1D1F';
        ctx.fillText(nameText, centerX + 4, centerY - 5);
        ctx.font = '400 10px -apple-system, BlinkMacSystemFont, "SF Pro Text", sans-serif';
        ctx.fillStyle = '#86868B';
        ctx.fillText(areaText, centerX, centerY + 9);
      }
    }

    // 3. Draw Room Walls
    const wallSegments = WallDetector.extractWalls(rooms, doors);
    ctx.strokeStyle = '#1D1D1F';
    ctx.lineWidth = 4;
    ctx.lineCap = 'round';

    for (const wall of wallSegments) {
      if (wall.isDoor) continue; // Door gap
      ctx.beginPath();
      ctx.moveTo(wall.startX * CELL_SIZE, wall.startY * CELL_SIZE);
      ctx.lineTo(wall.endX * CELL_SIZE, wall.endY * CELL_SIZE);
      ctx.stroke();
    }

    // 4. Draw Doors
    for (const door of doors) {
      const isSelected = selectedEntity.type === 'door' && selectedEntity.id === door.id;
      const isDoorSensorPlacing = placingDeviceType === 'door_sensor';
      const x = door.x * CELL_SIZE;
      const y = door.y * CELL_SIZE;

      ctx.save();
      ctx.translate(x, y);

      // Highlight doors in vibrant green if placing door sensor!
      if (isDoorSensorPlacing) {
        ctx.shadowColor = 'rgba(52, 199, 89, 0.8)';
        ctx.shadowBlur = 12;
        ctx.fillStyle = 'rgba(52, 199, 89, 0.2)';
        if (door.orientation === 'horizontal') {
          ctx.fillRect(-4, -12, CELL_SIZE + 8, 24);
        } else {
          ctx.fillRect(-12, -4, 24, CELL_SIZE + 8);
        }
        ctx.shadowColor = 'transparent';
      }

      if (door.orientation === 'horizontal') {
        // Horizontal Door
        ctx.clearRect(0, -3, CELL_SIZE, 6);
        ctx.fillStyle = '#FFFFFF';
        ctx.fillRect(0, -3, CELL_SIZE, 6);

        // Frame posts
        ctx.fillStyle = isSelected ? '#0071E3' : isDoorSensorPlacing ? '#34C759' : '#1D1D1F';
        ctx.fillRect(-2, -3, 4, 6);
        ctx.fillRect(CELL_SIZE - 2, -3, 4, 6);

        // Door leaf & swing arc
        if (door.isOpen) {
          ctx.strokeStyle = '#0071E3';
          ctx.lineWidth = 2.5;
          ctx.beginPath();
          ctx.moveTo(0, 0);
          ctx.lineTo(0, -CELL_SIZE);
          ctx.stroke();

          ctx.setLineDash([3, 3]);
          ctx.strokeStyle = 'rgba(0, 113, 227, 0.4)';
          ctx.beginPath();
          ctx.arc(0, 0, CELL_SIZE, -Math.PI / 2, 0, false);
          ctx.stroke();
          ctx.setLineDash([]);
        } else {
          ctx.strokeStyle = isSelected ? '#0071E3' : isDoorSensorPlacing ? '#34C759' : '#8E8E93';
          ctx.lineWidth = 3;
          ctx.beginPath();
          ctx.moveTo(0, 0);
          ctx.lineTo(CELL_SIZE, 0);
          ctx.stroke();
        }
      } else {
        // Vertical Door
        ctx.clearRect(-3, 0, 6, CELL_SIZE);
        ctx.fillStyle = '#FFFFFF';
        ctx.fillRect(-3, 0, 6, CELL_SIZE);

        ctx.fillStyle = isSelected ? '#0071E3' : isDoorSensorPlacing ? '#34C759' : '#1D1D1F';
        ctx.fillRect(-3, -2, 6, 4);
        ctx.fillRect(-3, CELL_SIZE - 2, 6, 4);

        if (door.isOpen) {
          ctx.strokeStyle = '#0071E3';
          ctx.lineWidth = 2.5;
          ctx.beginPath();
          ctx.moveTo(0, 0);
          ctx.lineTo(-CELL_SIZE, 0);
          ctx.stroke();

          ctx.setLineDash([3, 3]);
          ctx.strokeStyle = 'rgba(0, 113, 227, 0.4)';
          ctx.beginPath();
          ctx.arc(0, 0, CELL_SIZE, Math.PI, 1.5 * Math.PI, true);
          ctx.stroke();
          ctx.setLineDash([]);
        } else {
          ctx.strokeStyle = isSelected ? '#0071E3' : isDoorSensorPlacing ? '#34C759' : '#8E8E93';
          ctx.lineWidth = 3;
          ctx.beginPath();
          ctx.moveTo(0, 0);
          ctx.lineTo(0, CELL_SIZE);
          ctx.stroke();
        }
      }
      ctx.restore();
    }

    // 5. Draw Devices in Planner mode
    for (const dev of Array.from(devices.values())) {
      const isSelected = selectedEntity.type === 'device' && selectedEntity.id === dev.id;
      const isDragging = dragDeviceId === dev.id && hasMovedSignificantly;
      const dx = dev.x * CELL_SIZE;
      const dy = dev.y * CELL_SIZE;

      ctx.save();

      // Outer glow for selected or dragging device
      if (isDragging) {
        ctx.shadowColor = 'rgba(0, 113, 227, 0.7)';
        ctx.shadowBlur = 18;
      } else if (isSelected) {
        ctx.shadowColor = '#0071E3';
        ctx.shadowBlur = 10;
      }

      // If motion sensor is selected or dragging, draw its radius outline
      if ((isSelected || isDragging) && dev.type === 'motion') {
        const state = dev.getState() as any;
        const rad = (state.detectionRadius || 3.5) * CELL_SIZE;
        ctx.strokeStyle = 'rgba(0, 113, 227, 0.4)';
        ctx.lineWidth = 1.5;
        ctx.setLineDash([4, 4]);
        ctx.beginPath();
        ctx.arc(dx, dy, rad, 0, Math.PI * 2);
        ctx.stroke();
        ctx.setLineDash([]);
      }

      // Device badge circle
      ctx.fillStyle = isDragging ? '#0071E3' : isSelected ? '#0071E3' : '#FFFFFF';
      ctx.strokeStyle = isDragging ? '#FFFFFF' : isSelected ? '#FFFFFF' : '#D1D1D6';
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.arc(dx, dy, isDragging ? 15 : 12, 0, Math.PI * 2);
      ctx.fill();
      ctx.stroke();

      // Device Type Icon / Letter
      ctx.fillStyle = isDragging || isSelected ? '#FFFFFF' : '#1D1D1F';
      ctx.font = '700 10px -apple-system, BlinkMacSystemFont, sans-serif';
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';

      const typeSymbol: Record<string, string> = {
        light: '💡',
        motion: '👁️',
        door_sensor: '🚪',
        thermostat: '🌡️',
        heater: '♨️',
        curtains: '🪟',
        ac: '❄️',
        socket: '⚡',
      };
      ctx.fillText(typeSymbol[dev.type] || '•', dx, dy + 1);

      // Name tooltip when selected or dragged
      if (isSelected || isDragging) {
        const devName = dev.name;
        ctx.font = '600 10px -apple-system, BlinkMacSystemFont, sans-serif';
        const nw = ctx.measureText(devName).width + 12;
        ctx.fillStyle = 'rgba(0, 0, 0, 0.75)';
        ctx.beginPath();
        ctx.roundRect(dx - nw / 2, dy - 26, nw, 16, 5);
        ctx.fill();
        ctx.fillStyle = '#FFFFFF';
        ctx.fillText(devName, dx, dy - 18);
      }

      ctx.restore();
    }

    // 6. Draw Interactive Device Placement Ghost Preview
    if (placingDeviceType && currentHoverRaw) {
      const hx = currentHoverRaw.x * CELL_SIZE;
      const hy = currentHoverRaw.y * CELL_SIZE;

      ctx.save();

      // If motion sensor, preview radius
      if (placingDeviceType === 'motion') {
        ctx.strokeStyle = 'rgba(0, 113, 227, 0.5)';
        ctx.fillStyle = 'rgba(0, 113, 227, 0.08)';
        ctx.lineWidth = 1.5;
        ctx.setLineDash([4, 4]);
        ctx.beginPath();
        ctx.arc(hx, hy, 3.5 * CELL_SIZE, 0, Math.PI * 2);
        ctx.fill();
        ctx.stroke();
        ctx.setLineDash([]);
      }

      // Ghost circle
      ctx.shadowColor = 'rgba(0, 113, 227, 0.4)';
      ctx.shadowBlur = 14;
      ctx.fillStyle = 'rgba(0, 113, 227, 0.85)';
      ctx.beginPath();
      ctx.arc(hx, hy, 16, 0, Math.PI * 2);
      ctx.fill();
      ctx.shadowColor = 'transparent';

      // Ghost icon
      const ghostSymbols: Record<string, string> = {
        light: '💡',
        motion: '👁️',
        door_sensor: '🚪',
        thermostat: '🌡️',
        heater: '♨️',
        curtains: '🪟',
        ac: '❄️',
        socket: '⚡',
      };
      ctx.font = '14px sans-serif';
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.fillText(ghostSymbols[placingDeviceType] || '•', hx, hy);

      // Tooltip following cursor
      const labelText =
        placingDeviceType === 'door_sensor'
          ? 'Нажмите на дверь для установки'
          : 'Нажмите, чтобы поставить';
      ctx.font = '600 10px -apple-system, BlinkMacSystemFont, sans-serif';
      const tw = ctx.measureText(labelText).width + 14;
      ctx.fillStyle = 'rgba(0, 0, 0, 0.8)';
      ctx.beginPath();
      ctx.roundRect(hx - tw / 2, hy - 32, tw, 18, 6);
      ctx.fill();
      ctx.fillStyle = '#FFFFFF';
      ctx.fillText(labelText, hx, hy - 23);

      ctx.restore();
    }

    // 7. Draw Previews for Room tools
    if (activeTool === 'room_rect' && dragStartCell && currentHoverCell && isPointerDown) {
      const minX = Math.min(dragStartCell.x, currentHoverCell.x);
      const maxX = Math.max(dragStartCell.x, currentHoverCell.x);
      const minY = Math.min(dragStartCell.y, currentHoverCell.y);
      const maxY = Math.max(dragStartCell.y, currentHoverCell.y);

      const w = (maxX - minX + 1) * CELL_SIZE;
      const h = (maxY - minY + 1) * CELL_SIZE;

      ctx.fillStyle = activeRoomColor + '40';
      ctx.fillRect(minX * CELL_SIZE, minY * CELL_SIZE, w, h);

      ctx.strokeStyle = activeRoomColor;
      ctx.lineWidth = 2;
      ctx.setLineDash([4, 4]);
      ctx.strokeRect(minX * CELL_SIZE, minY * CELL_SIZE, w, h);
      ctx.setLineDash([]);
    } else if (activeTool === 'brush' && currentHoverCell) {
      ctx.fillStyle = activeRoomColor + '50';
      ctx.fillRect(
        currentHoverCell.x * CELL_SIZE,
        currentHoverCell.y * CELL_SIZE,
        CELL_SIZE,
        CELL_SIZE
      );
      ctx.strokeStyle = activeRoomColor;
      ctx.lineWidth = 1.5;
      ctx.strokeRect(
        currentHoverCell.x * CELL_SIZE,
        currentHoverCell.y * CELL_SIZE,
        CELL_SIZE,
        CELL_SIZE
      );
    } else if (activeTool === 'eraser' && currentHoverCell) {
      ctx.fillStyle = 'rgba(255, 59, 48, 0.3)';
      ctx.fillRect(
        currentHoverCell.x * CELL_SIZE,
        currentHoverCell.y * CELL_SIZE,
        CELL_SIZE,
        CELL_SIZE
      );
      ctx.strokeStyle = '#FF3B30';
      ctx.lineWidth = 2;
      ctx.strokeRect(
        currentHoverCell.x * CELL_SIZE,
        currentHoverCell.y * CELL_SIZE,
        CELL_SIZE,
        CELL_SIZE
      );
    } else if (activeTool === 'door' && currentHoverCell) {
      const validation = WallDetector.isValidDoorPlacement(
        rooms,
        currentHoverCell.x,
        currentHoverCell.y,
        doorOrientation
      );

      ctx.fillStyle = validation.isValid ? 'rgba(52, 199, 89, 0.35)' : 'rgba(255, 59, 48, 0.35)';
      ctx.strokeStyle = validation.isValid ? '#34C759' : '#FF3B30';
      ctx.lineWidth = 2;

      if (doorOrientation === 'horizontal') {
        ctx.fillRect(
          currentHoverCell.x * CELL_SIZE,
          currentHoverCell.y * CELL_SIZE - 4,
          CELL_SIZE,
          8
        );
        ctx.strokeRect(
          currentHoverCell.x * CELL_SIZE,
          currentHoverCell.y * CELL_SIZE - 4,
          CELL_SIZE,
          8
        );
      } else {
        ctx.fillRect(
          currentHoverCell.x * CELL_SIZE - 4,
          currentHoverCell.y * CELL_SIZE,
          8,
          CELL_SIZE
        );
        ctx.strokeRect(
          currentHoverCell.x * CELL_SIZE - 4,
          currentHoverCell.y * CELL_SIZE,
          8,
          CELL_SIZE
        );
      }
    }

    ctx.restore();
    ctx.restore();
  }, [
    activeTab,
    gridWidth,
    gridHeight,
    zoom,
    panOffset,
    activeTool,
    rooms,
    doors,
    devices,
    activeRoomColor,
    selectedEntity,
    doorOrientation,
    personPosition,
    placingDeviceType,
    dragDeviceId,
    hasMovedSignificantly,
    dragStartCell,
    currentHoverCell,
    currentHoverRaw,
    isPointerDown,
  ]);

  // Pointer event handlers
  const handlePointerDown = (e: React.PointerEvent<HTMLCanvasElement>) => {
    const { cell, raw } = pixelToGrid(e.clientX, e.clientY);
    setIsPointerDown(true);
    setPointerDownScreenPos({ x: e.clientX, y: e.clientY });
    setHasMovedSignificantly(false);

    // 1. Device Placement Mode Active
    if (placingDeviceType) {
      if (placingDeviceType === 'door_sensor') {
        // Must be placed on or directly next to a door
        const targetDoor = doors.find(
          (d) =>
            d.containsPoint(raw) ||
            Math.hypot(raw.x - (d.x + 0.5), raw.y - (d.y + 0.5)) <= 1.2
        );

        if (!targetDoor) {
          alert('Датчик открытия можно устанавливать только на двери! Пожалуйста, нажмите на дверной проем.');
          return;
        }

        const newDev = addDevice(
          'door_sensor',
          targetDoor.x + 0.5,
          targetDoor.y + 0.5,
          undefined,
          { doorId: targetDoor.id }
        );
        setPlacingDeviceType(null);
        setSelectedEntity({ type: 'device', id: newDev.id });
        return;
      } else {
        // Snap to nearest 0.5 grid step
        const snappedX = Math.round(raw.x * 2) / 2;
        const snappedY = Math.round(raw.y * 2) / 2;
        const newDev = addDevice(placingDeviceType, snappedX, snappedY);
        setPlacingDeviceType(null);
        setSelectedEntity({ type: 'device', id: newDev.id });
        return;
      }
    }

    // 2. Spacebar or middle click for panning
    if (e.button === 1 || e.buttons === 4 || e.shiftKey) {
      setIsPanning(true);
      setPanStart({ x: e.clientX - panOffset.x, y: e.clientY - panOffset.y });
      return;
    }

    // 3. Rectangle tool
    if (activeTool === 'room_rect') {
      setDragStartCell(cell);
      setCurrentHoverCell(cell);
    } else if (activeTool === 'brush') {
      const clickedRoom = WallDetector.findRoomAtPoint(rooms, cell);
      if (selectedEntity.type === 'room' && selectedEntity.id) {
        addTilesToRoom(selectedEntity.id, [cell]);
      } else if (clickedRoom) {
        setSelectedEntity({ type: 'room', id: clickedRoom.id });
        addTilesToRoom(clickedRoom.id, [cell]);
      } else {
        const room = addRoom(`Комната ${rooms.length + 1}`, activeRoomColor, [cell]);
        setSelectedEntity({ type: 'room', id: room.id });
      }
    } else if (activeTool === 'eraser') {
      for (const room of rooms) {
        if (room.hasTile(cell.x, cell.y)) {
          removeTilesFromRoom(room.id, [cell]);
        }
      }
    } else if (activeTool === 'door') {
      const door = addDoor(cell.x, cell.y, doorOrientation);
      if (door) {
        setSelectedEntity({ type: 'door', id: door.id });
      }
    } else if (activeTool === 'select') {
      // 1. Check if clicked on a device
      let clickedDev: string | null = null;
      for (const dev of Array.from(devices.values())) {
        if (dev.containsPoint(raw)) {
          clickedDev = dev.id;
          break;
        }
      }

      if (clickedDev) {
        // Candidate for click or drag
        setCandidateDeviceId(clickedDev);
        setDragDeviceId(clickedDev);
        const dev = devices.get(clickedDev)!;
        setDragDeviceOffset({ x: raw.x - dev.x, y: raw.y - dev.y });
        // NOTE: Do not set selectedEntity here yet, wait for pointerUp to distinguish click vs drag!
        return;
      }

      // 2. Check if clicked on a door
      const clickedDoor = doors.find((d) => d.containsPoint(raw));
      if (clickedDoor) {
        setSelectedEntity({ type: 'door', id: clickedDoor.id });
        return;
      }

      // 3. Check if clicked on a room
      const clickedRoom = WallDetector.findRoomAtPoint(rooms, cell);
      if (clickedRoom) {
        setCandidateRoomId(clickedRoom.id);
        setDragRoomId(clickedRoom.id);
        setDragRoomStartOffset({ x: cell.x, y: cell.y });
        // NOTE: Do not set selectedEntity here yet, wait for pointerUp!
      } else {
        setSelectedEntity({ type: null, id: null });
      }
    }
  };

  const handlePointerMove = (e: React.PointerEvent<HTMLCanvasElement>) => {
    if (isPanning) {
      setPanOffset({
        x: e.clientX - panStart.x,
        y: e.clientY - panStart.y,
      });
      return;
    }

    const { cell, raw } = pixelToGrid(e.clientX, e.clientY);
    setCurrentHoverCell(cell);
    setCurrentHoverRaw(raw);

    if (!isPointerDown) return;

    // Check if pointer moved beyond drag threshold (5 pixels)
    if (pointerDownScreenPos && !hasMovedSignificantly) {
      const dist = Math.hypot(e.clientX - pointerDownScreenPos.x, e.clientY - pointerDownScreenPos.y);
      if (dist > 5) {
        setHasMovedSignificantly(true);
      }
    }

    // Dragging device in Planner mode (only if moved significantly)
    if (activeTool === 'select' && dragDeviceId && dragDeviceOffset) {
      const dist = pointerDownScreenPos
        ? Math.hypot(e.clientX - pointerDownScreenPos.x, e.clientY - pointerDownScreenPos.y)
        : 0;

      if (dist > 5 || hasMovedSignificantly) {
        setHasMovedSignificantly(true);
        const newX = raw.x - dragDeviceOffset.x;
        const newY = raw.y - dragDeviceOffset.y;
        moveDevice(dragDeviceId, newX, newY);
        return;
      }
    }

    // Brush painting
    if (activeTool === 'brush') {
      if (selectedEntity.type === 'room' && selectedEntity.id) {
        addTilesToRoom(selectedEntity.id, [cell]);
      }
    } else if (activeTool === 'eraser') {
      for (const room of rooms) {
        if (room.hasTile(cell.x, cell.y)) {
          removeTilesFromRoom(room.id, [cell]);
        }
      }
    } else if (activeTool === 'select' && dragRoomId && dragRoomStartOffset) {
      const dist = pointerDownScreenPos
        ? Math.hypot(e.clientX - pointerDownScreenPos.x, e.clientY - pointerDownScreenPos.y)
        : 0;

      if (dist > 5 || hasMovedSignificantly) {
        setHasMovedSignificantly(true);
        const dx = cell.x - dragRoomStartOffset.x;
        const dy = cell.y - dragRoomStartOffset.y;
        if (dx !== 0 || dy !== 0) {
          moveRoom(dragRoomId, dx, dy);
          setDragRoomStartOffset({ x: cell.x, y: cell.y });
        }
      }
    }
  };

  const handlePointerUp = (e: React.PointerEvent<HTMLCanvasElement>) => {
    if (isPanning) {
      setIsPanning(false);
      setIsPointerDown(false);
      return;
    }

    // 1. Device Interaction: Distinguish Click vs Drag
    if (candidateDeviceId) {
      if (hasMovedSignificantly) {
        // User dragged the device! Snap cleanly to 0.5 step, do NOT open the settings modal.
        const dev = devices.get(candidateDeviceId);
        if (dev) {
          const snappedX = Math.round(dev.x * 2) / 2;
          const snappedY = Math.round(dev.y * 2) / 2;
          moveDevice(candidateDeviceId, snappedX, snappedY);
        }
      } else {
        // User simple-clicked (tapped) the device -> Open Settings Inspector Modal!
        setSelectedEntity({ type: 'device', id: candidateDeviceId });
      }

      setCandidateDeviceId(null);
      setDragDeviceId(null);
      setDragDeviceOffset(null);
    }

    // 2. Room Interaction: Distinguish Click vs Drag
    if (candidateRoomId) {
      if (!hasMovedSignificantly) {
        // User simple-clicked on room -> Open Room Inspector
        setSelectedEntity({ type: 'room', id: candidateRoomId });
      }
      setCandidateRoomId(null);
      setDragRoomId(null);
      setDragRoomStartOffset(null);
    }

    // 3. Rectangle Room Creation
    if (activeTool === 'room_rect' && dragStartCell && currentHoverCell) {
      const minX = Math.min(dragStartCell.x, currentHoverCell.x);
      const maxX = Math.max(dragStartCell.x, currentHoverCell.x);
      const minY = Math.min(dragStartCell.y, currentHoverCell.y);
      const maxY = Math.max(dragStartCell.y, currentHoverCell.y);

      const tiles: Point2D[] = [];
      for (let x = minX; x <= maxX; x++) {
        for (let y = minY; y <= maxY; y++) {
          tiles.push({ x, y });
        }
      }

      if (tiles.length > 0) {
        const room = addRoom(`Комната ${rooms.length + 1}`, activeRoomColor, tiles);
        setSelectedEntity({ type: 'room', id: room.id });
      }
    }

    setIsPointerDown(false);
    setDragStartCell(null);
    setPointerDownScreenPos(null);
    setHasMovedSignificantly(false);
  };

  return (
    <div className="relative w-full h-full overflow-hidden select-none bg-[#F5F5F7]">
      {/* Floating Placement Banner when placing a device */}
      {placingDeviceType && (
        <div className="absolute top-20 left-1/2 -translate-x-1/2 z-30 bg-white/95 backdrop-blur-xl border border-blue-200 px-5 py-3 rounded-2xl shadow-apple-hover flex items-center gap-4 animate-in fade-in slide-in-from-top-4 duration-200">
          <div className="flex items-center gap-2.5">
            <span className="w-2.5 h-2.5 rounded-full bg-blue-600 animate-ping" />
            <div>
              <h4 className="text-xs font-bold text-zinc-900">
                Размещение: {DeviceFactory.getDefaultName(placingDeviceType)}
              </h4>
              <p className="text-[11px] text-zinc-500">
                {placingDeviceType === 'door_sensor'
                  ? '🚪 Нажмите на дверной проем на плане (подсвечен зеленым)'
                  : '📍 Нажмите на плане в месте, куда хотите установить устройство'}
              </p>
            </div>
          </div>
          <button
            onClick={() => setPlacingDeviceType(null)}
            className="px-3 py-1.5 bg-zinc-100 hover:bg-zinc-200 text-zinc-700 rounded-xl text-xs font-semibold flex items-center gap-1 transition-colors"
          >
            <X className="w-3.5 h-3.5" /> Отмена (Esc)
          </button>
        </div>
      )}

      <canvas
        ref={canvasRef}
        onPointerDown={handlePointerDown}
        onPointerMove={handlePointerMove}
        onPointerUp={handlePointerUp}
        className="w-full h-full touch-none"
        style={{
          cursor: isPanning
            ? 'grabbing'
            : placingDeviceType
            ? 'crosshair'
            : dragDeviceId && hasMovedSignificantly
            ? 'grabbing'
            : activeTool === 'select'
            ? 'default'
            : activeTool === 'eraser'
            ? 'cell'
            : 'crosshair',
        }}
      />
    </div>
  );
};
