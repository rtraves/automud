import * as crypto from 'crypto';
import * as fs from 'fs';
import * as path from 'path';

export interface User {
  username: string;
  password: string;
}

const usersPath = path.join(__dirname, '..', 'users.json');
const users: User[] = Object.values(JSON.parse(fs.readFileSync(usersPath, 'utf-8')));

export function findUser(username:string): User | undefined {
  for (const user of users) {
    if (user.username === username) {
      return user;
    }
  }
  return undefined;
}

export function addUser(username: string, password: string): void {
  // Check if the username already exists
  if (findUser(username)) {
    throw new Error(`Username "${username}" already exists. Please choose a different username.`);
  }

  const hashedPassword = hashPassword(password);
  const newUser: User = {
    username: username,
    password: hashedPassword,
  };

  // Add the new user to the list of users
  users.push(newUser);

  // Save the updated list of users to the file
  fs.writeFileSync(usersPath, JSON.stringify(users), 'utf-8');
}

export function hashPassword(password: string): string {
  const hash = crypto.createHash('sha256');
  hash.update(password);
  return hash.digest('hex');
}

export function isValidPassword(user: User, password: string): boolean {
  return user.password === hashPassword(password);
}
