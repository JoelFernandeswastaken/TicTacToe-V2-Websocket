let socket;
let clientID = "";
let clientDetails = {};
let clientMove = 0;
let protocol = window.location.protocol === "https:" ? "wss" : "ws";
let hostname = window.location.hostname;
let port = hostname === "localhost" ? 8080 : "";

document.getElementById("start-button").addEventListener("click", () => {
    document.getElementById("start-button").disabled = true;
    const loadingIndicator = document.getElementById("loading-indicator");
    loadingIndicator.classList.remove("hidden");
    console.log(`Connecting to WebSocket server... Address: ${hostname}:${port}`);
    socket = new WebSocket(`${protocol}://${hostname}:${port}`);
    // socket = new WebSocket('ws://localhost:8080');

    socket.addEventListener("open", () => {
        console.log("Connected to WebSocket server");
        socket.send(JSON.stringify({ type: "START_GAME" }));
    });

    socket.addEventListener("message", (event) => {
        let data;
        try {
            data = JSON.parse(event.data);
            console.log(`Data from server: ${JSON.stringify(data)}`);
        } catch (err) {
            console.error("Invalid JSON:", err);
            return;
        }

        switch(data.type) {
            case "CLIENT_ID":
                if (!clientDetails.id && data.client) {
                    clientDetails = data.client;
                }
                console.log("Players greater than 2:", data.startGame);
                if(data.startGame === true){
                    document.getElementById("landing-screen").classList.add("hidden");
                    document.getElementById("game-area").classList.remove("hidden");
                }
                 // 👇 hide landing, show game board
                document.getElementById("player-details").innerText = clientDetails.id;
                RenderBoard();
                break;

            case "GAME_STATE":
                RenderBoard(data.state);
                AddMove(data.state);
                break;

            default:
                console.warn("Unknown message type:", data.type);
        }
    });
});


document.querySelectorAll(".cell").forEach(cell => {
    cell.addEventListener("click", function () {
        const data_index = this.getAttribute("data-index");
        clientMove = parseInt(data_index);
        console.log("Clicked cell with index:", data_index);
        console.log("ClientMove:", clientMove);
        let playerMove = {
            type : "PLAYER_MOVE",
            clientID : clientDetails.id,
            movePosition : clientMove
        }

        socket.send(JSON.stringify(playerMove));
    });
});


function AddMove(gameState){
    console.log(`Available Positions : ${gameState.availableMoves}`);
    console.log(`Player id from session: ${sessionStorage.getItem("playerId")}`);
    console.log(`Player id from global variable: ${clientDetails.id}`);
    let available = gameState.availableMoves;
    // let playerSymbol = gameState.players.find(x => x.id === sessionStorage.getItem("playerId"))?.symbol || "Unknown";
    let playerSymbol = gameState.players.find(x => x.id === clientDetails.id)?.symbol || "Unknown";
    console.log(`playerSymbol: ${playerSymbol}`);
    // let indexInAvailable = available.indexOf(parseInt(movePosition));

    return gameState;
}

function RenderBoard(gameState){
    document.getElementById("result").classList.remove("show");
    if(!gameState){
        console.log(`clientDetails: ${clientDetails}`);
        if(clientDetails?.symbol !== "X")
            document.getElementsByClassName("game-pane")[0].classList.add("disable-click");
        return;
    }
    console.log("Should board be active?", gameState.currentPlayer === clientDetails.id);
    if (gameState.currentPlayer !== clientDetails.id) {
        document.getElementsByClassName("game-pane")[0].classList.add("disable-click");
    } else {
        document.getElementsByClassName("game-pane")[0].classList.remove("disable-click");
    }

    let xPositions = gameState.X;
    let oPositions = gameState.O;
    let winner = gameState.winner;
    let winningPositions = [];
    console.log(`xPositions:  ${xPositions}`);
    console.log(`oPositions:  ${oPositions}`);

    const allCells = document.querySelectorAll(".cell");

    allCells.forEach(cell => {
        const index = parseInt(cell.dataset.index);
        if (xPositions.includes(index)) {
            cell.innerText = "X";
            cell.classList.remove("winner-position");
        } else if (oPositions.includes(index)) {
            cell.innerText = "O";
            cell.classList.remove("winner-position");
        } else {
            cell.innerText = "";
            cell.classList.remove("winner-position");
        }
    });

    if(winner != ""){
        winningPositions.forEach(position => {
            var element = document.getElementById(`c${position}`);
            element.classList.add("winner-position");
            document.getElementById(`c${position}`).classList.add("winner-position");
        });
        document.getElementById("winner").innerText = (winner === clientDetails.id) ? "You win!!" : "You lose"
        // document.getElementById("result").classList.remove("hidden");
        document.getElementById("result").classList.add("show");
    }
}

function GameOver(){
    socket.send(JSON.stringify({
        type : "RESET_GAME",
    }));
}