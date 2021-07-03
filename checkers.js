// document.write(`<p>${board}</p>`)

function makeStruct(names) {
    names = names.split(' ')
    let count = names.length

    function constructor() {
        for (let i = 0; i < count; i++) {
            this[names[i]] = arguments[i]
        }
    }
    return constructor;
}

let PathNode = makeStruct("children isEmptyCell cell")

let board = []
let whitePiecesStartId = 0

const whiteTurnText = document.querySelector(".WhiteTurnText")
const blackTurnText = document.querySelector(".BlackTurnText")

const FORWARD = [-9, -7]
const BACKWARD = [7, 9]
const BOTH_DIRS = [-9, -7, 7, 9]

let cells = document.querySelectorAll("td")
let whitePieces = document.querySelectorAll("span")
let blackPieces = document.querySelectorAll("p")
let playerPieces = whitePieces

let whitesTurn = true
let mustJumpFrom = []
let queenRoutes = null

let selectedPiece = {
    pieceId: -1,
    cell: -1,
}
let availableMoves = [];

function InitializeTable(numRows, numCols) {
    let size = numRows * numCols
    for (let i = 0; i < size; ++i) {
        board.push(null)
    }
    let docTable = document.querySelector(".Board")
    for (let i = 0; i < numRows; ++i) {
        docTable.innerHTML += `<tr class='Row'>\n</tr>\n`
    }
    let rows = document.querySelectorAll(".Row")
    let fromLineStart = false
    for (let i = 0; i < size; ++i) {
        let row = rows[i / numCols >> 0]
        if (fromLineStart ^ i % 2) {
            row.innerHTML += `<td></td>\n`
        } else {
            row.innerHTML += `<td class='NoPieceHere'></td>\n`
        }
        if (i % numCols === numCols - 1) {
            fromLineStart = !fromLineStart
        }
    }
}

function InitializePieces(numRows, numCols, ignoreRowFrom, ignoreRowTo) {
    let size = numRows * numCols
    let cs = document.querySelectorAll("td")
    let fromLineStart = false
    let id = 0
    for (let i = 0; i < size; ++i) {
        if (i < ignoreRowFrom * numCols || i >= ignoreRowTo * numCols) {
            if (fromLineStart ^ i % 2) {
                if (i < ignoreRowFrom * numCols) {
                    cs[i].innerHTML = `<td><p class='BlackPiece' id='${id}'></p></td>\n`
                } else {
                    cs[i].innerHTML = `<td><span class='WhitePiece' id='${id}'></span></td>\n`
                }
                board[i] = id++
            }
        }
        if (i % numCols === numCols - 1) {
            fromLineStart = !fromLineStart
        }
    }
    whitePiecesStartId = 12
    cells = document.querySelectorAll("td")
    whitePieces = document.querySelectorAll("span")
    blackPieces = document.querySelectorAll("p")
}

function SetPieces(wp, bp) {
    let cs = document.querySelectorAll("td")
    let id = 0
    for (let blackPiece of bp) {
        cs[blackPiece].innerHTML = `<td><p class='BlackPiece' id='${id}'></p></td>\n`
        board[blackPiece] = id++
    }
    whitePiecesStartId = bp.length
    for (let whitePiece of wp) {
        cs[whitePiece].innerHTML = `<td><span class='WhitePiece' id='${id}'></span></td>\n`
        board[whitePiece] = id++
    }
    cells = document.querySelectorAll("td")
    whitePieces = document.querySelectorAll("span")
    blackPieces = document.querySelectorAll("p")
}

function InitializeEventListenersOnPieces() {
    if (whitesTurn) {
        playerPieces = whitePieces
    } else {
        playerPieces = blackPieces
    }
    CheckMustJump()
    if (mustJumpFrom.length > 0) {
        for (let from of mustJumpFrom) {
            document.getElementById(board[from]).addEventListener("click", GetPlayerPieces)
        }
        return
    }
    for (let i = 0; i < playerPieces.length; ++i) {
        playerPieces[i].addEventListener("click", GetPlayerPieces)
    }
}

function CheckMustJump() {
    mustJumpFrom.length = 0
    for (let i = 0; i < playerPieces.length; ++i) {
        let cell = board.indexOf(parseInt(playerPieces[i].id))
        if (cell < 0 || cell >= board.length) {
            continue
        }
        let jumps = GetAvailableJumps(cell)
        if (HasJumps(jumps)) {
            mustJumpFrom.push(cell)
        }
    }
}

function GetPlayerPieces() {
    RemoveCellonclick()
    ResetSelectedPieceProperties()
    ResetAvailableMoves()
    GetSelectedPiece()

    if (mustJumpFrom.length === 0) {
        GetAvailableSpaces()
    } else {
        availableMoves = GetAvailableJumps(selectedPiece.cell)
    }

    HighlightPiece()
}

function HasJumps(jumps) {
    return jumps.length > 0
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
        for (let dir of BOTH_DIRS) {
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
    let moves = whitesTurn ? FORWARD : BACKWARD
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
    return board[cell] >= whitePiecesStartId
}

function IsEnemyHere(cell) {
    return cells[cell] !== undefined &&
        !cells[cell].classList.contains("NoPieceHere") &&
        board[cell] !== null &&
        (whitesTurn ^ IsWhitePiece(cell))
}

function IsPieceQueen(cell) {
    console.assert(board[cell] !== null)
    return document.getElementById(board[cell]).classList.contains("Queen");
}

function CalcJumpPathsHelper(node, from, eaten, maxSteps, forbiddenDir) {
    for (let dir of BOTH_DIRS) {
        if (dir === forbiddenDir) {
            continue
        }
        let metEnemy = null
        let enemyNode = null
        for (let step = 1; step < maxSteps; ++step) {
            let cell = from + dir * step
            if (IsEnemyHere(cell)) {
                if (metEnemy != null || eaten[cell]) {
                    break
                }
                metEnemy = cell
                enemyNode = new PathNode([], false, cell)
            } else if (board[cell] !== null || cells[cell].classList.contains("NoPieceHere")) {
                break
            } else if (metEnemy) {
                eaten[metEnemy] = true
                let next = new PathNode([], true, cell)
                enemyNode.children.push(next)
                CalcJumpPathsHelper(next, cell, eaten, maxSteps, -dir)
                eaten[metEnemy] = false
            }
        }
        if (enemyNode && enemyNode.children.length > 0) {
            let hasPathWithMoreJumps = false
            for (let child of enemyNode.children) {
                if (child.children.length > 0) {
                    hasPathWithMoreJumps = true
                    break
                }
            }
            if (hasPathWithMoreJumps) {
                for (let i = 0; i < enemyNode.children.length; ) {
                    if (enemyNode.children[i].children.length === 0) {
                        enemyNode.children.splice(i, 1)
                    } else {
                        ++i
                    }
                }
            }
            node.children.push(enemyNode)
        }
    }
}

function CalcJumpPaths(from) {
    let eaten = []
    let root = new PathNode([], false, from)
    CalcJumpPathsHelper(root, from, eaten, 8)
    return root
}

function GetAvailableJumps(from) {
    let jumps = []

    if (IsPieceQueen(from)) {
        let root = CalcJumpPaths(from)
        queenRoutes = root
        for (let child of root.children) {
            for (let emptyCellNode of child.children) {
                jumps.push(emptyCellNode.cell)
            }
        }
        return jumps
    }

    for (let dir of BOTH_DIRS) {
        let cell = from + dir * 2
        let enemy = from + dir
        if (!IsEnemyHere(enemy) || IsEnemyHere(cell) || board[cell] !== null || cells[cell].classList.contains("NoPieceHere")) {
            continue
        }
        jumps.push(cell)
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
    ResetAvailableMoves()

    if (whitesTurn) {
        cells[to].innerHTML = `<span class="WhitePiece${queen}" id="${selectedPiece.pieceId}"></span>`
        whitePieces = document.querySelectorAll("span")
    } else {
        cells[to].innerHTML = `<p class="BlackPiece${queen}" id="${selectedPiece.pieceId}"></p>`
        blackPieces = document.querySelectorAll("p")
    }

    mustJumpFrom = []
    let jumps = []
    if (queen === "") {
        queenRoutes = null
        if (BOTH_DIRS.includes(to - from)) {
            ChangeData(from, to)
        } else {
            let over = (from + to) / 2
            ChangeData(from, to, over)
            jumps = GetAvailableJumps(to)
            if (HasJumps(jumps)) {
                mustJumpFrom = [to]
            }
        }
    } else if (queenRoutes) {
        let enemyCell = null
        for (let enemy of queenRoutes.children) {
            for (let child of enemy.children) {
                if (child.cell === to) {
                    enemyCell = enemy.cell
                    queenRoutes = child
                    break
                }
            }
        }
        if (queenRoutes.children.length > 0) {
            mustJumpFrom = [to]
            for (let enemy of queenRoutes.children) {
                for (let child of enemy.children) {
                    jumps.push(child.cell)
                }
            }
        } else {
            queenRoutes = null
        }
        ChangeData(from, to, enemyCell)
    } else {
        ChangeData(from, to)
    }

    if (mustJumpFrom.length === 0) {
        ResetSelectedPieceProperties()
        ChangePlayer()
        InitializeEventListenersOnPieces()
    } else {
        selectedPiece.cell = to
        availableMoves = jumps
        AddCellsClick()
    }
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

function TestQueen() {
    const whiteP = [8]
    const blackP = [10]
    InitializeTable(8, 8)
    SetPieces(whiteP, blackP)
    InitializeEventListenersOnPieces()
}

function TestQueenJumps() {
    const whiteP = [8]
    const blackP = [10, 35, 51]
    InitializeTable(8, 8)
    SetPieces(whiteP, blackP)
    InitializeEventListenersOnPieces()
}

function TestCheckerToQueenJumps() {
    const whiteP = [24]
    const blackP = [3, 21, 55]
    InitializeTable(8, 8)
    SetPieces(whiteP, blackP)
    InitializeEventListenersOnPieces()
}

function TestJumps() {
    const whiteP = [49]
    const blackP = [35, 37, 1]
    InitializeTable(8, 8)
    SetPieces(whiteP, blackP)
    InitializeEventListenersOnPieces()
}

function RunGame() {
    InitializeTable(8, 8)
    InitializePieces(8, 8, 3, 5)
    InitializeEventListenersOnPieces()
}

// TestQueen()
// TestJumps()
// RunGame()
// TestQueenJumps()
TestCheckerToQueenJumps()
