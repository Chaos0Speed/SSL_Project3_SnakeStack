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
let gridSize = Number(document.getElementById("gridSize").value) || 40;
let tileCount;

let currentHighScore = 0;
let currentScore = 0;
let foodX, foodY, foodType, isImmune, immtimeout, gameInterval, immtime, immtimetimeout;
let startTime = 0, endTime = 0;

let snake = [];
let dx = 0;
let dy = 0;

let audioContext = new (window.AudioContext || window.webkitAudioContext)();
let isPaused = false;

document.addEventListener("keydown", (e) => {
    if (e.key === " " || e.key === "p" || e.key === "P") {
        e.preventDefault();
        togglePause();
        return;
    }
    if(isPaused) return;
    if ((e.key === "ArrowUp" || e.key === "w" || e.key === "W") && dy !== 1) { dx = 0; dy = -1; playTurnSound(); }
    if ((e.key === "ArrowDown" || e.key === "s" || e.key === "S") && dy !== -1) { dx = 0; dy = 1; playTurnSound(); }
    if ((e.key === "ArrowLeft" || e.key === "a" || e.key === "A") && dx !== 1) { dx = -1; dy = 0; playTurnSound(); }
    if ((e.key === "ArrowRight" || e.key === "d" || e.key === "D") && dx !== -1) { dx = 1; dy = 0; playTurnSound(); }
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
    gridSize = Number(document.getElementById("gridSize").value) || 40;
    const maxPossibleSize = Math.min(window.innerWidth * 0.85, window.innerHeight * 0.85);
    tileCount = Math.floor(maxPossibleSize / gridSize);
    canvasBlock.width = canvasBlock.height = tileCount * gridSize;
    foodSpawn();

    if (toggle.checked) {
        const interval = 1000 / (Number(speed.value) || 40);
        gameInterval = setInterval(runGame, interval);
    } else {
        gameInterval = setInterval(runGame, 150);
    }
};

function runGame() {
    if(toggle.checked){
        clearInterval(gameInterval);
        gameInterval = setInterval(runGame, (150 - 2*Math.min(62.5, currentScore)));
    }
    console.log("running game")
    let newHead = [snake[0][0] + dx, snake[0][1]+dy];
    snake.unshift(newHead);
    snake.pop();

    if (checkCollision()) return;

    if (newHead[0] === foodX && newHead[1] === foodY) {
        playEatSound();
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

// Modified draw() function
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
    canvas.save();
    canvas.translate(snake[0][0] * gridSize + gridSize / 2, snake[0][1] * gridSize + gridSize / 2);
    canvas.rotate(headRotation);
    canvas.translate(-gridSize / 2, -gridSize / 2);

    let pulseScale = isPaused ? 1.0 + 0.02 * Math.sin(Date.now() * 0.005) : 1.0;
    canvas.scale(pulseScale, pulseScale);

    canvas.fillStyle = "rgb(212, 175, 55)";
    canvas.fillRect(2, 2, gridSize - 4, gridSize - 4);
    canvas.strokeStyle = "#1A1A1B";
    canvas.lineWidth = 2.5;
    canvas.beginPath();
    canvas.moveTo(5, 5);
    canvas.lineTo(gridSize - 5, gridSize - 5);
    canvas.moveTo(gridSize - 5, 5);
    canvas.lineTo(5, gridSize - 5);
    canvas.stroke();

    canvas.restore();

    snake.forEach((part, index) => {
        if (index === 0) return;

        const x = part[0] * gridSize;
        const y = part[1] * gridSize;

        const ratio = 1 - 0.5 * ((index) / (snake.length));
        const opacity = ratio*0.8 + 0.2;
        const inset = (1-ratio)*gridSize*0.5;

        canvas.strokeStyle = `rgba(165, 135, 15, ${opacity})`;
        canvas.lineWidth = 2;
        canvas.strokeRect(x + inset + 1, y + inset + 1, gridSize*ratio - 2, gridSize*ratio - 2);
        canvas.fillStyle = `rgba(165, 135, 15, ${opacity})`;
        canvas.fillRect(x + inset + 2, y + inset + 2, gridSize*ratio - 4, gridSize*ratio - 4);
    });
}

function playTurnSound() {
    let oscillator = audioContext.createOscillator();
    let gainNode = audioContext.createGain();
    oscillator.connect(gainNode);
    gainNode.connect(audioContext.destination);
    oscillator.frequency.setValueAtTime(2000, audioContext.currentTime); // High-freq
    oscillator.type = 'square';
    gainNode.gain.setValueAtTime(0.1, audioContext.currentTime);
    gainNode.gain.exponentialRampToValueAtTime(0.01, audioContext.currentTime + 0.1);
    oscillator.start(audioContext.currentTime);
    oscillator.stop(audioContext.currentTime + 0.1);
}

function playEatSound() {
    let oscillator = audioContext.createOscillator();
    let gainNode = audioContext.createGain();
    oscillator.connect(gainNode);
    gainNode.connect(audioContext.destination);
    oscillator.frequency.setValueAtTime(100, audioContext.currentTime); // Low-freq
    oscillator.type = 'sawtooth';
    gainNode.gain.setValueAtTime(0.3, audioContext.currentTime);
    gainNode.gain.exponentialRampToValueAtTime(0.01, audioContext.currentTime + 0.5);
    oscillator.start(audioContext.currentTime);
    oscillator.stop(audioContext.currentTime + 0.5);
}

function togglePause() {
    isPaused = !isPaused;
    if (isPaused) {
        clearInterval(gameInterval);
        gameInterval = null;
    } else {
        const interval = toggle.checked ? 1000 / (Number(speed.value) || 40) : 150;
        gameInterval = setInterval(runGame, interval);
    }
}

