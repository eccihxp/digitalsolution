const express = require('express')
const app = express()
const port = 3000

app.use(express.static('public'))

app.listen(port, () => {
    console.log(`Server running at http://localhost:${port}`)
})

app.get('/user', (req, res) => {
    res.send('index.html')
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

let enPassantTargetSquare = ""
//present even if there is not a piece able to capture the en passant (leave blank if not applicable, square (eg "e3") otherwise)

let halfmoveClock = 0
//used for 50 move rule and FEN notation

let fullmoveCount = 1
//number of moves since start of game (starts at 1)

let board = {
    a: [21, 19, 20, 22, 17, 20, 19, 21],
    b: [18, 18, 18, 18, 18, 18, 18, 18],
    c: [0, 0, 0, 0, 0, 0, 0, 0],
    d: [0, 0, 0, 0, 0, 0, 0, 0],
    e: [0, 0, 0, 0, 0, 0, 0, 0],
    f: [0, 0, 0, 0, 0, 0, 0, 0],
    g: [10, 10, 10, 10, 10, 10, 10, 10],
    h: [13, 11, 12, 14, 9, 12, 11, 13]
}

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

    console.log(outputFEN)
}

toFEN(board)