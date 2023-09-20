import { Item } from "./item";

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
  
    constructor(id: string, title: string, description: string, exits: Exit[], items: Item[]) {
      this.id = id;
      this.title = title;
      this.description = description;
      this.exits = exits;
      this.items = items;
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
  
    removeItem(item: Item): void {
      const itemIndex = this.items.findIndex((i) => i.id === item.id);
      if (itemIndex > -1) {
        this.items.splice(itemIndex, 1);
      }
    }
  }
  