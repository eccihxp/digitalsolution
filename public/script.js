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
    wtime: 120000,
    btime: 120000
}
let startingTime = {
    wtime: 120000,
    btime: 120000
}

let currentFEN = ""

let movableSquares = []

let moveHistory = ""

var wasmSupported = typeof WebAssembly === 'object' && WebAssembly.validate(Uint8Array.of(0x0, 0x61, 0x73, 0x6d, 0x01, 0x00, 0x00, 0x00));

var stockfish = new Worker(wasmSupported ? 'stockfish.wasm.js' : 'stockfish.js');

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
        stockfish.postMessage("setoption name Skill Level value 1")
        stockfish.postMessage("setoption name MultiPV value 5")
    }
    else if(e.data.includes("bestmove") == true){
        console.log(e.data.split(" ")[1])
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
            console.log(data.message)
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
                let eval = (e.data.split(" ")[e.data.split(" ").indexOf("cp") + 1] * -whiteActive)/100
                console.log((50+ (((-0.5*eval)/(Math.sqrt(400+Math.pow(eval, 2)))))*100))
                $("#evalLeftFill").css("height", ((50+ (((-0.5*eval)/(Math.sqrt(400+Math.pow(eval, 2)))))*100).toString() + "%"))
                console.log("evaluation is: " + eval)
            }
            else if(e.data.includes("mate") == true){
                console.log("mate in: " + (e.data.split(" ")[e.data.split(" ").indexOf("mate") + 1] * -whiteActive))
                $("#evalLeftFill").css("height", (whiteActive==true ? "100%" : "0%"))
            }
            else{
                console.log("evaluation error")
            }
        }
        console.log(e.data.split(" pv ")[1])
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
            console.log(data.message)
        });
    }
});

stockfish.postMessage("uci");

function updateBoard(){
    for(let i=8;i>0;i--){
        for(let j=0;j<8;j++){
            $(".img" + String.fromCharCode(97+j) + i.toString()).attr("src", currentBoard[8-i][j] + ".png")
        }
    }
}

async function timerUpdates() {
    while (true) {
        timeFetch("updateTimer")
        await new Promise(resolve => setTimeout(resolve, 1/604))
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
    //console.log(Math.floor(currentTime["wtime"]/60000) + ":" + Math.floor(Math.floor(currentTime["wtime"]%60000)/1000) + "." + Math.floor(currentTime["wtime"]%1000))
    let m = {w: Math.floor(currentTime["wtime"]/60000), b: Math.floor(currentTime["btime"]/60000)}
    let s = {w: Math.floor(Math.floor(currentTime["wtime"]%60000)/1000), b: Math.floor(Math.floor(currentTime["btime"]%60000)/1000)}
    let ms = {w: Math.floor(currentTime["wtime"]%1000), b: Math.floor(currentTime["btime"]%1000)}
    $("#whiteTime").html((m.w<10 ? "0"+m.w : m.w ) + ":" + (s.w<10 ? "0"+s.w : s.w) + "." + (ms.w.toString().length==3 ? ms.w : (ms.w.toString().length==2? "0" + ms.w : "00" + ms.w)))
    $("#blackTime").html((m.b<10 ? "0"+m.b : m.b ) + ":" + (s.b<10 ? "0"+s.b : s.b) + "." + (ms.b.toString().length==3 ? ms.b : (ms.b.toString().length==2? "0" + ms.b : "00" + ms.b)))
}

$("body").append("<div id='vspacer1'></div>").children().last().addClass("boardAlignH vspacer")
$("body").append("<div id='evalLeft'></div>").children().last().addClass("boardAlignH")
$("#evalLeft").append("<div id='evalLeftFill'></div>")
$("body").append("<div id='board'></div>").children().last().addClass("boardAlignH")
for(let i=8;i>=1;i--){
    $("#board").append("<div></div>").children().last().addClass("row row"+i)
    for(let j=1;j<=8;j++){
        $(".row"+i).append("<div></div>").children().last().addClass("square " + String.fromCharCode(96+j) + i.toString() + " " + ((i+j)%2==0 ? "black" : "white"))
        $(".row"+i).children().last().append("<img>").children().last().addClass("pieceImg img" + String.fromCharCode(96+j) + i.toString()).attr("src", "0.png")
    }
}
$("body").append("<div id='vspacer2'></div>").children().last().addClass("boardAlignH vspacer")
$("body").append("<div id='rightPanel'></div>").children().last().addClass("boardAlignH")
$("#rightPanel").append("<div id='engineDetails'></div").children().last().addClass("inRightPanel")
$("#rightPanel").append("<div id='line1'></div").children().last().addClass("inRightPanel line")
$("#rightPanel").append("<div id='line2'></div").children().last().addClass("inRightPanel line")
$("#rightPanel").append("<div id='line3'></div").children().last().addClass("inRightPanel line")
$("#rightPanel").append("<div id='line4'></div").children().last().addClass("inRightPanel line")
$("#rightPanel").append("<div id='line5'></div").children().last().addClass("inRightPanel line")
$("#rightPanel").append("<div id='moveHistoryContainer'></div").children().last().addClass("inRightPanel")
$("#rightPanel").append("<div id='timerContainer'></div>").children().last().addClass("inRightPanel")
$("#timerContainer").append("<div id='whiteTime'></div>").children().last().addClass("timer")
$("#timerContainer").append("<div id='blackTime'></div>").children().last().addClass("timer")
$("#rightPanel").append("<div id='gameDetails'></div").children().last().addClass("inRightPanel")
$("#gameDetails").append("<button id='testButton'>Set Up Board</button>")
$("#gameDetails").append("<button id='trigger'>Evaluate Position</button>")
$("body").append("<div id='vspacer3'></div>").children().last().addClass("boardAlignH vspacer")

$("#trigger").click(function(){
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
                console.log("FEN FOUND: " + data.message)
                console.log("current FEN: " + currentFEN)
                timeFetch("switchTimer")
                stockfish.postMessage("position fen " + currentFEN)
                console.log(String(currentTime["wtime"]))
                console.log("go wtime " + String(currentTime["wtime"]) + " btime " + String(currentTime["btime"]))
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
        timeFetch("initTimer")
    });
})

$(".pieceImg").on("mouseup", function(){
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
                console.log(data.message);
                currentBoard = data.message
                updateBoard()
            });
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