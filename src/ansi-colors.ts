export enum AnsiColor {
    Reset = '\x1b[0m',
    Black = '\x1b[30m',
    Red = '\x1b[31m',
    Green = '\x1b[32m',
    Yellow = '\x1b[33m',
    Blue = '\x1b[34m',
    Purple = '\x1b[35m',
    Cyan = '\x1b[36m',
    White = '\x1b[37m',
    BrightWhite = '\x1b[1m\x1b[37m',
    LightBlue = '\x1b[94m',
    LightGreen = '\x1b[92m',
    LightCyan = '\x1b[96m',
    LightRed = '\x1b[91m',
    LightPurple = '\x1b[95m',
    LightYellow = '\x1b[93m',
  }
  
  export function colorize(text: string, color: AnsiColor): string {
    return color + text + AnsiColor.Reset;
  }
  