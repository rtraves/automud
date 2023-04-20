import { Player } from "../src/player";

export function broadcastToRoom(message: string, sender: Player, players: Map<string, Player>) {
  for (const otherPlayer of players.values()) {
    if (otherPlayer.currentRoom === sender.currentRoom && otherPlayer.id !== sender.id) {
      otherPlayer.socket.write(message);
    }
  }
}

export function broadcastToAll(message: string, players: Map<string, Player>, sender?: Player) {
  for (const otherPlayer of players.values()) {
    otherPlayer.socket.write(message);
  }
}
