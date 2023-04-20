import * as net from 'net';
import * as fs from 'fs';
import * as path from 'path';
import * as crypto from 'crypto';
import { Player } from './player';
import { Room, Exit } from './room';
import { CommandName, parseCommand, Command } from './command-parser';
import { AnsiColor, colorize } from './ansi-colors';

interface User {
  username: string;
  password: string;
}


const PORT = parseInt(process.env.PORT as string, 10) || 3000;

const players: Map<string, Player> = new Map();
const rooms: Map<string, Room> = new Map();

const usersPath = path.join(__dirname, '..', 'users.json');
const users: User[] = JSON.parse(fs.readFileSync(usersPath, 'utf-8'));

function findUser(username: string): User | undefined {
  return users.find((user) => user.username.toLowerCase() === username.toLowerCase());
}

function hashPassword(password: string): string {
  const hash = crypto.createHash('sha256');
  hash.update(password);
  return hash.digest('hex');
}

function isValidPassword(user: User, password: string): boolean {
  return user.password === hashPassword(password);
}
function loadArea(areaPath: string): Map<string, Room> {
  const areaJson = fs.readFileSync(areaPath, 'utf-8');
  const areaData = JSON.parse(areaJson);

  const areaRooms: Map<string, Room> = new Map();

  for (const roomData of areaData.rooms) {
    const room = new Room(roomData.id, roomData.title, roomData.description, roomData.exits as Exit[]);
    areaRooms.set(room.id, room);
  }

  return areaRooms;
}

const areaPath = path.join(__dirname, '..', 'areas', 'area1.json');
const areaRooms = loadArea(areaPath);

for (const [roomId, room] of areaRooms.entries()) {
  rooms.set(roomId, room);
}

function findExitByDirection(room: Room, direction: string): Exit | undefined {
  return room.exits.find((exit) => exit.direction.startsWith(direction));
}
// Add a helper function to broadcast a message to players in the same room
function broadcastToRoom(message: string, sender: Player) {
  for (const otherPlayer of players.values()) {
    if (otherPlayer.currentRoom === sender.currentRoom && otherPlayer.id !== sender.id) {
      otherPlayer.socket.write(message);
    }
  }
}

// Add a helper function to broadcast a message to all connected players
function broadcastToAll(message: string, sender?: Player) {
  for (const otherPlayer of players.values()) {
      otherPlayer.socket.write(message);
  }
}

const server = net.createServer((socket) => {
  console.log('A user connected');

  // Assign a unique ID to each player
  const playerId = `${socket.remoteAddress}:${socket.remotePort}`;

  // Create a new player session with an initial room
  const player = new Player(playerId, 'area1_room1', socket);
  players.set(playerId, player);

  socket.write('Welcome to the MUD!\r\n');
  socket.write('Enter your name: ');

  let expectingName = true;
  let expectingPassword = false;

  socket.on('data', (data) => {
    const input = data.toString().trim();
  
    if (expectingName) {
      const user = findUser(input);
      if (user) {
        player.name = input;
        socket.write('Enter your password: ');
        expectingName = false;
        expectingPassword = true;
      } else {
        socket.write('Invalid username. Enter your name: ');
      }
    } else if (expectingPassword) {
      const user = findUser(player.name);
      if (user && isValidPassword(user, input)) {
        socket.write(`Hello, ${player.name}!\r\n`);
        expectingPassword = false;
      } else {
        socket.write('Invalid password. Enter your password: ');
      }
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
          broadcastToRoom(roomMessage, player);
          break;
        case CommandName.Chat:
          const globalMessage = `${AnsiColor.Red}[Global] ${player.name}: ${command.args.join(' ')}${AnsiColor.Reset}\r\n`;
          broadcastToAll(globalMessage, player);
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
  
