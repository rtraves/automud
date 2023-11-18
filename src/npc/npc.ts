import { Item } from '../item/item';
import { findItemById } from '../item/item-manager';
import { Room } from '../area/room';
import { Player } from '../player/player';
import { ShopItem } from '../item/shop-item';
import { NPCData } from '.';
import { AC } from '../services/ansi-colors';

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
  isShop: boolean;
  shopItems?: ShopItem[];
  onEnterSpeak?: string;
  isAggressive?: boolean;
  questGiver?: boolean;
  questId?: number;

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
    this.isShop = data.isShop || false;
    this.onEnterSpeak = data.onEnterSpeak;
    this.isAggressive = data.isAggressive || false;
    this.questGiver = data.questGiver || false;
    this.questId = data.questId || 0;

    if (data.shopItems) {
      this.shopItems = data.shopItems.map(shopItemData => {
        const baseItem = itemMap.get(shopItemData.itemId);
        if (!baseItem) {
          throw new Error(`Shop item ${shopItemData.itemId} not found in item map.`);
        }
        return {
          ...baseItem,
          itemId: shopItemData.itemId,
          cost: shopItemData.cost
        };
      });
    }
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

  listItems(): string {
    if (!this.isShop || !this.shopItems) {
      return `${this.name} is not a shopkeeper.`;
    }

    let output = 'Items for sale:\r\n';
    this.shopItems.forEach((item, index) => {
      output += `${index + 1}. ${AC.DarkGray} ${item.name}${AC.Reset} - ${AC.LightYellow}${item.cost}${AC.Reset} gold\r\n`;
    });

    return output;
  }

  sellItem(player: Player, itemIndex: number): string {
    if (!this.isShop || !this.shopItems) {
      return `${this.name} is not a shopkeeper.`;
    }

    if (itemIndex < 0 || itemIndex >= this.shopItems.length) {
      return "I don't have that item for sale.";
    }

    const item = this.shopItems[itemIndex];
    if (player.gold < item.cost) {
      return "You don't have enough gold!";
    }
    player.gold -= item.cost;
    // Add the item to the player's inventory
    player.inventory.addItem(item);  // Assumes player has an 'inventory' property.
    return `You bought ${item.name} for ${item.cost} gold!`;
  }

  buyItem(player: Player, item: Item): string {
    if (!this.isShop || !this.shopItems) {
      return `${this.name} is not a shopkeeper.`;
    }

    if (item.value) {
      player.gold += item.value;  // Player's gold is increased
      player.inventory.removeItem(item.name, 0);  // Removes the item from the player's inventory
      return `You sold ${item.name} for ${item.value} gold!`;
    }
    return `You can't sell ${item.name}!`;
  }

  onPlayerEnter(player: Player): void {
    if (this.questId !== undefined) {
      if (this.questGiver && !player.hasQuest(this.questId)) {
        player.writeToSocket(`\n${this.name} says: ${this.onEnterSpeak}\r\n`);
      } 
      else if (this.isAggressive) {
        this.initiateCombat(player);
      }  
    }
  }

  initiateCombat(player: Player): void {
    // fight player
  }
}