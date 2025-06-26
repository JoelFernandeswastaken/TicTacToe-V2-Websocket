import { GenerateID } from './utils.js';

const winningConditions = [
  [1, 2, 3], [4, 5, 6], [7, 8, 9],
  [1, 4, 7], [2, 5, 8], [3, 6, 9],
  [1, 5, 9], [3, 5, 7]
];

export class Game {
  constructor(playerId) {
    this.gameID = 'game_' + GenerateID();
    this.gameState = {
      players: [{ id: playerId, symbol: 'X' }],
      X: [],
      O: [],
      availableMoves: [1,2,3,4,5,6,7,8,9],
      currentPlayer: playerId,
      isWinner: false,
      gameMeta: { xMove: true },
      winner: ''
    };
  }

  addPlayer(playerId) {
    if (this.gameState.players.length < 2) {
      this.gameState.players.push({ id: playerId, symbol: 'O' });
      return true;
    }
    return false;
  }

  makeMove(playerId, movePosition) {
    const player = this.gameState.players.find(p => p.id === playerId);
    if (!player || this.gameState.isWinner) return false;

    const index = this.gameState.availableMoves.indexOf(movePosition);
    if (index === -1) return false;

    this.gameState.availableMoves.splice(index, 1);
    const symbol = player.symbol;

    if (this.gameState[symbol].length === 3) {
      this.gameState.availableMoves.push(this.gameState[symbol][0]);
      this.gameState[symbol].shift();
    }
    this.gameState[symbol].push(movePosition);

    if (this.checkWinner(symbol)) {
      this.gameState.isWinner = true;
      this.gameState.winner = playerId;
    } else {
      this.gameState.currentPlayer = this.gameState.players.find(p => p.id !== playerId).id;
    }

    return true;
  }

  checkWinner(symbol) {
    const moves = this.gameState[symbol];
    return winningConditions.some(condition =>
      condition.every(pos => moves.includes(pos))
    );
  }

  reset() {
    this.swapSymbols();
    this.gameState.X = [];
    this.gameState.O = [];
    this.gameState.availableMoves = [1,2,3,4,5,6,7,8,9];
    this.gameState.isWinner = false;
    this.gameState.winner = "";
    this.gameState.currentPlayer = this.gameState.players.find(p => p.symbol === 'X').id;
  }

  swapSymbols() {
    const [p1, p2] = this.gameState.players;
    if (p1 && p2) {
      [p1.symbol, p2.symbol] = [p2.symbol, p1.symbol];
    }
  }
}
