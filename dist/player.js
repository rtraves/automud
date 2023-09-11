"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.Player = void 0;
class Player {
    constructor(id, currentRoom, socket) {
        this.id = id;
        this.name = '';
        this.currentRoom = currentRoom;
        this.inventory = [];
        this.disconnected = false;
        this.socket = socket;
        this.expectingName = true;
        this.expectingPassword = false;
        this.isLoggedIn = false;
        this.newPlayer = false;
    }
    addItem(item) {
        this.inventory.push(item);
    }
    removeItem(item) {
        const itemIndex = this.inventory.indexOf(item);
        if (itemIndex > -1) {
            this.inventory.splice(itemIndex, 1);
        }
    }
}
exports.Player = Player;
