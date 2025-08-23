//#region VARIABLES

//#region Game Options

let playingEngine = true
//Boolean; Turns on and off the engine which plays against the player (if reactivated, the engine will resume play following a move)

let promotion = "q"
//String; Decides which piece a pawn will promote to; Q = Queen, R = Rook, B = Bishop, N = Knight

let showAnalysis = true
//Boolean; Turns on and off the engine analysis, statistics, lines, and analysis bar; Does not disable opponent engine

let showTimers = true
//Boolean; Toggles the visibility of the text in the timer boxes

//#endregion

//#region Timers

let startingTime = {
    wtime: 60000, //Integer: White's starting time
    btime: 60000 //Integer: Black's starting time
}
//Object; Amount of time each side starts with; In milliseconds

let currentTime = {
    wtime: 60000, //Integer: White's remaining time
    btime: 60000 //Integer: Black's remaining time
}
//Object; Amount of time each side has remaining

let increment = 0
//Integer; Amount of time added per move per sidel; In milliseconds 

//#endregion

//#region Game Info

let currentFEN = ""
//The current board position represented with Forsyth-Edwards Notation

let currentBoard = [
    [21, 19, 20, 22, 17, 20, 19, 21],
    [18, 18, 18, 18, 18, 18, 18, 18],
    [0, 0, 0, 0, 0, 0, 0, 0],
    [0, 0, 0, 0, 0, 0, 0, 0],
    [0, 0, 0, 0, 0, 0, 0, 0],
    [0, 0, 0, 0, 0, 0, 0, 0],
    [10, 10, 10, 10, 10, 10, 10, 10],
    [13, 11, 12, 14, 9, 12, 11, 13]
]
//Array; Contains arrays of numbers; Denotes which piece is on each square; 0 if the square is empty; Otherwise uses method below
//Step 1; Add 8 if the piece is white; Add 16 if the piece is black
//Step 2; Add a number for what type of piece it is (King = 1, Pawn = 2, Knight = 3, Bishop = 4, Rook = 5, Queen = 6)

let halfMoves = 0
//Integer; Counts the number of moves made, which each move by either side adding 1 to the counter

let movableSquares = []
//Array; Contains strings; Denotes which squares the selected piece can move to

let playerPieces = [
    [false, false, false, false, false, false, false, false],
    [false, false, false, false, false, false, false, false],
    [false, false, false, false, false, false, false, false],
    [false, false, false, false, false, false, false, false],
    [false, false, false, false, false, false, false, false],
    [false, false, false, false, false, false, false, false],
    [true, true, true, true, true, true, true, true],
    [true, true, true, true, true, true, true, true]
]
//Array; Contains arrays of booleans; Similar structure to board arrays; Denotes whether each square on the board contains a piece belonging to the player

let exclusion = ""
//String; The squares the player's selected piece can move to

//#endregion

//#region End of Game

let boardActive = true
//Boolean; Allows/Disallows interaction with the board

let runTimer = true
//Boolean; Turns the timer on and off (Primarily for when menus are open)

let playerIsWhite = true
//Boolean; Denotes whether the user is playing white or black

let status = ""
//String; Used for checking whether the game has ended and if so through what method 
//Normal value throughout game: "normal" 
//Win/loss methods: "checkmate", "fifty moves", "forfeit", "timeout"
//Draw Methods: "agreement", "insufficient material", "stalemate", "threefold"

let winner = "White"
//String; Denotes who won the game

//#endregion

//#region History

let boardHistory = [
    [[21, 19, 20, 22, 17, 20, 19, 21],
    [18, 18, 18, 18, 18, 18, 18, 18],
    [0, 0, 0, 0, 0, 0, 0, 0],
    [0, 0, 0, 0, 0, 0, 0, 0],
    [0, 0, 0, 0, 0, 0, 0, 0],
    [0, 0, 0, 0, 0, 0, 0, 0],
    [10, 10, 10, 10, 10, 10, 10, 10],
    [13, 11, 12, 14, 9, 12, 11, 13]]
]
//Array; Contains multiple board arrays; All previous boards from the current game

let displayedBoard = 0
//Integer; Denotes which board is being displayed on the screen

let mhBlack = []
//Array; Contains strings; Move history for black in SAN

let mhWhite = []
//Array; Contains strings; Move history for white in SAN

let moveHistory = ""
//String; Move history for both sides for the current game in SAN

//#endregion

//#region Engines/Validation

var wasmSupported = typeof WebAssembly === 'object' && WebAssembly.validate(Uint8Array.of(0x0, 0x61, 0x73, 0x6d, 0x01, 0x00, 0x00, 0x00));
//Boolean; Checks whether WASM is supported by the device

var analysis = new Worker(wasmSupported ? 'analysis.wasm.js' : 'analysis.js');
//Web Worker; The engine that analyses the game

var stockfish = new Worker(wasmSupported ? 'stockfish.wasm.js' : 'stockfish.js');
//Web Worker; The engine that plays against the player

//#endregion

//#endregion

//#region FUNCTIONS

//#region Initialisation

$(document).ready(function(e){
    timeFetch("resetTimer") 
    fetch("/reset", {
        method: "POST",
        headers: {
        "Content-Type": "application/json"
        },
        body: JSON.stringify({ placehold:  false})
    })
})
//Runs upon loading; Tells the server to reset the game and timers; Resets the page and all significant variables

function initialisePage(){
    $("body").append("<div id='banner'></div>")
    $("#banner").append("<div id='bannerText'>Chess Trainer</div>")
    $("#banner").append("<a id='bannerLink' href='https://github.com/nmrugg/stockfish.js' target='_blank'>Stockfish ⮺</div>")
    $("body").append("<div id='boardContainer'></div>")
    $("#boardContainer").append("<div id='vspacer1'></div>").children().last().addClass("boardAlignH vspacer")
    $("#boardContainer").append("<div id='evalLeft'></div>").children().last().addClass("boardAlignH")
    $("#evalLeft").append("<div id='evalLeftFill'></div>")
    $("#boardContainer").append("<div id='board'></div>").children().last().addClass("boardAlignH")
    for(let i=8;i>=1;i--){
        $("#board").append("<div></div>").children().last().addClass("row row"+i)
        for(let j=1;j<=8;j++){
            $(".row"+i).append("<div></div>").children().last().addClass("square " + String.fromCharCode(96+j) + i.toString() + " " + ((i+j)%2==0 ? "black" : "white"))
            $(".row"+i).children().last().append("<img>").children().last().addClass("pieceImg img" + String.fromCharCode(96+j) + i.toString()).attr("src", "0.png")
        }
    }
    $("#boardContainer").append("<div id='vspacer2'></div>").children().last().addClass("boardAlignH vspacer")

    //Right Panel
    $("#boardContainer").append("<div id='rightPanel'></div>").children().last().addClass("boardAlignH")
    $("#rightPanel").append("<div id='engineDetails'></div>").children().last().addClass("inRightPanel")
    $("#engineDetails").append("<div id='evalScore'>+0.2</div>").children().last().addClass("inEngineDetails")
    $("#engineDetails").append("<div id='engineName'>Running <strong>Stockfish 2018-07-25</strong></div>").children().last().addClass("inEngineDetails")
    $("#engineDetails").append("<div id='nodeDetails'>2m nodes at 410k/s</div>").children().last().addClass("inEngineDetails")
    $("#engineDetails").append("<div id='depth'><strong>Depth:</strong> 10</div>").children().last().addClass("inEngineDetails")
    
    $("#rightPanel").append("<div id='line1'></div>").children().last().addClass("inRightPanel line")
    $("#rightPanel").append("<div id='line2'></div>").children().last().addClass("inRightPanel line")
    $("#rightPanel").append("<div id='line3'></div>").children().last().addClass("inRightPanel line")
    $("#rightPanel").append("<div id='line4'></div>").children().last().addClass("inRightPanel line")
    $("#rightPanel").append("<div id='line5'></div>").children().last().addClass("inRightPanel line")
    $("#rightPanel").append("<div id='moveHistoryContainer'></div>").children().last().addClass("inRightPanel")
    $("#moveHistoryContainer").append("<div id='mhNumberColumn'></div>")
    $("#moveHistoryContainer").append("<div id='moveHistoryLeft'></div>").children().last().addClass("historyColumn")
    $("#moveHistoryContainer").append("<div id='moveHistoryRight'></div>").children().last().addClass("historyColumn")
    $("#rightPanel").append("<div id='timerContainer'></div>").children().last().addClass("inRightPanel")
    $("#timerContainer").append("<div id='whiteTime'></div>").children().last().addClass("timer")
    $("#timerContainer").append("<div id='blackTime'></div>").children().last().addClass("timer")
    $("#rightPanel").append("<div id='gameDetails'></div>").children().last().addClass("inRightPanel")
    $("#gameDetails").append("<div id='options1'></div>").children().last().addClass("options")
    $("#options1").append("<button id='toggleAnalysis'>Toggle Analysis: On</button>").children().last().addClass("controls")
    $("#options1").append("<button id='exportFen'>Export game FEN</button>").children().last().addClass("controls")
    $("#gameDetails").append("<div id='options2'></div>").children().last().addClass("options")
    $("#options2").append("<button id='toggleEngine'>Toggle Engine: On</button>").children().last().addClass("controls")
    $("#options2").append("<button id='surrender'>Surrender</button>").children().last().addClass("controls")
    $("#gameDetails").append("<div id='options3'></div>").children().last().addClass("options")
    $("#options3").append("<button id='toggleTimers'>Show Timers: On</button>").children().last().addClass("controls")
    $("#options3").append("<button id='pawnPromotion'>Pawn Promotes To: Queen</button>").children().last().addClass("controls") 

    $("body").append("<div id='hspacer2'></div>").children().last().addClass("hspacer")
    $("body").append("<div id='bottomPanel'></div>")
    $("#bottomPanel").append("<div id='vspacer4'></div>").children().last().addClass("botlane vspacer")
    $("#bottomPanel").append("<div id='fback'>⏮</div>").children().last().addClass("botlane button")
    $("#bottomPanel").append("<div id='vspacer5'></div>").children().last().addClass("botlane vspacer")
    $("#bottomPanel").append("<div id='back'>⏴</div>").children().last().addClass("botlane button")
    $("#bottomPanel").append("<div id='vspacer6'></div>").children().last().addClass("botlane vspacer")
    $("#bottomPanel").append("<div id='pause'>⏯</div>").children().last().addClass("botlane button")
    $("#bottomPanel").append("<div id='vspacer7'></div>").children().last().addClass("botlane vspacer")
    $("#bottomPanel").append("<div id='fwd'>⏵</div>").children().last().addClass("botlane button")
    $("#bottomPanel").append("<div id='vspacer8'></div>").children().last().addClass("botlane vspacer")
    $("#bottomPanel").append("<div id='ffwd'>⏭</div>").children().last().addClass("botlane button")
    $("#bottomPanel").append("<div id='vspacer9'></div>").children().last().addClass("botlane vspacer")

    $("body").append("<div id='mid'></div>")
    $("#mid").append("<div id='midTitle'>Start A Game</div>").children().last().addClass("midlane")
    $("#mid").append("<div id='midSubtitle'>Choose Your Settings</div>").children().last().addClass("midlane")
    $("#mid").append("<div id='strengthTitle'>Strength: 20</div>").children().last().addClass("midlane")
    $("#mid").append("<input id='strengthInput' type='range' min='1' max='20' value='20' step='1' />").children().last().addClass("midlane slider")
    $("#mid").append("<div id='minTitle'>Minutes: 5</div>").children().last().addClass("midlane")
    $("#mid").append("<input id='minInput' type='range' min='0' max='60' step='1' value='5'/>").children().last().addClass("midlane slider")
    $("#mid").append("<div id='secTitle'>Seconds: 30</div>").children().last().addClass("midlane")
    $("#mid").append("<input id='secInput' type='range' min='0' max='60' step='1' />").children().last().addClass("midlane slider")
    $("#mid").append("<div id='incTitle'>Increment: 0s</div>").children().last().addClass("midlane")
    $("#mid").append("<input id='incInput' type='range' min='0' max='60' step='1' value='0'/>").children().last().addClass("midlane slider")
    $("#mid").append("<button id='playWhite' value='Play as White'>Play as White</button>").children().last().addClass("midlane colorButton")
    $("#mid").append("<button id='playBlack' value='Play as Black'>Play as Black</button>").children().last().addClass("midlane colorButton")

    $("body").append("<div id='support'></div>")
    $("#support").append("<div id='supportAnalysis'>This panel for experienced chess players shows engine details</div>").children().last().addClass("support")
    $("#support").append("<div><strong>→</strong></div>").children().last().addClass("arrow").css("margin-top", "1.5vh").css("margin-bottom", "1.5vh")
    $("#support").append("<div id='supportHistory'>Recently played moves are shown here</div>").children().last().addClass("support")
    $("#support").append("<div><strong>→</strong></div>").children().last().addClass("arrow").css("margin-top", "1.5vh").css("margin-bottom", "1.5vh")
    $("#support").append("<div><strong>←</strong></div>").children().last().addClass("arrow").css("margin-top", "1.5vh").css("margin-bottom", "1.5vh")
    $("#support").append("<div id='supportStrength'>This controls the strength of the engine (1 is roughly 2500 Elo, 20 is roughly 3750 Elo)</div>").children().last().addClass("support")
    $("#support").append("<div><strong>←</strong></div>").children().last().addClass("arrow").css("margin-top", "2.8vh").css("margin-bottom", "1.5vh")
    $("#support").append("<div id='supportMinutes'>This adds the chosen number of minutes to the timer</div>").children().last().addClass("support")
    $("#support").append("<div><strong>←</strong></div>").children().last().addClass("arrow").css("margin-top", "2.8vh").css("margin-bottom", "1.5vh")
    $("#support").append("<div id='supportSeconds'>This adds the chosen number of seconds to the timer</div>").children().last().addClass("support")
    $("#support").append("<div><strong>←</strong></div>").children().last().addClass("arrow").css("margin-top", "2.8vh")
    $("#support").append("<div id='supportIncrement'>Adds seconds to the timer after each move</div>").children().last().addClass("support")
    $("#support").append("<div id='supportTimer'>The time left per side is shown here</div>").children().last().addClass("support")
    $("#support").append("<div><strong>→</strong></div>").children().last().addClass("arrow").css("margin-top", "1.5vh").css("margin-bottom", "1.5vh")
    $("#support").append("<div><strong>↙</strong></div>").children().last().addClass("arrow").css("line-height", "3.5vh")
    $("#support").append("<div id='supportOptions'>Game controls shown here:</div>").children().last().addClass("support")
    $("#support").append("<div><strong>↓</strong></div>").children().last().addClass("arrow").css("line-height", "3.5vh").css("font-size", "3.5vh")

    $(".line").empty()
    $(".mhEntry").remove()
}
initialisePage()
//Initialises page, resetting HTML and CSS

//#endregion

//#region Engines

analysis.addEventListener('message', function (e) {
    console.log(e.data);
    if(e.data === "uciok"){
        analysis.postMessage("ucinewgame");
        analysis.postMessage("isready");
    }
    else if(e.data === "readyok"){
        analysis.postMessage("position name startpos")
        analysis.postMessage("setoption name MultiPV value 5")
        analysis.postMessage("go depth 16")
    }
    else if(e.data.includes("info") == true){
        let pv = e.data.split(" ")[e.data.split(" ").indexOf("multipv")+1]
        if(pv==1){
            fetch("/rqSide", {
                    method: "POST",
                    headers: {
                    "Content-Type": "application/json"
                    },
                    body: JSON.stringify({placehold: true})
            })
            .then(res => res.json())
            .then(data => {
                whiteActive = data.message
            });
            if(e.data.includes("cp") == true){
                let eval = ((e.data.split(" ")[e.data.split(" ").indexOf("cp") + 1])/100*whiteActive)
                eval = eval.toPrecision(4).toString()
                eval = eval.padEnd(9, "0").substring(0, eval.toString().includes("-")==true ? 6 : 5)
                let depth = (e.data.split(" ")[e.data.split(" ").indexOf("depth") + 1])
                let nps = Math.round(e.data.split(" ")[e.data.split(" ").indexOf("nps") + 1]/1000)
                let nodes = Math.round(e.data.split(" ")[e.data.split(" ").indexOf("nodes") + 1]/1000)
                $("#nodeDetails").html(nodes + "k nodes at " + nps + "k/s")
                $("#depth").html("<strong>Depth:</strong> " + depth)
                if(e.data.split(" ")[e.data.split(" ").indexOf("depth")+1]>12){
                    $("#evalScore").html((eval>=0 ? "+" : "") + eval)
                    $("#evalLeftFill").animate({
                        height: ((50+ (((-0.5*eval)/(Math.sqrt(400+Math.pow(eval, 2)))))*100).toString() + "%")
                        }, {
                        duration: 50,
                        easing: "swing"
                    })
                }
            }
            else if(e.data.includes("mate") == true){
                $("#evalLeftFill").animate({
                    height: (halfMoves%2==0 ? "100%" : "0%")
                    }, {
                    duration: 100,
                    easing: "swing"
                })
            }
        }
        fetch("/history", {
            method: "POST",
            headers: {
            "Content-Type": "application/json"
            },
            body: null
        })
        .then(res => res.json())
        .then(data => {
            moveHistory = data.message
        });
        let lineMH = moveHistory.concat(e.data.split(" pv ")[1].split(" "))
        fetch("/convert", {
            method: "POST",
            headers: {
            "Content-Type": "application/json"
            },
            body: JSON.stringify({line: lineMH})
        })
        .then(res => res.json())
        .then(data => {
            let lineOutput = data.message
            let lineOutputString = "1. ";
            let moveNo = 1
            for(let i=1;i<lineOutput.length+1;i++){
                if(i%2==1 && i!=1){
                    moveNo++
                    lineOutputString += " " + moveNo + ". "
                }
                lineOutputString += lineOutput[i-1] + " "
            }
            $("#line" + pv).html(lineOutputString)
        });
    }
});
//Processes all messages sent from the analysis engine

analysis.postMessage("uci");
//Ensures the analysis engine is working

stockfish.addEventListener('message', function (e) {
    if(e.data === "uciok"){
        stockfish.postMessage("ucinewgame");
        stockfish.postMessage("isready");
    }
    else if(e.data === "readyok"){
        stockfish.postMessage("position name startpos")
        stockfish.postMessage("setoption name Skill Level value 20")
    }
    else if(e.data.includes("bestmove") == true){
        fetch("/computerMove", {
                method: "POST",
                headers: {
                "Content-Type": "application/json"
                },
                body: JSON.stringify({ moveMade: e.data.split(" ")[1]})
        })
        .then(res => res.json())
        .then(data => {
            currentBoard = data.message
            updateBoard()
            addBoard()
            timeFetch("switchTimer")
        });
    }
});
//Processes all messages sent from the opponent engine

stockfish.postMessage("uci");
//Ensures the opponent engine is working

function computer(){
    fetch("/rqFen", {
        method: "POST",
        headers: {
        "Content-Type": "application/json"
        },
        body: JSON.stringify({ placehold:  false})
    })
    .then(res => res.json())
    .then(data => {
        currentFEN = data.message
        timeFetch("switchTimer")
        stockfish.postMessage("position fen " + currentFEN)
        stockfish.postMessage("go wtime " + String(currentTime["wtime"]) + " btime " + String(currentTime["btime"]))
        analysis.postMessage("position fen " + currentFEN)
        analysis.postMessage("go depth 16")
    });
}
//Called whenever the opponent engine needs to move; Updates FEN and starts opponent engine and analysis

//#endregion

//#region Timer 

function assignTime(){
    if(currentTime["wtime"]<=0 || currentTime["btime"]<=0){
        fetch(("/stopTimer"), {
            method: "POST",
            headers: {
            "Content-Type": "application/json"
            },
            body: JSON.stringify({placehold: true})
        })
            .then(res => res.json())
            .then(data => {
                currentTime["wtime"] = (startingTime["wtime"]-data.wtime)
                currentTime["btime"] = (startingTime["btime"]-data.btime)
                if(currentTime["wtime"]<=0){
                    $("#whiteTime").html("00:00.000")
                    $("#whiteTime").css("background-color", "red")
                    status = "timeout"
                    endGame()
                } else{
                    $("#blackTime").html("00:00.000")
                    $("#blackTime").css("background-color", "red")
                    status = "timeout"
                    endGame()
                }
                runTimer = false
        });
    } else{
        let m = {w: Math.floor(currentTime["wtime"]/60000), b: Math.floor(currentTime["btime"]/60000)}
        let s = {w: Math.floor(Math.floor(currentTime["wtime"]%60000)/1000), b: Math.floor(Math.floor(currentTime["btime"]%60000)/1000)}
        let ms = {w: Math.floor(currentTime["wtime"]%1000), b: Math.floor(currentTime["btime"]%1000)}
        $("#whiteTime").html((m.w<10 ? "0"+m.w : m.w ) + ":" + (s.w<10 ? "0"+s.w : s.w) + "." + (ms.w.toString().length==3 ? ms.w : (ms.w.toString().length==2? "0" + ms.w : "00" + ms.w)))
        $("#blackTime").html((m.b<10 ? "0"+m.b : m.b ) + ":" + (s.b<10 ? "0"+s.b : s.b) + "." + (ms.b.toString().length==3 ? ms.b : (ms.b.toString().length==2? "0" + ms.b : "00" + ms.b)))
    }
}
//Displays the remaining time for each side in their respective timer text box

function timeFetch(label){
    fetch(("/" + label), {
        method: "POST",
        headers: {
        "Content-Type": "application/json"
        },
        body: JSON.stringify({placehold: true})
    })
        .then(res => res.json())
        .then(data => {
            if(label=="switchTimer"){
                if(halfMoves%2==1){
                    startingTime["wtime"]+=increment
                } else{
                    startingTime["btime"]+=increment
                }
            }
            currentTime["wtime"] = (startingTime["wtime"]-data.wtime)
            currentTime["btime"] = (startingTime["btime"]-data.btime)
            assignTime()
    });
}
//Sends the server information about changes to timer (stop, start, reset, etc) and updates time

async function timerUpdates() {
    while (runTimer) {
        timeFetch("updateTimer")
        await new Promise(resolve => setTimeout(resolve, 1000/60))
    }
} timerUpdates();
//Updates the timer 60 times a second

//#endregion

//#region History

function addBoard(){
    boardHistory.push(currentBoard)
    displayedBoard++;
    halfMoves++;
}
//Adds the current board to history when a move is played

function updateHistory(){
    fetch("/history", {
        method: "POST",
        headers: {
        "Content-Type": "application/json"
        },
        body: null
    })
    .then(res => res.json())
    .then(data => {
        moveHistory = data.message
        mhWhite = []
        mhBlack = []
        for(let i=0;i<moveHistory.length;i++){
            if(i%2==0){
                mhWhite.push(moveHistory[i])
            } else{
                mhBlack.push(moveHistory[i])
            }
        }
        $(".historyColumn").empty()
        $("#mhNumberColumn").empty()
        mhBlack.map(function(cv, index, arr){
            $("#moveHistoryRight").append("<div>" + cv + "</div>").children().last().addClass("mhEntry")
        })
        mhWhite.map(function(cv, index, arr){
            $("#mhNumberColumn").append("<div>" + (index+1) + "</div>").children().last().addClass("moveNumber")
            $("#moveHistoryLeft").append("<div>" + cv + "</div>").children().last().addClass("mhEntry")
        })
        $("#moveHistoryContainer").scrollTop($("#moveHistoryContainer")[0].scrollHeight)
    });
}
//Updates the move history and displays this in the history box

//#endregion

//#region Move Handling

$("#board").on("click", ".pieceImg", function(){
    if(boardActive==true){
        let newSquare = true
        let clickedSquare = $(this).attr("class").split(" ")[1].substring(3,5)
        for(let i=0;i<movableSquares.length;i++){
            if(clickedSquare == movableSquares[i]["to"]){
                newSquare = false
                fetch("/makeMove", {
                    method: "POST",
                    headers: {
                    "Content-Type": "application/json"
                    },
                    body: JSON.stringify({ moveMade:  clickedSquare, promoteTo: promotion})
                })
                .then(res => res.json())
                .then(data => {
                    currentBoard = data.message
                    updateBoard()
                    addBoard()
                    if(playingEngine){
                        computer()
                    } else{
                        fetch("/rqFen", {
                            method: "POST",
                            headers: {
                            "Content-Type": "application/json"
                            },
                            body: JSON.stringify({ placehold:  false})
                        })
                        .then(res => res.json())
                        .then(data => {
                            currentFEN = data.message
                            timeFetch("switchTimer")
                            analysis.postMessage("position fen " + currentFEN)
                            analysis.postMessage("go depth 16")
                        });
                    }
                });
            }
        }
        if (newSquare == true){
            fetch("/checkMoves", {
                method: "POST",
                headers: {
                "Content-Type": "application/json"
                },  
                body: JSON.stringify({ selectedSquare:  clickedSquare})
            })
            .then(res => res.json())
            .then(data => {
                movableSquares = data.message
                console.log(movableSquares)
                attackers()
                for(let i=0;i<movableSquares.length;i++){
                    exclusion = movableSquares.map(id => (".img" + `${id.to}`)).join(", ")
                    console.log(exclusion)
                    $(".img" + data.message[i]["to"]).css("background-color", "red")
                    $(".pieceImg").not(exclusion).css("background-color", "transparent")
                }
            });
        }
        else{
            fetch(("/attackers"), {
                method: "POST",
                headers: {
                "Content-Type": "application/json"
                },
                body: JSON.stringify({playerPieces: playerPieces, playerIsWhite: playerIsWhite})
            })
            .then(res => res.json())
            .then(data => {
                console.log(data.attackers)   
                for(let i=0;i<8;i++){
                    for(let j=0;j<8;j++){
                        $(".img" + String.fromCharCode(97+j, 56-i)).css("backgroundColor", (data.attackers[i][j].length==1 ? "yellow" : (data.attackers[i][j].length==2 ? "orange" : (data.attackers[i][j].length>2 ? "red" : $(".img" + String.fromCharCode(97+j, 56-i)).css("backgroundColor")))))
                    }
                }
            });
            exclusion = ""
            $(".pieceImg").not(exclusion).css("background-color", "transparent")
        }
    }
})
//Function called when any square on the board is clicked

function updateBoard(){
    for(let i=8;i>0;i--){
        for(let j=0;j<8;j++){
            $(".img" + String.fromCharCode(97+j) + i.toString()).attr("src", currentBoard[8-i][j] + ".png")
        }
    }
    setTimeout(updateHistory(), 50)
    updateHistory()
    fetch("/rqFen", {
        method: "POST",
        headers: {
        "Content-Type": "application/json"
        },
        body: JSON.stringify({ placehold:  false})
    })
    .then(res => res.json())
    .then(data => {
        currentFEN = data.message
        analysis.postMessage("position fen " + currentFEN)
        analysis.postMessage("go depth 16")
    });
    gamestate()
    $(".pieceImg").not(exclusion).css("background-color", "transparent")
    attackers()
}
//Runs multiple other functions, updates board display, switches timers, and updates engines

function clearHighlights(){
    console.log("clearing highlights")
    $(".pieceImg").css("background-color", "transparent")
    clickedSquare = ""
    movableSquares = []
}
//Clears all highlighting on the board for threats or movable squares

function attackers(){
    if(showAnalysis==true){
        for(let i=0;i<8;i++){
            for(let j=0;j<8;j++){
                console.log(currentBoard[i][j])
                if(playerIsWhite==true && Math.floor(currentBoard[i][j]/8)==1){
                    playerPieces[i][j]=true
                } else if(playerIsWhite==false && Math.floor(currentBoard[i][j]/8)==2){
                    playerPieces[i][j]=true
                } else{
                    playerPieces[i][j]=false
                }
            }
        }
        fetch(("/attackers"), {
            method: "POST",
            headers: {
            "Content-Type": "application/json"
            },
            body: JSON.stringify({playerPieces: playerPieces, playerIsWhite: playerIsWhite})
        })
        .then(res => res.json())
        .then(data => {
            console.log(data.attackers)   
            for(let i=0;i<8;i++){
                for(let j=0;j<8;j++){
                    $(".img" + String.fromCharCode(97+j, 56-i)).css("backgroundColor", (data.attackers[i][j].length==1 ? "yellow" : (data.attackers[i][j].length==2 ? "orange" : (data.attackers[i][j].length>2 ? "red" : $(".img" + String.fromCharCode(97+j, 56-i)).css("backgroundColor")))))
                }
            }
        });

    }
}
//Adds yellow, orange, and red highlights respectively if a player's piece is attacked 1, 2, or 3+ times

function gamestate(){
    fetch(("/gamestate"), {
        method: "POST",
        headers: {
        "Content-Type": "application/json"
        },
        body: JSON.stringify({placehold: true})
    })
    .then(res => res.json())
    .then(data => {
        status = data.message
        endGame()
    });
}
//Checks whether the game is progressing normally, is drawn, or is over

function endGame(){
    if(["checkmate", "timeout", "forfeit"].includes(status)){
        timeFetch("stopTimer")
        clearHighlights()
        boardActive = false
        if(status=="timeout"){
            winner = (currentTime["wtime"]>currentTime["btime"] ? "White" : "Black")
        } else if(status=="forfeit"){
        } else{
            winner = (halfMoves%2==0 ? "Black" : "White")
        }
        $("#overlay").css("background-color", "red")
        let lossResponses = ["By Checkmate", "By Timeout", "By Surrender"]
        $("#midTitle").html(winner + " Wins")
        $("#midSubtitle").html(lossResponses[["checkmate", "timeout", "forfeit"].indexOf(status)])
        $("#midTitle").css("background-color", (winner == "White" ? "#e9ecef" : "#868e96"))
        $("#midSubtitle").css("background-color", (winner == "White" ? "#e9ecef" : "#868e96"))
        $("#midTitle").css("color", (winner == "White" ? "#101113" : "#f1f3f5")) 
        $("#midSubtitle").css("color", (winner == "White" ? "#101113" : "#f1f3f5"))
        setTimeout(()=>{
            $("#overlay").animate({
                opacity: "50%"
                }, {
                duration: 125,
                easing: "swing"
            })
            $("#mid").css("pointer-events", "true")
            $("#mid").css("z-index", "200")
            $("#mid").children().css("pointer-events", "true")
            $("#mid").animate({
                opacity: "100%"
            }, {
                duration: 100,
                easing: "swing"
            })
            $("#support").css("pointer-events", "true")
            $("#support").css("z-index", "200")
            $("#support").children().css("pointer-events", "true")
            $("#support").animate({
                opacity: "100%"
            }, {
                duration: 100,
                easing: "swing"
            })
        }, 500)
    } else if(["fifty moves", "insufficient material", "stalemate", "threefold", "agreement"].includes(status)){
        timeFetch("stopTimer")
        clearHighlights()
        boardActive = false
        $("#overlay").css("background-color", "yellow")
        let drawResponses = ["By Fifty Move Rule", "By Insufficient Material", "By Stalemate", "By Threefold Repetition", "By Agreement"]
        $("#midTitle").html("Draw")
        $("#midSubtitle").html(drawResponses[["fifty moves", "insufficient material", "stalemate", "threefold", "agreement"].indexOf(status)])
        $("#midTitle").css("background-color", "#1a1b1e") 
        $("#midSubtitle").css("background-color", "#1a1b1e")
        $("#midTitle").css("color", "#f1f3f5") 
        $("#midSubtitle").css("color", "#f1f3f5")
        setTimeout(()=>{
            $("#overlay").animate({
                opacity: "50%"
                }, {
                duration: 125,
                easing: "swing"
            })
            $("#mid").css("pointer-events", "true")
            $("#mid").css("z-index", "200")
            $("#mid").children().css("pointer-events", "true")
            $("#mid").animate({
                opacity: "100%"
            }, {
                duration: 100,
                easing: "swing"
            })
            $("#support").css("pointer-events", "true")
            $("#support").css("z-index", "200")
            $("#support").children().css("pointer-events", "true")
            $("#support").animate({
                opacity: "100%"
            }, {
                duration: 100,
                easing: "swing"
            })
        }, 500)
    }
}
//Ends the game if it is drawn or is over

//#endregion

//#region View Boards

$("#fback").on("mouseup", function(){
    displayedBoard = 0
    currentBoard = boardHistory[0]
    updateBoard()
    clearHighlights()
    boardActive = false
})

$("#back").on("mouseup", function(){
    displayedBoard = (displayedBoard==0 ? 0 : displayedBoard-1)
    currentBoard = boardHistory[displayedBoard]
    updateBoard()
    clearHighlights()
    boardActive = false
})

$("#fwd").on("mouseup", function(){
    displayedBoard = (displayedBoard==halfMoves ? displayedBoard : displayedBoard+1)
    currentBoard = boardHistory[displayedBoard]
    updateBoard()
    clearHighlights()
    boardActive = (displayedBoard==halfMoves ? true : false)
})

$("#ffwd").on("mouseup", function(){
    displayedBoard = halfMoves
    currentBoard = boardHistory[displayedBoard]
    updateBoard()
    clearHighlights()
    boardActive = (displayedBoard==halfMoves ? true : false)
})

$("#pause").on("mouseup", function(){
    clearHighlights()
    for(let i=0;i<(halfMoves-displayedBoard);i++){
        setTimeout(() => {
            displayedBoard++
            currentBoard=boardHistory[displayedBoard]
            updateBoard()
            boardActive = (displayedBoard==halfMoves ? true : false)
        }, 250*i);
    }
})

//#endregion

//#region Pop-up Options

$("#strengthInput").on("change", function(){
    stockfish.postMessage("setoption name Skill Level value " + $("#strengthInput").val())
    $("#strengthTitle").html("Strength: " + $("#strengthInput").val())
})

$("#minInput").on("change", function(){
    $("#minTitle").html("Minutes: " + this.value)
    currentTime.wtime = (parseInt($("#minInput").val())*60000+parseInt($("#secInput").val())*1000)
    currentTime.btime = (parseInt($("#minInput").val())*60000+parseInt($("#secInput").val())*1000)
    startingTime.wtime = (parseInt($("#minInput").val())*60000+parseInt($("#secInput").val())*1000)
    startingTime.btime = (parseInt($("#minInput").val())*60000+parseInt($("#secInput").val())*1000)
})

$("#secInput").on("change", function(){
    $("#secTitle").html("Seconds: " + this.value)
    currentTime.wtime = (parseInt($("#minInput").val())*60000+parseInt($("#secInput").val())*1000)
    currentTime.btime = (parseInt($("#minInput").val())*60000+parseInt($("#secInput").val())*1000)
    startingTime.wtime = (parseInt($("#minInput").val())*60000+parseInt($("#secInput").val())*1000)
    startingTime.btime = (parseInt($("#minInput").val())*60000+parseInt($("#secInput").val())*1000)
})

$("#incInput").on("change", function(){
    $("#incTitle").html("Increment: " + this.value + "s")
    increment = this.value*1000
})

$("#playWhite").on("mouseup", function(){
    console.log("SDLFKJL:SDKJFSKLDFSHJKLLKSDFHLKJ")
    fetch("/reset", {
        method: "POST",
        headers: {
        "Content-Type": "application/json"
        },
        body: JSON.stringify({ placehold:  false})
    })
    stockfish.postMessage("setoption name Skill Level value ") + $("#strength").val()
    currentTime.wtime = (parseInt($("#minInput").val())*60000+parseInt($("#secInput").val())*1000)
    currentTime.btime = (parseInt($("#minInput").val())*60000+parseInt($("#secInput").val())*1000)
    startingTime.wtime = (parseInt($("#minInput").val())*60000+parseInt($("#secInput").val())*1000)
    startingTime.btime = (parseInt($("#minInput").val())*60000+parseInt($("#secInput").val())*1000)
    fetch("/boardSetup", {
        method: "POST",
        headers: {
        "Content-Type": "application/json"
        },
        body: JSON.stringify({ trigger: true })
    })
    .then(res => res.json())
    .then(data => {
        currentBoard = data.message
        whiteActive = 1
        updateBoard()
        timeFetch("initTimer")
        boardActive = true
        $(".line").empty()
        $(".mhEntry").remove()
        $("#whiteTime").css("background-color", "#e9ecef")
        $("#blackTime").css("background-color", "#868e96")
        $("#overlay").css("opacity", "0")
        runTimer = true
        boardHistory = [
            [[21, 19, 20, 22, 17, 20, 19, 21],
            [18, 18, 18, 18, 18, 18, 18, 18],
            [0, 0, 0, 0, 0, 0, 0, 0],
            [0, 0, 0, 0, 0, 0, 0, 0],
            [0, 0, 0, 0, 0, 0, 0, 0],
            [0, 0, 0, 0, 0, 0, 0, 0],
            [10, 10, 10, 10, 10, 10, 10, 10],
            [13, 11, 12, 14, 9, 12, 11, 13]]
        ]
        halfMoves = 0
        displayedBoard = 0
        timerUpdates()
    });
    playerIsWhite = true
    $("#mid").css("pointer-events", "false")
    $("#mid").css("z-index", "-100")
    $("#mid").children().css("pointer-events", "false")
    $("#mid").animate({
        opacity: 0
    }, {
        duration: 100,
        easing: "swing"
    })
    $("#support").css("pointer-events", "false")
    $("#support").css("z-index", "-100")
    $("#support").children().css("pointer-events", "false")
    $("#support").animate({
        opacity: 0
    }, {
        duration: 100,
        easing: "swing"
    })
    $("#board").empty()
    for(let i=8;i>=1;i--){
        $("#board").append("<div></div>").children().last().addClass("row row"+i)
        for(let j=1;j<=8;j++){
            $(".row"+i).append("<div></div>").children().last().addClass("square " + String.fromCharCode(96+j) + i.toString() + " " + ((i+j)%2==0 ? "black" : "white"))
            $(".row"+i).children().last().append("<img>").children().last().addClass("pieceImg img" + String.fromCharCode(96+j) + i.toString()).attr("src", "0.png")
        }
    }
})

$("#playBlack").on("mouseup", function(){
    fetch("/reset", {
        method: "POST",
        headers: {
        "Content-Type": "application/json"
        },
        body: JSON.stringify({ placehold:  false})
    })
    stockfish.postMessage("setoption name Skill Level value ") + $("#strength").val()
    currentTime.wtime = (parseInt($("#minInput").val())*60000+parseInt($("#secInput").val())*1000)
    currentTime.btime = (parseInt($("#minInput").val())*60000+parseInt($("#secInput").val())*1000)
    startingTime.wtime = (parseInt($("#minInput").val())*60000+parseInt($("#secInput").val())*1000)
    startingTime.btime = (parseInt($("#minInput").val())*60000+parseInt($("#secInput").val())*1000)
    fetch("/boardSetup", {
        method: "POST",
        headers: {
        "Content-Type": "application/json"
        },
        body: JSON.stringify({ trigger: true })
    })
    .then(res => res.json())
    .then(data => {
        currentBoard = data.message
        whiteActive = 1
        updateBoard()
        timeFetch("initTimer")
        boardActive = true
        $(".line").empty()
        $(".mhEntry").remove()
        $("#whiteTime").css("background-color", "#e9ecef")
        $("#blackTime").css("background-color", "#868e96")
        $("#overlay").css("opacity", "0")
        runTimer = true
        boardHistory = [
            [[21, 19, 20, 22, 17, 20, 19, 21],
            [18, 18, 18, 18, 18, 18, 18, 18],
            [0, 0, 0, 0, 0, 0, 0, 0],
            [0, 0, 0, 0, 0, 0, 0, 0],
            [0, 0, 0, 0, 0, 0, 0, 0],
            [0, 0, 0, 0, 0, 0, 0, 0],
            [10, 10, 10, 10, 10, 10, 10, 10],
            [13, 11, 12, 14, 9, 12, 11, 13]]
        ]
        halfMoves = 0
        displayedBoard = 0
    });
    playerIsWhite = false
    $("#mid").css("pointer-events", "false")
    $("#mid").css("z-index", "-100")
    $("#mid").children().css("pointer-events", "false")
    $("#mid").animate({
        opacity: 0
    }, {
        duration: 100,
        easing: "swing"
    })
    $("#support").css("pointer-events", "false")
    $("#support").css("z-index", "-100")
    $("#support").children().css("pointer-events", "false")
    $("#support").animate({
        opacity: 0
    }, {
        duration: 100,
        easing: "swing"
    })
    $("#board").empty()
    for(let i=1;i<=8;i++){
        $("#board").append("<div></div>").children().last().addClass("row row"+i)
        for(let j=8;j>=1;j--){
            $(".row"+i).append("<div></div>").children().last().addClass("square " + String.fromCharCode(96+j) + i.toString() + " " + ((i+j)%2==0 ? "black" : "white"))
            $(".row"+i).children().last().append("<img>").children().last().addClass("pieceImg img" + String.fromCharCode(96+j) + i.toString()).attr("src", "0.png")
        }
    }
    fetch("/rqFen", {
        method: "POST",
        headers: {
        "Content-Type": "application/json"
        },
        body: JSON.stringify({ placehold:  false})
    })
    .then(res => res.json())
    .then(data => {
        currentFEN = data.message
        stockfish.postMessage("position fen " + currentFEN)
        stockfish.postMessage("go wtime " + String(currentTime["wtime"]) + " btime " + String(currentTime["btime"]))
        analysis.postMessage("position fen " + currentFEN)
        analysis.postMessage("go depth 16")
    });
})

//#endregion

//#region Options Panel

$("#toggleAnalysis").on("mouseup", function(){
    showAnalysis = !showAnalysis
    $(".pieceImg").not(exclusion).css("background-color", "transparent")
    $(".inEngineDetails").css("color", (showAnalysis == true ? "#f1f3f5" : "transparent"))
    $(".line").css("color", (showAnalysis == true ? "#f1f3f5" : "transparent"))
    $("#toggleAnalysis").html("Toggle Analysis: " + (showAnalysis == true ? "On" : "Off"))
    $("#toggleAnalysis").css("background-color", (showAnalysis == true ? "green" : "#800000"))
    $("#evalLeft").css("opacity", (showAnalysis == true ? "100%" : "0%"))
    $("#board").css({"border-top-left-radius": (showAnalysis == true ? "0vh" : "1vh"), "border-bottom-left-radius": (showAnalysis == true ? "0vh" : "1vh")})
    attackers()
})
//Turns on and off analysis and attacker displays

$("#toggleEngine").on("mouseup", function(){
    playingEngine = !playingEngine
    $("#toggleEngine").html("Toggle Engine: " + (playingEngine == true ? "On" : "Off"))
    $("#toggleEngine").css("background-color", (playingEngine == true ? "green" : "#800000"))
})
//Turns on and off the engine which plays against the player

$("#toggleTimers").on("mouseup", function(){
    showTimers = !showTimers
    $("#whiteTime").css("color", (showTimers == true ? "#101113" : "transparent"))
    $("#blackTime").css("color", (showTimers == true ? "#f1f3f5" : "transparent"))
    $("#toggleTimers").html("Show Timers: " + (showTimers == true ? "On" : "Off"))
    $("#toggleTimers").css("background-color", (showTimers == true ? "green" : "#800000"))
})
//Shows or hides time remaining per side

$("#exportFen").on("mouseup", function(){
    fetch("/rqFen", {
        method: "POST",
        headers: {
        "Content-Type": "application/json"
        },
        body: JSON.stringify({ placehold:  false})
    })
    .then(res => res.json())
    .then(data => {
        navigator.clipboard.writeText(data.message)
        alert("Copied the text: " + data.message)
    });
})
//Copies the current FEN to clipboard

$("#surrender").on("mouseup", function(){
    if(playingEngine == false){
        winner = (whiteActive==true ? "Black" : "White")
        status = "forfeit"
        endGame()
    } else{
        winner = (playerIsWhite==true ? "Black" : "White")
        status = "forfeit"
        endGame()
    }
})
//Ends the game immediately as the player's loss

$("#pawnPromotion").on("mouseup", function(){
    promotion = ["r", "b", "n", "q"][["q", "r", "b", "n"].indexOf(promotion)]
    $("#pawnPromotion").html("Pawn Promotes To: " + ["Queen", "Rook", "Bishop", "Knight"][["q", "r", "b", "n"].indexOf(promotion)])
})
//Cycles between which piece to promote pawns to

//#endregion

//#endregion