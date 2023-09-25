import * as net from 'net';
import { GameManager } from './game-manager';
import { parseCommand, Command } from './command-parser';
import { handleLogin } from './login';
import { Session } from './session';
import { Player } from './player';

const PORT = parseInt(process.env.PORT as string, 10) || 4444;
const gameManager = GameManager.getInstance();
gameManager.start();

const server = net.createServer((socket) => {
  console.log('A user connected');

  let sessionOrPlayer: Session | Player = gameManager.initSession(socket);

  socket.write('Welcome to the MUD!\r\n');
  socket.write('Enter your username or type `new` to create a new user: ');

  socket.on('data', (data) => {
    const input = data.toString().trim();

    if (sessionOrPlayer instanceof Session) {
      sessionOrPlayer = handleLogin(sessionOrPlayer, socket, input);
      if (sessionOrPlayer instanceof Player) {
        gameManager.players.set(sessionOrPlayer.id, sessionOrPlayer);
        gameManager.handleLookCommand(sessionOrPlayer, gameManager.rooms.get(sessionOrPlayer.currentRoom)!);
      }        
    } else if (sessionOrPlayer instanceof Player) {
      const command: Command = parseCommand(input);
      gameManager.handleCommand(sessionOrPlayer, command);
    }
  });

  socket.on('end', () => {
    if (sessionOrPlayer instanceof Player) {
      console.log(`A user (${sessionOrPlayer.name}) disconnected`);
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
