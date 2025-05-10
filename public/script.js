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

let movableSquares = []

$("body").append("<div id='board'></div>")
for(let i=8;i>=1;i--){
    $("#board").append("<div></div>").children().last().addClass("row row"+i)
    for(let j=1;j<=8;j++){
        $(".row"+i).append("<div></div>").children().last().addClass("square " + String.fromCharCode(96+j) + i.toString() + " " + ((i+j)%2==0 ? "black" : "white"))
        $(".row"+i).children().last().append("<img>").children().last().addClass("pieceImg img" + String.fromCharCode(96+j) + i.toString())
    }
}

$("#trigger").click(function(){
    fetch("/evaluate", {
        method: "POST",
        headers: {
        "Content-Type": "application/json"
        },
        body: JSON.stringify({ trigger: true })
    })
    .then(res => res.json())
    .then(data => {
        console.log(data.message);
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
    });
})

function updateBoard(){
    for(let i=8;i>0;i--){
        for(let j=0;j<8;j++){
            $(".img" + String.fromCharCode(97+j) + i.toString()).attr("src", currentBoard[8-i][j] + ".png")
        }
    }
}

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