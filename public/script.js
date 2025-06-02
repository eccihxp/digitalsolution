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
    wtime: 600000,
    btime: 600000
}

let currentFEN = ""

let movableSquares = []

var wasmSupported = typeof WebAssembly === 'object' && WebAssembly.validate(Uint8Array.of(0x0, 0x61, 0x73, 0x6d, 0x01, 0x00, 0x00, 0x00));

var stockfish = new Worker(wasmSupported ? 'stockfish.wasm.js' : 'stockfish.js');

stockfish.addEventListener('message', function (e) {
    console.log(e.data);
    if(e.data === "uciok"){
        stockfish.postMessage("ucinewgame");
        stockfish.postMessage("isready");
    }
    else if(e.data === "readyok"){
        stockfish.postMessage("position name startpos")
        stockfish.postMessage("setoption name Skill Level value 1")
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
            console.log(data.message);
            currentBoard = data.message
            updateBoard()
            switchTimer()
        });
    }
    else if(e.data.includes("info") == true){
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
            console.log("evaluation is: " + (e.data.split(" ")[e.data.split(" ").indexOf("cp") + 1] * -whiteActive))
        }
        else if(e.data.includes("mate") == true){
            console.log("mate in: " + (e.data.split(" ")[e.data.split(" ").indexOf("mate") + 1] * -whiteActive))
        }
        else{
            console.log("evaluation error")
        }
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

function updateTime(){
    fetch("/updateTime", {
                method: "POST",
                headers: {
                "Content-Type": "application/json"
                },
                body: JSON.stringify({placehold: true})
        })
        .then(res => res.json())
        .then(data => {
            currentTime["wtime"] = data.wtime
            currentTime["btime"] = data.btime
            console.log("white time: " + data.wtime + ", black time: " + data.btime);
        });
}

function initTimer(){
    fetch("/initTimer ", {
                method: "POST",
                headers: {
                "Content-Type": "application/json"
                },
                body: JSON.stringify({placehold: true})
        })
        .then(res => res.json())
        .then(data => {
            currentTime["wtime"] = data.wtime
            currentTime["btime"] = data.btime
            console.log("white time: " + data.wtime + ", black time: " + data.btime);
        });
}

function switchTimer(){
    fetch("/switchTimer ", {
                method: "POST",
                headers: {
                "Content-Type": "application/json"
                },
                body: JSON.stringify({placehold: true})
        })
        .then(res => res.json())
        .then(data => {
            currentTime["wtime"] = data.wtime
            currentTime["btime"] = data.btime
            console.log("white time: " + data.wtime + ", black time: " + data.btime);
        });
}

$("body").append("<div id='board'></div>")
for(let i=8;i>=1;i--){
    $("#board").append("<div></div>").children().last().addClass("row row"+i)
    for(let j=1;j<=8;j++){
        $(".row"+i).append("<div></div>").children().last().addClass("square " + String.fromCharCode(96+j) + i.toString() + " " + ((i+j)%2==0 ? "black" : "white"))
        $(".row"+i).children().last().append("<img>").children().last().addClass("pieceImg img" + String.fromCharCode(96+j) + i.toString()).attr("src", "0.png")
    }
}

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
                switchTimer()
                stockfish.postMessage("position fen " + currentFEN)
                stockfish.postMessage("go depth 11")
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
        initTimer()
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