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
    Help = 'help',
    Drop = 'drop',
    Get = 'get',
    Colors = 'colors',
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
      case 'u':
      case 'up':
      case 'd':
      case 'down':
        return { name: CommandName.Move, args: [name.charAt(0)] };
      case 'look':
      case 'l':
      case 'ls':
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
      case 'help':
        return { name: CommandName.Help, args };
      case 'get':
      case 'take':
        return { name: CommandName.Get, args };
      case 'drop':
        return { name: CommandName.Drop, args };
      case 'colors':
        return { name: CommandName.Colors, args};
      default:
        return { name: '', args: [] };
    }
  }
  