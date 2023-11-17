import * as net from 'net';
import { GameManager } from './game-manager';
import { parseCommand, Command } from './command-parser';
import { handleLogin } from './login';
import { Session } from './session';
import { Player } from './player/player';
import { handleLookCommand } from './commands';
import { AC } from './services/ansi-colors';

const PORT = parseInt(process.env.PORT as string, 10) || 4444;
const gameManager = GameManager.getInstance();
gameManager.start();

const server = net.createServer((socket) => {
  console.log('A user connected: ' + socket.remoteAddress + ':' + socket.remotePort);

  let sessionOrPlayer: Session | Player = gameManager.initSession(socket);

  socket.write(`${AC.Cyan}Welcome to the MUD!${AC.Reset}\r\n`);
  socket.write(`Enter your ${AC.LightYellow}username${AC.Reset} or type ${AC.LightGreen}'new' ${AC.Reset}to create a new user: `);

  socket.on('data', (data) => {
    const input = data.toString().trim();

    if (sessionOrPlayer instanceof Session) {
      sessionOrPlayer = handleLogin(sessionOrPlayer, socket, input);
      if (sessionOrPlayer instanceof Player) {
        gameManager.players.set(sessionOrPlayer.name, sessionOrPlayer);
        handleLookCommand(sessionOrPlayer, gameManager.rooms.get(sessionOrPlayer.currentRoom)!);
        sessionOrPlayer.writeToSocket('\n' + sessionOrPlayer.getPrompt());
      }
    } else if (sessionOrPlayer instanceof Player) {
      const command: Command = parseCommand(input);
      gameManager.handleCommand(sessionOrPlayer, command);
    }
  });

  socket.on('end', () => {
    if (sessionOrPlayer instanceof Player) {
      console.log(`A user (${sessionOrPlayer.name}) disconnected`);
      gameManager.commandTimeouts.delete(sessionOrPlayer.name);
      gameManager.players.delete(sessionOrPlayer.id);
    } else {
      console.log('A user disconnected before logging in.');
    }
  });

  socket.on('error', (err) => {
    console.error(`Socket error: ${err.message}`);
  });
});

server.listen(PORT, () => {
  console.log(`Telnet server is running on port ${PORT}`);
});