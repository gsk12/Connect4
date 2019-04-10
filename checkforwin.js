// Exporting the checkForWin function.
module.exports = {
	checkForWin: checkForWin
}

function checkForWin(boardstate){
	var result = 0;
	var success = false;
	for(var i = 0; i < 7 && !success; i++){
		for(var j = 0; j < boardstate[i].length && !success; j++){
			result = checkAtSpot(boardstate, i, j, boardstate[i][j]);
			if(result){
				success = true;
				console.log("Player", result, "has won the game.");
			}
		}
	}
	return result;
}

//  Helper Functions


function checkAtSpot(boardstate, loci, locj, occupy){
	if(!occupy)
		return 0;
	else{
		var victor = 0;
		victor = checkHorizontal(boardstate, 1, occupy, loci, locj);
		if(victor)
			return victor;
		victor = checkVertical(boardstate, 1, occupy, loci, locj);
		if(victor)
			return victor;
		victor = checkDiagPos(boardstate, 1, occupy, loci, locj);
		if(victor)
			return victor;
		victor = checkDiagNeg(boardstate, 1, occupy, loci, locj);
		return victor;
	}
}




function checkHorizontal(boardstate, prev, playerOfInterest, loci, locj){
	loci++;
	if(loci > 6 || boardstate[loci].length <= locj)
		return 0;
	if(boardstate[loci][locj] == playerOfInterest){
		prev++;
		if(prev == 4)
			return playerOfInterest;
		else
			return checkHorizontal(boardstate, prev, playerOfInterest, loci, locj);
	}
	else
		return 0;
}




function checkVertical(boardstate, prev, playerOfInterest, loci, locj){
	locj++;
	if(locj > 5 || boardstate[loci].length <= locj)
		return 0;
	if(boardstate[loci][locj] == playerOfInterest){
		prev++;
		if(prev == 4){
			console.log("Player ", playerOfInterest, " returned!");
			return playerOfInterest;
		}
		else
			return checkVertical(boardstate, prev, playerOfInterest, loci, locj);
	}
	else
		return 0;
}



function checkDiagPos(boardstate, prev, playerOfInterest, loci, locj){
	loci++;
	locj++;
	if(locj > 5 || loci > 6 || boardstate[loci].length <= locj)
		return 0;
	if(boardstate[loci][locj] == playerOfInterest){
		prev++;
		if(prev == 4)
			return playerOfInterest;
		else
			return checkDiagPos(boardstate, prev, playerOfInterest, loci, locj);
	}
	else
		return 0;
}


function checkDiagNeg(boardstate, prev, playerOfInterest, loci, locj){
	loci++;
	locj--;
	if(locj < 0 || loci > 6 || boardstate[loci].length <= locj)
		return 0;
	if(boardstate[loci][locj] == playerOfInterest){
		prev++;
		if(prev == 4)
			return playerOfInterest;
		else
			return checkDiagNeg(boardstate, prev, playerOfInterest, loci, locj);
	}
	else
		return 0;
}
