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
    document.getElementById("Instructions").style.display = "block";
};

const canvas = document.getElementById("Canvas");
const ctx = canvas.getContext("2d");
const gridSize = 20;
let tileCount;

let currentHighScore = 0;
let currentScore = 0;
let foodX, foodY, foodType, isImmune, immtimeout, gameInterval;
let startTime = 0, endTime = 0;

let snake = [];
let dx = 0;
let dy = 0;

document.addEventListener("keydown", (e) => {
    if ((e.key === "ArrowUp" || e.key === "w") && dy !== 1) { dx = 0; dy = -1; }
    if ((e.key === "ArrowDown" || e.key === "s") && dy !== -1) { dx = 0; dy = 1; }
    if ((e.key === "ArrowLeft" || e.key === "a") && dx !== 1) { dx = -1; dy = 0; }
    if ((e.key === "ArrowRight" || e.key === "d") && dx !== -1) { dx = 1; dy = 0; }
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
    canvas.width = canvas.height = tileCount * gridSize;
    foodSpawn();
    gameInterval = setInterval(runGame, 60);
};

function runGame() {
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
        else if (foodType == 'goldenapple') {
            isImmune = true;
            document.getElementById("status").innerText = "IMMUNE!";
            clearTimeout(immtimeout);
            immtimeout = setTimeout( () => {
                isImmune = false;
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
        snake.push([...tail]);
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
        foodType = 'goldenapple';
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
    ctx.fillStyle = "#1a1a1a";
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    if (foodType === 'carrot') ctx.fillStyle = "orange";
    if (foodType === 'pie') ctx.fillStyle = "white";
    if (foodType === 'goldenapple') ctx.fillStyle = "red";

    ctx.beginPath();
    ctx.arc(foodX * gridSize + gridSize/2, foodY * gridSize + gridSize/2, gridSize/2 - 2, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = isImmune ? "gold" : "#4caf50";
    for (let part of snake) {
        ctx.fillRect(part[0] * gridSize + 1, part[1] * gridSize + 1, gridSize - 2, gridSize - 2);
    }
}