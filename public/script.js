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
let currentTime = {
    wtime: 60000,
    btime: 60000
}
let startingTime = {
    wtime: 60000,
    btime: 60000
}
let increment = 0

let currentFEN = ""
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
let displayedBoard = 0
let halfMoves = 0
let playerIsWhite = true
let winner = "White"

let movableSquares = []
let status = ""

let moveHistory = ""
let mhWhite = []
let mhBlack = []
let runTimer = true
let playingEngine = true

var wasmSupported = typeof WebAssembly === 'object' && WebAssembly.validate(Uint8Array.of(0x0, 0x61, 0x73, 0x6d, 0x01, 0x00, 0x00, 0x00));

var stockfish = new Worker(wasmSupported ? 'stockfish.wasm.js' : 'stockfish.js');
var analysis = new Worker(wasmSupported ? 'analysis.wasm.js' : 'analysis.js');

initialisePage()

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

stockfish.addEventListener('message', function (e) {
    //console.log(e.data);
    if(e.data === "uciok"){
        stockfish.postMessage("ucinewgame");
        stockfish.postMessage("isready");
    }
    else if(e.data === "readyok"){
        stockfish.postMessage("position name startpos")
        stockfish.postMessage("setoption name Skill Level value 20")
    }
    else if(e.data.includes("bestmove") == true){
        //console.log(e.data.split(" ")[1])
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

stockfish.postMessage("uci");

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
                console.log(eval)
                eval = eval.toPrecision(4).toString()
                console.log(eval)
                eval = eval.padEnd(9, "0").substring(0, eval.toString().includes("-")==true ? 6 : 5)
                console.log(eval)
                let depth = (e.data.split(" ")[e.data.split(" ").indexOf("depth") + 1])
                let nps = Math.round(e.data.split(" ")[e.data.split(" ").indexOf("nps") + 1]/1000)
                let nodes = Math.round(e.data.split(" ")[e.data.split(" ").indexOf("nodes") + 1]/1000)
                $("#nodeDetails").html(nodes + "k nodes at " + nps + "k/s")
                $("#depth").html("<strong>Depth:</strong> " + depth)
                if(e.data.split(" ")[e.data.split(" ").indexOf("depth")+1]>12){
                    $("#evalScore").html((eval>=0 ? "+" : "") + eval)
                    //console.log((50+ (((-0.5*eval)/(Math.sqrt(400+Math.pow(eval, 2)))))*100))
                    //$("#evalLeftFill").css("height", ((50+ (((-0.5*eval)/(Math.sqrt(400+Math.pow(eval, 2)))))*100).toString() + "%"))
                    $("#evalLeftFill").animate({
                        height: ((50+ (((-0.5*eval)/(Math.sqrt(400+Math.pow(eval, 2)))))*100).toString() + "%")
                        }, {
                        duration: 50,
                        easing: "swing"
                    })
                    //console.log("evaluation is: " + eval)
                }
            }
            else if(e.data.includes("mate") == true){
                //console.log("mate in: " + (e.data.split(" ")[e.data.split(" ").indexOf("mate") + 1] * -whiteActive))
                //$("#evalLeftFill").css("height", (whiteActive==true ? "100%" : "0%"))
                $("#evalLeftFill").animate({
                    height: (halfMoves%2==0 ? "100%" : "0%")
                    }, {
                    duration: 100,
                    easing: "swing"
                })
            }
            else{
                //console.log("evaluation error")
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
            //console.log(data.message)
            moveHistory = data.message
        });
        let lineMH = moveHistory.concat(e.data.split(" pv ")[1].split(" "))
        console.log(lineMH)
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
            console.log(lineOutput)
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
            //console.log(data.message)
        });
        //console.log(e.data.split(" pv ")[1])
        /*fetch("/rqFen", {
            method: "POST",
            headers: {
            "Content-Type": "application/json"
            },
            body: JSON.stringify({ placehold:  false})
        })
        .then(res => res.json())
        .then(data => {
            currentFEN = data.message
            
            fetch("/convert", {
                method: "POST",
                headers: {
                "Content-Type": "application/json"
                },
                body: JSON.stringify({line: e.data.split(" pv ")[1], fen: data.message})
            })
            .then(res => res.json())
            .then(data => {
                let lineOutput = data.message
                console.log(lineOutput)
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
                //console.log(data.message)
            });
        });*/
    }
});

analysis.postMessage("uci");

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
    });
}

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
}

async function timerUpdates() {
    while (runTimer) {
        timeFetch("updateTimer")
        await new Promise(resolve => setTimeout(resolve, 1000/60))
    }
} 
timerUpdates();

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
                console.log(currentTime)
                if(halfMoves%2==1){
                    startingTime["wtime"]+=increment
                } else{
                    startingTime["btime"]+=increment
                }
            }
            currentTime["wtime"] = (startingTime["wtime"]-data.wtime)
            currentTime["btime"] = (startingTime["btime"]-data.btime)
            console.log(currentTime)
            assignTime()
    });
}

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
    $("#gameDetails").append("<div id='engineOptions'></div>").children().last().addClass("options")
    $("#engineOptions").append("<button id='toggleAnalysis'></button>").children().last().addClass("analysisButton")
    $("#engineOptions").append("<button id='toggleEngine'></button>").children().last().addClass("analysisButton")
    $("#gameDetails").append("<div id='gameOptions'></div>").children().last().addClass("options")
    $("#gameOptions").append("<button id='exportFen'></button>").children().last().addClass("gameButton")
    $("#gameOptions").append("<button id='surrender'></button>").children().last().addClass("gameButton")

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
    $("#mid").append("<div id='minTitle'>Minutes: 30</div>").children().last().addClass("midlane")
    $("#mid").append("<input id='minInput' type='range' min='0' max='60' step='1' />").children().last().addClass("midlane slider")
    $("#mid").append("<div id='secTitle'>Seconds: 30</div>").children().last().addClass("midlane")
    $("#mid").append("<input id='secInput' type='range' min='0' max='60' step='1' />").children().last().addClass("midlane slider")
    $("#mid").append("<div id='incTitle'>Increment: 0s</div>").children().last().addClass("midlane")
    $("#mid").append("<input id='incInput' type='range' min='0' max='60' step='1' value='0'/>").children().last().addClass("midlane slider")
    $("#mid").append("<button id='playWhite' value='Play as White'>Play as White</button>").children().last().addClass("midlane colorButton")
    $("#mid").append("<button id='playBlack' value='Play as Black'>Play as Black</button>").children().last().addClass("midlane colorButton")

    $(".line").empty()
    $(".mhEntry").remove()
}   

function gamestate(){
    //"checkmate", "fifty moves", "insufficient material", "stalemate", "threefold", "normal", "timeout"
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
        console.log(status)
        endGame()
    });
}

function endGame(){
    if(["checkmate", "timeout", "forfeit"].includes(status)){
        timeFetch("stopTimer")
        if(status=="timeout"){
            winner = (currentTime["wtime"]>currentTime["btime"] ? "White" : "Black")
        } else if(status=="forfeit"){
            winner = (playerIsWhite ? "Black" : "White")
        } else{
            winner = (halfMoves%2==0 ? "Black" : "White")
        }
        console.log("APPLY OVERLAY")
        $("#overlay").css("background-color", "red")
        let lossResponses = ["By Checkmate", "By Timeout", "By Surrender"]
        $("#midTitle").html(winner + " Wins")
        $("#midSubtitle").html(lossResponses[["checkmate", "timeout", "forfeit"].indexOf(status)])
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
        }, 500)
    } else if(["fifty moves", "insufficient material", "stalemate", "threefold", "agreement"].includes(status)){
        timeFetch("stopTimer")
        console.log("APPLY OVERLAY")
        $("#overlay").css("background-color", "yellow")
        let drawResponses = ["By Fifty Move Rule", "By Insufficient Material", "By Stalemate", "By Threefold Repetition", "By Agreement"]
        $("#midTitle").html("Draw")
        $("#midSubtitle").html(drawResponses[["checkmate", "timeout", "forfeit"].indexOf(status)])
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
        }, 500)
    }
}

function addBoard(){
    boardHistory.push(currentBoard)
    displayedBoard++;
    halfMoves++;
}

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
        //console.log("FEN FOUND: " + data.message)
        //console.log("current FEN: " + currentFEN)
        timeFetch("switchTimer")
        stockfish.postMessage("position fen " + currentFEN)
        //console.log(String(currentTime["wtime"]))
        //console.log("go wtime " + String(currentTime["wtime"]) + " btime " + String(currentTime["btime"]))
        stockfish.postMessage("go wtime " + String(currentTime["wtime"]) + " btime " + String(currentTime["btime"]))
        analysis.postMessage("position fen " + currentFEN)
        analysis.postMessage("go depth 16")
    });
}

$("#board").on("click", ".pieceImg", function(){
    let newSquare = true
    $(".pieceImg").css("background-color", "transparent")
    let clickedSquare = $(this).attr("class").split(" ")[1].substring(3,5)
    for(let i=0;i<movableSquares.length;i++){
        console.log(movableSquares[i])
        if(clickedSquare == movableSquares[i]["to"]){
            newSquare = false
            fetch("/makeMove", {
                method: "POST",
                headers: {
                "Content-Type": "application/json"
                },
                body: JSON.stringify({ moveMade:  clickedSquare})
            })
            .then(res => res.json())
            .then(data => {
                //console.log(data.message);
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
                        //console.log("FEN FOUND: " + data.message)
                        //console.log("current FEN: " + currentFEN)
                        timeFetch("switchTimer")
                        analysis.postMessage("position fen " + currentFEN)
                        analysis.postMessage("go depth 16")
                    });
                }
            });
        }
    }
    if (newSquare = true){
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
            for(let i=0;i<data.message.length;i++){
                $(".img" + data.message[i]["to"]).css("background-color", "red")
            }
        });
    }
})

$("#fback").on("mouseup", function(){
    displayedBoard = 0
    currentBoard = boardHistory[0]
    updateBoard()
})

$("#back").on("mouseup", function(){
    displayedBoard = (displayedBoard==0 ? 0 : displayedBoard-1)
    currentBoard = boardHistory[displayedBoard]
    updateBoard()
})

$("#fwd").on("mouseup", function(){
    displayedBoard = (displayedBoard==halfMoves ? displayedBoard : displayedBoard+1)
    currentBoard = boardHistory[displayedBoard]
    updateBoard()
})

$("#ffwd").on("mouseup", function(){
    displayedBoard = halfMoves
    currentBoard = boardHistory[displayedBoard]
    updateBoard()
})

$("#pause").on("mouseup", function(){
    console.log(halfMoves-displayedBoard)
    for(let i=0;i<(halfMoves-displayedBoard);i++){
        setTimeout(() => {
            displayedBoard++
            currentBoard=boardHistory[displayedBoard]
            updateBoard()
        }, 250*i);
    }
})

$("#strengthInput").on("change", function(){
    stockfish.postMessage("setoption name Skill Level value ") + this.value
    $("#strengthTitle").html("Strength: " + this.value)
})

$("#minInput").on("change", function(){
    $("#minTitle").html("Minutes: " + this.value)
    console.log(parseInt($("#minInput").val()))
    currentTime.wtime = (parseInt($("#minInput").val())*60000+parseInt($("#secInput").val())*1000)
    currentTime.btime = (parseInt($("#minInput").val())*60000+parseInt($("#secInput").val())*1000)
    startingTime.wtime = (parseInt($("#minInput").val())*60000+parseInt($("#secInput").val())*1000)
    startingTime.btime = (parseInt($("#minInput").val())*60000+parseInt($("#secInput").val())*1000)
    console.log(currentTime)
    console.log(startingTime)
})

$("#secInput").on("change", function(){
    $("#secTitle").html("Seconds: " + this.value)
    currentTime.wtime = (parseInt($("#minInput").val())*60000+parseInt($("#secInput").val())*1000)
    currentTime.btime = (parseInt($("#minInput").val())*60000+parseInt($("#secInput").val())*1000)
    startingTime.wtime = (parseInt($("#minInput").val())*60000+parseInt($("#secInput").val())*1000)
    startingTime.btime = (parseInt($("#minInput").val())*60000+parseInt($("#secInput").val())*1000)
    console.log(currentTime)
    console.log(startingTime)
})

$("#incInput").on("change", function(){
    $("#incTitle").html("Increment: " + this.value + "s")
    increment = this.value*1000
})

$("#playWhite").on("mouseup", function(){
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
        //console.log("FEN FOUND: " + data.message)
        //console.log("current FEN: " + currentFEN)
        stockfish.postMessage("position fen " + currentFEN)
        //console.log(String(currentTime["wtime"]))
        //console.log("go wtime " + String(currentTime["wtime"]) + " btime " + String(currentTime["btime"]))
        stockfish.postMessage("go wtime " + String(currentTime["wtime"]) + " btime " + String(currentTime["btime"]))
        analysis.postMessage("position fen " + currentFEN)
        analysis.postMessage("go depth 16")
    });
})