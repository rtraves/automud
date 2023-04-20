import * as net from 'net';
export class Player {
    id: string;
    name: string;
    currentRoom: string;
    inventory: string[];
    disconnected: boolean;
    socket: net.Socket;
  
    constructor(id: string, currentRoom: string, socket: net.Socket) {
      this.id = id;
      this.name = '';
      this.currentRoom = currentRoom;
      this.inventory = [];
      this.disconnected = false;
      this.socket = socket;
    }
  
    addItem(item: string): void {
      this.inventory.push(item);
    }
  
    removeItem(item: string): void {
      const itemIndex = this.inventory.indexOf(item);
      if (itemIndex > -1) {
        this.inventory.splice(itemIndex, 1);
      }
    }
  }
