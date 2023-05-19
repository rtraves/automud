"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.broadcastToAll = exports.broadcastToRoom = void 0;
function broadcastToRoom(message, sender, players) {
    for (const otherPlayer of players.values()) {
        if (otherPlayer.currentRoom === sender.currentRoom && otherPlayer.id !== sender.id) {
            otherPlayer.socket.write(message);
        }
    }
}
exports.broadcastToRoom = broadcastToRoom;
function broadcastToAll(message, players, sender) {
    for (const otherPlayer of players.values()) {
        otherPlayer.socket.write(message);
    }
}
exports.broadcastToAll = broadcastToAll;
