'use client';

import React, { useRef, useEffect, useState, useCallback } from 'react';
import { usePlannerStore } from '@/store/usePlannerStore';
import { Point2D } from '@/domain/types';
import { WallDetector } from '@/domain/layout/WallDetector';

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
    setSelectedEntity,
    addRoom,
    addTilesToRoom,
    removeTilesFromRoom,
    moveRoom,
    addDoor,
    toggleDoor,
    setPanOffset,
  } = usePlannerStore();

  // Interaction states
  const [isPointerDown, setIsPointerDown] = useState(false);
  const [dragStartCell, setDragStartCell] = useState<Point2D | null>(null);
  const [currentHoverCell, setCurrentHoverCell] = useState<Point2D | null>(null);
  const [dragRoomId, setDragRoomId] = useState<string | null>(null);
  const [dragRoomStartOffset, setDragRoomStartOffset] = useState<Point2D | null>(null);
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
      const x = door.x * CELL_SIZE;
      const y = door.y * CELL_SIZE;

      ctx.save();
      ctx.translate(x, y);

      if (door.orientation === 'horizontal') {
        // Horizontal Door
        // Opening gap
        ctx.clearRect(0, -3, CELL_SIZE, 6);
        ctx.fillStyle = '#FFFFFF';
        ctx.fillRect(0, -3, CELL_SIZE, 6);

        // Frame posts
        ctx.fillStyle = isSelected ? '#0071E3' : '#1D1D1F';
        ctx.fillRect(-2, -3, 4, 6);
        ctx.fillRect(CELL_SIZE - 2, -3, 4, 6);

        // Door leaf & swing arc
        if (door.isOpen) {
          // Open door: leaf swings out
          ctx.strokeStyle = '#0071E3';
          ctx.lineWidth = 2.5;
          ctx.beginPath();
          ctx.moveTo(0, 0);
          ctx.lineTo(0, -CELL_SIZE);
          ctx.stroke();

          // Swing arc
          ctx.setLineDash([3, 3]);
          ctx.strokeStyle = 'rgba(0, 113, 227, 0.4)';
          ctx.beginPath();
          ctx.arc(0, 0, CELL_SIZE, -Math.PI / 2, 0, false);
          ctx.stroke();
          ctx.setLineDash([]);
        } else {
          // Closed door leaf
          ctx.strokeStyle = isSelected ? '#0071E3' : '#8E8E93';
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

        ctx.fillStyle = isSelected ? '#0071E3' : '#1D1D1F';
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
          ctx.strokeStyle = isSelected ? '#0071E3' : '#8E8E93';
          ctx.lineWidth = 3;
          ctx.beginPath();
          ctx.moveTo(0, 0);
          ctx.lineTo(0, CELL_SIZE);
          ctx.stroke();
        }
      }
      ctx.restore();
    }

    // 5. Draw Devices in Planner mode (simplified representations)
    for (const dev of Array.from(devices.values())) {
      const isSelected = selectedEntity.type === 'device' && selectedEntity.id === dev.id;
      const dx = dev.x * CELL_SIZE;
      const dy = dev.y * CELL_SIZE;

      ctx.save();
      // Outer glow for selected
      if (isSelected) {
        ctx.shadowColor = '#0071E3';
        ctx.shadowBlur = 10;
      }

      // Device badge circle
      ctx.fillStyle = isSelected ? '#0071E3' : '#FFFFFF';
      ctx.strokeStyle = isSelected ? '#FFFFFF' : '#D1D1D6';
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.arc(dx, dy, 12, 0, Math.PI * 2);
      ctx.fill();
      ctx.stroke();

      // Device Type Icon / Letter
      ctx.fillStyle = isSelected ? '#FFFFFF' : '#1D1D1F';
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

      ctx.restore();
    }

    // 6. Draw Previews & Active Tools
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
      // Validate if current cell/edge is valid for door placement
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
    dragStartCell,
    currentHoverCell,
    isPointerDown,
  ]);

  // Pointer event handlers
  const handlePointerDown = (e: React.PointerEvent<HTMLCanvasElement>) => {
    const { cell, raw } = pixelToGrid(e.clientX, e.clientY);
    setIsPointerDown(true);

    // Spacebar or middle click for panning
    if (e.button === 1 || e.buttons === 4 || e.shiftKey) {
      setIsPanning(true);
      setPanStart({ x: e.clientX - panOffset.x, y: e.clientY - panOffset.y });
      return;
    }

    if (activeTool === 'room_rect') {
      setDragStartCell(cell);
      setCurrentHoverCell(cell);
    } else if (activeTool === 'brush') {
      // If a room is selected, paint into it; else create a new room or paint into clicked room
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
      // Find room under cell and remove tile
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
        setSelectedEntity({ type: 'device', id: clickedDev });
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
        setSelectedEntity({ type: 'room', id: clickedRoom.id });
        setDragRoomId(clickedRoom.id);
        setDragRoomStartOffset({ x: cell.x, y: cell.y });
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

    const { cell } = pixelToGrid(e.clientX, e.clientY);
    setCurrentHoverCell(cell);

    if (!isPointerDown) return;

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
      const dx = cell.x - dragRoomStartOffset.x;
      const dy = cell.y - dragRoomStartOffset.y;
      if (dx !== 0 || dy !== 0) {
        moveRoom(dragRoomId, dx, dy);
        setDragRoomStartOffset({ x: cell.x, y: cell.y });
      }
    }
  };

  const handlePointerUp = (e: React.PointerEvent<HTMLCanvasElement>) => {
    if (isPanning) {
      setIsPanning(false);
      setIsPointerDown(false);
      return;
    }

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
    setDragRoomId(null);
    setDragRoomStartOffset(null);
  };

  return (
    <div className="relative w-full h-full overflow-hidden select-none bg-[#F5F5F7]">
      <canvas
        ref={canvasRef}
        onPointerDown={handlePointerDown}
        onPointerMove={handlePointerMove}
        onPointerUp={handlePointerUp}
        className="w-full h-full touch-none cursor-crosshair"
        style={{
          cursor:
            isPanning
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
