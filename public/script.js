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

let movableSquares = []
let status = ""

let moveHistory = ""
let mhWhite = []
let mhBlack = []
let runTimer = true

var wasmSupported = typeof WebAssembly === 'object' && WebAssembly.validate(Uint8Array.of(0x0, 0x61, 0x73, 0x6d, 0x01, 0x00, 0x00, 0x00));

var stockfish = new Worker(wasmSupported ? 'stockfish.wasm.js' : 'stockfish.js');

initialisePage()

$(document).ready(function(e){
    timeFetch("resetTimer") 
})

stockfish.addEventListener('message', function (e) {
    console.log(e.data);
    if(e.data === "uciok"){
        stockfish.postMessage("ucinewgame");
        stockfish.postMessage("isready");
    }
    else if(e.data === "readyok"){
        stockfish.postMessage("position name startpos")
        stockfish.postMessage("setoption name Skill Level value 20")
        stockfish.postMessage("setoption name MultiPV value 5")
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
            timeFetch("switchTimer")
            setTimeout(() => {
                updateHistory()
                addBoard()
            }, 50);
        });
    }
    else if(e.data.includes("info") == true){
        let pv = e.data.split(" ")[e.data.split(" ").indexOf("multipv")+1]
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
        if(pv==1){
            let whiteActive = 1
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
                let eval = ((e.data.split(" ")[e.data.split(" ").indexOf("cp") + 1] * -whiteActive)/100 + 0.2)
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
                $("#evalScore").html((eval>=0 ? "+" : "") + eval)
                //console.log((50+ (((-0.5*eval)/(Math.sqrt(400+Math.pow(eval, 2)))))*100))
                //$("#evalLeftFill").css("height", ((50+ (((-0.5*eval)/(Math.sqrt(400+Math.pow(eval, 2)))))*100).toString() + "%"))
                $("#evalLeftFill").animate({
                    height: ((50+ (((-0.5*eval)/(Math.sqrt(400+Math.pow(eval, 2)))))*100).toString() + "%")
                    }, {
                    duration: 100,
                    easing: "swing"
                })
                //console.log("evaluation is: " + eval)
            }
            else if(e.data.includes("mate") == true){
                //console.log("mate in: " + (e.data.split(" ")[e.data.split(" ").indexOf("mate") + 1] * -whiteActive))
                //$("#evalLeftFill").css("height", (whiteActive==true ? "100%" : "0%"))
                $("#evalLeftFill").animate({
                    height: (whiteActive==true ? "100%" : "0%")
                    }, {
                    duration: 100,
                    easing: "swing"
                })
            }
            else{
                //console.log("evaluation error")
            }
        }
        //console.log(e.data.split(" pv ")[1])
        fetch("/convert", {
            method: "POST",
            headers: {
            "Content-Type": "application/json"
            },
            body: JSON.stringify({line: e.data.split(" pv ")[1]})
        })
        .then(res => res.json())
        .then(data => {
            let lineOutput = moveHistory.concat(data.message)
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
    }
});

stockfish.postMessage("uci");

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
            //console.log(data.message)
            moveHistory = data.message
    });
    mhWhite = []
    mhBlack = []
    for(let i=0;i<moveHistory.length;i++){
        console.log(i)
        if(i%2==0){
            mhWhite.push(moveHistory[i])
        } else{
            mhBlack.push(moveHistory[i])
        }
        console.log(moveHistory)
        //console.log(mhWhite)
        //console.log(mhBlack)
        $(".historyColumn").empty()
        mhBlack.map(function(cv, index, arr){
            $("#moveHistoryRight").append("<div>" + cv + "</div>").children().last().addClass("mhEntry")
        })
        mhWhite.map(function(cv, index, arr){
            $("#moveHistoryLeft").append("<div>" + cv + "</div>").children().last().addClass("mhEntry")
        })
    }
}

function updateBoard(){
    for(let i=8;i>0;i--){
        for(let j=0;j<8;j++){
            $(".img" + String.fromCharCode(97+j) + i.toString()).attr("src", currentBoard[8-i][j] + ".png")
        }
    }
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
            currentTime["wtime"] = (startingTime["wtime"]-data.wtime)
            currentTime["btime"] = (startingTime["btime"]-data.btime)
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
                } else{
                    $("#blackTime").html("00:00.000")
                    $("#blackTime").css("background-color", "red")
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
    $("#moveHistoryContainer").append("<div id='moveHistoryLeft'></div>").children().last().addClass("historyColumn")
    $("#moveHistoryContainer").append("<div id='moveHistoryRight'></div>").children().last().addClass("historyColumn")
    $("#rightPanel").append("<div id='timerContainer'></div>").children().last().addClass("inRightPanel")
    $("#timerContainer").append("<div id='whiteTime'></div>").children().last().addClass("timer")
    $("#timerContainer").append("<div id='blackTime'></div>").children().last().addClass("timer")
    $("#rightPanel").append("<div id='gameDetails'></div>").children().last().addClass("inRightPanel")
    $("#gameDetails").append("<button id='testButton'>Set Up Board</button>")
    $("#gameDetails").append("<button id='trigger'>Evaluate Position</button>")

    $("#boardContainer").append("<div id='vspacer3'></div>").children().last().addClass("boardAlignH vspacer")

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

    $(".line").empty()
    $(".mhEntry").remove()
}   

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
    });
}

function addBoard(){
    boardHistory.push(currentBoard)
    displayedBoard++;
    halfMoves++;
}

$("#trigger").click(function(){
    updateBoard()
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
    });
})

$("#testButton").click(function(){
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
        updateBoard()
        updateHistory
        timeFetch("initTimer")
        $(".line").empty()
        $(".mhEntry").remove()
        $("#whiteTime").css("background-color", "tan")
        $("#blackTime").css("background-color", "forestgreen")
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
})

$(".pieceImg").on("mouseup", function(){
    let newSquare = true
    $(".pieceImg").css("background-color", "transparent")
    let clickedSquare = $(this).attr("class").split(" ")[1].substring(3,5)
    for(let i=0;i<movableSquares.length;i++){
        //console.log(movableSquares[i])
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
            });        
            setTimeout(() => {
                addBoard()
                updateHistory()
            }, 50);
            $("#trigger").click();
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