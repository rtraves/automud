import * as net from 'net';
import * as path from 'path';
import { Player } from './player';
import { Room } from './room';
import { CommandName, parseCommand, Command } from './command-parser';
import { AnsiColor, colorize } from './ansi-colors';
import { loadArea, findExitByDirection } from './area-utils';
import { broadcastToRoom, broadcastToAll } from './broadcast-utils';

export class GameManager {
  private static instance: GameManager;
  players: Map<string, Player>;
  rooms: Map<string, Room>;

  private constructor() {
    this.players = new Map();
    this.rooms = new Map();
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
  }

  stop() {}

  gameTick() {}

  createPlayer(socket: any) {
    // Assign a unique ID to each player
    const playerId = `${socket.remoteAddress}:${socket.remotePort}`;

    // Create a new player session with an initial room
    const player = new Player(playerId, 'area1_room1', socket);
    this.players.set(playerId, player);

    return player;
  }

  handleCommand(player: Player, socket: any, command: Command) {
    switch (command.name) {
      case CommandName.Move:
        this.handleMoveCommand(player, command);
        break;
      case CommandName.Look:
        const room = this.rooms.get(player.currentRoom);
        if (room) {
          socket.write(colorize(`${room.title}\r\n`, AnsiColor.Cyan));
          socket.write(colorize(`${room.description}\r\n`, AnsiColor.Green));
  
          const exitStrings = room.exits.map((exit) => `${exit.direction}`);
          socket.write(colorize(`Exits: ${exitStrings.join(', ')}\r\n`, AnsiColor.Yellow));
        } else {
          socket.write('An error occurred. The current room does not exist.\r\n');
        }
        break;
      case CommandName.Quit:
        player.disconnected = true;  
        socket.write('Goodbye!\r\n');
        socket.end();
      case CommandName.Say:
        const roomMessage = `${AnsiColor.LightBlue}${player.name} says: ${command.args.join(' ')}${AnsiColor.Reset}\r\n`;
        socket.write(roomMessage);
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
      case 'help':
        this.handleHelpCommand(player);
        break;
      default:
        // socket.write('Unknown command. Type `help` for a list of commands.\r\n');
        socket.write(`${AnsiColor.Reset}You said: ${command}\r\n`);
    }
  }
  // TODO: move this to a separa  te file
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

    player.currentRoom = newRoom.id;

    // Send the room description to the player's socket
    player.socket.write(colorize(`${newRoom.title}\r\n`, AnsiColor.Cyan));
    player.socket.write(colorize(`${newRoom.description}\r\n`, AnsiColor.Green));

    const exitStrings = newRoom.exits.map((exit) => `${exit.direction}`);
    player.socket.write(colorize(`Exits: ${exitStrings.join(', ')}\r\n`, AnsiColor.Yellow));
  }
  // TODO: move this to a separate file
  handleWhoCommand(player: Player) {
    const playerNames = Array.from(this.players.values()).map((p) => p.name).join(',\n');
    const message = `Players online:\n----------------------------\n${playerNames}\r\n`;
    player.socket.write(`${AnsiColor.Cyan}${message}${AnsiColor.Reset}`);
  }
  // TODO: move this to a separate file
  handleInventoryCommand(player: Player) {
    if (player.inventory.length === 0) {
      player.socket.write('You are not carrying anything.\r\n');
    } else {
      player.socket.write('You are carrying:\r\n');
      player.inventory.forEach((item) => {
        // TODO: colorize items and probably do something like item.name
        player.socket.write(`- ${item}\r\n`);
      });
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
  }
};

