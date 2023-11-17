import { Item } from "../item";

export class PlayerInventory {
    items: Map<string, Item[]>;
  
    constructor() {
      this.items = new Map();
    }
  
    addItem(item: Item): void {
      const existingItems = this.items.get(item.name);
      if (existingItems) {
        existingItems.push(item);
      } else {
        this.items.set(item.name, [item]);
      }
    }
  
    removeItem(itemName: string, index: number): void {
      const existingItems = this.items.get(itemName);
      if (existingItems) {
        existingItems.splice(index, 1);
        if (existingItems.length === 0) {
          this.items.delete(itemName);
        }
      }
    }
  
    findItem(itemName: string): Item | undefined {
      const searchTerm = itemName.toLowerCase();
      const itemsArray = Array.from(this.items.values()).flat();
      return itemsArray.find((item) => 
          item.name.toLowerCase() === searchTerm || 
          item.keywords?.includes(searchTerm)
      );
    }
  
    findItemByIndex(itemName: string, index: number): Item | undefined {
      const existingItems = this.items.get(itemName);
      return existingItems ? existingItems[index] : undefined;
    }
  }