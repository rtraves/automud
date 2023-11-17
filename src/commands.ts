import { Command, CommandName } from './command-parser';
import { GameManager } from './game-manager';
import { Player } from './player/player';
import { findExitByDirection } from './area-utils';
import { broadcastToRoom } from './broadcast-utils';
import { Room } from './room';
import { AC, colorize } from './ansi-colors';
import { effectHandlers } from './effects';

export function handleMoveCommand(gameManager: GameManager, player: Player, command: Command) {
  const currentRoom = gameManager.rooms.get(player.currentRoom);
  if (!currentRoom) {
    player.writeToSocket(`Error: Current room ${player.currentRoom} not found.\r\n`);
    return;
  }

  const exit = findExitByDirection(currentRoom, command.args[0]);

  if (!exit) {
    player.writeToSocket(`You cannot go ${command.args[0]} from here.\r\n`);
    return;
  }

  if (exit.door) {
    if (!exit.door.isOpen) {
      player.writeToSocket(`The door is closed.\r\n`);
      return;
    }
  }

  const newRoom = gameManager.rooms.get(exit.roomId);

  if (!newRoom) {
    player.writeToSocket(`Error: Room ${exit.roomId} not found.\r\n`);
    return;
  }

  broadcastToRoom(`${player.name} leaves ${command.args[0]}.\r\n`, player, gameManager.players);
  player.currentRoom = newRoom.id;
  broadcastToRoom(`${player.name} has arrived.\r\n`, player, gameManager.players);
  handleLookCommand(player, newRoom);
  newRoom.onPlayerEnter(player);
}

export function handleOpenCommand(gameManager: GameManager, player: Player, command: Command) {
  const currentRoom = gameManager.rooms.get(player.currentRoom);
  if (!currentRoom) {
    player.writeToSocket(`Error: Current room ${player.currentRoom} not found.\r\n`);
    return;
  }

  const exit = findExitByDirection(currentRoom, command.args[0]);

  if (exit && exit.door) {
    if (exit.door.isOpen) {
      player.writeToSocket(`The door is already open.\r\n`);
      return;
    }
    else if (exit.door.isLocked) {
      if (player.inventory.findItem(exit.door.keyName || '')) {
        exit.door.isLocked = false;
        exit.door.isOpen = true;
        player.writeToSocket(`You unlock and open the door.\r\n`);
        broadcastToRoom(`${player.name} unlocks and opens the door.\r\n`, player, gameManager.players);
        return;
      }
      else {
        player.writeToSocket(`The door is locked.\r\n`);
        return;
      }
    }
    else {
      exit.door.isOpen = true;
      player.writeToSocket(`You open the door.\r\n`);
      broadcastToRoom(`${player.name} opens the door.\r\n`, player, gameManager.players);
      return;
    }
  }
}

export function handleEnterCommand(gameManager: GameManager, player: Player, args: string[]) {
  if (args.length === 0) {
    player.writeToSocket('Enter what?\r\n');
    return;
  }

  const target = args.join(' ').toLowerCase();
  const room = gameManager.rooms.get(player.currentRoom);
  const specialExit = room?.specialExits?.find((exit) => exit.name.toLowerCase() === target);

  if (specialExit) {
    const newRoom = gameManager.rooms.get(specialExit.roomId);
    if (!newRoom) {
      player.writeToSocket(`Error: Room ${specialExit.roomId} not found.\r\n`);
      return;
    }

    broadcastToRoom(`${player.name} leaves through ${specialExit.name}.\r\n`, player, gameManager.players);
    player.currentRoom = newRoom.id;
    broadcastToRoom(`${player.name} has arrived.\r\n`, player, gameManager.players);
    handleLookCommand(player, newRoom);
    newRoom.onPlayerEnter(player);
    return;
  }
  else {
    player.writeToSocket(`You can't use ${target}.\r\n`);
    return;
  }
}

export function handleWearCommand(gameManager: GameManager, player: Player, args: string[]) {
  if (args.length === 0) {
    player.writeToSocket('Wear what?\r\n');
    return;
  }

  const itemName = args.join(' ');
  const item = player.inventory.findItem(itemName);
  if (!item) {
    player.writeToSocket(`You do not have ${itemName}.\r\n`);
    return;
  }
  player.equip(item);
  broadcastToRoom(`${player.name} wears ${item.description}.\r\n`, player, gameManager.players);
}

export function handleRemoveCommand(gameManager: GameManager, player: Player, args: string[]) {
  if (args.length === 0) {
    player.writeToSocket('Remove what?\r\n');
    return;
  }

  const itemName = args.join(' ');
  const item = player.findEquippedItem(itemName);
  if (!item) {
    player.writeToSocket(`You are not wearing ${itemName}.\r\n`);
    return;
  }
  player.unequip(item);
  broadcastToRoom(`${player.name} removes ${item.description}.\r\n`, player, gameManager.players);
}

export function handleEquipmentCommand(player: Player) {
  player.writeToSocket('You are wearing:\r\n');
  Object.entries(player.equipment).forEach(([slot, item]) => {
    if (item) {
      player.writeToSocket(`- ${slot}: ${item.name}\r\n`);
    }
    else {
      player.writeToSocket(`- ${slot}: nothing\r\n`);
    }
  });
}

export function handleKillCommand(gameManager: GameManager, player: Player, args: string[]) {
    const targetName = args[0]; // assuming first argument is the name of the NPC or player
    const room = gameManager.rooms.get(player.currentRoom);
    const npc = room?.npcs.find(n => n.name.toLowerCase() === targetName.toLowerCase());
    
    if (npc && npc.isEnemy) {
        player.combatTarget = npc;
        player.writeToSocket(`You start attacking ${npc.name}!\r\n`);
        broadcastToRoom(`${player.name} starts attacking ${npc.name}!\r\n`, player, gameManager.players);
    } else if (npc && !npc.isEnemy) {
        player.writeToSocket(`You can't attack ${npc.name}.\r\n`);
    } else {
        player.writeToSocket(`There is no ${targetName} here.\r\n`);
    }
}

export function handleWhoCommand(gameManager: GameManager, player: Player) {
    const playerNames = Array.from(gameManager.players.values()).map((p) => p.name).join('\n');
    const names = [];
    for (const player of gameManager.players.values()) {
      names.push(player.name);
    }
    const message = `Players online:\n----------------------------\n${playerNames}\r\n`;
    player.writeToSocket(`${AC.Cyan}${message}${AC.Reset}`);
  }

export function handleInventoryCommand(player: Player) {
    if (player.inventory.items.size === 0) {
      player.writeToSocket('You are not carrying anything.\r\n');
    } else {
      player.writeToSocket('You are carrying:\r\n');
      for (const [itemName, items] of player.inventory.items.entries()) {
        // TODO: colorize items
        player.writeToSocket(`- ${AC.LightGreen}${itemName} (${items.length})\r\n`);
      }
    }
  }

export function handleHelpCommand(player: Player) {
    // for loop thru command names
    for (let command in CommandName) {
      player.writeToSocket(`${CommandName[command as keyof typeof CommandName]}\r\n`);
    }
  }

export function handleLookCommand(player: Player, room: Room | undefined, args?: string[]) {
  // If no specific item is mentioned, show the room description
  if (!args || args.length === 0) {
    if (room) {
      player.writeToSocket(colorize(`${room.title}\r\n`, AC.Cyan));
      const hiddenSpecialExits = room.specialExits?.filter((specialExit) => specialExit.hidden);
      const hiddenSpecialExitsDescriptions = hiddenSpecialExits?.map((specialExit) => specialExit.description).join(', ');
      player.writeToSocket(colorize(`${room.description}${hiddenSpecialExitsDescriptions}\r\n`, AC.Green));

      if (room.npcs && room.npcs.length > 0) {
        for (const npc of room.npcs) {
          if (npc.isEnemy) {
            player.writeToSocket(colorize(`${npc.name}\r\n`, AC.Red));
          }
          else {
            player.writeToSocket(colorize(`${npc.name}\r\n`, AC.Yellow));
          }
        }
      }

      for (const resources of room.resources) {
        player.writeToSocket(colorize(`${resources.name}\r\n`, AC.Blue));
      }

      if (room.items && room.items.length > 0) {
        for (const item of room.items) {
          player.writeToSocket(colorize(`${item.description}\r\n`, AC.Purple));
        }
      }

      if (room.specialExits) {
        room.specialExits.forEach((specialExit) => {
          if (!specialExit.hidden) {
            player.writeToSocket(colorize(`${specialExit.description}\r\n`, AC.Purple));
          }
        });
      }

      const exitStrings = room.exits?.map((exit) => `${exit.direction}`);
      if (exitStrings) {
        player.writeToSocket(colorize(`Exits: ${exitStrings.join(', ')}\r\n`, AC.Yellow));
      }
    } 
    else {
      player.writeToSocket('An error occurred. The current room does not exist.\r\n');
    }
  }
  else if (room?.specialExits) {
    // If a specific special exit is mentioned, show the special exit's lookDescription
    const specialExitName = args.join(' ').toLowerCase();
    const specialExit = room.specialExits.find((specialExit) => specialExit.name.toLowerCase() === specialExitName);

    if (specialExit) {
      player.writeToSocket(specialExit.lookDescription + '\r\n');
    } 
    else {
      player.writeToSocket(`You can't find ${specialExitName} to look at.\r\n`);
    }
  }
  else {
    // If a specific item is mentioned, show the item's lookDescription
    const itemName = args.join(' ').toLowerCase();
    const itemInInventory = player.inventory.findItem(itemName);
    const itemInRoom = room?.items.find(item => item.name.toLowerCase() === itemName);

    if (itemInInventory) {
      player.writeToSocket(itemInInventory.lookDescription + '\r\n');
    } 
    else if (itemInRoom) {
      player.writeToSocket(itemInRoom.lookDescription + '\r\n');
    } 
    else {
      player.writeToSocket(`You can't find ${itemName} to look at.\r\n`);
    }
  }
}

export function handleDropCommand(gameManager: GameManager,player: Player, args: string[]) {
    if (args.length === 0) {
      player.writeToSocket('Drop what?\r\n');
      return;
    }

    const itemName = args.join(' ');
    const item = player.inventory.findItem(itemName);
    if (!item) {
      player.writeToSocket(`You do not have ${itemName}.\r\n`);
      return;
    }
  
    const currentRoom = gameManager.rooms.get(player.currentRoom);
    if (!currentRoom) {
      player.writeToSocket(`Error: Current room ${player.currentRoom} not found.\r\n`);
      return;
    }
  
    player.inventory.removeItem(item.name , 0);
    currentRoom.addItem(item);
    player.writeToSocket(`You drop ${item.name}.\r\n`);
    broadcastToRoom(`${player.name} drops ${item.name}.\r\n`, player, gameManager.players);
  }

export function handleGetCommand(gameManager: GameManager,player: Player, args: string[]) {
    if (args.length === 0) {
      player.writeToSocket('Get what?\r\n');
      return;
    }

    const itemName = args.join(' ');
    const currentRoom = gameManager.rooms.get(player.currentRoom);

    if (!currentRoom) {
      player.writeToSocket(`Error: Current room ${player.currentRoom} not found.\r\n`);
      return;
    }

    const item = currentRoom.items.find((item) => 
      item.name.toLowerCase() === itemName || 
      item.keywords?.includes(itemName)
    );

    if (!item) {
      player.writeToSocket(`There is no ${itemName} here.\r\n`);
      return;
    }

    currentRoom.removeItem(item);
    player.inventory.addItem(item);
    player.writeToSocket(`You get ${item.description}.\r\n`);
    broadcastToRoom(`${player.name} gets ${item.description}.\r\n`, player, gameManager.players);
  }

export function handleColorsCommand(player: Player) {
    player.writeToSocket('Available colors:\r\n');
    for (let color in AC) {
      player.writeToSocket(`${AC[color as keyof typeof AC]}${color}${AC.Reset}\r\n`);
    }
}
export function gotoCommand(gameManager: GameManager, player: Player, args: string[]) {
    const room = gameManager.rooms.get(args[0]);
    if (!room) {
      player.writeToSocket(`Error: Room not found.\r\n`);
      return;
    }
    broadcastToRoom(`${player.name} leaves the room.\r\n`, player, gameManager.players);
    player.currentRoom = room.id;
    broadcastToRoom(`${player.name} has arrived.\r\n`, player, gameManager.players);
    handleLookCommand(player, room);
}
export function handleScoreCommand(player: Player){
    player.writeToSocket(`${AC.LightCyan}------------------------------------------------${AC.Reset}\r\n`);
    player.writeToSocket(`You are ${AC.LightBlue}${player.name}${AC.Reset}.\r\n`);
    player.writeToSocket(`You have ${AC.LightYellow}${player.gold}${AC.Reset} gold.\r\n`);
    player.writeToSocket(`You have ${AC.LightPurple}${player.experience}${AC.Reset} experience.\r\n`);
    player.writeToSocket(`You are level ${AC.LightGreen}${player.level}${AC.Reset}.\r\n`);
    player.writeToSocket(`${AC.LightWhite}Attributes:${AC.Reset}\r\n`);
    for (const attribute in player.attributes) {
      player.writeToSocket(`- ${attribute}: ${AC.LightGreen}${player.attributes[attribute as keyof typeof player.attributes]}${AC.Reset}\r\n`);
    }
    player.writeToSocket(`${AC.LightWhite}Life Skills:${AC.Reset}\r\n`);
    for (const skill of player.lifeSkills) {
      player.writeToSocket(`- ${skill.name}: ${AC.LightGreen}${skill.level}${AC.Reset}\r\n`);
    }
    player.displayExperienceToNextLevel();
    player.writeToSocket(`${AC.LightCyan}------------------------------------------------${AC.Reset}\r\n`);
}
export function handleRestoreCommand(gameManager: GameManager, player: Player, args: string[]){
    if (args.length === 0) {
      player.writeToSocket('Restore what?\r\n');
      return;
    }
    // set player hp to full
    player.health = 100;
    player.writeToSocket(`You have been restored to full health.\r\n`);
    // Temporarily just setting to 100 hp, eventually will just set to max health
}
export function handleDrinkCommand(gameManager: GameManager, player: Player, args: string[]) {
  const currentRoom = gameManager.rooms.get(player.currentRoom);  
  if (args.length === 0) {
      player.writeToSocket('Drink what?\r\n');
      return;
  }
  const itemName = args.join(' ').toLowerCase();
  const itemInInventory = player.inventory.findItem(itemName);
  if (!itemInInventory) {
      player.writeToSocket(`You do not have ${itemName}.\r\n`);
      return;
  } else {
    if (itemInInventory.useCommand === 'drink') {
      const effectName = itemInInventory.effect?.type;
      const effectAmount = itemInInventory.effect?.amount;
      effectHandlers[effectName](player, effectAmount);
      player.writeToSocket(`You restore ${effectAmount} health.\r\n`);
      player.inventory.removeItem(itemName, 0);
      currentRoom?.removeItem(itemInInventory);
    }
  }
}
export function handleListCommand(gameManager: GameManager, player: Player) {
  const currentRoom = gameManager.rooms.get(player.currentRoom);
  const shopsInRoom = currentRoom?.npcs.filter(npc => npc.isShop);
  if (shopsInRoom) {
      player.writeToSocket(shopsInRoom[0].listItems());
  }
}
export function handleBuyCommand(gameManager: GameManager, player: Player, args: string[]) {
  const currentRoom = gameManager.rooms.get(player.currentRoom);
  if (args.length < 3) {
      player.writeToSocket('Usage: buy [item number] from [npc name]\r\n');
      return;
  }
  
  const itemIndex = parseInt(args[0]) - 1;
  args.shift(); // remove the item index from the args
  args.shift(); // remove the "from" from the args
  
  const npcName = args.join(' ').toLowerCase();
  const npcInRoom = currentRoom?.npcs.find(npc => npc.name.toLowerCase() === npcName);
  
  if (!npcInRoom) {
      player.writeToSocket(`You do not see ${npcName} here.\r\n`);
      return;
  } else if (npcInRoom.isShop) {
      player.writeToSocket(npcInRoom.sellItem(player, itemIndex));
  }
}
export function handleSellCommand(gameManager: GameManager, player: Player, args: string[]) {
  const currentRoom = gameManager.rooms.get(player.currentRoom);
  if (args.length < 3) {
      player.writeToSocket('Usage: sell [item name] to [npc name]\r\n');
      return;
  }

  // Split arguments based on the "to" keyword
  const toIndex = args.indexOf('to');
  if (toIndex === -1 || toIndex === 0 || toIndex === args.length - 1) {
      player.writeToSocket('Usage: sell [item name] to [npc name]\r\n');
      return;
  }

  const itemName = args.slice(0, toIndex).join(' ').toLowerCase();
  const npcName = args.slice(toIndex + 1).join(' ').toLowerCase();

  const item = player.inventory.findItem(itemName);
  const npcInRoom = currentRoom?.npcs.find(npc => npc.name.toLowerCase() === npcName);

  if (!npcInRoom) {
      player.writeToSocket(`You do not see ${npcName} here.\r\n`);
      return;
  } else if (npcInRoom.isShop && item) {
      player.writeToSocket(npcInRoom.buyItem(player, item));
  } else if (!item) {
      player.writeToSocket(`You do not have ${itemName}.\r\n`);
  } else {
      player.writeToSocket(`${npcInRoom.name} is not interested in buying items.\r\n`);
  }
}
export function handleFishCommand(gameManager: GameManager, player: Player, command: Command, args: string[]) {
  const currentRoom = gameManager.rooms.get(player.currentRoom);
  if (args.length === 0) {
      player.writeToSocket('Fish what?\r\n');
      return;
  }

  const resourceCommand = args.join(' ').toLowerCase();
  const matchedResource = currentRoom?.resources.find(resource => resource.name.toLowerCase() === resourceCommand);
  if (!matchedResource) {
      player.writeToSocket(`Could not find ${resourceCommand} here.\r\n`);
      return;
  }

  const fishingSkill = player.lifeSkills.find(skill => skill.name.toLowerCase() === 'fishing');
  if (!fishingSkill || fishingSkill.level < matchedResource.level) {
    player.writeToSocket("You need a higher fishing skill to fish here!\r\n");
    return;
  }
  const fishingRod = player.inventory.findItem('rod');
  if (!fishingRod) { 
    player.writeToSocket("You need a fishing rod to fish!\r\n"); 
    return; 
  } 

  player.writeToSocket(`${AC.LightBlue}You cast your line into the ${AC.Blue}water${AC.Reset}...\r\n`);
  setTimeout(() => {
    if (!matchedResource?.dropTable) {
      player.writeToSocket("You didn't catch anything this time.\r\n");
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
      player.writeToSocket("You didn't catch anything this time.\r\n");
    } else {
      player.inventory.addItem(dropItem.item);
      player.writeToSocket(`You caught a ${dropItem.item.name}!\r\n`);
      player.gainLifeSkillExperience('Fishing', 5);
    }
  }, 3000);

  gameManager.startCommandAutomation(player, command, args, 5000);
}
export function handleMineCommand(gameManager: GameManager, player: Player, command: Command, args: string[]) {
  const currentRoom = gameManager.rooms.get(player.currentRoom);
  if (args.length === 0) {
      player.writeToSocket('Mine what?\r\n');
      return;
  }

  const resourceCommand = args.join(' ').toLowerCase();
  const matchedResource = currentRoom?.resources.find(resource => resource.name.toLowerCase() === resourceCommand);
  if (!matchedResource) {
      player.writeToSocket(`Could not find ${resourceCommand} here.\r\n`);
      return;
  }

  const miningSkill = player.lifeSkills.find(skill => skill.name.toLowerCase() === 'mining');
  if (!miningSkill || miningSkill.level < matchedResource.level) {
    player.writeToSocket("You need a higher Mining skill to mine here!\r\n");
    return;
  }

  const pickaxe = player.inventory.findItem('pickaxe');
  if (!pickaxe) { 
    player.writeToSocket("You need a pickaxe to mine!\r\n"); 
    return; 
  } 

  player.writeToSocket(`${AC.LightBlue}You swing your pickaxe at the ${AC.Blue}ore${AC.Reset}...\r\n`);
  setTimeout(() => {
    if (!matchedResource?.dropTable) {
      player.writeToSocket("You didn't find anything this time.\r\n");
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
      player.writeToSocket("You didn't find anything this time.\r\n");
    } else {
      player.inventory.addItem(dropItem.item);
      player.writeToSocket(`You mined ${dropItem.item.name}!\r\n`);
      player.gainLifeSkillExperience('Mining', 5);
    }
  }, 3000);
  gameManager.startCommandAutomation(player, command, args, 5000);
}
export function handleChopCommand(gameManager: GameManager, player: Player, command: Command, args: string[]) {
  const currentRoom = gameManager.rooms.get(player.currentRoom);
  if (args.length === 0) {
      player.writeToSocket('Chop what?\r\n');
      return;
  }

  const resourceCommand = args.join(' ').toLowerCase();
  const matchedResource = currentRoom?.resources.find(resource => resource.name.toLowerCase() === resourceCommand);
  if (!matchedResource) {
      player.writeToSocket(`Could not find ${resourceCommand} here.\r\n`);
      return;
  }

  const woodcuttingSkill = player.lifeSkills.find(skill => skill.name.toLowerCase() === 'mining');
  if (!woodcuttingSkill || woodcuttingSkill.level < matchedResource.level) {
    player.writeToSocket("You need a higher Woodcutting skill to chop here!\r\n");
    return;
  }

  const hatchet = player.inventory.findItem('hatchet');
  if (!hatchet) { 
    player.writeToSocket("You need a hatchet to chop!\r\n"); 
    return; 
  } 

  player.writeToSocket(`${AC.LightBlue}You swing your axe at the ${AC.Blue}tree${AC.Reset}...\r\n`);
  setTimeout(() => {
    if (!matchedResource?.dropTable) {
      player.writeToSocket("You didn't find anything this time.\r\n");
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
      player.writeToSocket("You didn't find anything this time.\r\n");
    } else {
      player.inventory.addItem(dropItem.item);
      player.writeToSocket(`You chopped a ${dropItem.item.name}!\r\n`);
      player.gainLifeSkillExperience('Woodcutting', 5);
    }
  }, 3000);
  gameManager.startCommandAutomation(player, command, args, 5000);
}

export function handleReloadCommand(gameManager: GameManager, player: Player, args: string[]) {
  if (!player.isAdmin) {
    player.writeToSocket('Unknown command.\r\n');
    return;
  }
  else {
    player.writeToSocket(`${player}: Reloading...\r\n`);
    gameManager.reload();
    player.writeToSocket(`${player}: Reloaded.\r\n`);
  }
}

export function handleQuestCommand() {
  // TODO: implement
}