import { Item } from './index';

export interface ShopItem extends Item {
  itemId: number,
  cost: number;
}