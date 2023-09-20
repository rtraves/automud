"use strict";
// item.ts
Object.defineProperty(exports, "__esModule", { value: true });
exports.Item = void 0;
class Item {
    constructor(id, name, description, value) {
        this.name = name;
        this.description = description;
        this.value = value;
        this.id = id;
    }
}
exports.Item = Item;
