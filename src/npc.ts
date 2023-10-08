import { Item } from './item';
import { findItemById } from './item-manager';
import { Room } from './room';
import { Player } from './player';

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
}

export class NPC {
    id: number;
    name: string;
    isEnemy: boolean;
    description: string;
    lookDescription?: string;
    keywords?: string[];
    maxHealth: number;
    health: number;
    damage: number = 5;
    items?: Item[];
    room: Room;
    respawnTime: number;
    combatTarget: Player | NPC | null = null;
    goldDrop: [number, number];
    expValue: number;

    constructor(data: NPCData, itemMap: Map<number, Item>, room: Room) {
        this.id = data.id;
        this.name = data.name;
        this.isEnemy = data.isEnemy;
        this.description = data.description;
        this.lookDescription = data.lookDescription;
        this.keywords = data.keywords;
        this.maxHealth = data.maxHealth;
        this.health = data.health;
        this.damage = data.damage;
        this.items = data.itemIds ? data.itemIds.map(itemId => findItemById(itemId, itemMap)).filter(item => item !== undefined) as Item[] : undefined;
        this.room = room;
        this.respawnTime = data.respawnTime;
        this.goldDrop = data.goldDrop || [0, 0];
        this.expValue = data.expValue || 0;
    }

    takeDamage(damage: number): void {
        this.health -= damage;
        if (this.health <= 0) {
            this.health = 0;
            const index = this.room.npcs.indexOf(this);
            if (index > -1) {
                this.room.npcs.splice(index, 1);
                if (this.items) {
                    this.room.items.push(...this.items);
                }

                if (this.respawnTime > 0) {
                    setTimeout(() => this.respawn(), this.respawnTime);
                }
            }
        }
    }

    respawn(): void {
        this.health = this.maxHealth;
        this.room.npcs.push(this);
    }
}