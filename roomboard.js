// Lets you export this function.

module.exports = {
	registerMove: registerMove
};

function registerMove(playerNumber, columnNumber, boardstate){
	for(var i = 5; i >= 0; i--){
		if(boardstate[columnNumber][i] == 0)
			boardstate[columnNumber][i] = playerNumber;
	}
	return boardstate;
};
