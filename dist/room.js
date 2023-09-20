"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.Room = void 0;
class Room {
    constructor(id, title, description, exits, items) {
        this.id = id;
        this.title = title;
        this.description = description;
        this.exits = exits;
        this.items = items;
    }
    addExit(exit) {
        this.exits.push(exit);
    }
    findExit(direction) {
        const exit = this.exits.find((exit) => exit.direction === direction);
        return exit ? exit.roomId : null;
    }
    addItem(item) {
        this.items.push(item);
    }
    removeItem(item) {
        const itemIndex = this.items.findIndex((i) => i.id === item.id);
        if (itemIndex > -1) {
            this.items.splice(itemIndex, 1);
        }
    }
}
exports.Room = Room;
