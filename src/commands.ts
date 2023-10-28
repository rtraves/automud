import { Command, CommandName } from './command-parser';
import { GameManager } from './game-manager';
import { Player } from './player';
import { findExitByDirection } from './area-utils';
import { broadcastToRoom } from './broadcast-utils';
import { Room } from './room';
import { AC, colorize } from './ansi-colors';
import { effectHandlers } from './effects';
import { Item } from './item';
import { findItemById } from './item-manager';


// TODO: maybe split into something like
//   commands/
// │
// ├── movement.ts
// ├── combat.ts
// ├── inventory.ts
// ├── misc.ts
// └── admin.ts

export function handleMoveCommand(gameManager: GameManager, player: Player, command: Command) {
  const currentRoom = gameManager.rooms.get(player.currentRoom);
  if (!currentRoom) {
    player.socket.write(`Error: Current room ${player.currentRoom} not found.\r\n`);
    return;
  }

  const exit = findExitByDirection(currentRoom, command.args[0]);

  if (!exit) {
    player.socket.write(`You cannot go ${command.args[0]} from here.\r\n`);
    return;
  }

  const newRoom = gameManager.rooms.get(exit.roomId);

  if (!newRoom) {
    player.socket.write(`Error: Room ${exit.roomId} not found.\r\n`);
    return;
  }

  broadcastToRoom(`${player.name} leaves ${command.args[0]}.\r\n`, player, gameManager.players);
  player.currentRoom = newRoom.id;
  broadcastToRoom(`${player.name} has arrived.\r\n`, player, gameManager.players);
  handleLookCommand(player, newRoom);
  newRoom.onPlayerEnter(player);
}

export function handleKillCommand(gameManager: GameManager, player: Player, args: string[]) {
    const targetName = args[0]; // assuming first argument is the name of the NPC or player
    const room = gameManager.rooms.get(player.currentRoom);
    const npc = room?.npcs.find(n => n.name.toLowerCase() === targetName.toLowerCase());
    
    if (npc && npc.isEnemy) {
        player.combatTarget = npc;
        player.socket.write(`You start attacking ${npc.name}!\r\n`);
        broadcastToRoom(`${player.name} starts attacking ${npc.name}!\r\n`, player, gameManager.players);
    } else if (npc && !npc.isEnemy) {
        player.socket.write(`You can't attack ${npc.name}.\r\n`);
    } else {
        player.socket.write(`There is no ${targetName} here.\r\n`);
    }
}

export function handleWhoCommand(gameManager: GameManager, player: Player) {
    const playerNames = Array.from(gameManager.players.values()).map((p) => p.name).join('\n');
    const names = [];
    for (const player of gameManager.players.values()) {
      names.push(player.name);
    }
    const message = `Players online:\n----------------------------\n${playerNames}\r\n`;
    player.socket.write(`${AC.Cyan}${message}${AC.Reset}`);
  }

export function handleInventoryCommand(player: Player) {
    if (player.inventory.items.size === 0) {
      player.socket.write('You are not carrying anything.\r\n');
    } else {
      player.socket.write('You are carrying:\r\n');
      for (const [itemName, items] of player.inventory.items.entries()) {
        // TODO: colorize items
        player.socket.write(`- ${AC.LightGreen}${itemName} (${items.length})\r\n`);
      }
    }
  }

export function handleHelpCommand(player: Player) {
    // for loop thru command names
    for (let command in CommandName) {
      player.socket.write(`${CommandName[command as keyof typeof CommandName]}\r\n`);
    }
  }

export function handleLookCommand(player: Player, room: Room | undefined, args?: string[]) {
    // If no specific item is mentioned, show the room description
    if (!args || args.length === 0) {
        if (room) {
            player.socket.write(colorize(`${room.title}\r\n`, AC.Cyan));
            player.socket.write(colorize(`${room.description}\r\n`, AC.Green));
            if (room.npcs && room.npcs.length > 0) {
        for (const npc of room.npcs) {
          if (npc.isEnemy) {
            player.socket.write(colorize(`${npc.name}\r\n`, AC.Red));
          }
          else {
            player.socket.write(colorize(`${npc.name}\r\n`, AC.Yellow));
          }
        }
      }
      for (const resources of room.resources) {
        player.socket.write(colorize(`${resources.name}\r\n`, AC.Blue));
      }
      if (room.items && room.items.length > 0) {
                for (const item of room.items) {
                    player.socket.write(colorize(`${item.description}\r\n`, AC.Purple));
                }
            }
            const exitStrings = room.exits.map((exit) => `${exit.direction}`);
            player.socket.write(colorize(`Exits: ${exitStrings.join(', ')}\r\n`, AC.Yellow));
        } else {
            player.socket.write('An error occurred. The current room does not exist.\r\n');
        }
    } else {
        // If a specific item is mentioned, show the item's lookDescription
        const itemName = args.join(' ').toLowerCase();
        const itemInInventory = player.inventory.findItem(itemName);
        const itemInRoom = room?.items.find(item => item.name.toLowerCase() === itemName);

        if (itemInInventory) {
            player.socket.write(itemInInventory.lookDescription + '\r\n');
        } else if (itemInRoom) {
            player.socket.write(itemInRoom.lookDescription + '\r\n');
        } else {
            player.socket.write(`You can't find ${itemName} to look at.\r\n`);
        }
    }
}

export function handleDropCommand(gameManager: GameManager,player: Player, args: string[]) {
    if (args.length === 0) {
      player.socket.write('Drop what?\r\n');
      return;
    }

    const itemName = args.join(' ');
    const item = player.inventory.findItem(itemName);
    if (!item) {
      player.socket.write(`You do not have ${itemName}.\r\n`);
      return;
    }
  
    const currentRoom = gameManager.rooms.get(player.currentRoom);
    if (!currentRoom) {
      player.socket.write(`Error: Current room ${player.currentRoom} not found.\r\n`);
      return;
    }
  
    player.inventory.removeItem(item.name , 0);
    currentRoom.addItem(item);
    player.socket.write(`You drop ${item.name}.\r\n`);
    broadcastToRoom(`${player.name} drops ${item.name}.\r\n`, player, gameManager.players);
  }

export function handleGetCommand(gameManager: GameManager,player: Player, args: string[]) {
    if (args.length === 0) {
      player.socket.write('Get what?\r\n');
      return;
    }

    const itemName = args.join(' ');
    const currentRoom = gameManager.rooms.get(player.currentRoom);

    if (!currentRoom) {
      player.socket.write(`Error: Current room ${player.currentRoom} not found.\r\n`);
      return;
    }

    const item = currentRoom.items.find((item) => 
      item.name.toLowerCase() === itemName || 
      item.keywords?.includes(itemName)
    );

    if (!item) {
      player.socket.write(`There is no ${itemName} here.\r\n`);
      return;
    }

    currentRoom.removeItem(item);
    player.inventory.addItem(item);
    player.socket.write(`You get ${item.description}.\r\n`);
    broadcastToRoom(`${player.name} gets ${item.description}.\r\n`, player, gameManager.players);
  }

export function handleColorsCommand(player: Player) {
    player.socket.write('Available colors:\r\n');
    for (let color in AC) {
      player.socket.write(`${AC[color as keyof typeof AC]}${color}${AC.Reset}\r\n`);
    }
}
export function gotoCommand(gameManager: GameManager, player: Player, args: string[]) {
    const room = gameManager.rooms.get(args[0]);
    if (!room) {
      player.socket.write(`Error: Room not found.\r\n`);
      return;
    }
    broadcastToRoom(`${player.name} leaves the room.\r\n`, player, gameManager.players);
    player.currentRoom = room.id;
    broadcastToRoom(`${player.name} has arrived.\r\n`, player, gameManager.players);
    handleLookCommand(player, room);
}
export function handleScoreCommand(player: Player){
    player.socket.write(`${AC.LightCyan}------------------------------------------------${AC.Reset}\r\n`);
    player.socket.write(`You are ${AC.LightBlue}${player.name}${AC.Reset}.\r\n`);
    player.socket.write(`You have ${AC.LightYellow}${player.gold}${AC.Reset} gold.\r\n`);
    player.socket.write(`You have ${AC.LightPurple}${player.experience}${AC.Reset} experience.\r\n`);
    player.socket.write(`You are level ${AC.LightGreen}${player.level}${AC.Reset}.\r\n`);
    player.socket.write(`${AC.LightWhite}Attributes:${AC.Reset}\r\n`);
    for (const attribute in player.attributes) {
      player.socket.write(`- ${attribute}: ${AC.LightGreen}${player.attributes[attribute as keyof typeof player.attributes]}${AC.Reset}\r\n`);
    }
    player.socket.write(`${AC.LightWhite}Life Skills:${AC.Reset}\r\n`);
    for (const skill of player.lifeSkills) {
      player.socket.write(`- ${skill.name}: ${AC.LightGreen}${skill.level}${AC.Reset}\r\n`);
    }
    player.displayExperienceToNextLevel();
    player.socket.write(`${AC.LightCyan}------------------------------------------------${AC.Reset}\r\n`);
}
export function handleRestoreCommand(gameManager: GameManager, player: Player, args: string[]){
    if (args.length === 0) {
      player.socket.write('Restore what?\r\n');
      return;
    }
    // set player hp to full
    player.health = 100;
    player.socket.write(`You have been restored to full health.\r\n`);
    // Temporarily just setting to 100 hp, eventually will just set to max health
}
export function handleDrinkCommand(gameManager: GameManager, player: Player, args: string[]) {
  const currentRoom = gameManager.rooms.get(player.currentRoom);  
  if (args.length === 0) {
      player.socket.write('Drink what?\r\n');
      return;
  }
  const itemName = args.join(' ').toLowerCase();
  const itemInInventory = player.inventory.findItem(itemName);
  if (!itemInInventory) {
      player.socket.write(`You do not have ${itemName}.\r\n`);
      return;
  } else {
    if (itemInInventory.useCommand === 'drink') {
      const effectName = itemInInventory.effect?.type;
      const effectAmount = itemInInventory.effect?.amount;
      effectHandlers[effectName](player, effectAmount);
      player.socket.write(`You restore ${effectAmount} health.\r\n`);
      player.inventory.removeItem(itemName, 0);
      currentRoom?.removeItem(itemInInventory);
    }
  }
}
export function handleListCommand(gameManager: GameManager, player: Player) {
  const currentRoom = gameManager.rooms.get(player.currentRoom);
  const shopsInRoom = currentRoom?.npcs.filter(npc => npc.isShop);
  if (shopsInRoom) {
      player.socket.write(shopsInRoom[0].listItems());
  }
}
export function handleBuyCommand(gameManager: GameManager, player: Player, args: string[]) {
  const currentRoom = gameManager.rooms.get(player.currentRoom);
  if (args.length < 3) {
      player.socket.write('Usage: buy [item number] from [npc name]\r\n');
      return;
  }
  
  const itemIndex = parseInt(args[0]) - 1;
  args.shift(); // remove the item index from the args
  args.shift(); // remove the "from" from the args
  
  const npcName = args.join(' ').toLowerCase();
  const npcInRoom = currentRoom?.npcs.find(npc => npc.name.toLowerCase() === npcName);
  
  if (!npcInRoom) {
      player.socket.write(`You do not see ${npcName} here.\r\n`);
      return;
  } else if (npcInRoom.isShop) {
      player.socket.write(npcInRoom.sellItem(player, itemIndex));
  }
}
export function handleSellCommand(gameManager: GameManager, player: Player, args: string[]) {
  const currentRoom = gameManager.rooms.get(player.currentRoom);
  if (args.length < 3) {
      player.socket.write('Usage: sell [item name] to [npc name]\r\n');
      return;
  }

  // Split arguments based on the "to" keyword
  const toIndex = args.indexOf('to');
  if (toIndex === -1 || toIndex === 0 || toIndex === args.length - 1) {
      player.socket.write('Usage: sell [item name] to [npc name]\r\n');
      return;
  }

  const itemName = args.slice(0, toIndex).join(' ').toLowerCase();
  const npcName = args.slice(toIndex + 1).join(' ').toLowerCase();

  const item = player.inventory.findItem(itemName);
  const npcInRoom = currentRoom?.npcs.find(npc => npc.name.toLowerCase() === npcName);

  if (!npcInRoom) {
      player.socket.write(`You do not see ${npcName} here.\r\n`);
      return;
  } else if (npcInRoom.isShop && item) {
      player.socket.write(npcInRoom.buyItem(player, item));
  } else if (!item) {
      player.socket.write(`You do not have ${itemName}.\r\n`);
  } else {
      player.socket.write(`${npcInRoom.name} is not interested in buying items.\r\n`);
  }
}
export function handleFishCommand(gameManager: GameManager, player: Player, command: Command, args: string[]) {
  const currentRoom = gameManager.rooms.get(player.currentRoom);
  if (args.length === 0) {
      player.socket.write('Fish what?\r\n');
      return;
  }

  const resourceCommand = args.join(' ').toLowerCase();
  const matchedResource = currentRoom?.resources.find(resource => resource.name.toLowerCase() === resourceCommand);
  if (!matchedResource) {
      player.socket.write(`Could not find ${resourceCommand} here.\r\n`);
      return;
  }

  const fishingSkill = player.lifeSkills.find(skill => skill.name.toLowerCase() === 'fishing');
  if (!fishingSkill || fishingSkill.level < matchedResource.level) {
    player.socket.write("You need a higher fishing skill to fish here!\r\n");
    return;
  }
  const fishingRod = player.inventory.findItem('rod');
  if (!fishingRod) { 
    player.socket.write("You need a fishing rod to fish!\r\n"); 
    return; 
  } 

  player.socket.write(`${AC.LightBlue}You cast your line into the ${AC.Blue}water${AC.Reset}...\r\n`);
  setTimeout(() => {
    if (!matchedResource?.dropTable) {
      player.socket.write("You didn't catch anything this time.\r\n");
      return;
    }

    const totalChance = matchedResource.dropTable.reduce((sum, item) => sum + item.chance, 0);
    let randomChance = Math.random() * totalChance;
    const dropTableSorted = matchedResource.dropTable.sort((a, b) => a.chance - b.chance);

    let dropItem;
    for (const item of dropTableSorted) {
      randomChance -= item.chance;
      if (randomChance <= 0) {
        dropItem = item;
        break;
      }
    }

    if (!dropItem || !dropItem.item) {
      player.socket.write("You didn't catch anything this time.\r\n");
    } else {
      player.inventory.addItem(dropItem.item);
      player.socket.write(`You caught a ${dropItem.item.name}!\r\n`);
      player.gainLifeSkillExperience('Fishing', 5);
    }
  }, 3000);

  gameManager.startCommandAutomation(player, command, args, 5000);
}
export function handleMineCommand(gameManager: GameManager, player: Player, command: Command, args: string[]) {
  const currentRoom = gameManager.rooms.get(player.currentRoom);
  if (args.length === 0) {
      player.socket.write('Mine what?\r\n');
      return;
  }

  const resourceCommand = args.join(' ').toLowerCase();
  const matchedResource = currentRoom?.resources.find(resource => resource.name.toLowerCase() === resourceCommand);
  if (!matchedResource) {
      player.socket.write(`Could not find ${resourceCommand} here.\r\n`);
      return;
  }

  const miningSkill = player.lifeSkills.find(skill => skill.name.toLowerCase() === 'mining');
  if (!miningSkill || miningSkill.level < matchedResource.level) {
    player.socket.write("You need a higher Mining skill to mine here!\r\n");
    return;
  }

  const pickaxe = player.inventory.findItem('pickaxe');
  if (!pickaxe) { 
    player.socket.write("You need a pickaxe to mine!\r\n"); 
    return; 
  } 

  player.socket.write(`${AC.LightBlue}You swing your pickaxe at the ${AC.Blue}ore${AC.Reset}...\r\n`);
  setTimeout(() => {
    if (!matchedResource?.dropTable) {
      player.socket.write("You didn't find anything this time.\r\n");
      return;
    }
  
    const totalChance = matchedResource.dropTable.reduce((sum, item) => sum + item.chance, 0);
    let randomChance = Math.random() * totalChance;
    const dropTableSorted = matchedResource.dropTable.sort((a, b) => a.chance - b.chance);
  
    let dropItem;
    for (const item of dropTableSorted) {
      randomChance -= item.chance;
      if (randomChance <= 0) {
        dropItem = item;
        break;
      }
    }
  
    if (!dropItem || !dropItem.item) {
      player.socket.write("You didn't find anything this time.\r\n");
    } else {
      player.inventory.addItem(dropItem.item);
      player.socket.write(`You mined ${dropItem.item.name}!\r\n`);
      player.gainLifeSkillExperience('Mining', 5);
    }
  }, 3000);
  gameManager.startCommandAutomation(player, command, args, 5000);
}
export function handleChopCommand(gameManager: GameManager, player: Player, command: Command, args: string[]) {
  const currentRoom = gameManager.rooms.get(player.currentRoom);
  if (args.length === 0) {
      player.socket.write('Chop what?\r\n');
      return;
  }

  const resourceCommand = args.join(' ').toLowerCase();
  const matchedResource = currentRoom?.resources.find(resource => resource.name.toLowerCase() === resourceCommand);
  if (!matchedResource) {
      player.socket.write(`Could not find ${resourceCommand} here.\r\n`);
      return;
  }

  const woodcuttingSkill = player.lifeSkills.find(skill => skill.name.toLowerCase() === 'mining');
  if (!woodcuttingSkill || woodcuttingSkill.level < matchedResource.level) {
    player.socket.write("You need a higher Woodcutting skill to chop here!\r\n");
    return;
  }

  const hatchet = player.inventory.findItem('hatchet');
  if (!hatchet) { 
    player.socket.write("You need a hatchet to chop!\r\n"); 
    return; 
  } 

  player.socket.write(`${AC.LightBlue}You swing your axe at the ${AC.Blue}tree${AC.Reset}...\r\n`);
  setTimeout(() => {
    if (!matchedResource?.dropTable) {
      player.socket.write("You didn't find anything this time.\r\n");
      return;
    }
  
    const totalChance = matchedResource.dropTable.reduce((sum, item) => sum + item.chance, 0);
    let randomChance = Math.random() * totalChance;
    const dropTableSorted = matchedResource.dropTable.sort((a, b) => a.chance - b.chance);
  
    let dropItem;
    for (const item of dropTableSorted) {
      randomChance -= item.chance;
      if (randomChance <= 0) {
        dropItem = item;
        break;
      }
    }
  
    if (!dropItem || !dropItem.item) {
      player.socket.write("You didn't find anything this time.\r\n");
    } else {
      player.inventory.addItem(dropItem.item);
      player.socket.write(`You chopped a ${dropItem.item.name}!\r\n`);
      player.gainLifeSkillExperience('Woodcutting', 5);
    }
  }, 3000);
  gameManager.startCommandAutomation(player, command, args, 5000);
}

export function handleReloadCommand(gameManager: GameManager, player: Player, args: string[]) {
  if (!player.isAdmin) {
    player.socket.write('Unknown command.\r\n');
    return;
  }
  else {
    player.socket.write(`${player}: Reloading...\r\n`);
    gameManager.reload();
    player.socket.write(`${player}: Reloaded.\r\n`);
  }
}

export function handleQuestCommand() {
  // TODO: implement
}