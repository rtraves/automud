"use strict";
// login.ts
Object.defineProperty(exports, "__esModule", { value: true });
exports.handleLogin = void 0;
const user_utils_1 = require("./user-utils");
function handleLogin(player, socket, input) {
    switch (true) {
        case input === 'new':
            socket.write('Enter your new username: ');
            player.newPlayer = true;
            player.expectingName = true;
            break;
        case player.expectingName:
            const user = (0, user_utils_1.findUser)(input);
            if (player.newPlayer) {
                if (user) {
                    socket.write('Username already exists. Enter your new username: ');
                }
                else {
                    socket.write('Create your password: ');
                    player.name = input;
                    player.expectingName = false;
                    player.expectingPassword = true;
                }
            }
            else {
                if (user) {
                    player.name = input;
                    socket.write('Enter your password: ');
                    player.expectingName = false;
                    player.expectingPassword = true;
                }
                else {
                    socket.write('Invalid username. Enter your player username: ');
                }
            }
            break;
        case player.expectingPassword:
            // If expectingPassword is true, it means the user provided a password.
            // We will use the addUser function to create a new user in this section.
            const inputPassword = input;
            try {
                if (player.newPlayer) {
                    (0, user_utils_1.addUser)(player.name, inputPassword);
                    socket.write(`Hello, ${player.name}! Your account has been created.\r\n`);
                    player.newPlayer = false;
                    player.expectingPassword = false;
                    player.isLoggedIn = true;
                }
                else {
                    var attemptLogin = (0, user_utils_1.login)(player.name, inputPassword);
                    if (attemptLogin) {
                        socket.write(`Welcome back, ${player.name}!\r\n`);
                        player.expectingPassword = false;
                        player.isLoggedIn = true;
                    }
                    else {
                        socket.write(`Invalid username or password. Please try again.\r\n`);
                        socket.write('Enter your new username: ');
                        player.expectingName = true;
                        player.expectingPassword = false;
                    }
                }
            }
            catch (error) {
                socket.write(`${error.message}\r\n`);
            }
            break;
    }
}
exports.handleLogin = handleLogin;
