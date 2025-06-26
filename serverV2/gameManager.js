import { Game } from './game.js';

const games = [];

export function joinGame(ws) {
  for (const game of games) {
    if (game.gameState.players.length < 2) {
      game.addPlayer(ws.id);
      return game;
    }
  }

  const newGame = new Game(ws.id);
  games.push(newGame);
  return newGame;
}

export function getGameByID(id) {
  return games.find(g => g.gameID === id);
}

export function functionLeaveGame(playerId, gameID){
  let game = games.find(game => game.gameID === gameID);
  game.gameState.players.filter(player => player.id != playerId);

  game.gameState.winner = "";
  game.gameState.availableMoves = [0,1,2,3,4,5,6,7,8];
  game.gameState.X = [];
  game.gameState.O = [];
  game.gameState.currentPlayer = null;

  return game.gameState
}
