import * as net from 'net';
import * as fs from 'fs';
import * as path from 'path';
import { GameManager } from './game-manager'; 
import { CommandName, parseCommand, Command } from './command-parser';
import { AnsiColor, colorize } from './ansi-colors';
import { User } from './user-utils';
import { loadArea, findExitByDirection } from './area-utils';
import { broadcastToRoom, broadcastToAll } from './broadcast-utils';
import { handleLogin } from './login';

const PORT = parseInt(process.env.PORT as string, 10) || 3000;

const server = net.createServer((socket) => {
  console.log('A user connected');

  const gameManager = GameManager.getInstance();
  gameManager.start();
  const player = gameManager.createPlayer(socket);

  socket.write('Welcome to the MUD!\r\n');
  socket.write('Enter your username or type `new` to create a new user: ');

  socket.on('data', (data) => {
    const input = data.toString().trim();
    if (!player.isLoggedIn) {
      handleLogin(player, socket, input);
    } else {
      const command: Command = parseCommand(input);
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