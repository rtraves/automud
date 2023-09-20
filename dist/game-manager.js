"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || function (mod) {
    if (mod && mod.__esModule) return mod;
    var result = {};
    if (mod != null) for (var k in mod) if (k !== "default" && Object.prototype.hasOwnProperty.call(mod, k)) __createBinding(result, mod, k);
    __setModuleDefault(result, mod);
    return result;
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.GameManager = void 0;
const path = __importStar(require("path"));
const player_1 = require("./player");
const command_parser_1 = require("./command-parser");
const ansi_colors_1 = require("./ansi-colors");
const area_utils_1 = require("./area-utils");
const broadcast_utils_1 = require("./broadcast-utils");
class GameManager {
    constructor() {
        this.players = new Map();
        this.rooms = new Map();
    }
    static getInstance() {
        if (!GameManager.instance) {
            GameManager.instance = new GameManager();
        }
        return GameManager.instance;
    }
    start() {
        const areaPath = path.join(__dirname, '..', 'areas', 'area1.json');
        const areaRooms = (0, area_utils_1.loadArea)(areaPath);
        for (const [roomId, room] of areaRooms.entries()) {
            this.rooms.set(roomId, room);
        }
    }
    stop() { }
    gameTick() { }
    createPlayer(socket) {
        // Assign a unique ID to each player
        const playerId = `${socket.remoteAddress}:${socket.remotePort}`;
        // Create a new player session with an initial room
        const player = new player_1.Player(playerId, 'area1_room1', socket);
        this.players.set(playerId, player);
        return player;
    }
    handleCommand(player, socket, command) {
        switch (command.name) {
            case command_parser_1.CommandName.Move:
                this.handleMoveCommand(player, command);
                break;
            case command_parser_1.CommandName.Look:
                const room = this.rooms.get(player.currentRoom);
                if (room) {
                    socket.write((0, ansi_colors_1.colorize)(`${room.title}\r\n`, ansi_colors_1.AnsiColor.Cyan));
                    socket.write((0, ansi_colors_1.colorize)(`${room.description}\r\n`, ansi_colors_1.AnsiColor.Green));
                    const exitStrings = room.exits.map((exit) => `${exit.direction}`);
                    socket.write((0, ansi_colors_1.colorize)(`Exits: ${exitStrings.join(', ')}\r\n`, ansi_colors_1.AnsiColor.Yellow));
                }
                else {
                    socket.write('An error occurred. The current room does not exist.\r\n');
                }
                break;
            case command_parser_1.CommandName.Quit:
                player.disconnected = true;
                socket.write('Goodbye!\r\n');
                socket.end();
            case command_parser_1.CommandName.Say:
                const roomMessage = `${ansi_colors_1.AnsiColor.LightBlue}${player.name} says: ${command.args.join(' ')}${ansi_colors_1.AnsiColor.Reset}\r\n`;
                socket.write(roomMessage);
                (0, broadcast_utils_1.broadcastToRoom)(roomMessage, player, this.players);
                break;
            case command_parser_1.CommandName.Chat:
                const globalMessage = `${ansi_colors_1.AnsiColor.Red}[Global] ${player.name}: ${command.args.join(' ')}${ansi_colors_1.AnsiColor.Reset}\r\n`;
                (0, broadcast_utils_1.broadcastToAll)(globalMessage, this.players, player);
                break;
            case command_parser_1.CommandName.Who:
                this.handleWhoCommand(player);
                break;
            case command_parser_1.CommandName.Inventory:
                this.handleInventoryCommand(player);
                break;
            case 'help':
                this.handleHelpCommand(player);
                break;
            default:
                // socket.write('Unknown command. Type `help` for a list of commands.\r\n');
                socket.write(`${ansi_colors_1.AnsiColor.Reset}You said: ${command}\r\n`);
        }
    }
    // TODO: move this to a separa  te file
    handleMoveCommand(player, command) {
        const currentRoom = this.rooms.get(player.currentRoom);
        if (!currentRoom) {
            player.socket.write(`Error: Current room ${player.currentRoom} not found.\r\n`);
            return;
        }
        const exit = (0, area_utils_1.findExitByDirection)(currentRoom, command.args[0]);
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
        player.socket.write((0, ansi_colors_1.colorize)(`${newRoom.title}\r\n`, ansi_colors_1.AnsiColor.Cyan));
        player.socket.write((0, ansi_colors_1.colorize)(`${newRoom.description}\r\n`, ansi_colors_1.AnsiColor.Green));
        const exitStrings = newRoom.exits.map((exit) => `${exit.direction}`);
        player.socket.write((0, ansi_colors_1.colorize)(`Exits: ${exitStrings.join(', ')}\r\n`, ansi_colors_1.AnsiColor.Yellow));
    }
    // TODO: move this to a separate file
    handleWhoCommand(player) {
        const playerNames = Array.from(this.players.values()).map((p) => p.name).join(',\n');
        const message = `Players online:\n----------------------------\n${playerNames}\r\n`;
        player.socket.write(`${ansi_colors_1.AnsiColor.Cyan}${message}${ansi_colors_1.AnsiColor.Reset}`);
    }
    // TODO: move this to a separate file
    handleInventoryCommand(player) {
        if (player.inventory.length === 0) {
            player.socket.write('You are not carrying anything.\r\n');
        }
        else {
            player.socket.write('You are carrying:\r\n');
            player.inventory.forEach((item) => {
                // TODO: colorize items and probably do something like item.name
                player.socket.write(`- ${item}\r\n`);
            });
        }
    }
    // TODO: move this to a separate file
    handleHelpCommand(player) {
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
}
exports.GameManager = GameManager;
;
