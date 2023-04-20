export interface Exit {
    direction: string;
    roomId: string;
  }
  
  export class Room {
    id: string;
    title: string;
    description: string;
    exits: Exit[];
  
    constructor(id: string, title: string, description: string, exits: Exit[] = []) {
      this.id = id;
      this.title = title;
      this.description = description;
      this.exits = exits;
    }
  
    addExit(exit: Exit): void {
      this.exits.push(exit);
    }
  
    findExit(direction: string): string | null {
      const exit = this.exits.find((exit) => exit.direction === direction);
      return exit ? exit.roomId : null;
    }
  }
  