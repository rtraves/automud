import * as net from 'net';
import * as path from 'path';
import { Player } from './player';
import { Room } from './room';
import { CommandName, Command } from './command-parser';
import { AC, colorize } from './ansi-colors';
import { loadArea, findExitByDirection } from './area-utils';
import { broadcastToRoom, broadcastToAll } from './broadcast-utils';
import { Session } from './session';
import * as commands from './commands';

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
    const areaPath = path.join(__dirname, '..', 'areas', 'area1.yaml');
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
    }, 120000);
  }

  stop() {}

  gameTick() {
  
  }

  saveTick() {
    console.log('Saving players...');
    this.players.forEach((player) => {
      player.save();
    });
  }

  convertSessionToPlayer(session: Session, providedName: string, password: string): Player {
    const player = Player.createNewPlayer(providedName, password, session.socket);
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
        commands.handleMoveCommand(this, player, command);
        break;
      case CommandName.Kill:
        commands.handleKillCommand(this, player, command.args);
        break;
      case CommandName.Look:
        const room = this.rooms.get(player.currentRoom);
        commands.handleLookCommand(player,room);
        break;
      case CommandName.Quit:
        player.save();
        player.socket.write('Goodbye!\r\n');
        player.socket.end();
        break;
      case CommandName.Say:
        const roomMessage = `${AC.LightCyan}${player.name} says: ${command.args.join(' ')}${AC.Reset}\r\n`;
        player.socket.write(roomMessage);
        broadcastToRoom(roomMessage, player, this.players);
        break;
      case CommandName.Chat:
        const globalMessage = `${AC.LightRed}[Global] ${player.name}:${AC.White} ${command.args.join(' ')}${AC.Reset}\r\n`;
        broadcastToAll(globalMessage, this.players, player);
        break;
      case CommandName.Who:
        commands.handleWhoCommand(this, player);
        break;
      case CommandName.Inventory:
        commands.handleInventoryCommand(player);
        break;
      case CommandName.Help:
        commands.handleHelpCommand(player);
        break;
      case CommandName.Drop:
        commands.handleDropCommand(this, player, command.args);
        break;
      case CommandName.Get:
        commands.handleGetCommand(this, player, command.args);
        break;
      case CommandName.Colors:
        commands.handleColorsCommand(player);
        break;
      case CommandName.Goto:
        commands.gotoCommand(this, player, command.args);
        break;

      default:
        player.socket.write('Unknown command. Type `help` for a list of commands.\r\n');
    }
    player.socket.write('\n' + player.getPrompt());
  }
};