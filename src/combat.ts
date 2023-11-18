// Purpose: Combat-related functions maybe turn into a manager later
import { Player } from './player/player';
import { NPC } from './npc/npc';
import { AC } from './services/ansi-colors';

export function resolveCombat(attacker: Player, defender: NPC) {
  const damage = attacker.damage;
  defender.takeDamage(damage);

  if (attacker instanceof Player) {
    attacker.writeToSocket(`You dealt ${damage} damage to ${defender.name}!\r\n`);
  }

  // NPC retaliation
  if (defender.health > 0) {
    const npcDamage = defender.damage;
    attacker.takeDamage(npcDamage);
    if (attacker instanceof Player) {
      attacker.writeToSocket(`You took ${npcDamage} damage from ${defender.name}! You have ${attacker.health} health left.\r\n`);
    }
  }

  // Handle death, if health drops to 0 or below
  if (defender.health <= 0) {
    attacker.combatTarget = null;
    const goldDropped = Math.floor(Math.random() * (defender.goldDrop[1] - defender.goldDrop[0] + 1)) + defender.goldDrop[0];
    attacker.gold += goldDropped;
    attacker.earnExperience(defender.expValue);
    attacker.writeToSocket(`You killed ${defender.name}!\r\n`);
    attacker.writeToSocket(`${AC.Cyan}You gained ${AC.LightPurple}${defender.expValue}${AC.Cyan} experience and ${AC.LightYellow}${goldDropped}${AC.Cyan} gold.${AC.Reset}\r\n`);
    attacker.writeToSocket('\n' + attacker.getPrompt());
    // Handle NPC death, e.g., drop items, respawn
  }

  if (attacker instanceof Player && attacker.health <= 0) {
    // Handle player death
  }
}