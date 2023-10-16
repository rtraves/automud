// resources.ts
interface DropTableItem {
    itemId: number;
    chance: number;
}
  
interface DropTable {
    [key: string]: DropTableItem[];
}

export class Resource {
	resourceType: string;
    name: string;
    description: string;
    quantity: number;
    level: number;
    dropTable: DropTable;

  constructor(resourceType: string, name: string, description: string, quantity: number, level: number, dropTable: DropTable) {
	this.resourceType = resourceType;
    this.name = name;
	this.description = description;
    this.quantity = quantity;
	this.level = level;
    this.dropTable = dropTable;
  }
}