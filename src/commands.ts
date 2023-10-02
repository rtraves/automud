import { Command, CommandName } from './command-parser';
import { GameManager } from './game-manager';
import { Player } from './player';
import { findExitByDirection } from './area-utils';
import { broadcastToRoom } from './broadcast-utils';
import { Room } from './room';
import { AC, colorize } from './ansi-colors';


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
}

export function handleKillCommand(gameManager: GameManager, player: Player, args: string[]) {
    const targetName = args[0]; // assuming first argument is the name of the NPC or player
    const room = gameManager.rooms.get(player.currentRoom);
    const npc = room?.npcs.find(n => n.name.toLowerCase() === targetName.toLowerCase());
    
    if (npc) {
        player.combatTarget = npc;
        player.socket.write(`You start attacking ${npc.name}!\r\n`);
        broadcastToRoom(`${player.name} starts attacking ${npc.name}!\r\n`, player, gameManager.players);
    } else {
        player.socket.write(`${targetName} isn't here.\r\n`);
    }
}

export function handleWhoCommand(gameManager: GameManager,player: Player) {
    const playerNames = Array.from(gameManager.players.values()).map((p) => p.name).join('\n');
    const names = [];
    for (const player of gameManager.players.values()) {
      names.push(player.name);
    }
    const message = `Players online:\n----------------------------\n${playerNames}\r\n`;
    player.socket.write(`${AC.Cyan}${message}${AC.Reset}`);
  }

export function handleInventoryCommand(player: Player) {
    if (player.inventory.length === 0) {
      player.socket.write('You are not carrying anything.\r\n');
    } else {
      player.socket.write('You are carrying:\r\n');
      for (const item of player.inventory.items) {
        // TODO: colorize items and probably do something like item.name
        player.socket.write(`- ${item.name}\r\n`);
      };
    }
  }

export function handleHelpCommand(player: Player) {
    // for loop thru command names
    for (let command in CommandName) {
      player.socket.write(`${CommandName[command as keyof typeof CommandName]}\r\n`);
    }
  }

  // Also bug for some reason isEnemy is not evaluating appropriatly
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

    player.inventory.removeItem(item);
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