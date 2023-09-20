import * as net from 'net';
import { Item } from './item';

export interface PlayerInventory {
  items: Item[];
  addItem(item: Item): void;
  removeItem(item: Item): void;
  readonly length: number;
  findItem(itemName: string): Item | undefined;
}

export class Player {
  id: string;
  name: string;
  currentRoom: string;
  inventory: PlayerInventory;
  disconnected: boolean;
  socket: net.Socket;
  expectingName: boolean;
  expectingPassword: boolean;
  isLoggedIn: boolean;
  newPlayer: boolean;

  constructor(id: string, currentRoom: string, socket: net.Socket) {
    this.id = id;
    this.name = '';
    this.currentRoom = currentRoom;
    this.inventory = {
      items: [],
      addItem(item: Item): void {
        this.items.push(item);
      },
      removeItem(item: Item): void {
        const itemIndex = this.items.findIndex((i) => i.id === item.id);
        if (itemIndex > -1) {
          this.items.splice(itemIndex, 1);
        }
      },
      get length(): number {
        return this.items.length;
      },
      findItem(itemName: string): Item | undefined {
        return this.items.find((item) => item.name.toLowerCase() === itemName.toLowerCase());
      }
    };
    this.disconnected = false;
    this.socket = socket;
    this.expectingName = true;
    this.expectingPassword = false;
    this.isLoggedIn = false;
    this.newPlayer = false;
  }
}
