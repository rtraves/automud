import * as net from 'net';
import { PlayerPersistence } from './index';
import { Player } from '../player/index';
import * as crypto from 'crypto';

export class AuthenticationService {
  static attemptLogin(name: string, password: string, socket: net.Socket): Player {
    const player = PlayerPersistence.load(name);
    if (player && player.password === this.hashPassword(password)) {
      player.socket = socket;
      return player;
    }
    else {
      throw new Error('Invalid username or password.');
    }
  }

  static hashPassword(password: string): string {
    const hash = crypto.createHash('sha256');
    hash.update(password);
    return hash.digest('hex');
  }
}