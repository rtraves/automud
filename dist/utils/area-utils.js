"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || function (mod) {
    if (mod && mod.__esModule) return mod;
    var result = {};
    if (mod != null) for (var k in mod) if (k !== "default" && Object.prototype.hasOwnProperty.call(mod, k)) __createBinding(result, mod, k);
    __setModuleDefault(result, mod);
    return result;
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.findExitByDirection = exports.loadArea = void 0;
const fs = __importStar(require("fs"));
const room_1 = require("../src/room");
function loadArea(areaPath) {
    const areaJson = fs.readFileSync(areaPath, 'utf-8');
    const areaData = JSON.parse(areaJson);
    const areaRooms = new Map();
    for (const roomData of areaData.rooms) {
        const room = new room_1.Room(roomData.id, roomData.title, roomData.description, roomData.exits);
        areaRooms.set(room.id, room);
    }
    return areaRooms;
}
exports.loadArea = loadArea;
function findExitByDirection(room, direction) {
    return room.exits.find((exit) => exit.direction.startsWith(direction));
}
exports.findExitByDirection = findExitByDirection;
