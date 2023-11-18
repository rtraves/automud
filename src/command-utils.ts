import { GameManager } from "./game-manager";
import { Player } from "./player";

export function getCurrentRoom(gameManager: GameManager, player: Player) {
    const currentRoom = gameManager.rooms.get(player.currentRoom);
    if (!currentRoom) {
      player.writeToSocket(`Error: Current room ${player.currentRoom} not found.\r\n`);
      return null;
    }
    return currentRoom;
}

export function checkPlayerInventory(player: Player, itemName: string): boolean {
    const item = player.inventory.findItem(itemName);
    if (!item) {
      player.writeToSocket(`You do not have ${itemName}`);
      return false;
    }
    return true;
}

  