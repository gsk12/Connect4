var player = document.getElementById("player-one");
var numPlayer = 1;
var turn = 0;
var playerData = {name: player.dataset.name, room: player.dataset.room, color: player.dataset.color};
var socket = io.connect('http://localhost:3000');
socket.emit('player', playerData);

for(let i = 0; i <= 6; i++) {
	disableColumn(i); 
}

// event listeners
document.getElementById("forfeit-button").addEventListener("click", sendForfeit);
document.getElementById("submitmsg").addEventListener("click", sendMessage);
document.getElementById("draw-button").addEventListener("click", votetoDraw);
document.getElementById("usermsg").addEventListener("keypress", pressEnter);


socket.on('newPlayer', function(newPlayerData) {
	numPlayer = 2;
	document.getElementById("player-two").dataset[0] = newPlayerData.name;
	document.getElementById("player-two").dataset[1] = newPlayerData.room;
	document.getElementById("player-two").dataset[2] = newPlayerData.color;
	document.getElementById("player-two").children[0].innerText = newPlayerData.name;
	updateStatus(1);
});

socket.on('chatMessage', function(content) {
	var liElement = document.createElement("li");
	var textNode = document.createTextNode(content.author + " says : " + content.text);
	liElement.appendChild(textNode);
	document.getElementById("chatbox").appendChild(liElement);
})

socket.on('fullColumn', function(content) {
	disableColumn(content);
})


socket.on('playerForfeit', function(content) {
	socket.disconnect();
	updateStatus(2);
})

function sendForfeit() {
	socket.emit("forfeit", playerData);
	window.location = "http://localhost:3000";
}

socket.on('disconnectedPlayer', function() {
	updateStatus(0);
	numPlayer = 1;
})


socket.on('newToken', function(content) {
	// function to drop / add token 
	turn = content.turn;
	switchTurn();
	document.getElementById("board").children[content.x].children[5-content.y].style.backgroundColor = content.color;
});

socket.on('startGame', function() {
	turn = 1;
	removeModal();
	switchTurn();
})

socket.on('playerWin', function(content) {
	turn = 0;
	switchTurn();
	if (numPlayer != content.num){
		document.getElementById("turn-marker").innerText = "You won !";
		document.getElementById("turn-marker").style.backgroundColor = "green";
	} else {
		document.getElementById("turn-marker").innerText = content.player + " won !";		
	}
	document.getElementById("forfeit-button").disabled = true;
	document.getElementById("draw-button").disabled = true;
});

function pressEnter(event) {
    if (event.which == 13 || event.keyCode == 13) {
    	sendMessage();
    	return true;
    }
    return false;
};

function updateStatus(state) {

	switch(state) {
		case 0:
			document.getElementById("player-two").children[0].innerText = "[...]";
			document.getElementById("player-two").children[1].innerText = "Not connected";
			document.getElementById("player-two").children[1].style.color = "red";
			break;
		case 1:
			document.getElementById("player-two").children[1].innerText = "Connected";
			document.getElementById("player-two").children[1].style.color = "green";
			removeModal();
			break;
		case 2:
			document.getElementById("player-two").children[1].innerText = "Forfeit";
			document.getElementById("player-two").children[1].style.color = "red";
			document.getElementById("turn-marker").innerText = "Game Over";			
			document.getElementById("forfeit-button").disabled = true;
			document.getElementById("draw-button").disabled = true;
			break;
		default:
			break;
	}
	
}

function votetoDraw() {
	socket.emit('drawrequest');
}

socket.on('draw', function() {
	if(confirm("Other player votes for a Draw!")){
		socket.emit('drawfullfillreq');
		window.location = "http://localhost:3000";
	}
});

socket.on('drawfullfill', function(){
	window.location = "http://localhost:3000";
});

function removeModal() {
	var modal = document.getElementById("loading-modal");
	modal.style.display = "none";
}
function sendMessage() {
	var message = document.getElementById("usermsg").value;
	if (message) {
		socket.emit('emittedMessage', {author : playerData.name, text: message});
		document.getElementById("usermsg").value = '';
	} else {
		window.alert("Input is empty !");
	}
}

function switchTurn(){
	var turnMarker = document.getElementById("turn-marker");
	if(turn == numPlayer) {
		turnMarker.style.backgroundColor="green";
		turnMarker.innerText="Your turn !";
		for(let i = 0; i <= 6; i++) {
			enableColumn(i);
		}
	} else {
		for(let i = 0; i <= 6; i++) {
			disableColumn(i); 	
		}
		turnMarker.style.backgroundColor="red";
		turnMarker.innerText="Not your turn !";
	}
}

function putToken(event) {
	socket.emit('putToken', {column : parseInt(this.id), player : playerData.name, room: playerData.room});
}

function disableColumn(num) {
	var column = document.getElementById(String(num));
	column.style.backgroundColor="grey";
	column.disabled = true;
	column.removeEventListener("click", putToken);
}

function enableColumn(num) {
	var column = document.getElementById(String(num));
	column.style.backgroundColor="lightgreen";
	column.disabled = false;
	column.addEventListener("click", putToken);
}