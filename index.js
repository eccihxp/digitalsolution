const express = require('express')
const app = express()
const port = 3000
const {Chess} = require('chess.js')

app.use(express.json())
app.use(express.static('public'))

app.listen(port, () => {
    console.log(`Server running at http://localhost:${port}`)
})

app.post('/evaluate', (req, res) => {
    console.log('Function triggered from frontend!');
    basicEval()
    moveSearch()
    res.json({message: eval}); // <-- JSON response
});

app.post('/boardSetup', (req, res) => {
    console.log('Function triggered from frontend!');
    game = new Chess()
    clickedSquare = ""
    toBoardObject("rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR w KQkq - 0 1")
    assignObject()
    res.json({ message: startingBoard }); // <-- JSON response
});

app.post('/checkMoves', (req, res) => {
    console.log('Function triggered from frontend!');
    clickedSquare = req.body.selectedSquare
    res.json({ message: game.moves({verbose: true}).filter(moveFilter) }); // <-- JSON response
});

app.post('/makeMove', (req, res) => {
    console.log('Function triggered from frontend!');
    game.move((clickedSquare.toString() + req.body.moveMade.toString()).toString(), {sloppy: true})
    toBoardObject(game.fen())
    assignObject()
    res.json({ message: theBoard }); // <-- JSON response
});

app.post('/computer', (req, res) => {
    console.log('Function triggered from frontend!');
    clickedSquare = ""
    moveSearch()
    game.move(evaluatedMove)
    toBoardObject(game.fen())
    assignObject()
    res.json({ message: theBoard }); // <-- JSON response
});

let game = new Chess("rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR w KQkq - 0 1")
let clickedSquare = ""
//using the Chess.js package for move validation

let evaluatedMove = ""

const pieceIDs = ["x", "k", "p", "n", "b", "r", "q"]
//index of the piece name corresponds to the piece value which is added to the colour (8 for white, 16 for black) to identify piece

const pointValue = [0, 10000, 100, 350, 350, 525, 1000]
//worth for all pieces for evaluation (folllows order of pieceIDs)

let eval = 0

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

function basicEval(){

    //#region Piece Mobility
    let activeMobility = game.moves().length //side to move
    let opponentMobility = 0
    for(let i=0;i<game.moves().length;i++){
        game.move(game.moves()[i])
        opponentMobility += game.moves().length
        game.undo()
    }
    opponentMobility = opponentMobility/game.moves().length
    console.log(activeMobility-opponentMobility)
    //#endregion

    let whiteEval = 0
    let blackEval = 0
    let filePawnsWhite = [0, 0, 0, 0, 0, 0, 0, 0]
    let filePawnsBlack = [0, 0, 0, 0, 0, 0, 0, 0]
    let doubledPawnsWhite = 0
    let doubledPawnsBlack = 0
    let blockedPawnsWhite = 0
    let blockedPawnsBlack = 0
    let isolatedPawnsWhite = 0
    let isolatedPawnsBlack = 0
    for(let i=0;i<8;i++){
        for(let j=0;j<8;j++){
            if(theBoard[i][j] == 0){
                //do nothing
            } else if(theBoard[i][j]/8 > 2){
                blackEval += pointValue[theBoard[i][j]%8]
                if(theBoard[i][j]%8 == 2){
                    filePawnsBlack[j] += 1
                    if(theBoard[i+1][j] != 0){
                        blockedPawnsBlack += 1
                    }
                }
            }else{
                whiteEval += pointValue[theBoard[i][j]%8]
                if(theBoard[i][j]%8 == 2){
                    filePawnsWhite[j] += 1
                    if(theBoard[i-1][j] != 0){
                        blockedPawnsWhite += 1
                    }
                }
            }
        }
    }
    for(let i=0;i<8;i++){
        if(filePawnsBlack[i]>1){
            doubledPawnsBlack += filePawnsBlack[i]
        }
        if(filePawnsBlack[i]>0){
            if(i==0){
                if(filePawnsBlack[i+1]==0){
                    isolatedPawnsBlack += 1
                }
            } else if(i==7){
                if(filePawnsBlack[i-1]==0){
                    isolatedPawnsBlack += 1
                }
            } else{
                if(filePawnsBlack[i-1]==0 && filePawnsBlack[i+1]==0){
                    isolatedPawnsBlack += 1
                }
            }
        }
        if(filePawnsWhite[i]>1){
            doubledPawnsWhite += filePawnsWhite[i]
        }
        if(filePawnsWhite[i]>0){
            if(i==0){
                if(filePawnsWhite[i+1]==0){
                    isolatedPawnsWhite += 1
                }
            } else if(i==7){
                if(filePawnsWhite[i-1]==0){
                    isolatedPawnsWhite += 1
                }
            } else{
                if(filePawnsWhite[i-1]==0 && filePawnsWhite[i+1]==0){
                    isolatedPawnsWhite += 1
                }
            }
        }
    }
    eval = ((whiteActive==true ? 20 : -20) + (whiteEval - blackEval) - (50 * (doubledPawnsWhite + blockedPawnsWhite + isolatedPawnsWhite - doubledPawnsBlack - blockedPawnsBlack - isolatedPawnsBlack)) + (whiteActive==true ? (activeMobility-opponentMobility)*10 : (activeMobility-opponentMobility)*-10))
}

function moveSearch(){
    let positionsSearched = 0
    let moves = []
    moves[0] = (game.moves())
    let bestEvaluation = (whiteActive==true ? -999999 : 999999)
    let bestMove = ""
    for(let i=0;i<moves[0].length;i++){
        game.move(moves[0][i])
        moves[1] = (game.moves())
        console.log(moves)
        for(let j=0;j<moves[1].length;j++){
            game.move(moves[1][j])
            positionsSearched++
            basicEval()
            if(whiteActive == true){
                if((eval)>bestEvaluation){
                    bestMove = moves[0][i]
                    bestEvaluation = eval
                }
            } else{
                if((eval)<bestEvaluation){
                    bestMove = moves[0][i]
                    bestEvaluation = eval
                }
            }
            game.undo()
        }
        game.undo()
    }
    evaluatedMove = bestMove
    console.log("Best Move: " + bestMove + " Eval: " + bestEvaluation + " Positions Searched: " + positionsSearched)
}

console.log(toFEN(startingBoard))
console.log(toBoardObject(toFEN(startingBoard)))

function moveFilter(obj){
    return obj["from"] == clickedSquare
}