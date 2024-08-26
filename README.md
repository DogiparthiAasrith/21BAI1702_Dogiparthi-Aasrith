# 21BAI1702_Dogiparthi-Aasrith

## Piece Movement Game

This is a simple, web-based, turn-based chess game where two players can compete against each other in real time using WebSockets. Players can create or join a game session, take turns, and make strategic moves on the board to win the game.

### Setup Instructions

#### Setting Up the Server

1. **Install Node.js:** Ensure that Node.js is installed on your system.
2. **Create Project Directory:** Create a new directory for the project named `Hitwicket` by running the command `mkdir Hitwicket`.
3. **Initialize Node Project:** Navigate to the `Hitwicket` directory and run `npm init -y` to generate a `package.json` file and install the necessary node modules.
4. **Install Required Packages:** Run `npm install express websocket` to install the `express` and `websocket` packages, which will be used to create the web server and manage WebSocket connections.
5. **Create Server File:** In the `Hitwicket` directory, create a file named `server.js` and add the server-side code. This code will set up an HTTP server to serve the HTML file and a WebSocket server to manage real-time communication between clients.
6. **Run the Server:** Start the server by running the command `node server.js` in the terminal. The server will start listening on HTTP port 9091 for serving the HTML requests and WebSocket port 9090 for managing game communication.

#### Setting Up the Client

1. **Create Client File:** In the same directory where `server.js` is located, create a file named `client.html`.
2. **User Interface:** Add the HTML code to `client.html`, which will serve as the user interface for the game.
3. **Debugging:** When you start debugging, the web page will open, allowing players to create or join game sessions.

### Running the Game

1. **Open Two Tabs:** Open the game in two separate tabs since the game is designed for two players.
2. **Start a New Game:** In one tab, click the "New Game" button in the client interface. This action generates a unique Game ID, which you can copy and paste into the other tab before clicking the "Join Game" button.
3. **Taking Turns:** Once both players have joined, they can start playing by entering their moves in the input field provided on the client page.
4. **Input Format:** Enter moves in the format "Piece:Direction". For example, 'P1:F' moves pawn 1 one step forward, or 'H2:BL' moves Hero 2 two steps diagonally backward-left. Click "Submit" to register the move.
5. **Real-Time Updates:** The board will update in real time as players make their moves, and the prompt will display whose turn it is.
6. **Winning the Game:** When one player captures all of the opponent's pieces, a message will appear declaring that player as the winner. Players can then start a new game.

This streamlined guide ensures that the game setup and gameplay are easy to follow and enjoy.
