import * as net from 'net';
import * as fs from 'fs';
import * as crypto from 'crypto';
import { Item } from './item';

export interface PlayerData {
  id: string;
  name: string;
  currentRoom: string;
  inventory: PlayerInventory;
}

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
    this.save = this.save.bind(this);
  }

  save(): void {
    // was a bug where i was attempting to login and saves were firing
    if (this.isLoggedIn) {
      const playerData: PlayerData = {
        id: this.id,
        name: this.name,
        currentRoom: this.currentRoom,
        inventory: this.inventory,
      };
      console.log(`Saving player ${this.name}...`);
      fs.writeFileSync(`./data/players/${this.name}.json`, JSON.stringify(playerData), 'utf-8');
    }
  }

  // TODO: add password to player data rethink login logic to avoid further issues
  // might be worth using state for it instead of booleans attached to player
  // this would also make it so we prob no longer need an instance of a temp playerprior to login
  attemptLogin(name: string, password: string): boolean {
    try{
      const playerData = JSON.parse(fs.readFileSync(`./data/players/${name}.json`, 'utf-8'));

      if (this.hashPassword(playerData.password) !== password) {
        return false;
      }
      else {
        this.id = playerData.id;
        this.name = playerData.name;
        this.currentRoom = playerData.currentRoom;
        this.inventory = playerData.inventory;
  
        return true;
      }
    } catch (err) {
      return false;
    }
  }

  hashPassword(password: string): string {
    const hash = crypto.createHash('sha256');
    hash.update(password);
    return hash.digest('hex');
  }
}
