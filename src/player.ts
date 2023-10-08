import * as net from 'net';
import * as fs from 'fs';
import * as crypto from 'crypto';
import * as path from 'path';
import { Item } from './item';
import { NPC } from './npc';
import { AC, colorize } from './ansi-colors';

const playersDataPath = path.join(__dirname, '..', 'data', 'players');

export interface PlayerData {
  id: string;
  name: string;
  currentRoom: string;
  inventory: PlayerInventory;
  password?: string;
  isAdmin?: boolean;
  maxHealth: number;
  health: number;
  mana: number;
  stamina: number;
  experience: number;
  gold: number;
}

export class PlayerInventory {
  items: Item[];

  constructor(items: Item[] = []) {
    this.items = items;
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

  get length(): number {
    return this.items.length;
  }

  findItem(itemName: string): Item | undefined {
    const searchTerm = itemName.toLowerCase();
    return this.items.find((item) => 
        item.name.toLowerCase() === searchTerm || 
        item.keywords?.includes(searchTerm)
    );
  }
}

export class Player {
  id: string;
  name: string;
  currentRoom: string;
  inventory: PlayerInventory;
  disconnected: boolean;
  socket: net.Socket;
  password?: string;
  isAdmin?: boolean;
  health: number = 100;
  maxHealth: number = 100;
  mana: number = 100;   
  stamina: number = 100;
  damage: number = 10;
  combatTarget: Player | NPC | null = null;
  experience: number = 0;
  gold: number = 0;

  constructor(id: string, currentRoom: string, socket: net.Socket) {
    this.id = id;
    this.name = '';
    this.currentRoom = currentRoom;
    this.inventory = new PlayerInventory();
    this.disconnected = false;
    this.socket = socket;
    this.save = this.save.bind(this);
    
  }

  attack(target: NPC): void {
    const damage = Math.floor(Math.random() * 10);
    target.takeDamage(damage);
    this.socket.write(`You attack ${target.name} for ${damage} damage.\r\n`);
    if (target.health <= 0) {
      this.socket.write(`You killed ${target.name}!\r\n`);
    }
  }

  static playerExists(name: string): boolean {
    return fs.existsSync(path.join(playersDataPath, `${name}.json`));
  }

  static createNewPlayer(name: string, password: string, socket: net.Socket): Player {
    const player = new Player(name, 'area1_room1', socket); // default room for new players
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
      isAdmin: this.isAdmin,
      health: this.health,
      maxHealth: this.maxHealth,
      mana: this.mana,
      stamina: this.stamina,
      experience: this.experience,
      gold: this.gold
    };

    fs.writeFileSync(`./data/players/${this.name}.json`, JSON.stringify(playerData, null, 4), 'utf-8');
  }
  load(): void {
    try {
      const data = fs.readFileSync(`./data/players/${this.name}.json`, 'utf8');
      const playerData: PlayerData = JSON.parse(data);
      this.name = playerData.name;
      this.password = playerData.password;
      this.currentRoom = playerData.currentRoom;
      this.inventory = new PlayerInventory(playerData.inventory.items);
      this.isAdmin = playerData.isAdmin;
      this.health = playerData.health;
      this.maxHealth = playerData.maxHealth;
      this.mana = playerData.mana;
      this.stamina = playerData.stamina;
      this.experience = playerData.experience;
      this.gold = playerData.gold;
    } catch (err) {
      // TODO: Add this to a log file instead of console.error
      console.error(`Failed to load player data for ${this.name}. Error: ${err}`);
    }
  }

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
  getPrompt(): string {
    return `<${AC.LightGreen}HP:${this.health} ${AC.LightCyan}MP:${this.mana}${AC.LightYellow} ST:${this.stamina}${AC.Reset}> `;
  }
  takeDamage(amount: number) {
    this.health -= amount;
  }
}
