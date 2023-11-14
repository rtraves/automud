import { Player } from "./player";

export function broadcastToRoom(message: string, sender: Player, players: Map<string, Player>) {
  for (const otherPlayer of players.values()) {
    if (otherPlayer.currentRoom === sender.currentRoom && otherPlayer.id !== sender.id) {
      otherPlayer.writeToSocket(message);
    }
  }
}

export function broadcastToAll(message: string, players: Map<string, Player>, sender?: Player) {
  for (const otherPlayer of players.values()) {
    otherPlayer.writeToSocket(message);
  }
}

export function sendToPlayer(player: Player, message: string) {
  player.writeToSocket(message);
}
