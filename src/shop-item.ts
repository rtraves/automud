import { Item } from './item';

export interface ShopItem extends Item {
    itemId: number,
    cost: number;
}