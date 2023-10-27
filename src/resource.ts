// resources.ts
import { Item } from './item';

export interface DropTableItem {
    itemId: number;
    item?: Item; 
    chance: number;
}

export class Resource {
	resourceType: string;
  name: string;
  description: string;
  quantity: number;
  level: number;
  dropTable?: DropTableItem[];

  constructor(resourceType: string, name: string, description: string, quantity: number, level: number, dropTable: DropTableItem[]) {
	this.resourceType = resourceType;
    this.name = name;
	this.description = description;
    this.quantity = quantity;
	this.level = level;
    this.dropTable = dropTable;
  }
}