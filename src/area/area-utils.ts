import * as fs from 'fs';
import { Room, Exit, SpecialExit } from './room';
import yaml from 'js-yaml';
import { Item } from '../item/item';
import { findItemById } from '../item/item-manager';
import { NPC, NPCData } from '../npc';
import { Resource } from '../reasource/resource';

interface AreaData {
  npcs: NPCData[];
  rooms: {
    id: string;
    title: string;
    description: string;
    exits: Exit[];
    specialExits?: SpecialExit[];
    itemIds: number[];
    items: Item[];
    npcIds: number[];
    npcs: NPCData[];
    resources: Resource[];
  }[];
}

export function loadArea(areaPath: string, itemMap: Map<number, Item>, resourceMap: Map<string, Resource[]>): Map<string, Room> {
  const areaFile = fs.readFileSync(areaPath, 'utf-8');
  const areaData = yaml.load(areaFile) as AreaData;

  const areaRooms: Map<string, Room> = new Map();
  const npcDataMap: Map<number, NPCData> = new Map();

  for (const areaNPC of areaData.npcs) {
    npcDataMap.set(areaNPC.id, areaNPC);
  }

  for (const roomData of areaData.rooms) {
    const matchedResources: Resource[] = [];

    for (const resource of roomData.resources || []) {
      const resourcesOfType = resourceMap.get(resource.resourceType);
      if (resourcesOfType) {
        const resourceData = resourcesOfType.find(r => r.name === resource.name);
        if (resourceData) {
          matchedResources.push(resourceData);
        }
      }
    }
    roomData.resources = matchedResources;

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

    const room = new Room(roomData.id, roomData.title, roomData.description, roomData.exits as Exit[], roomData.specialExits as SpecialExit[], roomData.items, roomData.npcs, itemMap, roomData.resources);
    areaRooms.set(room.id, room);
  }

  return areaRooms;
}

export function findExitByDirection(room: Room, direction: string): Exit | undefined {
  return room.exits.find((exit) => exit.direction.startsWith(direction));
}
