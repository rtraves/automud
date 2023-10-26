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
    Kill = 'kill',
    Colors = 'colors',
    Score = 'score',
    Drink = 'drink',
    List = 'list',
    Buy = 'buy',
    Sell = 'sell',
    Fish = 'fish',
    Mine = 'mine',
    Chop = 'chop',
    Reload = 'reload', // Admin
    Restore = 'restore', // Admin
    Goto = 'goto', // Admin
  }
  // Admin Commands
  // reload (area)
  // shutdown (server)
  // broadcast (to all)
  // wizinvis (admin invis)

  // Builder Commands
  // ocreate, oedit, odelete (object)
  // rcreate, redit, rdelete (room)
  // mcreate, medit, mdelete (mob, npc)
  // link (rooms)
  // unlink (rooms)
  // add (item, npc) to (room)
  // remove (item, npc) from (room)
  // add, remove (item) to (npc)
  // etc
  
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
      case 'k':
      case 'kill':
        return { name: CommandName.Kill, args };
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
      case 'score':
      case 'sc':
        return { name: CommandName.Score, args};
      case 'restore':
        return { name: CommandName.Restore, args}; // Admin only
      case 'goto': //eventually restict to admin only
        return { name: CommandName.Goto, args};
      case 'reload':
        return { name: CommandName.Reload, args}; // Admin only
      case 'drink':
        return { name: CommandName.Drink, args};
      case 'list':
        return { name: CommandName.List, args};
      case 'buy':
        return { name: CommandName.Buy, args};
      case 'sell':
        return { name: CommandName.Sell, args};
      case 'fish':
        return { name: CommandName.Fish, args};
      case 'mine':
        return { name: CommandName.Mine, args};
      case 'chop':
        return { name: CommandName.Chop, args};
      default:
        return { name: '', args: [] };
    }
  }
  