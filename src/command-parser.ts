export interface Command {
    name: string;
    args: string[];
  }
  
  export enum CommandName {
    Move = 'move',
    Look = 'look',
    Quit = 'quit',
    Say = 'say',
    Chat = 'chat',
    Who = 'who',
    Inventory = 'inventory',
  }
  
  export function parseCommand(input: string): Command {
    const words = input.split(/\s+/);
    const name = words[0].toLowerCase();
    const args = words.slice(1);
  
    switch (name) {
      case 'n':
      case 'north':
      case 'e':
      case 'east':
      case 's':
      case 'south':
      case 'w':
      case 'west':
        return { name: CommandName.Move, args: [name.charAt(0)] };
      case 'look':
      case 'l':
        return { name: CommandName.Look, args };
      case 'quit':
        return { name: CommandName.Quit, args};
      case 'say':
        return { name: CommandName.Say, args};
      case 'chat':
        return { name: CommandName.Chat, args};
      case 'who':
        return { name: CommandName.Who, args};
        case 'inventory':
        case 'inv':
        case 'i':
          return { name: CommandName.Inventory, args };

      default:
        return { name: '', args: [] };
    }
  }
  