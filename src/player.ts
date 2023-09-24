import * as net from 'net';
import * as fs from 'fs';
import * as crypto from 'crypto';
import * as path from 'path';
import { Item } from './item';

const playersDataPath = path.join(__dirname, '..', 'data', 'players');

export interface PlayerData {
  id: string;
  name: string;
  currentRoom: string;
  inventory: PlayerInventory;
  password?: string;
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
  password?: string;

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
    this.save = this.save.bind(this);
    
  }

  static playerExists(name: string): boolean {
    return fs.existsSync(path.join(playersDataPath, `${name}.json`));
  }

  static createNewPlayer(name: string, password: string, socket: net.Socket): Player {
    const player = new Player(name, 'area1_room1', socket); // Assuming default room for new players
    player.name = name;
    player.password = player.hashPassword(password);
    player.save();
    return player;
  }

  save(): void {
    const playerData: PlayerData = {
      id: this.id,
      name: this.name,
      currentRoom: this.currentRoom,
      inventory: this.inventory,
      password: this.password,
    };
    console.log(`Saving player ${this.name}...`);
    fs.writeFileSync(`./data/players/${this.name}.json`, JSON.stringify(playerData), 'utf-8');
  }
  load(): void {
    try {
      const data = fs.readFileSync(`./data/players/${this.name}.json`, 'utf8');
      const playerData: PlayerData = JSON.parse(data);
      this.name = playerData.name;
      this.password = playerData.password;
      this.currentRoom = playerData.currentRoom;
      this.inventory = playerData.inventory;
    } catch (err) {
      console.error(`Failed to load player data for ${this.name}. Error: ${err}`);
    }
  }

  // TODO: add password to player data rethink login logic to avoid further issues
  // might be worth using state for it instead of booleans attached to player
  // this would also make it so we prob no longer need an instance of a temp playerprior to login
  attemptLogin(name: string, password: string): boolean {
    try{
      const playerData = JSON.parse(fs.readFileSync(`./data/players/${name}.json`, 'utf-8'));

      if (playerData.password !== this.hashPassword(password)) {
        return false;
    }
      else {
        this.id = playerData.id;
        this.name = playerData.name;
        this.currentRoom = playerData.currentRoom;
        this.inventory = playerData.inventory;
        this.password = playerData.password;
  
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
