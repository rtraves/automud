import { Item } from './item';
import { Room } from './room';

export interface NPCData {
    id: string;
    name: string;
    isEnemy: boolean;
    description: string;
    maxHealth: number;
    health: number;
    damage: number;
    items: Item[];
    respawnTime: number;
}

export class NPC {
    id: string;
    name: string;
    isEnemy: boolean;
    description: string;
    maxHealth: number;
    health: number;
    damage: number;
    items: Item[];
    room: Room;
    respawnTime: number;

    constructor(data: NPCData, room: Room) {
        this.id = data.id;
        this.name = data.name;
        this.isEnemy = data.isEnemy;
        this.description = data.description;
        this.maxHealth = data.maxHealth;
        this.health = data.health;
        this.damage = data.damage;
        this.items = data.items;
        this.room = room;
        this.respawnTime = data.respawnTime;
    }

    takeDamage(damage: number): void {
        this.health -= damage;
        if (this.health < 0) {
            this.health = 0;
            const index = this.room.npcs.indexOf(this);
            if (index > -1) {
                this.room.npcs.splice(index, 1);
                this.room.items.push(...this.items);
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