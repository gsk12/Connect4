var express = require("express");
var handlebars = require('express-handlebars');
var bodyParser = require("body-parser");
var MongoClient = require('mongodb').MongoClient;
var app = express();
var maxRooms = 1000;
var urlDb = "mongodb://localhost:27017/test";
var gameEngine = require("./game.js");
var checkWin = require("./checkforwin.js");

MongoClient.connect(urlDb, function(err, client){
    if (err) throw err;
    var db = client.db('test');
    db.collection("rooms").deleteMany({}, function(err, obj){
        if (err) throw err;
        console.log(obj.result.n + "documents deleted.");
        for (let i = 1; i <= maxRooms; i++){
            db.collection("rooms").insertOne({numRoom : i, players_Number: 0, players: [], colors: ['red', 'black'], board: [[],[],[],[],[],[],[]], turn: 0}, function(err, obj) {
            });
        }
        client.close();
    });
});

var io = require('socket.io').listen(app.listen(3000, function () {
    console.log('server listening on port 3000');
}));

app.use(bodyParser.urlencoded({ extended : true }));
app.use(bodyParser.json());
app.engine('handlebars', handlebars({ defaultLayout: 'main' }));
app.set('view engine', 'handlebars');

app.get('/', function(req, res, next){

	MongoClient.connect(urlDb, function(err, client){
		if (err) throw err;
		var db = client.db('test');
		var query = {players_Number: 1};
		var avail = [];
			db.collection("rooms").find(query).toArray(function(err, result) {
			if (err) throw err;
			if(result.length >= 1){
			for (var k in result) {
				avail.push(result[k].numRoom);
			}
			}

			var availdata = avail;
			context = {style: "./index.css"};
			context.otherData = {data: availdata, style: "./index.css"};
			res.status(200).render('index.handlebars', context);

		});
	client.close();
	});
});


app.use(express.static('public'));

app.post("/four", function(req,res) {

	var settings;
	MongoClient.connect(urlDb, function(err, client) {

        if (err) throw err
        var db = client.db('test');
		var query = {players_Number: 1};
		var query2 = {players_Number: 0};
		db.collection("rooms").find(query).toArray(function(err, result) {
			settings = {room: parseInt(req.body.room), player: req.body.player,  style: "./four.css"};
			if (err) throw err;
			if (result.length > 0 ) {
				settings.otherPlayer = { room: result[0].numRoom[0], name: result[0].players[0]};
				res.status(200).render('four.handlebars', settings);
			} else {
				db.collection("rooms").find(query2).toArray(function(err, result) {
					if (err) throw err;
					if (result.length > 0) {
					res.status(200).render('four.handlebars', settings);
					}
					else {
						var	error = {error: true, text: 'All available rooms are full !'};
						res.status(200).render('index', error);
					}
					client.close();
				});
			}
			});
	});

});

app.use('*', function(req, res, next) {
    res.status(404).render('404');
});

io.on('connection', function (socket) {
	var player;
	socket.on('player', function(session){
		player = session;
		// join a room
		socket.join(player.room);
		console.log(player.name + " has just entered the room " + player.room);
		var query = {numRoom: parseInt(player.room)};
		addPlayer(player, function() {
			if (player.room != 1)
				MongoClient.connect(urlDb, function(err, client) {
                    if (err) throw err;
                    var db = client.db('test');
					db.collection("rooms").find(query).toArray(function(err, result) {
							if (result[0].players_Number == 2) {
								console.log("emit");
								// emit data
								socket.to(player.room).emit("newPlayer", player);
								db.collection("rooms").update(query, {$set: {board: [[],[],[],[],[],[],[]], turn: 1}});
								io.to(player.room).emit("startGame");
							}
						client.close();
					});
				});
		});
	});

	socket.on('disconnect', function() {
		if (player) {
			console.log(player.name + " has just left the room " + player.room);
			socket.to(player.room).emit("disconnectedPlayer");
			var content = {author: "Server", text: "The other player just disconnected !"};
			socket.in(player.room).emit('chatMessage', content);
			removePlayer(player);
		}
	});

	socket.on('emittedMessage', function(content) {
		// console.log(content)
		io.in(player.room).emit('chatMessage', content);
	});

	socket.on('forfeit', function(content) {
		console.log(content.name, "has forfeited the game in room:", content.room);
		socket.in(player.room).emit('chatMessage', {author: 'Server', text: player.name + ' has forfeit the game. The game is now over.'});
		socket.to(content.room).broadcast.emit('playerForfeit', content.name);
	});

	socket.on('drawrequest', function(){
	    console.log("player wants a call a draw");
	    socket.in(player.room).emit('chatMessage', {author:player.name, text:"votes for a Draw!"});
	    socket.broadcast.to(player.room).emit('draw');
	});

	socket.on('drawfullfillreq', function(){
	    socket.broadcast.to(player.room).emit('drawfullfill');
    });
    
	socket.on('putToken', function(content) {
		// console.log(content);
        addToken(content);
    });

    function addToken(settings) {
		var query = {numRoom: parseInt(settings.room)};
		MongoClient.connect(urlDb, function(err,client) {
            if (err) throw err;
            var db = client.db('test');
			db.collection("rooms").find(query).toArray(function(err, result) {
				if (err) throw err;
				if (result[0].board[settings.column].length < 6) {
					// console.log(result);
					if (result[0].turn == 1)
						result[0].turn = 2;
					else
                        result[0].turn = 1;
                        
					result[0].board[settings.column][result[0].board[settings.column].length] = result[0].players.indexOf(settings.player)+1;
					db.collection("rooms").update(query, {$set: {board: result[0].board, turn: result[0].turn}});
					io.in(player.room).emit('newToken', {x : settings.column, color: result[0].colors[result[0].players.indexOf(settings.player)], y: result[0].board[settings.column].length-1, turn :result[0].turn});
					client.close();
				}
		        if(checkWin.checkForWin(result[0].board) == 1){
		          console.log("player 1 wins");
		          io.in(player.room).emit('playerWin',{num : "1", player:result[0].players[0]});
		          }
		        else if(checkWin.checkForWin(result[0].board) == 2){
		          console.log("player 2 win");
		          io.in(player.room).emit('playerWin',{num : "2", player:result[0].players[1]});
				}else 
		        	client.close();
		        
			});
	});
	}
});

function addPlayer(player, next) {
	MongoClient.connect(urlDb, function(err, client) {
        var db = client.db('test');
		if (err) throw err;
		var query = {numRoom: parseInt(player.room)};
		db.collection("rooms").find(query).toArray(function(err, result) {
			result[0].players.push(player.name);
			result[0].players_Number++;
			db.collection("rooms").update(query, {$set: {players: result[0].players, players_Number: result[0].players_Number}}, function() {
				db.collection("rooms").find(query).toArray(function(err2, result2) {
					client.close();
					next();
				});
			});
		});
	});
};

function removePlayer(player) {
	MongoClient.connect(urlDb, function(err, client) {
        var db = client.db('test');
		if (err) throw err;
		var query = {numRoom: parseInt(player.room)};
		db.collection("rooms").find(query).toArray(function(err, result) {
			console.log("Removing : " + JSON.stringify(result));
			if(result[0].players_Number == 1) {
				result[0].players = [];
				result[0].colors = [];
				result[0].board = [[],[],[],[],[],[],[]];
			} else {
				result[0].players.splice(result[0].players.indexOf(player.name),1);
				result[0].colors.splice(result[0].players.indexOf(player.name),1);
			}
			result[0].players_Number--;
			db.collection("rooms").update(query, {$set: {players: result[0].players, players_Number: result[0].players_Number, colors: result[0].colors, board: result[0].board}}, function() {
				db.collection("rooms").find(query).toArray(function(err2, result2) {
					client.close();
				});
			});
		});
	});
};
