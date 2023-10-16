import * as fs from 'fs';
import { Room, Exit } from './room';
import yaml from 'js-yaml';
import { Item } from './item';
import { findItemById } from './item-manager';
import { NPC, NPCData } from './npc';
import { Resource } from './resource';

interface AreaData {
  npcs: NPCData[];
  rooms: {
    id: string;
    title: string;
    description: string;
    exits: Exit[];
    itemIds: number[];
    items: Item[];
    npcIds: number[];
    npcs: NPCData[];
    resources: Resource[];
  }[];
}

export function loadArea(areaPath: string, itemMap: Map<number, Item>): Map<string, Room> {
  const areaFile = fs.readFileSync(areaPath, 'utf-8');
  const areaData = yaml.load(areaFile) as AreaData;

  const areaRooms: Map<string, Room> = new Map();
  const npcDataMap: Map<number, NPCData> = new Map();

  for (const areaNPC of areaData.npcs) {
    npcDataMap.set(areaNPC.id, areaNPC);
  }

  for (const roomData of areaData.rooms) {
    if (roomData.npcIds) {
      if (!roomData.npcs) {
        roomData.npcs = [];
      }
      for (const npcId of roomData.npcIds) {
        const roomNPCData = npcDataMap.get(npcId);
        roomData.npcs.push(roomNPCData!);
      }
    }

    if (roomData.itemIds) {
      if (!roomData.items) {
        roomData.items = [];
      }
      for (const itemId of roomData.itemIds) {
        const item = findItemById(itemId, itemMap);
        if (item) {
          roomData.items.push(item);
        }
      }
    }

    const room = new Room(roomData.id, roomData.title, roomData.description, roomData.exits as Exit[], roomData.items, roomData.npcs, itemMap);
    areaRooms.set(room.id, room);
  }

  return areaRooms;
}

export function findExitByDirection(room: Room, direction: string): Exit | undefined {
  return room.exits.find((exit) => exit.direction.startsWith(direction));
}
