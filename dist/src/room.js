"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.Room = void 0;
class Room {
    constructor(id, title, description, exits = []) {
        this.id = id;
        this.title = title;
        this.description = description;
        this.exits = exits;
    }
    addExit(exit) {
        this.exits.push(exit);
    }
    findExit(direction) {
        const exit = this.exits.find((exit) => exit.direction === direction);
        return exit ? exit.roomId : null;
    }
}
exports.Room = Room;
