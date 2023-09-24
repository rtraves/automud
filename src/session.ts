// session.ts

import * as net from 'net';

export class Session {
  socket: net.Socket;
  newPlayer: boolean = false;
  expectingName: boolean = true;
  expectingPassword: boolean = false;
  providedName?: string;
  sessionId: string;

  constructor(socket: net.Socket) {
    this.socket = socket;
    this.sessionId = `${socket.remoteAddress}:${socket.remotePort}`;
  }
}
