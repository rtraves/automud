import { Item } from "./item";
import { NPC, NPCData } from "./npc";

export interface Exit {
    direction: string;
    roomId: string;
  }
  
  export class Room {
    id: string;
    title: string;
    description: string;
    exits: Exit[];
    items: Item[];
    npcs: NPC[];
  
    constructor(id: string, title: string, description: string, exits: Exit[], items: Item[], npcData: NPCData[]) {
      this.id = id;
      this.title = title;
      this.description = description;
      this.exits = exits;
      this.items = items;
      this.npcs = npcData ? npcData.map((data) => new NPC(data, this)) : [];
    }
  
    addExit(exit: Exit): void {
      this.exits.push(exit);
    }
  
    findExit(direction: string): string | null {
      const exit = this.exits.find((exit) => exit.direction === direction);
      return exit ? exit.roomId : null;
    }

    addItem(item: Item): void {
      this.items.push(item);
    }

    addNPC(npc: NPC): void {
      this.npcs.push(npc);
    }
  
    removeItem(item: Item): void {
      const itemIndex = this.items.findIndex((i) => i.id === item.id);
      if (itemIndex > -1) {
        this.items.splice(itemIndex, 1);
      }
    }
  }
  