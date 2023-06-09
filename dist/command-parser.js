"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.parseCommand = exports.CommandName = void 0;
var CommandName;
(function (CommandName) {
    CommandName["Move"] = "move";
    CommandName["Look"] = "look";
    CommandName["Quit"] = "quit";
    CommandName["Say"] = "say";
    CommandName["Chat"] = "chat";
})(CommandName = exports.CommandName || (exports.CommandName = {}));
function parseCommand(input) {
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
            return { name: CommandName.Quit, args };
        case 'say':
            return { name: CommandName.Say, args };
        case 'chat':
            return { name: CommandName.Chat, args };
        default:
            return { name: '', args: [] };
    }
}
exports.parseCommand = parseCommand;
