enterbutton = document.getElementById("EnterButton");
startbutton = document.getElementById("StartButton");
username = document.getElementById("username");
player = document.getElementById("player");

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
};

const canvas = document.getElementById("Canvas");
const ctx = canvas.getContext("2d");
const gridSize = 20;
const tileCount = canvas.width / gridSize;
ctx.fillStyle = "green";