import { ShopItem } from '../item/index';

export interface NPCData {
    id: number;
    name: string;
    isEnemy: boolean;
    description: string;
    lookDescription?: string;
    keywords?: string[];
    maxHealth: number;
    health: number;
    damage: number;
    itemIds?: number[];
    respawnTime: number;
    goldDrop?: [number, number];
    expValue?: number;
    isShop?: boolean;
    shopItems?: ShopItem[];
    onEnterSpeak?: string;
    isAggressive?: boolean;
    questGiver?: boolean;
    questId?: number;
  }