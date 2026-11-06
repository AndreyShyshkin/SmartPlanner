import { create } from 'zustand';
import { Point2D, DeviceType, DeviceGroup, DoorOrientation } from '../domain/types';
import { Room } from '../domain/layout/Room';
import { Door } from '../domain/layout/Door';
import { ISmartDevice } from '../domain/interfaces/ISmartDevice';
import { DeviceFactory } from '../domain/devices/DeviceFactory';
import { Scene } from '../domain/automations/Scene';
import { Automation } from '../domain/automations/Automation';
import { MotionTrigger } from '../domain/automations/triggers';
import { SetDeviceStateAction } from '../domain/automations/actions';
import { AutomationEngine, AutomationLogEntry } from '../domain/automations/AutomationEngine';
import { WallDetector } from '../domain/layout/WallDetector';

export type AppTab = 'planner' | 'devices' | 'simulation';
export type PlannerTool = 'select' | 'room_rect' | 'brush' | 'eraser' | 'door';

export interface SelectedEntity {
  type: 'room' | 'door' | 'device' | null;
  id: string | null;
}

export interface PlannerStoreState {
  // Navigation
  activeTab: AppTab;
  setActiveTab: (tab: AppTab) => void;

  // Grid setup
  gridWidth: number;
  gridHeight: number;
  zoom: number;
  panOffset: Point2D;
  setZoom: (zoom: number) => void;
  setPanOffset: (offset: Point2D) => void;

  // Planner tools
  activeTool: PlannerTool;
  setActiveTool: (tool: PlannerTool) => void;
  selectedEntity: SelectedEntity;
  setSelectedEntity: (entity: SelectedEntity) => void;

  // Layout entities
  rooms: Room[];
  doors: Door[];
  activeRoomColor: string;
  setActiveRoomColor: (color: string) => void;
  addRoom: (name: string, color: string, tiles: Point2D[]) => Room;
  updateRoom: (id: string, patch: Partial<{ name: string; color: string; customTemperature: number }>) => void;
  deleteRoom: (id: string) => void;
  moveRoom: (id: string, dx: number, dy: number) => void;
  addTilesToRoom: (id: string, tiles: Point2D[]) => void;
  removeTilesFromRoom: (id: string, tiles: Point2D[]) => void;

  // Doors
  doorOrientation: DoorOrientation;
  setDoorOrientation: (orientation: DoorOrientation) => void;
  addDoor: (x: number, y: number, orientation: DoorOrientation) => Door | null;
  deleteDoor: (id: string) => void;
  toggleDoor: (id: string) => void;

  // Devices
  devices: Map<string, ISmartDevice>;
  deviceGroups: DeviceGroup[];
  placingDeviceType: DeviceType | null;
  setPlacingDeviceType: (type: DeviceType | null) => void;
  addDevice: (type: DeviceType, x: number, y: number, name?: string, customState?: any) => ISmartDevice;
  updateDevice: (id: string, patch: any) => void;
  toggleDevice: (id: string) => void;
  deleteDevice: (id: string) => void;
  moveDevice: (id: string, x: number, y: number) => void;
  addGroup: (name: string, color?: string) => DeviceGroup;
  deleteGroup: (id: string) => void;
  assignDeviceToGroup: (deviceId: string, groupId: string | null) => void;

  // Scenes & Automations
  scenes: Scene[];
  automations: Automation[];
  addScene: (scene: Scene) => void;
  updateScene: (id: string, patch: Partial<Scene>) => void;
  deleteScene: (id: string) => void;
  triggerScene: (id: string) => void;
  addAutomation: (automation: Automation) => void;
  updateAutomation: (id: string, patch: Partial<Automation>) => void;
  deleteAutomation: (id: string) => void;
  toggleAutomation: (id: string) => void;

  // Simulation
  isSimulationRunning: boolean;
  personPosition: Point2D | null;
  isPersonHome: boolean;
  ambientTemperature: number;
  timeOfDayHours: number; // 0 - 24
  simulationLogs: AutomationLogEntry[];
  setSimulationRunning: (running: boolean) => void;
  setPersonPosition: (pos: Point2D | null) => void;
  setIsPersonHome: (isHome: boolean) => void;
  setAmbientTemperature: (temp: number) => void;
  setTimeOfDayHours: (hours: number) => void;
  clearSimulationLogs: () => void;
  stepSimulation: () => void;

  // Project persistence
  loadProjectJSON: (jsonString: string) => boolean;
  exportProjectJSON: () => string;
  loadTemplate: (templateName: 'studio' | 'apartment' | 'empty') => void;
}

const automationEngine = new AutomationEngine();

export const usePlannerStore = create<PlannerStoreState>((set, get) => ({
  // Navigation
  activeTab: 'planner',
  setActiveTab: (tab) => set({ activeTab: tab, selectedEntity: { type: null, id: null } }),

  // Grid
  gridWidth: 32,
  gridHeight: 22,
  zoom: 1,
  panOffset: { x: 0, y: 0 },
  setZoom: (zoom) => set({ zoom: Math.max(0.4, Math.min(2.5, zoom)) }),
  setPanOffset: (panOffset) => set({ panOffset }),

  // Tools
  activeTool: 'select',
  setActiveTool: (tool) => set({ activeTool: tool }),
  selectedEntity: { type: null, id: null },
  setSelectedEntity: (selectedEntity) => set({ selectedEntity }),

  // Layout
  rooms: [],
  doors: [],
  activeRoomColor: '#0071E3',
  setActiveRoomColor: (activeRoomColor) => set({ activeRoomColor }),

  addRoom: (name, color, tiles) => {
    const id = `room_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`;
    const newRoom = new Room(id, name, color, tiles);
    set((state) => ({ rooms: [...state.rooms, newRoom] }));
    return newRoom;
  },

  updateRoom: (id, patch) => {
    set((state) => ({
      rooms: state.rooms.map((r) => {
        if (r.id !== id) return r;
        if (patch.name !== undefined) r.name = patch.name;
        if (patch.color !== undefined) r.color = patch.color;
        if (patch.customTemperature !== undefined) r.customTemperature = patch.customTemperature;
        return r;
      }),
    }));
  },

  deleteRoom: (id) => {
    set((state) => {
      // Also unassign room from devices
      const nextDevices = new Map(state.devices);
      for (const dev of nextDevices.values()) {
        if (dev.roomId === id) {
          dev.roomId = null;
        }
      }
      return {
        rooms: state.rooms.filter((r) => r.id !== id),
        devices: nextDevices,
        selectedEntity:
          state.selectedEntity.type === 'room' && state.selectedEntity.id === id
            ? { type: null, id: null }
            : state.selectedEntity,
      };
    });
  },

  moveRoom: (id, dx, dy) => {
    if (dx === 0 && dy === 0) return;
    set((state) => {
      const room = state.rooms.find((r) => r.id === id);
      if (!room) return state;

      // Translate room tiles
      room.moveBy(dx, dy);

      // Move devices that belong to this room
      const nextDevices = new Map(state.devices);
      for (const [devId, dev] of nextDevices.entries()) {
        if (dev.roomId === id) {
          dev.x += dx;
          dev.y += dy;
        }
      }

      return {
        rooms: [...state.rooms],
        devices: nextDevices,
      };
    });
  },

  addTilesToRoom: (id, tiles) => {
    set((state) => {
      const room = state.rooms.find((r) => r.id === id);
      if (!room) return state;
      for (const t of tiles) {
        room.addTile(t);
      }
      return { rooms: [...state.rooms] };
    });
  },

  removeTilesFromRoom: (id, tiles) => {
    set((state) => {
      const room = state.rooms.find((r) => r.id === id);
      if (!room) return state;
      for (const t of tiles) {
        room.removeTile(t);
      }
      return { rooms: [...state.rooms] };
    });
  },

  // Doors
  doorOrientation: 'horizontal',
  setDoorOrientation: (doorOrientation) => set({ doorOrientation }),

  addDoor: (x, y, orientation) => {
    const { rooms } = get();
    // Validate door is on a wall
    const validation = WallDetector.isValidDoorPlacement(rooms, x, y, orientation);
    if (!validation.isValid) {
      return null;
    }

    const id = `door_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`;
    const newDoor = new Door(id, x, y, orientation, false, undefined, validation.connectedRooms);
    set((state) => ({ doors: [...state.doors, newDoor] }));
    return newDoor;
  },

  deleteDoor: (id) => {
    set((state) => ({
      doors: state.doors.filter((d) => d.id !== id),
      selectedEntity:
        state.selectedEntity.type === 'door' && state.selectedEntity.id === id
          ? { type: null, id: null }
          : state.selectedEntity,
    }));
  },

  toggleDoor: (id) => {
    set((state) => ({
      doors: state.doors.map((d) => {
        if (d.id === id) d.toggle();
        return d;
      }),
    }));
  },

  // Devices
  devices: new Map(),
  deviceGroups: [
    { id: 'grp_living', name: 'Гостиная', roomIds: [], deviceIds: [], color: '#0071E3' },
    { id: 'grp_climate', name: 'Климат', roomIds: [], deviceIds: [], color: '#FF9500' },
  ],
  placingDeviceType: null,
  setPlacingDeviceType: (placingDeviceType) => set({ placingDeviceType }),

  addDevice: (type, x, y, name, customState) => {
    const { rooms } = get();
    // Automatically find which room this point falls into
    const room = WallDetector.findRoomAtPoint(rooms, { x, y });
    const device = DeviceFactory.createDevice(type, {
      x,
      y,
      name,
      roomId: room ? room.id : null,
      state: customState,
    });

    set((state) => {
      const nextMap = new Map(state.devices);
      nextMap.set(device.id, device);
      return { devices: nextMap };
    });
    return device;
  },

  updateDevice: (id, patch) => {
    set((state) => {
      const dev = state.devices.get(id);
      if (!dev) return state;
      if (patch.name !== undefined) dev.name = patch.name;
      if (patch.roomId !== undefined) dev.roomId = patch.roomId;
      if (patch.groupId !== undefined) dev.groupId = patch.groupId;
      if (patch.isEnabled !== undefined) dev.isEnabled = patch.isEnabled;
      if (patch.state !== undefined) dev.setState(patch.state);

      const next = new Map(state.devices);
      next.set(id, dev);
      return { devices: next };
    });
  },

  toggleDevice: (id) => {
    set((state) => {
      const dev = state.devices.get(id);
      if (!dev) return state;
      dev.toggle();
      const next = new Map(state.devices);
      next.set(id, dev);
      return { devices: next };
    });
  },

  deleteDevice: (id) => {
    set((state) => {
      const next = new Map(state.devices);
      next.delete(id);
      return {
        devices: next,
        selectedEntity:
          state.selectedEntity.type === 'device' && state.selectedEntity.id === id
            ? { type: null, id: null }
            : state.selectedEntity,
      };
    });
  },

  moveDevice: (id, x, y) => {
    set((state) => {
      const dev = state.devices.get(id);
      if (!dev) return state;
      dev.x = x;
      dev.y = y;
      const room = WallDetector.findRoomAtPoint(state.rooms, { x, y });
      dev.roomId = room ? room.id : null;
      const next = new Map(state.devices);
      next.set(id, dev);
      return { devices: next };
    });
  },

  addGroup: (name, color) => {
    const group: DeviceGroup = {
      id: `grp_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`,
      name,
      color: color || '#34C759',
      roomIds: [],
      deviceIds: [],
    };
    set((state) => ({ deviceGroups: [...state.deviceGroups, group] }));
    return group;
  },

  deleteGroup: (id) => {
    set((state) => {
      const nextDevices = new Map(state.devices);
      for (const dev of nextDevices.values()) {
        if (dev.groupId === id) dev.groupId = null;
      }
      return {
        deviceGroups: state.deviceGroups.filter((g) => g.id !== id),
        devices: nextDevices,
      };
    });
  },

  assignDeviceToGroup: (deviceId, groupId) => {
    set((state) => {
      const dev = state.devices.get(deviceId);
      if (!dev) return state;
      dev.groupId = groupId;
      const next = new Map(state.devices);
      next.set(deviceId, dev);
      return { devices: next };
    });
  },

  // Scenes & Automations
  scenes: [],
  automations: [],

  addScene: (scene) => set((state) => ({ scenes: [...state.scenes, scene] })),
  updateScene: (id, patch) => {
    set((state) => ({
      scenes: state.scenes.map((s) => (s.id === id ? Object.assign(s, patch) : s)),
    }));
  },
  deleteScene: (id) => set((state) => ({ scenes: state.scenes.filter((s) => s.id !== id) })),

  triggerScene: (id) => {
    const { scenes, devices } = get();
    const scene = scenes.find((s) => s.id === id);
    if (!scene) return;

    for (const act of scene.actions) {
      const dev = devices.get(act.deviceId);
      if (dev) {
        dev.setState(act.statePatch);
      }
    }
    set({ devices: new Map(devices) });
  },

  addAutomation: (automation) => {
    set((state) => {
      const next = [...state.automations, automation];
      automationEngine.setAutomations(next);
      return { automations: next };
    });
  },

  updateAutomation: (id, patch) => {
    set((state) => {
      const next = state.automations.map((a) => (a.id === id ? Object.assign(a, patch) : a));
      automationEngine.setAutomations(next);
      return { automations: next };
    });
  },

  deleteAutomation: (id) => {
    set((state) => {
      const next = state.automations.filter((a) => a.id !== id);
      automationEngine.setAutomations(next);
      return { automations: next };
    });
  },

  toggleAutomation: (id) => {
    set((state) => {
      const next = state.automations.map((a) => {
        if (a.id === id) a.isEnabled = !a.isEnabled;
        return a;
      });
      automationEngine.setAutomations(next);
      return { automations: next };
    });
  },

  // Simulation
  isSimulationRunning: true,
  personPosition: { x: 5, y: 5 },
  isPersonHome: true,
  ambientTemperature: 21,
  timeOfDayHours: 14,
  simulationLogs: [],

  setSimulationRunning: (isSimulationRunning) => set({ isSimulationRunning }),
  setPersonPosition: (personPosition) => set({ personPosition }),
  setIsPersonHome: (isPersonHome) => set({ isPersonHome }),
  setAmbientTemperature: (ambientTemperature) => set({ ambientTemperature }),
  setTimeOfDayHours: (timeOfDayHours) => set({ timeOfDayHours }),
  clearSimulationLogs: () => {
    automationEngine.clearLogs();
    set({ simulationLogs: [] });
  },

  stepSimulation: () => {
    const state = get();
    if (!state.isSimulationRunning) return;

    // Calculate active walls
    const walls = WallDetector.extractWalls(state.rooms, state.doors);
    const activeDoors = new Set<string>();
    for (const door of state.doors) {
      if (door.isOpen) activeDoors.add(door.id);
    }

    const simContext = {
      personPosition: state.personPosition,
      isPersonHome: state.isPersonHome,
      walls,
      ambientTemperature: state.ambientTemperature,
      timeOfDayHours: state.timeOfDayHours,
      activeDoors,
    };

    // Update sensors
    let anySensorChanged = false;
    for (const dev of state.devices.values()) {
      if ('evaluate' in dev && typeof (dev as any).evaluate === 'function') {
        const changed = (dev as any).evaluate(simContext);
        if (changed) anySensorChanged = true;
      }
    }

    // Run automations engine
    automationEngine.evaluate(simContext, state.devices, (sceneId) => {
      get().triggerScene(sceneId);
    });

    set({
      devices: new Map(state.devices),
      simulationLogs: automationEngine.getLogs(),
    });
  },

  // Project persistence & templates
  exportProjectJSON: () => {
    const state = get();
    const data = {
      version: '1.0.0',
      exportedAt: new Date().toISOString(),
      grid: { width: state.gridWidth, height: state.gridHeight },
      rooms: state.rooms.map((r) => r.toJSON()),
      doors: state.doors.map((d) => d.toJSON()),
      devices: Array.from(state.devices.values()).map((dev) => dev.toJSON()),
      deviceGroups: state.deviceGroups,
      scenes: state.scenes.map((s) => s.toJSON()),
      automations: state.automations.map((a) => a.toJSON()),
      simulation: {
        ambientTemperature: state.ambientTemperature,
        timeOfDayHours: state.timeOfDayHours,
        isPersonHome: state.isPersonHome,
        personPosition: state.personPosition,
      },
    };
    return JSON.stringify(data, null, 2);
  },

  loadProjectJSON: (jsonString: string) => {
    try {
      const data = JSON.parse(jsonString);
      if (!data.rooms || !data.devices) {
        throw new Error('Invalid project JSON schema');
      }

      const rooms = (data.rooms || []).map((r: any) => Room.fromJSON(r));
      const doors = (data.doors || []).map((d: any) => Door.fromJSON(d));
      const devices = new Map<string, ISmartDevice>();

      for (const devData of data.devices || []) {
        const dev = DeviceFactory.fromJSON(devData);
        devices.set(dev.id, dev);
      }

      const scenes = (data.scenes || []).map((s: any) => Scene.fromJSON(s));
      const automations = (data.automations || []).map((a: any) => Automation.fromJSON(a));
      automationEngine.setAutomations(automations);

      set({
        gridWidth: data.grid?.width || 32,
        gridHeight: data.grid?.height || 22,
        rooms,
        doors,
        devices,
        deviceGroups: data.deviceGroups || [],
        scenes,
        automations,
        ambientTemperature: data.simulation?.ambientTemperature ?? 21,
        timeOfDayHours: data.simulation?.timeOfDayHours ?? 14,
        isPersonHome: data.simulation?.isPersonHome ?? true,
        personPosition: data.simulation?.personPosition ?? { x: 5, y: 5 },
      });
      return true;
    } catch (err) {
      console.error('Failed to load project JSON:', err);
      return false;
    }
  },

  loadTemplate: (templateName) => {
    if (templateName === 'empty') {
      set({
        rooms: [],
        doors: [],
        devices: new Map(),
        scenes: [],
        automations: [],
        selectedEntity: { type: null, id: null },
      });
      return;
    }

    // Default template: Beautiful 2-Room Smart Apartment
    const livingTiles: Point2D[] = [];
    for (let x = 3; x <= 12; x++) {
      for (let y = 3; y <= 10; y++) {
        livingTiles.push({ x, y });
      }
    }
    const bedroomTiles: Point2D[] = [];
    for (let x = 14; x <= 22; x++) {
      for (let y = 3; y <= 10; y++) {
        bedroomTiles.push({ x, y });
      }
    }
    const kitchenTiles: Point2D[] = [];
    for (let x = 3; x <= 12; x++) {
      for (let y = 12; y <= 17; y++) {
        kitchenTiles.push({ x, y });
      }
    }
    const hallwayTiles: Point2D[] = [];
    for (let x = 13; x <= 15; x++) {
      for (let y = 11; y <= 17; y++) {
        hallwayTiles.push({ x, y });
      }
    }

    const livingRoom = new Room('room_living', 'Гостиная', '#0071E3', livingTiles);
    const bedroom = new Room('room_bedroom', 'Спальня', '#AF52DE', bedroomTiles);
    const kitchen = new Room('room_kitchen', 'Кухня', '#FF9500', kitchenTiles);
    const hallway = new Room('room_hallway', 'Прихожая', '#34C759', hallwayTiles);

    const rooms = [livingRoom, bedroom, kitchen, hallway];

    // Doors on walls
    const door1 = new Door('door_1', 13, 6, 'vertical', false, 'Дверь в гостиную', ['room_living', 'room_hallway']);
    const door2 = new Door('door_2', 14, 6, 'vertical', false, 'Дверь в спальню', ['room_bedroom', 'room_hallway']);
    const door3 = new Door('door_3', 7, 11, 'horizontal', false, 'Вход на кухню', ['room_kitchen', 'room_living']);
    const doors = [door1, door2, door3];

    // Devices
    const devices = new Map<string, ISmartDevice>();

    // Living room devices
    const light1 = DeviceFactory.createDevice('light', {
      id: 'light_living',
      name: 'Люстра в гостиной',
      x: 7.5,
      y: 6.5,
      roomId: 'room_living',
      state: { isOn: true, brightness: 90, color: '#FFD60A' },
    });
    const motion1 = DeviceFactory.createDevice('motion', {
      id: 'motion_living',
      name: 'Датчик движения (Гостиная)',
      x: 3.5,
      y: 3.5,
      roomId: 'room_living',
      state: { detectionRadius: 5, fovAngle: 120, rotationAngle: 45 },
    });
    const curtains1 = DeviceFactory.createDevice('curtains', {
      id: 'curtains_living',
      name: 'Шторы в гостиной',
      x: 12,
      y: 6,
      roomId: 'room_living',
      state: { openPercentage: 80 },
    });
    const heater1 = DeviceFactory.createDevice('heater', {
      id: 'heater_living',
      name: 'Батарея в гостиной',
      x: 12,
      y: 9.5,
      roomId: 'room_living',
      state: { isOn: true, powerLevel: 70 },
    });

    // Bedroom devices
    const light2 = DeviceFactory.createDevice('light', {
      id: 'light_bed',
      name: 'Свет в спальне',
      x: 18,
      y: 6.5,
      roomId: 'room_bedroom',
      state: { isOn: false, brightness: 50, color: '#FF3B30' },
    });
    const thermo1 = DeviceFactory.createDevice('thermostat', {
      id: 'thermo_bed',
      name: 'Климат спальни',
      x: 21.5,
      y: 3.5,
      roomId: 'room_bedroom',
      state: { targetTemperature: 21.5, currentTemperature: 21.0 },
    });

    // Door sensor
    const doorSensor1 = DeviceFactory.createDevice('door_sensor', {
      id: 'doorsensor_1',
      name: 'Датчик двери гостиной',
      x: 13,
      y: 6,
      roomId: 'room_living',
      state: { doorId: 'door_1' },
    });

    for (const d of [light1, motion1, curtains1, heater1, light2, thermo1, doorSensor1]) {
      devices.set(d.id, d);
    }

    // Scenes
    const nightScene = new Scene('scene_night', 'Спокойной ночи', 'Moon', '#5856D6', [
      { deviceId: 'light_living', statePatch: { isOn: false } },
      { deviceId: 'light_bed', statePatch: { isOn: true, brightness: 20, color: '#FF9500' } },
      { deviceId: 'curtains_living', statePatch: { openPercentage: 0 } },
    ]);
    const welcomeScene = new Scene('scene_welcome', 'Я дома', 'Sun', '#FF9500', [
      { deviceId: 'light_living', statePatch: { isOn: true, brightness: 100, color: '#FFFFFF' } },
      { deviceId: 'curtains_living', statePatch: { openPercentage: 100 } },
    ]);
    const scenes = [nightScene, welcomeScene];

    // Automations
    const autoMotion = new Automation(
      'auto_1',
      'Включить свет при движении в гостиной',
      new MotionTrigger('motion_living', true),
      [new SetDeviceStateAction('light_living', { isOn: true, brightness: 100 })]
    );

    const automations = [autoMotion];
    automationEngine.setAutomations(automations);

    set({
      rooms,
      doors,
      devices,
      scenes,
      automations,
      personPosition: { x: 7, y: 6 },
      isPersonHome: true,
      timeOfDayHours: 12,
      ambientTemperature: 21.5,
    });
  },
}));
