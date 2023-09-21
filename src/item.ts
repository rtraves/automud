// item.ts

export class Item {
    id: number;
    name: string;
    description: string;
    value: number;
  
    constructor(id: number, name: string, description: string, value: number) {
      this.name = name;
      this.description = description;
      this.value = value;
      this.id = id;
    }

    serialize(): any {
      return {
        id: this.id,
        name: this.name,
        description: this.description,
        value: this.value
      };
    }
  }