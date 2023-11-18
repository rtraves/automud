import { Item } from "../item/index";
import { PlayerInventory } from "./index";
import { Socket } from "net";

export type Equipment = {
  [key: string]: Item | null;
  Head: Item | null;
  Neck: Item | null;
  Chest: Item | null;
  Legs: Item | null;
  Feet: Item | null;
  Hands: Item | null;
  MainHand: Item | null;
  OffHand: Item | null;
  Ring: Item | null;
}

export class PlayerEquipment {
  equipment: Equipment;
  inventory: PlayerInventory;
  socket: Socket | null;

  constructor(inventory: PlayerInventory, socket: Socket | null) {
    this.equipment = {
      Head: null,
      Neck: null,
      Chest: null,
      Legs: null,
      Feet: null,
      Hands: null,
      MainHand: null,
      OffHand: null,
      Ring: null,
    };
    this.inventory = inventory;
    this.socket = socket;
  }

  equip(item: Item): void {
    const itemType = item.equipmentType;
    if (!itemType) {
      if (this.socket) {
        this.socket.write(`${item.name} is not equippable.\r\n`);
      }
      return;
    }

    const itemSlot = Object.keys(this.equipment).find((key) => key === itemType);
    if (itemSlot) {
      const existingItem = this.equipment[itemSlot];
      if (existingItem) {
        this.unequip(existingItem);
      }
      this.inventory.removeItem(item.name, 0);
      this.equipment[itemSlot] = item;
      if (this.socket) {
        this.socket.write(`You equip ${item.name}.\r\n`);
      }
    }
  }

  unequip(item: Item): void {
    const itemType = item.equipmentType;
    const itemSlot = Object.keys(this.equipment).find((key) => key === itemType);

    if (itemSlot) {
      const existingItem = this.equipment[itemSlot];
      if (existingItem && existingItem.name === item.name) {
        this.equipment[itemSlot] = null;
        this.inventory.addItem(item);
        if (this.socket) {
          this.socket.write(`You unequip ${item.name}.\r\n`);
        }
      }
      else {
        if (this.socket) {
          this.socket.write(`Cannot unequip ${item.name} as it is not equipped.\r\n`);
        }
      }
    }
    else {
      if (this.socket) {
        this.socket.write(`Cannot unequip ${item.name} as it does not match any equipment slot.\r\n`);
      }
    }
  }

  findEquippedItem(itemName: string): Item | undefined {
    const searchTerm = itemName.toLowerCase();
    const equippedItems = Object.values(this.equipment).filter((item): item is Item => item !== null);
    return equippedItems.find((item) => 
        item.name.toLowerCase() === searchTerm || 
        item.keywords?.includes(searchTerm)
    );
  }
}