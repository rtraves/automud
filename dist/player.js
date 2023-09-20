"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.Player = void 0;
class Player {
    constructor(id, currentRoom, socket) {
        this.id = id;
        this.name = '';
        this.currentRoom = currentRoom;
        this.inventory = {
            items: [],
            addItem(item) {
                this.items.push(item);
            },
            removeItem(item) {
                const itemIndex = this.items.findIndex((i) => i.id === item.id);
                if (itemIndex > -1) {
                    this.items.splice(itemIndex, 1);
                }
            },
            get length() {
                return this.items.length;
            },
            findItem(itemName) {
                return this.items.find((item) => item.name.toLowerCase() === itemName.toLowerCase());
            }
        };
        this.disconnected = false;
        this.socket = socket;
        this.expectingName = true;
        this.expectingPassword = false;
        this.isLoggedIn = false;
        this.newPlayer = false;
    }
}
exports.Player = Player;
