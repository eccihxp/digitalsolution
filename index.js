//#region VARIABLES

//#region Node Variables

const express = require('express');
//Used for server and client interaction

const app = express();
//The server/client structure itself

const port = 3000;
//The localhost port being used

const {Chess} = require('chess.js');
//Handles move validation and history

let game = new Chess("rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR w KQkq - 0 1");
//Sets up a new game of chess in the default position

const {Timer} = require('timer-node');
//Is used for the chess clocks for both sides

let chessClock = {w: new Timer(), b: new Timer()};
//The timers used for both sides

//#endregion

//#region Game Details

const pieceIDs = ["x", "k", "p", "n", "b", "r", "q"];
//Array; Contains strings; letters to identify each piece with SAN notation; x is used for empty space

let theBoard = [
    [21, 19, 20, 22, 17, 20, 19, 21],
    [18, 18, 18, 18, 18, 18, 18, 18],
    [0, 0, 0, 0, 0, 0, 0, 0],
    [0, 0, 0, 0, 0, 0, 0, 0],
    [0, 0, 0, 0, 0, 0, 0, 0],
    [0, 0, 0, 0, 0, 0, 0, 0],
    [10, 10, 10, 10, 10, 10, 10, 10],
    [13, 11, 12, 14, 9, 12, 11, 13]
];
//Contains arrays of numbers; Denotes which piece is on each square; 0 if the square is empty; Otherwise uses method below
//Step 1; Add 8 if the piece is white; Add 16 if the piece is black
//Step 2; Add a number for what type of piece it is (King = 1, Pawn = 2, Knight = 3, Bishop = 4, Rook = 5, Queen = 6)

let startingBoard = [
    [21, 19, 20, 22, 17, 20, 19, 21],
    [18, 18, 18, 18, 18, 18, 18, 18],
    [0, 0, 0, 0, 0, 0, 0, 0],
    [0, 0, 0, 0, 0, 0, 0, 0],
    [0, 0, 0, 0, 0, 0, 0, 0],
    [0, 0, 0, 0, 0, 0, 0, 0],
    [10, 10, 10, 10, 10, 10, 10, 10],
    [13, 11, 12, 14, 9, 12, 11, 13]
];
//Array; The default board position (using same method as above)

let whiteActive = true;
//Boolean; True if white's turn, false if black's turn

let castlingRights = {
    white: {kingside: true, queenside: true},
    black: {kingside: true, queenside: true}
};
//Object; Defines each side's castling rights (kingside: towards the h file; queenside: towards the a file)

let enPassantTargetSquare = "";
//String; Defines a square a pawn can move to for an en passant capture

let halfmoveClock = 0;
//Integer; Increments whenever white or black make a move

let fullmoveCount = 1;
//Integer; Number of moves made by black since start of game (starts at 1)

let clickedSquare = "";
//String; Stores last square clicked by player. Used to generate valid move lists

let workingSections;
let workingPositions;
let workingActiveSide;
let workingCastling;
let workingEnPassant;
let workingHalfmoveClock;
let workingFullmoveCounter;
//Variables work like previous; used to avoid overwriting game details during processing

//#endregion

//#endregion

//#region FUNCTIONS

//#region Setup

app.use(express.json());
//Tells the server to receive and transmit in JSON format

app.use(express.static('public'));
//Gives the server public client-side files including HTML, CSS, JS, images, etc

app.listen(port, () => {});
//Starts listening to any commands sent from the client

app.post('/boardSetup', (req, res) => {
    game = new Chess();
    clickedSquare = "";
    toBoardObject("rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR w KQkq - 0 1");
    assignObject();
    res.json({ message: startingBoard });
});
//Sets up the board in its default position

app.post('/reset', (req, res) => {
    game = new Chess("rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR w KQkq - 0 1");
    clickedSquare = "";
    //using the Chess.js package for move validation

    whiteActive = true;
    //true if white turn, false if black turn

    castlingRights = {
        white: {kingside: true, queenside: true},
        black: {kingside: true, queenside: true}
    };
    //kingside: towards the h file; queenside: towards the a file

    enPassantTargetSquare = "";
    //present even if there is not a piece able to capture the en passant (leave blank if not applicable, square (eg "e3") otherwise)

    halfmoveClock = 0;
    //used for 50 move rule and FEN notation

    fullmoveCount = 1;
    //number of moves since start of game (starts at 1)

    startingBoard = [
        [21, 19, 20, 22, 17, 20, 19, 21],
        [18, 18, 18, 18, 18, 18, 18, 18],
        [0, 0, 0, 0, 0, 0, 0, 0],
        [0, 0, 0, 0, 0, 0, 0, 0],
        [0, 0, 0, 0, 0, 0, 0, 0],
        [0, 0, 0, 0, 0, 0, 0, 0],
        [10, 10, 10, 10, 10, 10, 10, 10],
        [13, 11, 12, 14, 9, 12, 11, 13]
    ];

    theBoard = [
        [21, 19, 20, 22, 17, 20, 19, 21],
        [18, 18, 18, 18, 18, 18, 18, 18],
        [0, 0, 0, 0, 0, 0, 0, 0],
        [0, 0, 0, 0, 0, 0, 0, 0],
        [0, 0, 0, 0, 0, 0, 0, 0],
        [0, 0, 0, 0, 0, 0, 0, 0],
        [10, 10, 10, 10, 10, 10, 10, 10],
        [13, 11, 12, 14, 9, 12, 11, 13]
    ];
    //board from the starting position of the default version of the game
});
//Resets all variables

//#endregion

//#region Timers

app.post('/initTimer', (req, res) => {
    chessClock["w"] = new Timer();
    chessClock["w"].start();
    chessClock["b"] = new Timer();
    res.json({wtime: chessClock["w"].ms(), btime: chessClock["b"].ms()});
});
//Sets up timers and starts white timer

app.post('/updateTimer', (req, res) => {
    res.json({wtime: chessClock["w"].ms(), btime: chessClock["b"].ms()});
});
//Updates the client on remaining time

app.post('/resetTimer', (req, res) => {
    chessClock["w"] = new Timer();
    chessClock["b"] = new Timer();
    res.json({wtime: chessClock["w"].ms(), btime: chessClock["b"].ms()});
});
//Resets both timers; Does not start a timer

app.post('/stopTimer', (req, res) => {
    chessClock["w"].pause();
    chessClock["b"].pause();
    res.json({wtime: chessClock["w"].ms(), btime: chessClock["b"].ms()});
});
//Pauses both timers

app.post('/switchTimer', (req, res) => {
    if(chessClock["w"].isRunning() == true){
        chessClock["w"].pause();
        if(chessClock["b"].isStarted() == false){
            chessClock["b"].start();
        } else{
            chessClock["b"].resume();
        };
    } else{
        chessClock["b"].pause();
        chessClock["w"].resume();
    };
    res.json({wtime: chessClock["w"].ms(), btime: chessClock["b"].ms()});
});
//Switches the timer which is paused with the running timer

//#endregion

//#region History/FEN

app.post('/convert', (req, res) => {
    let evalGame = new Chess();
    for(let i=0;i<req.body.line.length;i++){
        try {
            evalGame.move(req.body.line[i]);
        } catch (error) {
            continue;
        };
    };
    res.json({message: evalGame.history()});
});
//Converts LAN to SAN

app.post('/history', (req, res) => {
    res.json({message: game.history()});
});
//Tells the client the current game's history

app.post('/rqFen', (req, res) => {
    res.json({message: game.fen()});
});
//Tells the client the current position's FEN

app.post('/rqSide', (req, res) => {
    res.json({message: (game.turn() == "w" ? 1 : -1)});
});
//Tells the client which side is active

function assignObject(){
    theBoard = workingPositions;
    whiteActive = workingActiveSide;
    castlingRights = workingCastling;
    enPassantTargetSquare = workingEnPassant;
    halfmoveClock = workingHalfmoveClock;
    fullmoveCount = workingFullmoveCounter;
};
//Assigns the conversion from toBoardObject() to the variables

function toBoardObject(input){
    workingSections = input.toString().split(" ");

    // #region Piece Position Data
    workingSections[0] = workingSections[0].toString().split("/");
    workingPositions = [
        [],
        [],
        [],
        [],
        [],
        [],
        [],
        []
    ];
    for(let i=0;i<8;i++){
        while(workingSections[0][i].length != 0){
            if(isNaN(parseInt(workingSections[0][i].substring(0,1))) == false){
                for(let k=0;k<parseInt(workingSections[0][i].substring(0,1));k++){
                    workingPositions[i].push(0);
                };
                workingSections[0][i] = workingSections[0][i].slice(1);
            } else{
                for(let j=0;j<7;j++){
                    if(workingSections[0][i].substring(0,1).toLowerCase() == pieceIDs[j]){
                        workingPositions[i].push((workingSections[0][i].substring(0,1) == workingSections[0][i].substring(0,1).toLowerCase()) ? 16+j : 8+j);
                        workingSections[0][i] = workingSections[0][i].slice(1);
                        break;
                    };
                };
            };
        };
    };
    // #endregion

    // #region Side to Move

    workingActiveSide = (workingSections[1] == "w" ? true : false);

    // #endregion

    // #region Castling Ability

    workingCastling = (workingSections[2] == "-" ? {white: {kingside: false, queenside: false}, black: {kingside: false, queenside: false}} : {white: {kingside: (workingSections[2].includes("K") == true ? true: false), queenside: (workingSections[2].includes("Q") == true ? true: false)}, black: {kingside: (workingSections[2].includes("k") == true ? true: false), queenside: (workingSections[2].includes("q") == true ? true: false)}});

    //#endregion
    
    // #region En Passant Target Square

    workingEnPassant = (workingSections[3] == "-" ? "" : workingSections[3]);

    // #endregion

    // #region Halfmove Clock

    workingHalfmoveClock = workingSections[4];

    // #endregion

    // #region Fullmove Counter

    workingFullmoveCounter = workingSections[5];

    // #endregion

    theBoard = workingPositions;

    return [workingPositions, workingActiveSide, workingCastling, workingEnPassant, workingHalfmoveClock, workingFullmoveCounter];
};
//Converts FEN to server variables

function toFEN(input){
    let outputFEN = "";
    
    // Piece Placement
    for(let i=0;i<8;i++){
        let blankSpace = 0;
        for(let j=0;j<8;j++){
            let workingSquare = input[i][j];
            for(let k=0;k<7;k++){
                if(workingSquare == 0){
                    blankSpace += 1;
                    break;
                } else if(workingSquare%8 == k){
                    if (blankSpace != 0){
                        outputFEN += blankSpace;
                        blankSpace = 0;
                    };
                    outputFEN += (workingSquare > 16 ? pieceIDs[k] : pieceIDs[k].toUpperCase());
                };
            };
        };
        if(blankSpace == 8){
            outputFEN += blankSpace;
            blankSpace = 0;
        };
        outputFEN += (i != 7 ? "/" : " ");
    };

    //Side to Move
    outputFEN += (whiteActive == true ? "w " : "b ");

    //Castling Ability
    outputFEN += (castlingRights["white"]["kingside"] == false && castlingRights["white"]["queenside"] == false && castlingRights["black"]["kingside"] == false && castlingRights["black"]["queenside"] == false ? "- " : (castlingRights["white"]["kingside"] == true ? "K" : "") + (castlingRights["white"]["queenside"] == true ? "Q" : "") + (castlingRights["black"]["kingside"] == true ? "k" : "") + (castlingRights["black"]["queenside"] == true ? "q " : " "));

    //En Passant Target Square
    outputFEN += (enPassantTargetSquare != "" ? enPassantTargetSquare + " " : "- ");

    //Halfmove Clock
    outputFEN += halfmoveClock + " ";

    //Fullmove Counter
    outputFEN += fullmoveCount;

    return outputFEN;
};
//Converts server variables to FEN

//#endregion

//#region Analysis/Validation

app.post('/attackers', (req, res) => {
    let attackers = [
        [[], [], [], [], [], [], [], []],
        [[], [], [], [], [], [], [], []],
        [[], [], [], [], [], [], [], []],
        [[], [], [], [], [], [], [], []],
        [[], [], [], [], [], [], [], []],
        [[], [], [], [], [], [], [], []],
        [[], [], [], [], [], [], [], []],
        [[], [], [], [], [], [], [], []],
    ];
    for(let i=0; i<8; i++){
        for(let j=0; j<8; j++){
            if(req.body.playerPieces[i][j]==true){
                attackers[i][j]=game.attackers(String.fromCharCode(97+j, 56-i), (req.body.playerIsWhite==true ? "b" : "w"));
                console.log(attackers[i][j]);
            } else{
                attackers[i][j] = [];
            };
        };
    };
    res.json({attackers: attackers});
});
//Tells client how much each of their pieces is being attacked

app.post('/gamestate', (req, res) => {
    res.json({message: (game.isCheckmate()==true ? "checkmate" : (game.isDrawByFiftyMoves()==true ? "fifty moves" : (game.isInsufficientMaterial()==true ? "insufficient material" : (game.isStalemate()==true ? "stalemate" : (game.isThreefoldRepetition()==true ? "threefold" : "normal")))))});
});
//Tells the client if the game is progressing normally or is over

app.post('/checkMoves', (req, res) => {
    clickedSquare = req.body.selectedSquare;
    res.json({message: game.moves({verbose: true}).filter(moveFilter)});
});
//Checks the moves available for the highlighted piece

//#endregion

//#region Move Handling

app.post('/computerMove', (req, res) => {
    game.move(req.body.moveMade.toString(), {sloppy: true});
    toBoardObject(game.fen());
    assignObject();
    res.json({ message: theBoard });
});
//Handles when a computer makes a move

app.post('/makeMove', (req, res) => {
    game.move({
        from: clickedSquare.toString(),
        to: req.body.moveMade.toString(),
        promotion: req.body.promoteTo
    }, {sloppy: true})
    toBoardObject(game.fen());
    assignObject();
    res.json({ message: theBoard }); // <-- JSON response
});
//Handles when a player makes a move

function moveFilter(obj){
    return obj["from"] == clickedSquare;
};
//Filters to only moves from the player's highlighted piece

//#endregion

//#endregion