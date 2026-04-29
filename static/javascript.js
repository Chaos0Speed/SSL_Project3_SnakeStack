loginform = document.getElementById("LoginForm");
startbutton = document.getElementById("StartButton");
username = document.getElementById("username");
player = document.getElementById("player");
score = document.getElementById("score");

loginform.onsubmit = (event) => {
    event.preventDefault();
    document.getElementById("StartScreen").style.display = "none";
    document.getElementById("Instructions").style.display = "block";
    player.innerText = username.value;
};

const instructionsForm = document.getElementById("InstructionsForm");
instructionsForm.onsubmit = (event) => {
    event.preventDefault();
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

document.getElementById("home").onclick = () => {
    document.getElementById("EndScreen").style.display = "none";
    document.getElementById("StartScreen").style.display = "block";
    document.getElementById("Canvas").style.display = "none";
    document.getElementById("RunningInfo").style.visibility = "hidden";
};

const toggle = document.getElementById('modeToggle');
const speed = document.getElementById('speed');

toggle.addEventListener('change', function() {
    if (this.checked) {
        document.getElementById("mode-label2").style = "color : rgb(212, 175, 55)";
        document.getElementById("mode-label1").style = "color : rgb(255, 255, 255)";
        speed.disabled = false;
        speed.required = true;
        speed.value = 40;
        speed.focus();
    } else {
        document.getElementById("mode-label1").style = "color : rgb(212, 175, 55)";
        document.getElementById("mode-label2").style = "color : rgb(255, 255, 255)";
        speed.disabled = true;
        speed.required = false;
        speed.value = ""; 
  }
}
);

const canvasBlock = document.getElementById("Canvas");
const canvas = canvasBlock.getContext("2d");
const pauseMenu = document.getElementById("PauseMenu");
let gridSize = Number(document.getElementById("gridSize").value);
let tileCount;

let currentHighScore = 0;
let currentScore = 0;
let foodX, foodY, foodType, isImmune, immtimeout, gameInterval, immtime, immtimetimeout;
let startTime = 0, endTime = 0;

let snake = [];
let dx = 0;
let dy = 0;

let isPaused = false;

document.addEventListener("keydown", (e) => {
    if (e.key === " " || e.key === "p" || e.key === "P") {
        e.preventDefault();
        togglePause();
        return;
    }
    if(isPaused) return;
    if ((e.key === "ArrowUp" || e.key === "w" || e.key === "W") && dy !== 1) { dx = 0; dy = -1;}
    if ((e.key === "ArrowDown" || e.key === "s" || e.key === "S") && dy !== -1) { dx = 0; dy = 1; }
    if ((e.key === "ArrowLeft" || e.key === "a" || e.key === "A") && dx !== 1) { dx = -1; dy = 0; }
    if ((e.key === "ArrowRight" || e.key === "d" || e.key === "D") && dx !== -1) { dx = 1; dy = 0; }
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
    const maxPossibleSize = Math.min(window.innerWidth * 0.85, window.innerHeight * 0.85);
    tileCount = Math.floor(maxPossibleSize / gridSize);
    canvasBlock.width = canvasBlock.height = tileCount * gridSize;
    foodSpawn();

    if (toggle.checked) {
        gameInterval = setInterval(runGame, (1000 / (Number(speed.value) || 40)));
    } else {
        gameInterval = setInterval(runGame, 150);
    }
};

function runGame() {
    if(toggle.checked){
        clearInterval(gameInterval);
        gameInterval = setInterval(runGame, (150 - 2*Math.min(70, currentScore)));
    }
    console.log("running game")
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
                removeExcess();
            } , 10000);
        }
        score.innerText = currentScore;
        foodSpawn();
    }

    draw();
};

function grow(len) {
    let tail = snake[snake.length - 1];
    for (let i = 0; i < len; i++) {
        snake.push([tail[0], tail[1]]);
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
        foodType = 'star';      // 142/1000
    else if (rand%3 == 0)       
        foodType = 'pie';       // 333/1000
    else
        foodType = 'carrot';    // 525/1000

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
    
    const gameData = {
        username: username.value,
        age: document.getElementById("age").value,
        score: currentScore,
        survival_time: duration,
        cause: cause
    };

    fetch('/save_score', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
        },
        body: JSON.stringify(gameData)
    })

    document.getElementById("Canvas").style.display = "none";
    document.getElementById("EndScreen").style.display = "block";
}

function removeExcess() {
    if (snake.length <= 1) return;

    const isAdjacent = (a, b) => {
        const dx = Math.abs(a[0] - b[0]);
        const dy = Math.abs(a[1] - b[1]);
        return ((dx === 1 && dy === 0) || (dx === 0 && dy === 1));
    };

    for (let i = 1; i < snake.length; i++) {
        const current = snake[i];
        if (!isAdjacent(snake[i - 1], current)) {
            snake.splice(i);
            break;
        }
    }

    for (let i = 1; i < snake.length; i++) {
        const current = snake[i];
        for(let j = i+1; j < snake.length; j++){
            if (current[0] == snake[j][0] && current[1] == snake[j][1]){
                snake.splice(i);
                return;
            }
        }
    }
}

function shouldDrawShield() {
    if (!isImmune) return false;
    if (immtime > 1) return true;
    return Math.floor(Date.now() / 120) % 2 === 0;
}

function draw() {
    canvas.clearRect(0, 0, canvasBlock.width, canvasBlock.height);

    for (let i = 0; i < tileCount; i++) {
        for (let j = 0; j < tileCount; j++) {
            canvas.fillStyle = (i + j) % 2 === 0 ? "rgb(25, 25, 25)" : "rgb(35, 35, 35)";
            canvas.fillRect(i * gridSize, j * gridSize, gridSize, gridSize);
        }
    }

    canvas.beginPath();
    for (let i = 0; i <= tileCount; i++) {
        const position = i * gridSize + 0.5;
        canvas.moveTo(position, 0);
        canvas.lineTo(position, canvasBlock.width);
        canvas.moveTo(0, position);
        canvas.lineTo(canvasBlock.width, position);
    }
    canvas.strokeStyle = "rgb(35, 35, 35)";
    canvas.lineWidth = 5;
    canvas.stroke();

    canvas.strokeStyle = "rgb(200, 200, 200)";
    canvas.fillStyle = "rgb(220, 220, 220)";
    canvas.textAlign = "center";
    canvas.textBaseline = "middle";
    canvas.font = `${Math.floor(gridSize * 0.85)}px "Apple Color Emoji", "Segoe UI Emoji", "Noto Color Emoji", monospace`;

    if (foodType === "carrot")
        canvas.fillText("🥕", foodX * gridSize + gridSize / 2, foodY * gridSize + gridSize / 2);
    else if (foodType === "pie")
        canvas.fillText("🥞", foodX * gridSize + gridSize / 2, foodY * gridSize + gridSize / 2);
    else if (foodType === "star") 
        canvas.fillText("🌟", foodX * gridSize + gridSize / 2, foodY * gridSize + gridSize / 2);

    let headRotation = 0;
    if (dx === 1) headRotation = 0;
    else if (dx === -1) headRotation = Math.PI;
    else if (dy === -1) headRotation = -Math.PI / 2;
    else if (dy === 1) headRotation = Math.PI / 2;

    canvas.save();
    canvas.translate(snake[0][0] * gridSize + gridSize / 2, snake[0][1] * gridSize + gridSize / 2);
    canvas.rotate(headRotation);
    canvas.translate(-gridSize / 2, -gridSize / 2);

    const shieldVisible = shouldDrawShield();
    const headInset = gridSize * 0.025;
    const headSize = gridSize - headInset * 2;
    const headRadius = Math.max(6, gridSize * 0.24);

    canvas.fillStyle = "rgb(212, 175, 55)";
    canvas.beginPath();
    canvas.roundRect(headInset, headInset, headSize, headSize, headRadius);
    canvas.fill();

    if (shieldVisible) {
        canvas.fillStyle = "rgba(120, 195, 255, 0.5)";
        canvas.beginPath();
        canvas.roundRect(headInset * 0.5, headInset * 0.5, gridSize - headInset, gridSize - headInset, headRadius);
        canvas.fill();
    }

    canvas.fillStyle = "rgba(255, 240, 190, 0.32)";
    canvas.beginPath();
    canvas.roundRect(headInset + gridSize * 0.08, headInset + gridSize * 0.08, headSize * 0.55, headSize * 0.32, headRadius * 0.6);
    canvas.fill();

    canvas.strokeStyle = "#1A1A1B";
    canvas.lineWidth = 2;
    canvas.beginPath();
    canvas.roundRect(headInset, headInset, headSize, headSize, headRadius);
    canvas.stroke();

    const eyeY = gridSize * 0.34;
    const eyeRadius = Math.max(2.2, gridSize * 0.09);
    const pupilRadius = Math.max(1.2, gridSize * 0.04);

    canvas.fillStyle = "#F7F1D5";
    canvas.beginPath();
    canvas.arc(gridSize * 0.67, eyeY, eyeRadius, 0, Math.PI * 2);
    canvas.arc(gridSize * 0.67, gridSize * 0.66, eyeRadius, 0, Math.PI * 2);
    canvas.fill();

    canvas.fillStyle = "#1A1A1B";
    canvas.beginPath();
    canvas.arc(gridSize * 0.72, eyeY, pupilRadius, 0, Math.PI * 2);
    canvas.arc(gridSize * 0.72, gridSize * 0.66, pupilRadius, 0, Math.PI * 2);
    canvas.fill();

    canvas.strokeStyle = "rgba(26, 26, 27, 0.75)";
    canvas.lineWidth = 1.5;
    canvas.beginPath();
    canvas.moveTo(gridSize * 0.82, gridSize * 0.46);
    canvas.lineTo(gridSize * 0.92, gridSize * 0.5);
    canvas.lineTo(gridSize * 0.82, gridSize * 0.54);
    canvas.stroke();

    canvas.restore();

    snake.forEach((part, index) => {
        if (index === 0) return;

        const x = part[0] * gridSize;
        const y = part[1] * gridSize;

        const ratio = 1 - 0.5 * (index / snake.length);
        const opacity = ratio * 0.8 + 0.2;
        const inset = (1 - ratio) * gridSize * 0.5;
        const bodyLeft = x + inset + 1.5;
        const bodyTop = y + inset + 1.5;
        const bodySize = gridSize * ratio - 3;
        const bodyRadius = Math.max(3, bodySize * 0.18);

        canvas.fillStyle = `rgba(212, 175, 55, ${opacity})`;
        canvas.beginPath();
        canvas.roundRect(bodyLeft, bodyTop, bodySize, bodySize, bodyRadius);
        canvas.fill();

        canvas.fillStyle = `rgba(255, 240, 190, ${opacity * 0.28})`;
        canvas.beginPath();
        canvas.roundRect(
            bodyLeft + bodySize * 0.12,
            bodyTop + bodySize * 0.12,
            bodySize * 0.5,
            bodySize * 0.24,
            Math.max(2, bodyRadius * 0.55)
        );
        canvas.fill();

        canvas.strokeStyle = `rgba(26, 26, 27, ${0.72 + ratio * 0.18})`;
        canvas.lineWidth = Math.max(1.4, gridSize * 0.055);
        canvas.beginPath();
        canvas.roundRect(bodyLeft, bodyTop, bodySize, bodySize, bodyRadius);
        canvas.stroke();

        if (shieldVisible) {
            canvas.fillStyle = "rgba(120, 195, 255, 0.5)";
            canvas.fillRect(x, y, gridSize, gridSize);
        }
    });

    if (shieldVisible) drawSheildOutline();
}

function togglePause() {
    isPaused = !isPaused;
    if (isPaused) {
        clearInterval(gameInterval);
        gameInterval = null;
        if (pauseMenu && !pauseMenu.open) pauseMenu.showModal();
    } else {
        if (pauseMenu && pauseMenu.open) pauseMenu.close();
        const interval = toggle.checked ? 1000 / (Number(speed.value) || 40) : (150 - 2*Math.min(62.5, currentScore));
        gameInterval = setInterval(runGame, interval);
    }
}

document.getElementById("resume").onclick = () => {
    if (isPaused) togglePause();
};

document.getElementById("restartPause").onclick = () => {
    if (pauseMenu && pauseMenu.open) pauseMenu.close();
    isPaused = false;
    document.getElementById("Canvas").style.display = "block";
    document.getElementById("RunningInfo").style.visibility = "visible";
    player.innerText = username.value;
    score.innerText = 0;
    startGame();
};

document.getElementById("homePause").onclick = () => {
    if (pauseMenu && pauseMenu.open) pauseMenu.close();
    isPaused = false;
    clearInterval(gameInterval);
    gameInterval = null;
    document.getElementById("Canvas").style.display = "none";
    document.getElementById("RunningInfo").style.visibility = "hidden";
    document.getElementById("StartScreen").style.display = "block";
};

function drawSheildOutline() {
    canvas.save();
    canvas.strokeStyle = "rgba(90, 170, 255, 0.95)";
    canvas.lineWidth = 4;
    canvas.lineCap = "round";
    canvas.lineJoin = "round";
    canvas.beginPath();
    const cornerRadius = Math.min(gridSize * 0.22, 10);

    const segmentHasConnection = (fromX, fromY, toX, toY, direction) => {
        if (!toX && toX !== 0) return false;
        const deltaX = toX - fromX;
        const deltaY = toY - fromY;

        if (direction === "top") return deltaX === 0 && deltaY === -1;
        if (direction === "right") return deltaX === 1 && deltaY === 0;
        if (direction === "bottom") return deltaX === 0 && deltaY === 1;
        return deltaX === -1 && deltaY === 0;
    };

    snake.forEach(([cellX, cellY], index) => {
        const left = cellX * gridSize;
        const top = cellY * gridSize;
        const right = left + gridSize;
        const bottom = top + gridSize;
        const previous = snake[index - 1];
        const next = snake[index + 1];

        const hasTopConnection =
            (previous && segmentHasConnection(cellX, cellY, previous[0], previous[1], "top")) ||
            (next && segmentHasConnection(cellX, cellY, next[0], next[1], "top"));
        const hasRightConnection =
            (previous && segmentHasConnection(cellX, cellY, previous[0], previous[1], "right")) ||
            (next && segmentHasConnection(cellX, cellY, next[0], next[1], "right"));
        const hasBottomConnection =
            (previous && segmentHasConnection(cellX, cellY, previous[0], previous[1], "bottom")) ||
            (next && segmentHasConnection(cellX, cellY, next[0], next[1], "bottom"));
        const hasLeftConnection =
            (previous && segmentHasConnection(cellX, cellY, previous[0], previous[1], "left")) ||
            (next && segmentHasConnection(cellX, cellY, next[0], next[1], "left"));
        const roundTopLeft = !hasTopConnection && !hasLeftConnection;
        const roundTopRight = !hasTopConnection && !hasRightConnection;
        const roundBottomRight = !hasBottomConnection && !hasRightConnection;
        const roundBottomLeft = !hasBottomConnection && !hasLeftConnection;

        if (!hasTopConnection) {
            canvas.moveTo(left + (roundTopLeft ? cornerRadius : 0), top);
            canvas.lineTo(right - (roundTopRight ? cornerRadius : 0), top);
        }
        if (!hasRightConnection) {
            canvas.moveTo(right, top + (roundTopRight ? cornerRadius : 0));
            canvas.lineTo(right, bottom - (roundBottomRight ? cornerRadius : 0));
        }
        if (!hasBottomConnection) {
            canvas.moveTo(left + (roundBottomLeft ? cornerRadius : 0), bottom);
            canvas.lineTo(right - (roundBottomRight ? cornerRadius : 0), bottom);
        }
        if (!hasLeftConnection) {
            canvas.moveTo(left, top + (roundTopLeft ? cornerRadius : 0));
            canvas.lineTo(left, bottom - (roundBottomLeft ? cornerRadius : 0));
        }

        if (roundTopLeft) {
            canvas.moveTo(left, top + cornerRadius);
            canvas.arc(left + cornerRadius, top + cornerRadius, cornerRadius, Math.PI, 1.5 * Math.PI);
        }
        if (roundTopRight) {
            canvas.moveTo(right - cornerRadius, top);
            canvas.arc(right - cornerRadius, top + cornerRadius, cornerRadius, 1.5 * Math.PI, 0);
        }
        if (roundBottomRight) {
            canvas.moveTo(right, bottom - cornerRadius);
            canvas.arc(right - cornerRadius, bottom - cornerRadius, cornerRadius, 0, 0.5 * Math.PI);
        }
        if (roundBottomLeft) {
            canvas.moveTo(left + cornerRadius, bottom);
            canvas.arc(left + cornerRadius, bottom - cornerRadius, cornerRadius, 0.5 * Math.PI, Math.PI);
        }
    });

    canvas.stroke();
    canvas.restore();
}
