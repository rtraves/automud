// item.ts

export class Item {
    id: number;
    name: string;
    description: string;
    lookDescription?: string;
    value: number;
    keywords?: string[];
  
    constructor(id: number, name: string, description: string, value: number, lookDescription?: string, keywords?: string[]) {
      this.name = name;
      this.description = description;
      this.value = value;
      this.id = id;
      this.lookDescription = lookDescription;
      this.keywords = keywords;
    }
  }