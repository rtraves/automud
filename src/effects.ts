// effects.ts
import { Player } from './player/index';

type EffectHandler = {
  [effectName: string]: (player: Player, amount: number) => void;
};

export const effectHandlers: EffectHandler = {
  heal: (player: Player, amount: number) => {
    player.health += amount;
    if (player.health > player.maxHealth) {
      player.health = player.maxHealth;
    }
  },
  // You can add other effects like damage, boost, etc.
};