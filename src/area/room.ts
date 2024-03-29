import { Item } from "../item/index";
import { Resource } from "../resource/index";
import { NPC, NPCData } from "../npc/index";
import { Player } from "../player/index";

export interface Exit {
  direction: string;
  roomId: string;
  door?: Door;
}

export interface Door {
  isOpen: boolean;
  isLocked: boolean;
  keyName?: string;
}

export interface SpecialExit { 
  name: string;
  hidden?: boolean;
  description?: string;
  lookDescription?: string;
  roomId: string;
}
  
  export class Room {
    id: string;
    title: string;
    description: string;
    exits: Exit[];
    specialExits?: SpecialExit[];
    items: Item[];
    npcs: NPC[];
    resources: Resource[];

    constructor(id: string, title: string, description: string, exits: Exit[], specialExits: SpecialExit[] ,items: Item[], npcData: NPCData[], itemMap: Map<number, Item>, reasources: Resource[]) {
      this.id = id;
      this.title = title;
      this.description = description;
      this.exits = exits;
      this.specialExits = specialExits;
      this.items = items || [];
      this.npcs = npcData ? npcData.map((data) => new NPC(data, itemMap, this)) : [];
      this.resources = reasources;
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
    onPlayerEnter(player: Player): void {
      // Notify each NPC in the room that a player has entered
      for (const npc of this.npcs) {
          npc.onPlayerEnter(player);
      }
  }
  }
  