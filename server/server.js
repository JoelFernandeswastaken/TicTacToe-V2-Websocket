import { WebSocket, WebSocketServer } from 'ws';
import dotenv from 'dotenv';
dotenv.config()

const wss = new WebSocketServer({ port: 8080 });

wss.uniqueClientID = function(){
    return "client_" + GenerateID();
}

let winningCondition = [
    [1,2,3],[4,5,6],[7,8,9],
    [1,4,7],[2,5,8],[3,6,9],
    [1,5,9],[3,5,7]
];
let games = [];

// server side logic
wss.on("connection", (ws) => {
    ws.id = wss.uniqueClientID();
    console.log(`clientID ${ws.id} connected`);    
    ws.gameID = JoinGame(ws); // start or add user to game
    
    ws.on("message", (message) => {
        console.log('Received:', message.toString());
        let response = JSON.parse(message.toString());
        let validMove = true;
        let game;
        switch(response.type){
            case "START_GAME":              
                game = games.find(x => x.gameID == ws.gameID);
                console.log(`game: ${JSON.stringify(game)}`);
                let player = game.gameState.players.find(player => player.id === ws.id);
                wss.clients.forEach(client => {
                    if(client.readyState === WebSocket.OPEN && client.gameID === ws.gameID){
                        client.send(JSON.stringify({
                            type : "CLIENT_ID",
                            client : player
                        }));
                    }
                });
                return;

            case "PLAYER_MOVE": 
                let move = response.movePosition;
                validMove = AddMove(ws.id, ws.gameID, move);
                break;

            case "RESET_GAME":
                ResetGame(ws.gameID);
                game = games.find(x => x.gameID == ws.gameID);
                console.log(`reset gamestate: ${JSON.stringify(game.gameState)}`);
                break;

            default:
                console.log("Unknown message");
                return;

        }
        // send message to all cients in the game
        wss.clients.forEach(client => {
            if(client.readyState === WebSocket.OPEN && client.gameID == ws.gameID){
                let game = games.find(x => x.gameID == ws.gameID);
                client.send(JSON.stringify({
                    type : "GAME_STATE",    
                    state : game.gameState,
                    playerId : client.id,
                    isValidMove : validMove
                }));
            }     
        });
        
        // ws.send(message.toString());
    });    

    ws.on("close", () => {
        console.log("connection closed");
    });

    ws.on("error", console.error);
})



// game logic

function JoinGame(ws){
    let openGame = false;
    let gameID = "";
    console.log(`Available games: ${games.length}`)
    for(let i = 0; i < games.length; i++){
        if(games[i].gameState.players.length < 2){
            openGame = true;
            console.log("Open game found");
            games[i].gameState.players.push({ id : ws.id, symbol : "O"});
            gameID = games[i].gameID;
        }
    }

    if(!openGame){
        console.log("No open games found");
        gameID = "game_" + GenerateID();
        let game = {      
            gameState : {
                players : [],
                X : [],
                O : [],
                availableMoves : [1,2,3,4,5,6,7,8,9],
                currentPlayer : ws.id,
                isWinner : false,
                gameMeta : {xMove : true},
                winner : "",
            },
            gameID : gameID,
        }
        game.gameState.players.push({ id : ws.id, symbol : "X"});
        games.push(game)
    }
    console.log(`Game joined: ${gameID}`);
    return gameID;
}

function GenerateID() {
    const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
    let guid = '';
    for (let i = 0; i < 10; i++) {
      guid += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    return guid;
  }

function AddMove(playerID, gameID, playerMove){
    let game = games.find(g => g.gameID === gameID);
    let available = game.gameState.availableMoves;
    let playerInfo = game.gameState.players.find(player => player.id === playerID);
    let indexInAvailable = available.indexOf(playerMove);
    if(indexInAvailable > -1 && !game.gameState.isWinner){
        available.splice(indexInAvailable, 1);
        if(game.gameState[playerInfo.symbol].length == 3){
            available.push(game.gameState[playerInfo.symbol][0]);
            game.gameState[playerInfo.symbol].splice(0, 1);
            game.gameState[playerInfo.symbol].push(playerMove);
        }
        else{
            game.gameState[playerInfo.symbol].push(playerMove);
        }

        game.gameState.isWinner = CheckWinningCondition(game);
        if(game.gameState.isWinner)
            game.gameState.winner = playerID;   
        console.log(`isWinner: ${game.gameState.isWinner} | winner: ${game.gameState.winner}`);

        console.log(`Game object: ${JSON.stringify(game)}`);
        game.gameState.currentPlayer = game.gameState.players.find(p => p.id !== playerID).id; 
        return true; // for valid move
    }
    
    return false; // for invalid move
}

function CheckWinningCondition(game){
    let gameState = game.gameState;
    let currentPlayerID = game.gameState.currentPlayer;
    let currentPlayerSymbol = game.gameState.players.find(p => p.id === currentPlayerID).symbol;
    console.log(`winning condition player symbol: ${currentPlayerSymbol}`);

    if(gameState[currentPlayerSymbol].length > 2){
        for(let i = 0; i < winningCondition.length; i++){
            let flag = 1;
            for(let j = 0; j < winningCondition[i].length; j++){
                if (gameState[currentPlayerSymbol].indexOf(winningCondition[i][j]) < 0){
                    flag = 0;
                    break;
                }
            }
            if(flag == 1)
                return true;
        }
        return false;
    }
    return false;
}

function ResetGame(gameID){
    let game = games.find(x => x.gameID == gameID);   
    SwapPlayerSymbols(game);
    let gameState = game.gameState;
    gameState.X = [];
    gameState.O = [];
    gameState.availableMoves = [1,2,3,4,5,6,7,8,9];
    console.log(`Swap players player[]: ${gameState.players}`)
    gameState.currentPlayer = gameState.players.find(player => player.symbol === "X").id;
    gameState.isWinner = false;
    gameState.winner = "";
}

function SwapPlayerSymbols(game) {
    if (game && game.gameState && Array.isArray(game.gameState.players) && game.gameState.players.length === 2) {
        let players = game.gameState.players;
        
        // Swap the symbols
        let temp = players[0].symbol;
        players[0].symbol = players[1].symbol;
        players[1].symbol = temp;
    }
}
