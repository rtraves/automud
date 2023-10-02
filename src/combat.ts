// Purpose: Combat-related functions maybe turn into a manager later
import { Player } from './player';
import { NPC } from './npc';
import { GameManager } from './game-manager';
import { broadcastToRoom } from './broadcast-utils';
import { AC, colorize } from './ansi-colors';

export function resolveCombat(attacker: Player, defender: NPC) {
    const damage = attacker.damage;
    defender.takeDamage(damage);
    
    if (attacker instanceof Player) {
        attacker.socket.write(`You dealt ${damage} damage to ${defender.name}!\r\n`);
    }

    // NPC retaliation
    if (defender.health > 0) {
        const npcDamage = defender.damage;
        attacker.takeDamage(npcDamage);
        if (attacker instanceof Player) {
            attacker.socket.write(`You took ${npcDamage} damage from ${defender.name}! You have ${attacker.health} health left.\r\n`);
        }
    }

    // Handle death, if health drops to 0 or below
    if (defender.health <= 0) {
        attacker.combatTarget = null;
        const goldDropped = Math.floor(Math.random() * (defender.goldDrop[1] - defender.goldDrop[0] + 1)) + defender.goldDrop[0];
        attacker.gold += goldDropped;
        attacker.experience += defender.expValue;
        attacker.socket.write(`You killed ${defender.name}!\r\n`);
        attacker.socket.write(`${AC.Cyan}You gained ${AC.LightPurple}${defender.expValue}${AC.Cyan} experience and ${AC.LightYellow}${goldDropped}${AC.Cyan} gold.${AC.Reset}\r\n`);
        // Handle NPC death, e.g., drop items, respawn
    }

    if (attacker instanceof Player && attacker.health <= 0) {
        // Handle player death
    }
}