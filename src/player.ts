import * as net from 'net';
import { Item } from './item';
import { NPC } from './npc';
import { AC, colorize } from './ansi-colors';
import { QuestObjective, QuestReward } from './quest';
import { PlayerPersistence } from './player-persistence';
import { AuthenticationService } from './authentication-service';

export interface PlayerData {
  id: string;
  name: string;
  currentRoom: string;
  inventory: {
    items: [string, Item[]][]
  };
  password?: string;
  isAdmin?: boolean;
  maxHealth: number;
  health: number;
  mana: number;
  stamina: number;
  experience: number;
  gold: number;
  level: number;
  attributes: Attributes;
  lifeSkills: LifeSkill[];
  equipment: Equipment;
}

type Attributes = {
  strength: number;
  dexterity: number;
  intelligence: number;
  // ... other attributes
}

interface Quest {
  id: number;
  name: string;
  description: string;
  objectives: QuestObjective[];
  rewards: QuestReward[];
  isComplete: boolean;  // Whether the quest is completed
}

type LifeSkill = {
  name: string;
  level: number;
  experience: number;
}

type Equipment = {
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

export class Player {
  id: string;
  name: string;
  currentRoom: string;
  inventory: PlayerInventory;
  disconnected: boolean;
  socket: net.Socket | null;
  password?: string;
  isAdmin?: boolean;
  health: number = 100;
  maxHealth: number = 100;
  mana: number = 100;   
  stamina: number = 100;
  damage: number = 5;
  combatTarget: Player | NPC | null = null;
  experience: number = 0;
  gold: number = 0;
  level: number = 1;
  attributes: Attributes = {
    strength: 5,
    dexterity: 5,
    intelligence: 5
  };
  lifeSkills: LifeSkill[] = [
    {
      name: 'Mining',
      level: 1,
      experience: 0
    },
    {
      name: 'Fishing',
      level: 1,
      experience: 0
    },
    {
      name: 'Woodcutting',
      level: 1,
      experience: 0
    }
  ];
  equipment: Equipment = {
    Head: null,
    Neck: null,
    Chest: null,
    Legs: null,
    Feet: null,
    Hands: null,
    MainHand: null,
    OffHand: null,
    Ring: null
  };

  constructor(id: string, currentRoom: string, socket: net.Socket | null) {
    this.id = id;
    this.name = '';
    this.currentRoom = currentRoom;
    this.inventory = new PlayerInventory();
    this.disconnected = false;
    this.socket = socket;
    this.save = this.save.bind(this);
  }
  private static readonly BASE_EXP: number = 100;

  static expForLevel(level: number): number {
    return Player.BASE_EXP * (level * (level + 1) * (2*level + 1) / 6);
  }

  attack(target: NPC): void {
    const damage = Math.floor(Math.random() * 10);
    target.takeDamage(damage);
    if (this.socket) {
      this.socket.write(`You attack ${target.name} for ${damage} damage.\r\n`);
    }
    if (target.health <= 0) {
      if (this.socket) {
        this.socket.write(`You killed ${target.name}!\r\n`);
      }
    }
  }

  static createNewPlayer(name: string, password: string, socket: net.Socket): Player {
    const player = new Player(name, 'area1_room1', socket); // default room for new players
    player.name = name;
    player.password = AuthenticationService.hashPassword(password);
    player.save();
    return player;
  }

  static playerExists(name: string): boolean {
    return PlayerPersistence.playerExists(name);
  }

  save(): void {
    PlayerPersistence.save(this);
  }

  load(name: string, socket: net.Socket): Player | undefined {
    const player = PlayerPersistence.load(name);
    if (player) {
      player.socket = socket;
    }
    return player;
  }

  attemptLogin(name: string, password: string, socket: net.Socket): boolean {
    try {
      const player = AuthenticationService.attemptLogin(name, password, socket);
      if (player) {
        this.id = player.id;
        this.name = player.name;
        this.currentRoom = player.currentRoom;
        this.inventory = player.inventory;
        this.password = player.password;
        this.socket = player.socket;

        return true;
      }
    } catch (error) {
      return false;
    }
    return false;
  }

  writeToSocket(message: string): void {
    if (this.socket) {
      this.socket.write(message);
    }
  }

  getPrompt(): string {
    return `<${AC.LightGreen}HP:${this.health} ${AC.LightCyan}MP:${this.mana}${AC.LightYellow} ST:${this.stamina}${AC.Reset}> `;
  }

  takeDamage(amount: number) {
    this.health -= amount;
  }

  earnExperience(amount: number): void {
    this.experience += amount;
    this.updateLevel();
  }

  updateLevel(): void {
    let level = 1;
    while (Player.expForLevel(level) <= this.experience && level < 100) {
        level++;
    }

    if (level !== this.level) {
        this.level = level;
        if (this.socket) {
          this.socket.write(`${AC.LightWhite}Congratulations! ${AC.White}You have reached level ${AC.Cyan}${level}.${AC.Reset}\r\n`);
        }
        this.increaseAttribute('strength', 1);
        this.increaseAttribute('dexterity', 1);
        this.increaseAttribute('intelligence', 1);
    }
  }

  increaseAttribute(attributeName: keyof Attributes, amount: number): void {
    this.attributes[attributeName] += amount;
  }

  experienceToNextLevel(): number {
    const nextLevelExp = Player.expForLevel(this.level + 1);
    const currentExp = this.experience;
    return nextLevelExp - currentExp;
  }

  displayExperienceToNextLevel(): void {
    const expNeeded = this.experienceToNextLevel();
    if (this.socket) {
      this.socket.write(`Experience needed for next level: ${expNeeded}\r\n`);
    }
  }

  quests: Quest[] = [];  // Array to hold the quests

  hasQuest(questId: number): boolean {
    // Check if the player has a quest with the given ID
    return this.quests.some(quest => quest.id === questId);
  }

  addQuest(quest: Quest): void {
    // Add a quest to the player's quests array
    this.quests.push(quest);
  }

  removeQuest(questId: number): void {
    // Remove a quest with the given ID from the player's quests array
    this.quests = this.quests.filter(quest => quest.id !== questId);
  }

  getQuest(questId: number): Quest | undefined {
    // Get a quest with the given ID from the player's quests array
    return this.quests.find(quest => quest.id === questId);
  }

  private static readonly BASE_LIFE_SKILL_EXP: number = 100;

  static expForLifeSkillLevel(level: number): number {
    return Player.BASE_LIFE_SKILL_EXP * (level * (level + 1) * (2*level + 1) / 6);
  }

  gainLifeSkillExperience(resourceType: string, amount: number) {
    const lifeSkill = this.lifeSkills.find(skill => skill.name.toLowerCase() === resourceType.toLowerCase());
    if (lifeSkill) {
      lifeSkill.experience += amount;
      this.updateLifeSkillLevel(lifeSkill);
    }
  }

  updateLifeSkillLevel(lifeSkill: LifeSkill): void {
    let level = 1;
    while (Player.expForLifeSkillLevel(level) <= lifeSkill.experience && level < 100) {
      level++;
    }

    if (level !== lifeSkill.level && this.socket) {
      lifeSkill.level = level;
      this.socket.write(`${AC.LightWhite}Congratulations! ${AC.White}Your ${lifeSkill.name} skill has reached level ${AC.Cyan}${level}.${AC.Reset}\r\n`);
    }
  }

  experienceToNextLifeSkillLevel(name: string): number {
    const lifeSkill = this.lifeSkills.find(skill => skill.name === name);
    if (lifeSkill) {
      const nextLevelExp = Player.expForLifeSkillLevel(lifeSkill.level + 1);
      const currentExp = lifeSkill.experience;
      return nextLevelExp - currentExp;
    }
    return 0;
  }

  displayExperienceToNextLifeSkillLevel(name: string): void {
    const expNeeded = this.experienceToNextLifeSkillLevel(name);
    if (this.socket) {
      this.socket.write(`Experience needed for next ${name} level: ${expNeeded}\r\n`);
    }
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
