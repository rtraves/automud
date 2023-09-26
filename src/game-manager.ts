import * as net from 'net';
import * as path from 'path';
import { Player } from './player';
import { Room } from './room';
import { CommandName, Command } from './command-parser';
import { AnsiColor, colorize } from './ansi-colors';
import { loadArea, findExitByDirection } from './area-utils';
import { broadcastToRoom, broadcastToAll } from './broadcast-utils';
import { Session } from './session';

export class GameManager {
  private static instance: GameManager;
  players: Map<string, Player>;
  rooms: Map<string, Room>;
  sessions: Map<string, Session>;

  private constructor() {
    this.players = new Map();
    this.rooms = new Map();
    this.sessions = new Map();
  }

  static getInstance(): GameManager {
    if (!GameManager.instance) {
        GameManager.instance = new GameManager();
    }
    return GameManager.instance;
  }

  start() {
    const areaPath = path.join(__dirname, '..', 'areas', 'area1.json');
    const areaRooms = loadArea(areaPath);

    for (const [roomId, room] of areaRooms.entries()) {
      this.rooms.set(roomId, room);
    }

    // set game tick
    setInterval(() => {
      this.gameTick();
    }, 1000);

    // set save tick
    setInterval(() => {
      this.saveTick();
    }, 60000);
  }

  stop() {}

  gameTick() {

  }

  saveTick() {
    // save player data
    // console.log('Saving player data...');
    this.players.forEach((player) => {
      player.save();
    });
  }

  convertSessionToPlayer(session: Session, providedName: string, password: string): Player {
    const player = Player.createNewPlayer(providedName, password, session.socket);
    this.players.set(session.sessionId, player);
    this.sessions.delete(session.sessionId);
    return player;
  }

  initSession(socket: net.Socket): Session {
    const session = new Session(socket);
    return session;
  }

  handleCommand(player: Player, command: Command) {
    switch (command.name) {
      case CommandName.Move:
        this.handleMoveCommand(player, command);
        break;
      case CommandName.Kill:
        this.handleKillCommand(player, command);
        break;
      case CommandName.Look:
        const room = this.rooms.get(player.currentRoom);
        this.handleLookCommand(player,room);
        break;
      case CommandName.Quit:
        player.save();
        player.socket.write('Goodbye!\r\n');
        player.socket.end();
        break;
      case CommandName.Say:
        const roomMessage = `${AnsiColor.LightBlue}${player.name} says: ${command.args.join(' ')}${AnsiColor.Reset}\r\n`;
        player.socket.write(roomMessage);
        broadcastToRoom(roomMessage, player, this.players);
        break;
      case CommandName.Chat:
        const globalMessage = `${AnsiColor.Red}[Global] ${player.name}: ${command.args.join(' ')}${AnsiColor.Reset}\r\n`;
        broadcastToAll(globalMessage, this.players, player);
        break;
      case CommandName.Who:
        this.handleWhoCommand(player);
        break;
      case CommandName.Inventory:
        this.handleInventoryCommand(player);
        break;
      case CommandName.Help:
        this.handleHelpCommand(player);
        break;
      case CommandName.Drop:
        this.handleDropCommand(player, command.args);
        break;
      case CommandName.Get:
        this.handleGetCommand(player, command.args);
        break;
      default:
        player.socket.write('Unknown command. Type `help` for a list of commands.\r\n');
    }
  }
  // TODO: move this to a separate file
  handleMoveCommand(player: Player, command: Command) {
    const currentRoom = this.rooms.get(player.currentRoom);
    if (!currentRoom) {
      player.socket.write(`Error: Current room ${player.currentRoom} not found.\r\n`);
      return;
    }
  
    const exit = findExitByDirection(currentRoom, command.args[0]);
  
    if (!exit) {
      player.socket.write(`You cannot go ${command.args[0]} from here.\r\n`);
      return;
    }
  
    const newRoom = this.rooms.get(exit.roomId);
  
    if (!newRoom) {
      player.socket.write(`Error: Room ${exit.roomId} not found.\r\n`);
      return;
    }
    broadcastToRoom(`${player.name} leaves ${command.args[0]}.\r\n`, player, this.players);
    player.currentRoom = newRoom.id;
    broadcastToRoom(`${player.name} has arrived.\r\n`, player, this.players);

    // Modify handleLookCommand to accept a room ID so we can reuse it here
    // Also I kinda hate the 'handle' prefix
    this.handleLookCommand(player, newRoom);
  }

  // TODO: move this to a separate file
  handleKillCommand(player: Player, command: Command) {
    const currentRoom = this.rooms.get(player.currentRoom);
    if (!currentRoom) {
      player.socket.write(`Error: Current room ${player.currentRoom} not found.\r\n`);
      return;
    }
    const targetName = command.args.join(' ');
    const target = currentRoom.npcs.find((npc) => npc.name.toLowerCase() === targetName.toLowerCase());
    if (!target) {
      player.socket.write(`There is no ${targetName} here.\r\n`);
      return;
    }
    if (!target.isFriendly) {
      player.attack(target);
    }
    
  }
  // TODO: move this to a separate file
  handleWhoCommand(player: Player) {
    const playerNames = Array.from(this.players.values()).map((p) => p.name).join('\n');
    const message = `Players online:\n----------------------------\n${playerNames}\r\n`;
    player.socket.write(`${AnsiColor.Cyan}${message}${AnsiColor.Reset}`);
  }
  // TODO: move this to a separate file
  handleInventoryCommand(player: Player) {
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
  // TODO: move this to a separate file
  handleHelpCommand(player: Player) {
    player.socket.write('Available commands:\r\n');
    player.socket.write('- move (n/e/s/w)\r\n');
    player.socket.write('- look\r\n');
    player.socket.write('- quit\r\n');
    player.socket.write('- say <message>\r\n');
    player.socket.write('- chat <message>\r\n');
    player.socket.write('- who\r\n');
    player.socket.write('- inventory (inv/i)\r\n');
    player.socket.write('- help\r\n');
    player.socket.write('- drop <item>\r\n');
    player.socket.write('- get <item>\r\n');
  }
  // TODO: move this to a separate file
  handleLookCommand(player: Player, room: Room | undefined) {
    if (room) {
      console.log(room);
      player.socket.write(colorize(`${room.title}\r\n`, AnsiColor.Cyan));
      player.socket.write(colorize(`${room.description}\r\n`, AnsiColor.Green));
      if (room.npcs && room.npcs.length > 0) {
        for (const npc of room.npcs) {
          player.socket.write(colorize(`${npc.name}\r\n`, AnsiColor.Red));
        }
      }
      if (room.items && room.items.length > 0) {
        for( const item of room.items) {
          player.socket.write(colorize(`${item.description}\r\n`, AnsiColor.Magenta));
        }
      }
      const exitStrings = room.exits.map((exit) => `${exit.direction}`);
      player.socket.write(colorize(`Exits: ${exitStrings.join(', ')}\r\n`, AnsiColor.Yellow));
    } else {
      player.socket.write('An error occurred. The current room does not exist.\r\n');
    }
  }
  // TODO: move this to a separate file
  handleDropCommand(player: Player, args: string[]) {
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

    const currentRoom = this.rooms.get(player.currentRoom);

    if (!currentRoom) {
      player.socket.write(`Error: Current room ${player.currentRoom} not found.\r\n`);
      return;
    }

    player.inventory.removeItem(item);
    currentRoom.addItem(item);
    player.socket.write(`You drop ${item.name}.\r\n`);
    broadcastToRoom(`${player.name} drops ${item.name}.\r\n`, player, this.players);
  }
  // TODO: move this to a separate file
  handleGetCommand(player: Player, args: string[]) {
    if (args.length === 0) {
      player.socket.write('Get what?\r\n');
      return;
    }

    const itemName = args.join(' ');
    const currentRoom = this.rooms.get(player.currentRoom);

    if (!currentRoom) {
      player.socket.write(`Error: Current room ${player.currentRoom} not found.\r\n`);
      return;
    }

    const item = currentRoom.items.find((item) => item.name.toLowerCase() === itemName.toLowerCase());

    if (!item) {
      player.socket.write(`There is no ${itemName} here.\r\n`);
      return;
    }

    currentRoom.removeItem(item);
    player.inventory.addItem(item);
    player.socket.write(`You get ${item.description}.\r\n`);
    broadcastToRoom(`${player.name} gets ${item.description}.\r\n`, player, this.players);
  }
};

//TODO LIST
// Allow color switching mid-string
// Think about game state, how to save it, how to load it, how to reset it
// Refactor commands to be more modular