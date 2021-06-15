// document.write(`<p>${board}</p>`)

function InitializeBoard() {
    let fromLineStart = false
    let id = 0
    for (let i = 0; i < 64; ++i) {
        if (i >= 24 && i < 40) {
            board.push(null)
        } else {
            if (fromLineStart ^ i % 2) {
                board.push(id++)
            } else {
                board.push(null)
            }
        }
        if (i % 8 === 7) {
            fromLineStart = !fromLineStart
        }
    }
    console.assert(board[0] === null)
    console.assert(board[1] === 0)
    console.assert(board[2] === null)

    console.assert(board[8] === 4)

    console.assert(board[56] === 20)
    console.assert(board[57] === null)
}

const whiteTurnText = document.querySelector(".WhiteTurnText")
const blackTurnText = document.querySelector(".BlackTurnText")

let board = []

const cells = document.querySelectorAll("td")
let whitePieces = document.querySelectorAll("span")
let blackPieces = document.querySelectorAll("p")
let playerPieces

let whitesTurn = true
let mustJumpFrom = null

let selectedPiece = {
    pieceId: -1,
    cell: -1,
}
let availableMoves = [];

function InitializeEventListenersOnPieces() {
    if (whitesTurn) {
        playerPieces = whitePieces
    } else {
        playerPieces = blackPieces
    }

    if (mustJumpFrom) {
        document.getElementById(board[mustJumpFrom]).addEventListener("click", GetPlayerPieces)
        return
    }

    CheckMustJump()
    for (let i = 0; i < playerPieces.length; ++i) {
        playerPieces[i].addEventListener("click", GetPlayerPieces)
    }
}

function CheckMustJump() {
    for (let i = 0; i < playerPieces.length; ++i) {
        let cell = board.indexOf(parseInt(playerPieces[i].id))
        let jumps = GetAvailableJumps(cell)
        if (jumps.length > 0) {
            mustJumpFrom = true
            return
        }
    }
    mustJumpFrom = null
}

function GetPlayerPieces() {
    RemoveCellonclick()
    // for (let i = 0; i < playerPieces.length; ++i) {
    //     playerPieces[i].style.border = "1px solid red"
    // }
    ResetSelectedPieceProperties()
    ResetAvailableMoves()
    GetSelectedPiece()

    if (!mustJumpFrom) {
        GetAvailableSpaces()
    } else {
        availableMoves = GetAvailableJumps(selectedPiece.cell)
    }

    HighlightPiece()
}

function GetSelectedPiece() {
    selectedPiece.pieceId = parseInt(event.target.id)
    selectedPiece.cell = board.indexOf(selectedPiece.pieceId)
}

function RemoveCellonclick() {
    for (let i = 0; i < cells.length; ++i) {
        cells[i].removeAttribute("onclick")
    }
}

function ResetSelectedPieceProperties() {
    selectedPiece = {
        pieceId: -1,
        cell: -1,
    }
}

function GetAvailableSpaces() {
    let from = selectedPiece.cell
    if (IsPieceQueen(from)) {
        for (let dir of [-9, -7, 7, 9]) {
            for (let step = 1; step < 8; ++step) {
                let cell = from + dir * step
                if (IsEnemyHere(cell) || board[cell] !== null || cells[cell].classList.contains("NoPieceHere")) {
                    break
                }
                availableMoves.push(cell)
            }
        }
        return
    }
    let dir = whitesTurn ? -1 : 1
    let moves = [7 * dir, 9 * dir]
    for (let move of moves) {
        let cell = from + move
        if (board[cell] === null && !cells[cell].classList.contains("NoPieceHere")) {
            availableMoves.push(cell)
        }
    }
}

function ResetAvailableMoves() {
    for (let move of availableMoves) {
        if (move) {
            cells[move].innerHTML = ""
        }
    }

    availableMoves.length = 0
}

function IsWhitePiece(cell) {
    return board[cell] >= 12
}

function IsEnemyHere(cell) {
    return !cells[cell].classList.contains("NoPieceHere") &&
        board[cell] !== null &&
        (whitesTurn ^ IsWhitePiece(cell))
}

function IsPieceQueen(cell) {
    console.assert(board[cell])
    return document.getElementById(board[cell]).classList.contains("Queen");
}

function GetAvailableJumps(from) {
    let jumps = []
    let moves = [-18, -14, 14, 18]
    if (IsPieceQueen(from)) {
        for (let dir of [-9, -7, 7, 9]) {
            let metEnemy = false
            for (let step = 1; step < 8; ++step) {
                let cell = from + dir * step
                if (IsEnemyHere(cell)) {
                    if (metEnemy) {
                        break
                    }
                    metEnemy = true
                } else if (board[cell] || cells[cell].classList.contains("NoPieceHere")) {
                    break
                } else if (metEnemy) {
                    jumps.push(cell)
                }
            }
        }
        return jumps
    }
    for (let move of moves) {
        let cell = from + move
        let enemyCell = from + move / 2
        if (board[cell] === null && !cells[cell].classList.contains("NoPieceHere") &&
                IsEnemyHere(enemyCell)) {
            jumps.push(cell)
        }
    }
    return jumps
}

function HighlightPiece() {
    if (availableMoves.length > 0) {
        document.getElementById(selectedPiece.pieceId).style.border = "3px solid green"
        AddCellsClick()
    }
}

function AddCellsClick() {
    for (let move of availableMoves) {
        cells[move].innerHTML = `<div class="Ring OuterRing"></div>`
        cells[move].setAttribute("onclick", `MakeMove(${move})`)
    }
}

function MakeMove(to) {
    let from = selectedPiece.cell

    let queen = ""
    if (IsPieceQueen(from)) {
        queen = " Queen"
    }

    document.getElementById(selectedPiece.pieceId).remove()
    cells[from].innerHTML = ""
    delete availableMoves[availableMoves.indexOf(to)]
    ResetAvailableMoves()

    if (whitesTurn) {
        cells[to].innerHTML = `<span class="WhitePiece${queen}" id="${selectedPiece.pieceId}"></span>`
        whitePieces = document.querySelectorAll("span")
    } else {
        cells[to].innerHTML = `<p class="BlackPiece${queen}" id="${selectedPiece.pieceId}"></p>`
        blackPieces = document.querySelectorAll("p")
    }

    if ([-9, -7, 7, 9].includes(to - from)) {
        ChangeData(from, to)
    } else {
        let over = (from + to) / 2
        if (!IsEnemyHere(over)) {
            let dir = over - from
            for (let step = 2; step < 8; ++step) {
                over = from + dir * step
                if (IsEnemyHere(over)) {
                    break
                }
            }
            console.assert(IsEnemyHere(over))
        }
        ChangeData(from, to, over)
        let jumps = GetAvailableJumps(to)
        if (jumps.length > 0) {
            mustJumpFrom = to
        } else {
            mustJumpFrom = null
        }
    }

    ChangePlayer()
    InitializeEventListenersOnPieces()
}

function ChangeData(from, to, over) {
    board[from] = null
    board[to] = parseInt(selectedPiece.pieceId)
    if ((whitesTurn && to < 8) || (!whitesTurn && to >= 56)) {
        document.getElementById(selectedPiece.pieceId).classList.add("Queen")
    }
    if (over) {
        board[over] = null
        cells[over].innerHTML = ""
    }
    ResetSelectedPieceProperties()
    RemoveCellonclick()
    RemoveEventListeners()

    for (let i = 0; i < playerPieces.length; ++i) {
        playerPieces[i].style.border = "1px solid grey"
    }
}

function RemoveEventListeners() {
    if (whitesTurn) {
        for (let i = 0; i < whitePieces.length; ++i) {
            whitePieces[i].removeEventListener("click", GetPlayerPieces)
        }
    } else {
        for (let i = 0; i < blackPieces.length; ++i) {
            blackPieces[i].removeEventListener("click", GetPlayerPieces)
        }
    }
}

function ChangePlayer() {
    if (!mustJumpFrom) {
        let prev, next
        prev = whiteTurnText
        next = blackTurnText
        if (!whitesTurn) {
            [prev, next] = [next, prev]
        }
        prev.style.color = "lightGrey"
        next.style.color = "black"

        whitesTurn = !whitesTurn
    }
}

InitializeBoard()
InitializeEventListenersOnPieces()
