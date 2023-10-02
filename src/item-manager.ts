import * as fs from 'fs';
import { Room, Exit } from './room';
import yaml from 'js-yaml';
import { Item } from './item';

interface ItemData {
  items: Item[];
}

export function loadItems(itemPath: string): Map<number, Item> {
  const itemFile = fs.readFileSync(itemPath, 'utf-8');
  const itemData = yaml.load(itemFile) as ItemData;

  const itemMap: Map<number, Item> = new Map();

  for (const item of itemData.items) {
    const newItem = new Item(item.id, item.name, item.description, item.value, item.lookDescription, item.keywords);
    itemMap.set(newItem.id, newItem);
  }

  return itemMap;
}

export function findItemById(id: number, itemMap: Map<number, Item>): Item | undefined {
    return itemMap.get(id);
}