function checkInput() {
	var text = "";
	if (!document.getElementById("playerId").value) {
		text = "Missing player name";
	}
	if (!document.getElementById("roomId").value) {
		text += "\nMissing room number";
	}
	if (!text)
		document.getElementById("form").submit();
	else
	 	window.alert(text);
}


var player = document.getElementById("player-one");
var playerData = {name: 'Guest', room: '1', color: "blue"};
var socket = io.connect('http://localhost:3000');


function setname(){
	playerData.name = document.getElementById("Mainnamemsg").value;
	document.getElementById("Mainnamemsg").value = playerData.name;
	joining(playerData.name + " joined the chat")
};

socket.emit('player', playerData);

document.getElementById("Mainusermsg").addEventListener("keypress", pressEnter);

socket.on('chatMessage', function(content) {
	var liElement = document.createElement("li");
	var textNode = document.createTextNode(content.author + " says : " + content.text);
	liElement.appendChild(textNode);
	document.getElementById("Mainchatbox").appendChild(liElement);
});

function pressEnter(event) {
    if (event.which == 13 || event.keyCode == 13) {
			if(playerData != ''){
    		sendMessage();
    		return true;
			} else{
				window.alert("Enter a name");
			}
    }
    return false;
};


function sendMessage() {
	var message = document.getElementById("Mainusermsg").value;
	if (message) {

		socket.emit('emittedMessage', {author : playerData.name, text: message});
		document.getElementById("Mainusermsg").value = '';
	}
};

function joining(message) {
	if (message) {
		socket.emit('emittedMessage', {author : playerData.name, text: message});
		document.getElementById("Mainusermsg").value = '';
	}
};
