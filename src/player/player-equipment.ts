import { Item } from "../item";

export type Equipment = {
    [key: string]: Item | null;
    Head: Item | null;
    Neck: Item | null;
    Chest: Item | null;
    Legs: Item | null;
    Feet: Item | null;
    Hands: Item | null;
    MainHand: Item | null;
    OffHand: Item | null;
    Ring: Item | null;
  }