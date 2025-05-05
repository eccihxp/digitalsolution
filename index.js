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

const pieceIDs = {
    none: 0,
    king: 1,
    pawn: 2,
    knight: 3,
    bishop: 4,
    rook: 5,
    queen: 6,
}

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