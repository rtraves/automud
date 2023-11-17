import { Item } from '../item';
import { Attributes, LifeSkill, Equipment } from '.';

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