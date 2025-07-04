const express = require('express')
const app = express()
const port = 3000
const {Chess} = require('chess.js')
const {Timer} = require('timer-node')

let chessClock = {w: new Timer(), b: new Timer()}

app.use(express.json())
app.use(express.static('public'))

app.listen(port, () => {
    console.log(`Server running at http://localhost:${port}`)
})

app.post('/history', (req, res) => {
    console.log('Getting Move History');
    res.json({message: game.history()}); // <-- JSON response
});

app.post('/convert', (req, res) => {
    console.log('Converting Engine Line');
    let evalGame = new Chess(game.fen())
    console.log(req.body.line)
    console.log(req.body.line.split(" "))
    req.body.line.split(" ").map(function(e){
        evalGame.move(e)
    })
    res.json({message: evalGame.history()}); // <-- JSON response
});

app.post('/evaluate', (req, res) => {
    console.log('Evaluation');
    res.json({message: "Evaluation"}); // <-- JSON response
});

app.post('/initTimer', (req, res) => {
    console.log('Creating Timer');
    chessClock["w"] = new Timer()
    chessClock["w"].start()
    chessClock["b"] = new Timer()
    console.log({wtime: chessClock["w"].ms(), btime: chessClock["b"].ms()})
    res.json({wtime: chessClock["w"].ms(), btime: chessClock["b"].ms()}); // <-- JSON response
});

app.post('/resetTimer', (req, res) => {
    console.log('Resetting Timer');
    chessClock["w"] = new Timer()
    chessClock["b"] = new Timer()
    console.log({wtime: chessClock["w"].ms(), btime: chessClock["b"].ms()})
    res.json({wtime: chessClock["w"].ms(), btime: chessClock["b"].ms()}); // <-- JSON response
});

app.post('/updateTimer', (req, res) => {
    res.json({wtime: chessClock["w"].ms(), btime: chessClock["b"].ms()}); // <-- JSON response
});

app.post('/switchTimer', (req, res) => {
    console.log('Switching Timer States');
    if(chessClock["w"].isRunning() == true){
        chessClock["w"].pause()
        if(chessClock["b"].isStarted() == false){
            chessClock["b"].start()
        } else{
            chessClock["b"].resume()
        }
    } else{
        chessClock["b"].pause()
        chessClock["w"].resume()
    }
    console.log({wtime: chessClock["w"].ms(), btime: chessClock["b"].ms()})
    res.json({wtime: chessClock["w"].ms(), btime: chessClock["b"].ms()}); // <-- JSON response
});

app.post('/rqSide', (req, res) => {
    console.log('Requesting Side to Move: ' + (game.turn() == "w" ? 1 : -1));
    res.json({message: (game.turn() == "w" ? 1 : -1)}); // <-- JSON response
});

app.post('/rqFen', (req, res) => {
    console.log('Fen Request');
    console.log(game.fen())
    res.json({message: game.fen()}); // <-- JSON response
});

app.post('/boardSetup', (req, res) => {
    console.log('Setting up the Board');
    game = new Chess()
    clickedSquare = ""
    toBoardObject("rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR w KQkq - 0 1")
    assignObject()
    res.json({ message: startingBoard }); // <-- JSON response
});

app.post('/checkMoves', (req, res) => {
    console.log('Checking Moves');
    clickedSquare = req.body.selectedSquare
    res.json({ message: game.moves({verbose: true}).filter(moveFilter) }); // <-- JSON response
});

app.post('/makeMove', (req, res) => {
    console.log('Making Moves');
    game.move((clickedSquare.toString() + req.body.moveMade.toString()).toString(), {sloppy: true})
    toBoardObject(game.fen())
    assignObject()
    res.json({ message: theBoard }); // <-- JSON response
});

app.post('/computerMove', (req, res) => {
    console.log('Making Computer Move');
    game.move(req.body.moveMade.toString(), {sloppy: true})
    toBoardObject(game.fen())
    assignObject()
    res.json({ message: theBoard }); // <-- JSON response
});

let game = new Chess("rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR w KQkq - 0 1")
let clickedSquare = ""
//using the Chess.js package for move validation

const pieceIDs = ["x", "k", "p", "n", "b", "r", "q"]
//index of the piece name corresponds to the piece value which is added to the colour (8 for white, 16 for black) to identify piece

let whiteActive = true
//true if white turn, false if black turn

let castlingRights = {
    white: {kingside: true, queenside: true},
    black: {kingside: true, queenside: true}
}
//kingside: towards the h file; queenside: towards the a file

let enPassantTargetSquare = ""
//present even if there is not a piece able to capture the en passant (leave blank if not applicable, square (eg "e3") otherwise)

let halfmoveClock = 0
//used for 50 move rule and FEN notation

let fullmoveCount = 1
//number of moves since start of game (starts at 1)

let startingBoard = [
    [21, 19, 20, 22, 17, 20, 19, 21],
    [18, 18, 18, 18, 18, 18, 18, 18],
    [0, 0, 0, 0, 0, 0, 0, 0],
    [0, 0, 0, 0, 0, 0, 0, 0],
    [0, 0, 0, 0, 0, 0, 0, 0],
    [0, 0, 0, 0, 0, 0, 0, 0],
    [10, 10, 10, 10, 10, 10, 10, 10],
    [13, 11, 12, 14, 9, 12, 11, 13]
]

let theBoard = [
    [21, 19, 20, 22, 17, 20, 19, 21],
    [18, 18, 18, 18, 18, 18, 18, 18],
    [0, 0, 0, 0, 0, 0, 0, 0],
    [0, 0, 0, 0, 0, 0, 0, 0],
    [0, 0, 0, 0, 0, 0, 0, 0],
    [0, 0, 0, 0, 0, 0, 0, 0],
    [10, 10, 10, 10, 10, 10, 10, 10],
    [13, 11, 12, 14, 9, 12, 11, 13]
]
//board from the starting position of the default version of the game

function toFEN(input){
    let outputFEN = ""
    console.log("start")
    
    // Piece Placement
    for(let i=0;i<8;i++){
        let blankSpace = 0
        for(let j=0;j<8;j++){
            let workingSquare = input[i][j]
            for(let k=0;k<7;k++){
                if(workingSquare == 0){
                    blankSpace += 1
                    break
                } else if(workingSquare%8 == k){
                    if (blankSpace != 0){
                        outputFEN += blankSpace
                        blankSpace = 0
                    }
                    outputFEN += (workingSquare > 16 ? pieceIDs[k] : pieceIDs[k].toUpperCase())
                }
            }
        }
        if(blankSpace == 8){
            outputFEN += blankSpace
            blankSpace = 0
        }
        outputFEN += (i != 7 ? "/" : " ")
    }

    //Side to Move
    outputFEN += (whiteActive == true ? "w " : "b ")

    //Castling Ability
    outputFEN += (castlingRights["white"]["kingside"] == false && castlingRights["white"]["queenside"] == false && castlingRights["black"]["kingside"] == false && castlingRights["black"]["queenside"] == false ? "- " : (castlingRights["white"]["kingside"] == true ? "K" : "") + (castlingRights["white"]["queenside"] == true ? "Q" : "") + (castlingRights["black"]["kingside"] == true ? "k" : "") + (castlingRights["black"]["queenside"] == true ? "q " : " "))

    //En Passant Target Square
    outputFEN += (enPassantTargetSquare != "" ? enPassantTargetSquare + " " : "- ")

    //Halfmove Clock
    outputFEN += halfmoveClock + " "

    //Fullmove Counter
    outputFEN += fullmoveCount

    return outputFEN
}

let workingSections
let workingPositions
let workingActiveSide
let workingCastling
let workingEnPassant
let workingHalfmoveClock
let workingFullmoveCounter

function toBoardObject(input){
    workingSections = input.toString().split(" ")

    // #region Piece Position Data
    workingSections[0] = workingSections[0].toString().split("/")
    workingPositions = [
        [],
        [],
        [],
        [],
        [],
        [],
        [],
        []
    ]
    for(let i=0;i<8;i++){
        while(workingSections[0][i].length != 0){
            if(isNaN(parseInt(workingSections[0][i].substring(0,1))) == false){
                for(let k=0;k<parseInt(workingSections[0][i].substring(0,1));k++){
                    workingPositions[i].push(0)
                }
                workingSections[0][i] = workingSections[0][i].slice(1)
            } else{
                for(let j=0;j<7;j++){
                    if(workingSections[0][i].substring(0,1).toLowerCase() == pieceIDs[j]){
                        workingPositions[i].push((workingSections[0][i].substring(0,1) == workingSections[0][i].substring(0,1).toLowerCase()) ? 16+j : 8+j)
                        workingSections[0][i] = workingSections[0][i].slice(1)
                        break
                    }
                }
            }
        }
    }
    // #endregion

    // #region Side to Move

    workingActiveSide = (workingSections[1] == "w" ? true : false)

    // #endregion

    // #region Castling Ability

    workingCastling = (workingSections[2] == "-" ? {white: {kingside: false, queenside: false}, black: {kingside: false, queenside: false}} : {white: {kingside: (workingSections[2].includes("K") == true ? true: false), queenside: (workingSections[2].includes("Q") == true ? true: false)}, black: {kingside: (workingSections[2].includes("k") == true ? true: false), queenside: (workingSections[2].includes("q") == true ? true: false)}})

    //#endregion
    
    // #region En Passant Target Square

    workingEnPassant = (workingSections[3] == "-" ? "" : workingSections[3])

    // #endregion

    // #region Halfmove Clock

    workingHalfmoveClock = workingSections[4]

    // #endregion

    // #region Fullmove Counter

    workingFullmoveCounter = workingSections[5]

    // #endregion

    theBoard = workingPositions

    return [workingPositions, workingActiveSide, workingCastling, workingEnPassant, workingHalfmoveClock, workingFullmoveCounter]
}

function assignObject(){
    theBoard = workingPositions
    whiteActive = workingActiveSide
    castlingRights = workingCastling
    enPassantTargetSquare = workingEnPassant
    halfmoveClock = workingHalfmoveClock
    fullmoveCount = workingFullmoveCounter
}

console.log(toFEN(startingBoard))
console.log(toBoardObject(toFEN(startingBoard)))

function moveFilter(obj){
    return obj["from"] == clickedSquare
}