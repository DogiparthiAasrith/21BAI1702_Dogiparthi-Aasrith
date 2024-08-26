const http = require("http");
const express = require("express");
const app = express();

// Serve the static HTML file on the root route
app.get("/", (req, res) => res.sendFile(__dirname + "/index.html"));
app.listen(9091, () => console.log("Listening on HTTP port 9091"));

// Import the WebSocket server module and create an HTTP server for WebSocket connections
const websocketServer = require("websocket").server;
const httpServer = http.createServer();
httpServer.listen(9090, () => console.log("Listening on WebSocket port 9090"));

const clients = {}; // Object to store connected clients
const games = {};   // Object to store active games

// Set up the WebSocket server
const wsServer = new websocketServer({
    "httpServer": httpServer
});

// Handle incoming WebSocket connection requests
wsServer.on("request", request => {
    const connection = request.accept(null, request.origin); // Accept the connection

    // Handle connection events
    connection.on("open", () => console.log("opened!"));  // Log when connection opens
    connection.on("close", () => console.log("closed!")); // Log when connection closes

    // Handle incoming messages from clients
    connection.on("message", message => {
        const result = JSON.parse(message.utf8Data); // Parse the incoming message

        // Handle 'create' game request
        if (result.method === "create") {
            const clientId = result.clientId;
            const gameId = guid(); // Generate a unique game ID
            const state = initializeBoard(); // Initialize the game board
            games[gameId] = {
                "id": gameId,
                "clients": [],
                "state": state,
                "currentPlayer": "A"
            };

            const payLoad = {
                "method": "create",
                "game": games[gameId]
            };

            const con = clients[clientId].connection; // Get the client's connection
            con.send(JSON.stringify(payLoad)); // Send game creation confirmation to the client
        }

        // Handle 'join' game request
        if (result.method === "join") {
            const clientId = result.clientId;
            const gameId = result.gameId;
            const game = games[gameId];
            game.clients.push(clientId); // Add the client to the game

            const payLoad = {
                "method": "join",
                "game": game
            };

            // Notify all clients in the game that a player has joined
            game.clients.forEach(cId => {
                clients[cId].connection.send(JSON.stringify(payLoad));
            });

            // Start the game if two players have joined
            if (game.clients.length === 2) {
                notifyTurn(gameId);    // Notify players whose turn it is
                updateGameState(gameId); // Update the game state for all clients
            }
        }

        // Handle 'play' (move submission) request
        if (result.method === "play") {
            const gameId = result.gameId;
            const game = games[gameId];
            const move = result.move;

            // Validate the move
            if (validateMove(move, game)) {
                applyMove(move, game); // Apply the move to the game state
                if (checkWinCondition(game)) { // Check for a win condition
                    const payLoad = {
                        "method": "win",
                        "winner": game.currentPlayer
                    };

                    // Notify all clients that the game has been won
                    game.clients.forEach(cId => {
                        clients[cId].connection.send(JSON.stringify(payLoad));
                    });
                } else {
                    game.currentPlayer = game.currentPlayer === "A" ? "B" : "A"; // Switch turns
                    notifyTurn(gameId);    // Notify the next player of their turn
                    updateGameState(gameId); // Update the game state
                }
            } else {
                // If the move is invalid, notify the player
                const payLoad = {
                    "method": "invalidMove"
                };

                const con = clients[game.clients[0]].connection;
                con.send(JSON.stringify(payLoad));
            }
        }
    });

    // Assign a unique ID to the connected client
    const clientId = guid();
    clients[clientId] = {
        "connection": connection
    };

    // Send the client their assigned ID
    const payLoad = {
        "method": "connect",
        "clientId": clientId
    };
    connection.send(JSON.stringify(payLoad));
});

// Function to initialize the game board with starting positions
function initializeBoard() {
    return [
        ["A-P1", "A-H1", "A-H2", "A-P2", "A-P3"], // Player A's pieces
        [null, null, null, null, null],            // Empty rows
        [null, null, null, null, null],
        [null, null, null, null, null],
        ["B-P1", "B-H1", "B-H2", "B-P2", "B-P3"]  // Player B's pieces
    ];
}

// Function to update the game state and notify all clients
function updateGameState(gameId) {
    const game = games[gameId];
    const payLoad = {
        "method": "update",
        "game": game
    };

    game.clients.forEach(cId => {
        clients[cId].connection.send(JSON.stringify(payLoad));
    });
}

// Function to notify players whose turn it is
function notifyTurn(gameId) {
    const game = games[gameId];
    const payLoad = {
        "method": "turn",
        "currentPlayer": game.currentPlayer
    };

    game.clients.forEach(cId => {
        clients[cId].connection.send(JSON.stringify(payLoad));
    });
}

// Function to validate a move based on the game rules
function validateMove(move, game) {
    const [piece, direction] = move.split(":");
    const state = game.state;

    // Find the position of the piece on the board
    let pieceRow = -1;
    let pieceCol = -1;
    for (let row = 0; row < state.length; row++) {
        for (let col = 0; col < state[row].length; col++) {
            if (state[row][col] === `${game.currentPlayer}-${piece}`) {
                pieceRow = row;
                pieceCol = col;
                break;
            }
        }
        if (pieceRow !== -1) break; // Exit if the piece is found
    }

    if (pieceRow === -1 || pieceCol === -1) {
        console.log("Piece not found on the board.");
        return false; // Piece not found
    }

    // Determine the target position based on the direction
    let targetRow = pieceRow;
    let targetCol = pieceCol;

    // Pawns can only move one step in any direction
    const moveDistance = (piece.startsWith("P")) ? 1 : 2;

    switch (direction) {
        case "L":  targetCol = pieceCol - moveDistance; break;
        case "R":  targetCol = pieceCol + moveDistance; break;
        case "F":  targetRow = pieceRow - moveDistance; break;
        case "B":  targetRow = pieceRow + moveDistance; break;
        case "FL": targetRow = pieceRow - moveDistance; targetCol = pieceCol - moveDistance; break;
        case "FR": targetRow = pieceRow - moveDistance; targetCol = pieceCol + moveDistance; break;
        case "BL": targetRow = pieceRow + moveDistance; targetCol = pieceCol - moveDistance; break;
        case "BR": targetRow = pieceRow + moveDistance; targetCol = pieceCol + moveDistance; break;
        default: 
            console.log("Invalid direction.");
            return false; // Invalid direction
    }

    // Check if the target position is within the bounds of the board
    if (targetRow < 0 || targetRow >= state.length || targetCol < 0 || targetCol >= state[0].length) {
        console.log("Move out of bounds.");
        return false; // Move is out of bounds
    }

    // Check if the target position is occupied by the current player's piece
    if (state[targetRow][targetCol] && state[targetRow][targetCol].startsWith(game.currentPlayer)) {
        console.log("Move blocked by own piece.");
        return false; // Target position is occupied by the current player's own piece
    }

    // Specific piece movement rules
    switch (piece) {
        case "P1":
        case "P2":
        case "P3":
            // Pawns can only move one step in any direction
            if (Math.abs(targetRow - pieceRow) > 1 || Math.abs(targetCol - pieceCol) > 1) {
                console.log("Invalid move for Pawn.");
                return false;
            }
            break;
        case "H1":
            // Hero1 can move two steps either horizontally or vertically
            if ((direction === "L" || direction === "R") && Math.abs(targetCol - pieceCol) !== 2) {
                console.log("Invalid move for Hero1.");
                return false;
            }
            if ((direction === "F" || direction === "B") && Math.abs(targetRow - pieceRow) !== 2) {
                console.log("Invalid move for Hero1.");
                return false;
            }
            break;
        case "H2":
            // Hero2 can move two steps diagonally
            if ((direction === "FL" || direction === "FR" || direction === "BL" || direction === "BR") && (Math.abs(targetRow - pieceRow) !== 2 || Math.abs(targetCol - pieceCol) !== 2)) {
                console.log("Invalid move for Hero2.");
                return false;
            }
            break;
        default:
            console.log("Unknown piece.");
            return false; // Unknown piece
    }

    // Move is valid
    return true;
}

// Function to apply the move to the game state
function applyMove(move, game) {
    const [piece, direction] = move.split(":");
    const state = game.state;

    // Find the position of the piece on the board
    let pieceRow = -1;
    let pieceCol = -1;
    for (let row = 0; row < state.length; row++) {
        for (let col = 0; col < state[row].length; col++) {
            if (state[row][col] === `${game.currentPlayer}-${piece}`) {
                pieceRow = row;
                pieceCol = col;
                break;
            }
        }
        if (pieceRow !== -1) break; // Exit if the piece is found
    }

    if (pieceRow === -1 || pieceCol === -1) return; // Piece not found, exit

    // Determine the target position based on the direction
    let targetRow = pieceRow;
    let targetCol = pieceCol;

    // Pawns can only move one step in any direction
    const moveDistance = (piece.startsWith("P")) ? 1 : 2;

    switch (direction) {
        case "L":  targetCol = pieceCol - moveDistance; break;
        case "R":  targetCol = pieceCol + moveDistance; break;
        case "F":  targetRow = pieceRow - moveDistance; break;
        case "B":  targetRow = pieceRow + moveDistance; break;
        case "FL": targetRow = pieceRow - moveDistance; targetCol = pieceCol - moveDistance; break;
        case "FR": targetRow = pieceRow - moveDistance; targetCol = pieceCol + moveDistance; break;
        case "BL": targetRow = pieceRow + moveDistance; targetCol = pieceCol - moveDistance; break;
        case "BR": targetRow = pieceRow + moveDistance; targetCol = pieceCol + moveDistance; break;
    }

    // Move the piece to the target position
    state[pieceRow][pieceCol] = null; // Clear the original position
    state[targetRow][targetCol] = `${game.currentPlayer}-${piece}`; // Place the piece in the new position
}

// Function to check for a win condition
function checkWinCondition(game) {
    const state = game.state;
    const currentPlayer = game.currentPlayer;

    // Check for specific win conditions (e.g., capturing all opposing pieces)
    const opposingPlayer = currentPlayer === "A" ? "B" : "A";

    let opposingPieces = 0;
    state.forEach(row => {
        row.forEach(cell => {
            if (cell && cell.startsWith(opposingPlayer)) {
                opposingPieces++;
            }
        });
    });

    return opposingPieces === 0; // Win if the opposing player has no pieces left
}

// Function to generate a unique ID (GUID) for clients and games
function guid() {
    return "xxxx-xxxx-xxxx-xxxx".replace(/x/g, () => Math.floor(Math.random() * 16).toString(16));
}
