"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || function (mod) {
    if (mod && mod.__esModule) return mod;
    var result = {};
    if (mod != null) for (var k in mod) if (k !== "default" && Object.prototype.hasOwnProperty.call(mod, k)) __createBinding(result, mod, k);
    __setModuleDefault(result, mod);
    return result;
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.isValidPassword = exports.hashPassword = exports.login = exports.addUser = exports.findUser = void 0;
const crypto = __importStar(require("crypto"));
const fs = __importStar(require("fs"));
const path = __importStar(require("path"));
const usersPath = path.join(__dirname, '..', 'users.json');
const users = Object.values(JSON.parse(fs.readFileSync(usersPath, 'utf-8')));
function findUser(username) {
    for (const user of users) {
        if (user.username === username) {
            return user;
        }
    }
    return undefined;
}
exports.findUser = findUser;
function addUser(username, password) {
    // Check if the username already exists
    if (findUser(username)) {
        throw new Error(`Username "${username}" already exists. Please choose a different username.`);
    }
    const hashedPassword = hashPassword(password);
    const newUser = {
        username: username,
        password: hashedPassword,
    };
    // Add the new user to the list of users
    users.push(newUser);
    // Save the updated list of users to the file
    fs.writeFileSync(usersPath, JSON.stringify(users), 'utf-8');
}
exports.addUser = addUser;
function login(username, password) {
    const user = findUser(username);
    if (!user) {
        return false; // User does not exist
    }
    return isValidPassword(user, password);
}
exports.login = login;
function hashPassword(password) {
    const hash = crypto.createHash('sha256');
    hash.update(password);
    return hash.digest('hex');
}
exports.hashPassword = hashPassword;
function isValidPassword(user, password) {
    return user.password === hashPassword(password);
}
exports.isValidPassword = isValidPassword;
