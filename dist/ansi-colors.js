"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.colorize = exports.AnsiColor = void 0;
var AnsiColor;
(function (AnsiColor) {
    AnsiColor["Reset"] = "\u001B[0m";
    AnsiColor["Black"] = "\u001B[30m";
    AnsiColor["Red"] = "\u001B[31m";
    AnsiColor["Green"] = "\u001B[32m";
    AnsiColor["Yellow"] = "\u001B[33m";
    AnsiColor["Blue"] = "\u001B[34m";
    AnsiColor["Magenta"] = "\u001B[35m";
    AnsiColor["Cyan"] = "\u001B[36m";
    AnsiColor["White"] = "\u001B[37m";
    AnsiColor["Purple"] = "\u001B[35m";
    AnsiColor["LightBlue"] = "\u001B[94m";
})(AnsiColor || (exports.AnsiColor = AnsiColor = {}));
function colorize(text, color) {
    return color + text + AnsiColor.Reset;
}
exports.colorize = colorize;
