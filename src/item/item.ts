// item.ts

export class Item {
  id: number;
  name: string;
  description: string;
  lookDescription?: string;
  equipmentType?: string;
  value: number;
  keywords?: string[];
  useCommand?: string;
  useDescription?: string;
  effect?: any;

  constructor(id: number, name: string, description: string, value: number, lookDescription?: string, equipmentType?: string, keywords?: string[],useCommand?: string, useDescription?: string, effect?: any) {
    this.name = name;
    this.description = description;
    this.value = value;
    this.id = id;
    this.lookDescription = lookDescription;
    this.equipmentType = equipmentType;
    this.keywords = keywords;
    this.useCommand = useCommand;
    this.useDescription = useDescription;
    this.effect = effect;
	}
}