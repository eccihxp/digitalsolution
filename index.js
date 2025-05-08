const express = require('express')
const app = express()
const port = 3000

app.use(express.static('public'))

app.listen(port, () => {
    console.log(`Server running at http://localhost:${port}`)
})

app.post('/run-function', (req, res) => {
    console.log('Function triggered from frontend!');
    res.json({ message: 'Backend function executed successfully' }); // <-- JSON response
});

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

let startingBoard = {
    a: [21, 19, 20, 22, 17, 20, 19, 21],
    b: [18, 18, 18, 18, 18, 18, 18, 18],
    c: [0, 0, 0, 0, 0, 0, 0, 0],
    d: [0, 0, 0, 0, 0, 0, 0, 0],
    e: [0, 0, 0, 0, 0, 0, 0, 0],
    f: [0, 0, 0, 0, 0, 0, 0, 0],
    g: [10, 10, 10, 10, 10, 10, 10, 10],
    h: [13, 11, 12, 14, 9, 12, 11, 13]
}
//board from the starting position of the default version of the game

function toFEN(input){
    let outputFEN = ""
    console.log("start")
    
    // Piece Placement
    for(let i=0;i<8;i++){
        let blankSpace = 0
        for(let j=0;j<8;j++){
            let workingSquare = input[String.fromCharCode(97+i)][j]
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

function toBoardObject(input){
    let workingSections = input.toString().split(" ")

    // #region Piece Position Data
    workingSections[0] = workingSections[0].toString().split("/")
    let workingPositions = {
        a: [],
        b: [],
        c: [],
        d: [],
        e: [],
        f: [],
        g: [],
        h: []
    }
    for(let i=0;i<8;i++){
        while(workingSections[0][i].length != 0){
            if(isNaN(parseInt(workingSections[0][i].substring(0,1))) == false){
                for(let k=0;k<parseInt(workingSections[0][i].substring(0,1));k++){
                    workingPositions[String.fromCharCode(97 + i)].push(0)
                }
                workingSections[0][i] = workingSections[0][i].slice(1)
            } else{
                for(let j=0;j<7;j++){
                    if(workingSections[0][i].substring(0,1).toLowerCase() == pieceIDs[j]){
                        workingPositions[String.fromCharCode(97 + i)].push((workingSections[0][i].substring(0,1) == workingSections[0][i].substring(0,1).toLowerCase()) ? 16+j : 8+j)
                        workingSections[0][i] = workingSections[0][i].slice(1)
                        break
                    }
                }
            }
        }
    }
    // #endregion

    // #region Side to Move

    let workingActiveSide = (workingSections[1] == "w" ? true : false)

    // #endregion

    // #region Castling Ability

    let workingCastling = (workingSections[2] == "-" ? {white: {kingside: false, queenside: false}, black: {kingside: false, queenside: false}} : {white: {kingside: (workingSections[2].includes("K") == true ? true: false), queenside: (workingSections[2].includes("Q") == true ? true: false)}, black: {kingside: (workingSections[2].includes("k") == true ? true: false), queenside: (workingSections[2].includes("q") == true ? true: false)}})

    //#endregion
    
    // #region En Passant Target Square

    let workingEnPassant = (workingSections[3] == "-" ? "" : workingSections[3])

    // #endregion

    // #region Halfmove Clock

    let workingHalfmoveClock = workingSections[4]

    // #endregion

    // #region Fullmove Counter

    let workingFullmoveCounter = workingSections[5]

    // #endregion

    return [workingPositions, workingActiveSide, workingCastling, workingEnPassant, workingHalfmoveClock, workingFullmoveCounter]
}

console.log(toFEN(startingBoard))
console.log(toBoardObject(toFEN(startingBoard)))