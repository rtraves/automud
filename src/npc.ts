import { Item } from './item';
import { Room } from './room';

export interface NPCData {
    id: string;
    name: string;
    isFriendly: boolean;
    description: string;
    health: number;
    damage: number;
    items: Item[];
}

export class NPC {
    id: string;
    name: string;
    isFriendly: boolean;
    description: string;
    health: number;
    damage: number;
    items: Item[];
    room: Room;

    constructor(data: NPCData, room: Room) {
        this.id = data.id;
        this.name = data.name;
        this.isFriendly = data.isFriendly;
        this.description = data.description;
        this.health = data.health;
        this.damage = data.damage;
        this.items = data.items;
        this.room = room;
    }

    takeDamage(damage: number): void {
        this.health -= damage;
        if (this.health < 0) {
            this.health = 0;
            const index = this.room.npcs.indexOf(this);
            if (index > -1) {
                this.room.npcs.splice(index, 1);
                this.room.items.push(...this.items);
            }
        }
    }
}