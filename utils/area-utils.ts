import * as fs from 'fs';
import { Room, Exit } from '../src/room';

export function loadArea(areaPath: string): Map<string, Room> {
  const areaJson = fs.readFileSync(areaPath, 'utf-8');
  const areaData = JSON.parse(areaJson);

  const areaRooms: Map<string, Room> = new Map();

  for (const roomData of areaData.rooms) {
    const room = new Room(roomData.id, roomData.title, roomData.description, roomData.exits as Exit[]);
    areaRooms.set(room.id, room);
  }

  return areaRooms;
}

export function findExitByDirection(room: Room, direction: string): Exit | undefined {
  return room.exits.find((exit) => exit.direction.startsWith(direction));
}
