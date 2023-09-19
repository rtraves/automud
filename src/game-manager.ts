import * as net from 'net';
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

    start() {}
    
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
          const currentRoom = this.rooms.get(player.currentRoom);
          if (currentRoom) {
            const direction = command.args[0];
            const exit = findExitByDirection(currentRoom, direction);

            if (exit) {
              player.currentRoom = exit.roomId;
              socket.write(`You move ${direction}.\r\n`);
            } else {
              socket.write(`There's no exit in that direction.\r\n`);
            }
          } else {
            socket.write('An error occurred. The current room does not exist.\r\n');
          }
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
          const roomMessage = `${player.name} says: ${command.args.join(' ')}\r\n`;
          socket.write(roomMessage);
          broadcastToRoom(roomMessage, player, this.players);
          break;
        case CommandName.Chat:
          const globalMessage = `${AnsiColor.Red}[Global] ${player.name}: ${command.args.join(' ')}${AnsiColor.Reset}\r\n`;
          broadcastToAll(globalMessage, this.players, player);
          break;
        default:
          socket.write(`You said: ${command}\r\n`);
        }
    }
}