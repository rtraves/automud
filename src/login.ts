// login.ts

import { Player } from './player';
import { findUser, addUser } from './user-utils';
import * as net from 'net';

export function handleLogin(player: Player, socket: net.Socket, input: string) {
  let expectingName = player.expectingName;
  let expectingPassword = player.expectingPassword;

  if (input === 'new') {
    socket.write('Enter your new username: ');
    expectingName = false;
  } else if (expectingName) {
    const user = findUser(input);
    if (user) {
      player.name = input;
      socket.write('Enter your password: ');
      expectingName = false;
      expectingPassword = true;
    } else {
      socket.write('Invalid Name. Enter your name: ');
      // Set the player's name to the new username for the new user creation process
      player.name = input;
      expectingName = false;
      expectingPassword = true;
    }
  } else if (expectingPassword) {
    // If expectingPassword is true, it means the user provided a password.
    // We will use the addUser function to create a new user in this section.
    const newPassword = input;
    try {
      addUser(player.name, newPassword);
      socket.write(`Hello, ${player.name}! Your account has been created.\r\n`);
    } catch (error: any) {
      socket.write(`${error.message}\r\n`);
    }
    expectingPassword = false;
  }

  player.expectingName = expectingName;
  player.expectingPassword = expectingPassword;
}