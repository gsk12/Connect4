var checkFor = require("./checkforwin.js");
var reg = require("./roomboard.js");

module.exports = {
	playAgame: playAgame,
	reg: reg,
	checkFor: checkFor
}

// Called at the start of every game.

function playAgame(){ 
	var turn = 0;
	var board = 
		[
			[0, 0, 0, 0, 0, 0],
			[0, 0, 0, 0, 0, 0],
			[0, 0, 0, 0, 0, 0],
			[0, 0, 0, 0, 0, 0],
			[0, 0, 0, 0, 0, 0],
			[0, 0, 0, 0, 0, 0],
			[0, 0, 0, 0, 0, 0]
		];
	while(turn < 42){ 
		board = addMove(board, turn%2 + 1); 
		
		var winner = checkFor.checkForWin(board); 
		if(winner)
			return winner;
		turn = turn + 1;
	}
	return 0; 
}

function addMove(board, player){

	// Add a move to the board.
	var columnNumber = 0;
	board = reg.registerMove(player, columnNumber, board);
	return board;
}
