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
const game_manager_1 = require("./game-manager");
const command_parser_1 = require("./command-parser");
const login_1 = require("./login");
const PORT = parseInt(process.env.PORT, 10) || 3000;
const server = net.createServer((socket) => {
    console.log('A user connected');
    const gameManager = game_manager_1.GameManager.getInstance();
    gameManager.start();
    const player = gameManager.createPlayer(socket);
    socket.write('Welcome to the MUD!\r\n');
    socket.write('Enter your username or type `new` to create a new user: ');
    socket.on('data', (data) => {
        const input = data.toString().trim();
        if (!player.isLoggedIn) {
            (0, login_1.handleLogin)(player, socket, input);
        }
        else {
            const command = (0, command_parser_1.parseCommand)(input);
            gameManager.handleCommand(player, socket, command);
        }
    });
    socket.on('end', () => {
        console.log(`A user (${player.name}) disconnected`);
        gameManager.players.delete(player.id);
    });
    socket.on('error', (err) => {
        console.error(`Socket error: ${err.message}`);
    });
});
server.listen(PORT, () => {
    console.log(`Telnet server is running on port ${PORT}`);
});
