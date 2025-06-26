import { WebSocketServer } from 'ws';
import dotenv from 'dotenv';
import { GenerateID } from './utils.js';
import { joinGame, getGameByID } from './gameManager.js';

dotenv.config();

const wss = new WebSocketServer({ port: 8080 });

wss.uniqueClientID = function () {
  return "client_" + GenerateID();
};

wss.on("connection", (ws) => {
  ws.id = wss.uniqueClientID();
  console.log(`clientID ${ws.id} connected`);

  const game = joinGame(ws);
  ws.gameID = game.gameID;

  ws.on("message", (message) => {
    console.log('Received:', message.toString());
    let response = JSON.parse(message.toString());
    let validMove = true;
    let currentGame = getGameByID(ws.gameID);

    switch (response.type) {
      case "START_GAME":
        let players = currentGame.gameState.players;
        const player = currentGame.gameState.players.find(p => p.id === ws.id);
        wss.clients.forEach(client => {
          if (client.readyState === ws.OPEN && client.gameID === ws.gameID) {
            client.send(JSON.stringify({
              type: "CLIENT_ID",
              client: player,
              startGame : players.length > 1
            }));
          }
        });
        return;

      case "PLAYER_MOVE":
        validMove = currentGame.makeMove(ws.id, response.movePosition);
        break;

      case "RESET_GAME":
        currentGame.reset();
        console.log(`reset gamestate: ${JSON.stringify(currentGame.gameState)}`);
        break;

      default:
        console.log("Unknown message type");
        return;
    }

    // Send updated game state to all clients in the same game
    wss.clients.forEach(client => {
      if (client.readyState === ws.OPEN && client.gameID === ws.gameID) {
        client.send(JSON.stringify({
          type: "GAME_STATE",
          state: currentGame.gameState,
          playerId: client.id,
          isValidMove: validMove
        }));
      }
    });
  });

  ws.on("close", () => {
    console.log("connection closed");
    
  });

  ws.on("error", console.error);
});
