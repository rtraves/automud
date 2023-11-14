// login.ts

import { Player } from './player';
import * as net from 'net';
import { GameManager } from './game-manager';
import { Session } from './session';

export function handleLogin(session: Session, socket: net.Socket, input: string): Session | Player {
  const gameManager = GameManager.getInstance();

  switch (true) {
    case input === 'new':
      socket.write('Enter your new username: ');
      session.newPlayer = true;
      session.expectingName = true;
      break;
    case session.expectingName:
      if (session.newPlayer) {
        if (Player.playerExists(input)) {
          socket.write('Username already exists. Enter your new username: ');
        } else {
          socket.write('Create your password: ');
          session.providedName = input;
          session.expectingName = false;
          session.expectingPassword = true;
        }
      } else {
        if (Player.playerExists(input)) {
          session.providedName = input;
          socket.write('Enter your password: ');
          session.expectingName = false;
          session.expectingPassword = true;
        } else {
          socket.write('Invalid username. Enter your player username: ');
        }
      }
      break;
      case session.expectingPassword:
        const inputPassword = input;
        if (session.newPlayer) {
          const player = gameManager.convertSessionToPlayer(session, session.providedName!, inputPassword);
          socket.write(`Hello, ${player.name}! Your account has been created.\r\n`);
          return player; // Return the new Player instance
        } else {
          let existingPlayer = gameManager.players.get(session.providedName!);
          if (!existingPlayer) {
            existingPlayer = new Player(session.sessionId, 'area1_room1', socket);
            existingPlayer.name = session.providedName!;
          }
          if (existingPlayer.attemptLogin(existingPlayer.name, inputPassword, socket)) {
            existingPlayer.load(existingPlayer.name, socket);
            socket.write(`Welcome back, ${existingPlayer.name}!\r\n`);
            return existingPlayer; // Return the logged-in Player instance
          } else {
            socket.write(`Invalid username or password. Please try again.\r\n`);
            socket.write('Please enter your username: ');
            session.expectingName = true;
            session.expectingPassword = false;
          }
        }
        break;
  }
  return session; // Return the session if no conversion happened
}