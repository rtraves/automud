"use strict";
// login.ts
Object.defineProperty(exports, "__esModule", { value: true });
exports.handleLogin = void 0;
const user_utils_1 = require("./user-utils");
function handleLogin(player, socket, input) {
    switch (true) {
        case input === 'new':
            socket.write('Enter your new username: ');
            player.expectingName = false;
            break;
        case player.expectingName:
            const user = (0, user_utils_1.findUser)(input);
            if (user) {
                player.name = input;
                socket.write('Enter your password: ');
                player.expectingName = false;
                player.expectingPassword = true;
            }
            else {
                socket.write('Invalid Name. Enter your name: ');
                // Set the player's name to the new username for the new user creation process
                player.name = input;
                player.expectingName = false;
                player.expectingPassword = true;
            }
            break;
        case player.expectingPassword:
            try {
                // need to clean if its not a new user prob dont need to add also need password check
                (0, user_utils_1.addUser)(player.name, input);
                socket.write(`Hello, ${player.name}! Your account has been created.\r\n`);
                player.expectingPassword = false;
                player.isLoggedIn = true;
            }
            catch (error) {
                socket.write(`${error.message}\r\n`);
            }
            break;
    }
}
exports.handleLogin = handleLogin;
