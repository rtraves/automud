import * as net from 'net';
import * as fs from 'fs';
import * as path from 'path';
import { Player } from './player';
import { Room } from './room';
import { CommandName, parseCommand, Command } from './command-parser';
import { AnsiColor, colorize } from './ansi-colors';
import { User } from './user-utils';
import { loadArea, findExitByDirection } from './area-utils';
import { broadcastToRoom, broadcastToAll } from './broadcast-utils';
import { handleLogin } from './login';

const PORT = parseInt(process.env.PORT as string, 10) || 3000;

const players: Map<string, Player> = new Map();
const rooms: Map<string, Room> = new Map();

const usersPath = path.join(__dirname, '..', 'users.json');
const users: User[] = JSON.parse(fs.readFileSync(usersPath, 'utf-8'));

const areaPath = path.join(__dirname, '..', 'areas', 'area1.json');
const areaRooms = loadArea(areaPath);

for (const [roomId, room] of areaRooms.entries()) {
  rooms.set(roomId, room);
}

const server = net.createServer((socket) => {
  console.log('A user connected');

  // Assign a unique ID to each player
  const playerId = `${socket.remoteAddress}:${socket.remotePort}`;

  // Create a new player session with an initial room
  const player = new Player(playerId, 'area1_room1', socket);
  players.set(playerId, player);

  socket.write('Welcome to the MUD!\r\n');
  socket.write('Enter your username or type `new` to create a new user: ');

  socket.on('data', (data) => {
    const input = data.toString().trim();
    if (!player.isLoggedIn) {
      handleLogin(player, socket, input);
    } else {
      const command: Command = parseCommand(input);

      switch (command.name) {
        case CommandName.Move:
          const currentRoom = rooms.get(player.currentRoom);
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
          const room = rooms.get(player.currentRoom);
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
          broadcastToRoom(roomMessage, player, players);
          break;
        case CommandName.Chat:
          const globalMessage = `${AnsiColor.Red}[Global] ${player.name}: ${command.args.join(' ')}${AnsiColor.Reset}\r\n`;
          broadcastToAll(globalMessage, players, player);
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
