import * as fs from 'fs';
import * as path from 'path';
import { Player, PlayerData } from '../player/index';

const playersDataPath = path.join(__dirname, '..', '..', 'data', 'players');

export class PlayerPersistence {
  static save(player: Player): void {
    const playerData: PlayerData = {
      id: player.id,
      name: player.name,
      currentRoom: player.currentRoom,
      inventory: {
        items: Array.from(player.inventory.items.entries())
      },
      password: player.password,
      isAdmin: player.isAdmin,
      health: player.health,
      maxHealth: player.maxHealth,
      mana: player.mana,
      stamina: player.stamina,
      experience: player.experience,
      gold: player.gold,
      level: player.level,
      attributes: player.attributes,
      lifeSkills: player.lifeSkills,
      equipment: player.equipment.equipment
    };

    fs.writeFileSync(path.join(playersDataPath, `${player.name}.json`), JSON.stringify(playerData, null, 4), 'utf-8');
  }

  static load(name: string): Player | undefined {
    try {
      const data = fs.readFileSync(path.join(playersDataPath, `${name}.json`), 'utf8');
      const playerData: PlayerData = JSON.parse(data);
      const player = new Player(playerData.id, playerData.currentRoom, null);
      player.name = playerData.name;
      player.password = playerData.password;
      player.currentRoom = playerData.currentRoom;
      player.inventory.items = new Map(playerData.inventory.items);
      player.isAdmin = playerData.isAdmin;
      player.health = playerData.health;
      player.maxHealth = playerData.maxHealth;
      player.mana = playerData.mana;
      player.stamina = playerData.stamina;
      player.experience = playerData.experience;
      player.gold = playerData.gold;
      player.level = playerData.level;
      player.attributes = playerData.attributes;
      player.lifeSkills = playerData.lifeSkills;
      player.equipment.equipment = playerData.equipment;

      return player;
    }
    catch (err) {
      // TODO: Add this to a log file instead of console.error
      console.error(`Failed to load player data for ${this.name}. Error: ${err}`);
      return undefined;
    }
  }

  static playerExists(name: string): boolean {
    return fs.existsSync(path.join(playersDataPath, `${name}.json`));
  }
}