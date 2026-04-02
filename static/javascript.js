enterbutton = document.getElementById("EnterButton");
startbutton = document.getElementById("StartButton");
username = document.getElementById("username");
player = document.getElementById("player");
score = document.getElementById("score");

enterbutton.onclick = () => {
    document.getElementById("StartScreen").style.display = "none";
    document.getElementById("Instructions").style.display = "block";
    player.innerText = username.value;
};

startbutton.onclick = () => {
    document.getElementById("Canvas").style.display = "block";
    document.getElementById("Instructions").style.display = "none";
    document.getElementById("RunningInfo").style.visibility = "visible";
    player.innerText = username.value;
    score.innerText = 0;
    startGame();
};

document.getElementById("restart").onclick = () => {
    document.getElementById("EndScreen").style.display = "none";
    document.getElementById("Canvas").style.display = "block";
    document.getElementById("RunningInfo").style.visibility = "visible";
    player.innerText = username.value;
    score.innerText = 0;
    startGame();
};

const canvasBlock = document.getElementById("Canvas");
const canvas = canvasBlock.getContext("2d");
const gridSize = 20;
let tileCount;

let currentHighScore = 0;
let currentScore = 0;
let foodX, foodY, foodType, isImmune, immtimeout, gameInterval, immtime, immtimetimeout;
let startTime = 0, endTime = 0;

let snake = [];
let dx = 0;
let dy = 0;

document.addEventListener("keydown", (e) => {
    if ((e.key === "ArrowUp"  || e.key === "w"|| e.key === "W") && dy !== 1) { dx = 0; dy = -1; }
    if ((e.key === "ArrowDown" || e.key === "s" || e.key === "S") && dy !== -1) { dx = 0; dy = 1; }
    if ((e.key === "ArrowLeft" || e.key === "a"|| e.key === "A") && dx !== 1) { dx = -1; dy = 0; }
    if ((e.key === "ArrowRight" || e.key === "d"|| e.key === "D") && dx !== -1) { dx = 1; dy = 0; }
});

function startGame() {
    currentScore = 0;
    snake = [[0,0]];
    dx = 1; dy = 0;
    isImmune = false;
    startTime = Date.now();
    document.getElementById("status").innerText = "Normal";
    clearTimeout(immtimeout);
    if (gameInterval) clearInterval(gameInterval);
    const maxSize = Math.min(window.innerWidth * 0.85, window.innerHeight * 0.85);
    tileCount = Math.floor(maxSize / gridSize);
    canvasBlock.width = canvasBlock.height = tileCount * gridSize;
    foodSpawn();
    gameInterval = setInterval(runGame, 120);
};

function runGame() {
    clearInterval(gameInterval);
    gameInterval = setInterval(runGame, (120 - Math.min(100, currentScore)));
    let newHead = [snake[0][0] + dx, snake[0][1]+dy];
    snake.unshift(newHead);
    snake.pop();

    if (checkCollision()) return;

    if (newHead[0] === foodX && newHead[1] === foodY) {
        if (foodType == 'carrot') {
            grow(1);
            currentScore += 1;
        }
        else if (foodType == 'pie') {
            grow(3);
            currentScore += 3;
        }
        else if (foodType == 'star') {
            isImmune = true;
            immtime = 10;
            document.getElementById("status").innerText = `IMMUNE!(${immtime}s)`;
            clearInterval(immtimetimeout);
            immtimetimeout = setInterval( () => {
                immtime -= 1;
                document.getElementById("status").innerText = `IMMUNE!(${immtime}s)`;
            }, 1000);
            clearTimeout(immtimeout);
            immtimeout = setTimeout( () => {
                isImmune = false;
                clearInterval(immtimetimeout);
                document.getElementById("status").innerText = "Normal";
            } , 10000);
        }
        score.innerText = currentScore;
        foodSpawn();
    }

    draw();
};

function grow(len) {
    let tail = snake[snake.length - 1];
    for(i = 0; i < len; i++){
        snake.push([tail]);
    }
};

function checkCollision(){
    let head = snake[0];
    let cause = null;
    if( head[0] < 0 || head[0] >= tileCount || head[1] < 0 || head[1] >= tileCount){
        cause = "WALL";
    }
    for (let i = 1; i < snake.length; i++) {
        if (head[0] == snake[i][0] && head[1] == snake[i][1]) 
            cause = "SELF";
    }
    if(cause){
        if(isImmune){
            if(cause == "WALL"){
                if(head[0] < 0)
                    head[0] += tileCount;
                else if(head[0] >= tileCount)
                    head[0] -= tileCount;
                if(head[1] < 0)
                    head[1] += tileCount;
                else if(head[1] >= tileCount)
                    head[1] -= tileCount;
            }
            return false;
        }
        else{
            gameOver(cause);
            return true;
        }
    }
    else
        return false;
}

function foodSpawn() {
    foodX = Math.floor(Math.random() * tileCount);
    foodY = Math.floor(Math.random() * tileCount);

    const rand = Math.floor(Math.random()*1000);
    if (rand%7 == 0)
        foodType = 'star';
    else if (rand%3 == 0)
        foodType = 'pie';
    else
        foodType = 'carrot';

    for (let part of snake) {
        if(part[0] === foodX && part[1] === foodY)
            foodSpawn();
    }
}

function gameOver(cause) {
    clearInterval(gameInterval);
    const duration = Math.floor((Date.now() - startTime) / 1000);
    
    if (currentScore > currentHighScore)
        currentHighScore = currentScore;

    document.getElementById("Cause").innerText = cause;
    document.getElementById("finalScore").innerText = currentScore;
    document.getElementById("SurvivedTime").innerText = duration;
    document.getElementById("HighScore").innerText = currentHighScore;
    
    document.getElementById("Canvas").style.display = "none";
    document.getElementById("EndScreen").style.display = "block";
}

function draw() {
    text = '';
    canvas.fillStyle = "#153d09";
    canvas.fillRect(0, 0, canvasBlock.width, canvasBlock.height);
    if (foodType === 'carrot')
        text = '🥕';
    if (foodType === 'pie')
        text = '🥞';
    if (foodType === 'star')
        text = '🌟';

    canvas.beginPath();
    canvas.textAlign = 'center';
    canvas.font = `${gridSize}px serif`;
    canvas.fillText(text, foodX*gridSize + gridSize/2, foodY*gridSize + gridSize);
    canvas.fillStyle = isImmune ? "gold" : "#4caf50";
    for (let part of snake) {
        canvas.fillRect(part[0] * gridSize + 1, part[1] * gridSize + 1, gridSize - 2, gridSize - 2);
    }
}