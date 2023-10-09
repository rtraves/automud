export enum AC {
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
  DarkGray = '\x1b[90m',
}
const colorCodes: { [code: string]: string } = {
    "&r": "\x1b[31m", // Red
    "&g": "\x1b[32m", // Green
    "&*": "\x1b[0m",  // Reset to default
    "&y": "\x1b[33m", // Yellow
    "&b": "\x1b[34m", // Blue
    "&p": "\x1b[35m", // Purple
    "&c": "\x1b[36m", // Cyan
    "&w": "\x1b[37m", // White
    "&W": "\x1b[1m\x1b[37m", // Bright White
    "&B": "\x1b[94m", // Light Blue
    "&G": "\x1b[92m", // Light Green
    "&C": "\x1b[96m", // Light Cyan
    "&R": "\x1b[91m", // Light Red
    "&P": "\x1b[95m", // Light Purple
    "&Y": "\x1b[93m", // Light Yellow
};
  
export function colorize(text: string, color: AC): string {
  return color + text + AC.Reset;
}

export function colorizeString(input: string): string {
  for (const code in colorCodes) {
      const regex = new RegExp(code, "g");
      input = input.replace(regex, colorCodes[code]);
  }
  return input;
}

  