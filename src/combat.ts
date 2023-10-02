// Purpose: Combat-related functions maybe turn into a manager later
import { Player } from './player';
import { NPC } from './npc';
import { GameManager } from './game-manager';
import { broadcastToRoom } from './broadcast-utils';

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
        attacker.socket.write(`You killed ${defender.name}!\r\n`);
        // Handle NPC death, e.g., drop items, respawn
    }

    if (attacker instanceof Player && attacker.health <= 0) {
        // Handle player death
    }
}