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
const net = __importStar(require("net"));
const fs = __importStar(require("fs"));
const path = __importStar(require("path"));
const player_1 = require("./player");
const command_parser_1 = require("./command-parser");
const ansi_colors_1 = require("./ansi-colors");
const user_utils_1 = require("../utils/user-utils");
const area_utils_1 = require("../utils/area-utils");
const broadcast_utils_1 = require("../utils/broadcast-utils");
const PORT = parseInt(process.env.PORT, 10) || 3000;
const players = new Map();
const rooms = new Map();
const usersPath = path.join(__dirname, '..', 'users.json');
const users = JSON.parse(fs.readFileSync(usersPath, 'utf-8'));
const areaPath = path.join(__dirname, '..', 'areas', 'area1.json');
const areaRooms = (0, area_utils_1.loadArea)(areaPath);
for (const [roomId, room] of areaRooms.entries()) {
    rooms.set(roomId, room);
}
const server = net.createServer((socket) => {
    console.log('A user connected');
    // Assign a unique ID to each player
    const playerId = `${socket.remoteAddress}:${socket.remotePort}`;
    // Create a new player session with an initial room
    const player = new player_1.Player(playerId, 'area1_room1', socket);
    players.set(playerId, player);
    socket.write('Welcome to the MUD!\r\n');
    socket.write('Enter your name: ');
    let expectingName = true;
    let expectingPassword = false;
    socket.on('data', (data) => {
        const input = data.toString().trim();
        if (expectingName) {
            const user = (0, user_utils_1.findUser)(input);
            if (user) {
                player.name = input;
                socket.write('Enter your password: ');
                expectingName = false;
                expectingPassword = true;
            }
            else {
                socket.write('Invalid username. Enter your name: ');
            }
        }
        else if (expectingPassword) {
            const user = (0, user_utils_1.findUser)(player.name);
            if (user && (0, user_utils_1.isValidPassword)(user, input)) {
                socket.write(`Hello, ${player.name}!\r\n`);
                expectingPassword = false;
            }
            else {
                socket.write('Invalid password. Enter your password: ');
            }
        }
        else {
            const command = (0, command_parser_1.parseCommand)(input);
            switch (command.name) {
                case command_parser_1.CommandName.Move:
                    const currentRoom = rooms.get(player.currentRoom);
                    if (currentRoom) {
                        const direction = command.args[0];
                        const exit = (0, area_utils_1.findExitByDirection)(currentRoom, direction);
                        if (exit) {
                            player.currentRoom = exit.roomId;
                            socket.write(`You move ${direction}.\r\n`);
                        }
                        else {
                            socket.write(`There's no exit in that direction.\r\n`);
                        }
                    }
                    else {
                        socket.write('An error occurred. The current room does not exist.\r\n');
                    }
                    break;
                case command_parser_1.CommandName.Look:
                    const room = rooms.get(player.currentRoom);
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
                    const roomMessage = `${player.name} says: ${command.args.join(' ')}\r\n`;
                    socket.write(roomMessage);
                    (0, broadcast_utils_1.broadcastToRoom)(roomMessage, player, players);
                    break;
                case command_parser_1.CommandName.Chat:
                    const globalMessage = `${ansi_colors_1.AnsiColor.Red}[Global] ${player.name}: ${command.args.join(' ')}${ansi_colors_1.AnsiColor.Reset}\r\n`;
                    (0, broadcast_utils_1.broadcastToAll)(globalMessage, players, player);
                    break;
                default:
                    socket.write(`You said: ${input}\r\n`);
            }
        }
    });
    socket.on('end', () => {
        console.log(`A user (${player.name}) disconnected`);
        players.delete(playerId);
    });
    socket.on('error', (err) => {
        console.error(`Socket error: ${err.message}`);
    });
});
server.listen(PORT, () => {
    console.log(`Telnet server is running on port ${PORT}`);
});
