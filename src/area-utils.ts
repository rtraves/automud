import * as fs from 'fs';
import { Room, Exit } from './room';
import yaml from 'js-yaml';
import { Item } from './item';

interface AreaData {
  rooms: {
    id: string;
    title: string;
    description: string;
    exits: Exit[];
    items: Item[];
  }[];
}

export function loadArea(areaPath: string): Map<string, Room> {
  const areaFile = fs.readFileSync(areaPath, 'utf-8');
  const areaData = yaml.load(areaFile) as AreaData;

  const areaRooms: Map<string, Room> = new Map();

  for (const roomData of areaData.rooms) {
    const room = new Room(roomData.id, roomData.title, roomData.description, roomData.exits as Exit[], roomData.items, roomData.npcs);
    areaRooms.set(room.id, room);
  }

  return areaRooms;
}

export function findExitByDirection(room: Room, direction: string): Exit | undefined {
  return room.exits.find((exit) => exit.direction.startsWith(direction));
}
