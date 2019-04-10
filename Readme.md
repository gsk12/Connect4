
Connect 4
=======================
Connect 4 multiplayer game

 The objective of the game is to connect four of your checkers/tokens in a row while preventing your opponent from doing the same.  The game is played on a 7x6 board. At each turn, the player will drop a token in one of the seven columns by clicking on the chosen column. If a player connects 4 in any direction, they win. If the board fills up, the game is a tie.

Used `NodeJS` as a backend server to handle the requests as it could handle over 10,000 daily user's requests.
`Socket.io` is used to handle multiplayer connections and server chat room.
The game states are saved in a `MongoDB`.
`Handlebars.js` is used to build semantic templates on top of `express`.

Detailed packages used are mentioned in `package.json`

Tested on Windows 10 -  Google Chrome v.2.0.3626.109 (64-bit), Mozilla Firefox v.65.0.1 (64-bit) and Microsoft Edge v42.17134.1.0. 

Prerequisites
-------------

- [MongoDB](https://www.mongodb.org/downloads)
- [Node.js 8.0+](http://nodejs.org)


Getting Started
---------------

```bash
# Change directory
cd Connect4

# Install the dependencies
npm install

# The app expects mongoDB server to be running at localhost:27017 

# Then simply start the app
node .
```

## Usage

After initiating the server visit `localhost:3000` in the browser to access the game. You can click start immediately to create a new game room and wait for another player to join your game room. Also, you could select an available game room from the dropdown menu and join an existing game room. Any number of players could visit `localhost:3000` join/create games.  A game shall only start if two players have been connected in a game room. Once a game starts,  click on the arrow to drop a token. When a token is played, it falls into the bottommost position on the grid. And then the game logic follows.


## Explanation

### app.js
After starting the server, we can connect to it at port 3000 on localhost.
On start entries for 1000 game rooms are created (Can be modified to as we see fit). 

`Socket` keeps on listening for connection requests at our `localhost:3000`. If a new player is connected, their game room state is initialized and updated and a `"StartGame"` is emitted to the player rooms by socket. `addPlayer` function is called to add a player to a room and update the number of players and the players in the game room. On disconnect similarly disconnect message is emitted and `removePlayer` function is called resetting the player's state and updating it in the DB. Socket also listens for a forfeit and draw request if a user request for either of the options. When a player drops a token in socket listens on `putToken` and calls `addToken` function. In `addToken` function the constraints on the state of the board, `checkWin` and player's turn are handled and the player's `settings` values are updated (also in DB). Socket also checks and emits other game requirements such as chat messages, game resulting in a draw,

Bodyparser is used to parse the data in `json` format and we set the view engine to handlebars. On loading the website, a DB query is used to check if there are any games with number of players  = `1`, so those game rooms are available and waiting for another player to join them. Such rooms are sent as context data along with the CSS to be delivered along with the index page.

On starting a game (posting the game settings form) the user is redirected to `/four` page. Here with the help of DB queries the number of players in a requested room is determined. If there are no players in that game room, the player is added to a room along with their settings. If there is only one player is in the game room, then the requested user is added to the game room with their settings. If more than one player is present in a game room, the game room is full and if another user is trying to add themselves they shall receive an error.   

### game.js, roomboard.js & checkforwin.js

The `playAgame` function is called at the start of every game. We set a game board represented by 7 arrays each with 6 elements. Initialized with 0's. Each of the elements should contain a value: 0 if unoccupied, 1 if occupied by player 1, 2 if occupied by player 2.
```           
#empty board state array
[[] [] [] [] [] [] []]

[0, 0, 0, 0, 0, 0],
[0, 0, 0, 0, 0, 0],
[0, 0, 0, 0, 0, 0],
[0, 0, 0, 0, 0, 0],
[0, 0, 0, 0, 0, 0],
[0, 0, 0, 0, 0, 0],
[0, 0, 0, 0, 0, 0]

  0 1 2 3 4 5 6 ---> i                 
  v v v v v v v
5>* * * * * * *
4>* * * * * * *
3>* * * * * * *
2>* * * * * * *
1>* * * * * * *
0>* * * * * * *      

```
 There are 42 moves are possible until a draw, so keeping that as a check `addMove` function to add a token move to the board along with the player whose turn it is to make a move. The game board is updated by modifying the column number according to the token move by the player. `registerMove` registers the move and adds the token to the board. `playerNumber` is the number of the player making the move. `colummNumber` is the column of the board in play. `checkForWin` on the board returns the number player if there is a win, otherwise returns zero. There are several helper functions to check the state of the game. `checkForWin` function calls for `checkAtSpot` function over the state of the board array. Returns 0 if there is no win,  1 if player 1 is the winner or 2 if player 2 is the winner. `checkAtSpot` calls the `checkHorizontal`, `checkVertical`, `checkDiagPos`, `checkDiagNeg` helper functions to check over the possible valid win states and returns the value. 
 If all the 42 moves have been exhausted and there is no winner, the game is a draw and zero is returned.

### index.js & four.js

In `index.js` We have some input checks and variable initializations. `setname` function set's the name of the chat message. `joining` and `sendMessage` functions emit the message.  Socket on receiving a chat message creates a list element and keeps on appending to it.

In `four.js` the playerData variable is initialized and this data is emitted over the socket to the DB and so and. The player's game state is maintained with the help of this data. Here the socket connection is set up to the `http://localhost:3000` address. We have some event listeners for when the `forfeit` button is clicked, `submit msg` click, `draw request` button click, `user message` keypress (enter). When a new player is connected on the socket their `numplayer` is set to two and their status is updated on the game page. Socket on receiving a chat message creates a list element and keeps on appending to it. If a single column is entirely stacked / full we disable the column. If a player forfeits, the socket is disconnected and the status is updated and the player is redirected to the home page. When a player is disconnected `numPlayer` is set to 1 and the status is updated. When a new token is dropped/added the board element is updated and the player turn is switched. On starting a game (when two players have initialized a game) the Modal is removed and the turn is switched. We update the content displaying the turn state if the player has won/lost. `updateStatus` has three cases - 0 if only one player is connected, 1 if two players are connected and the modal is removed, 2 if the game is forfeited.
`votetoDraw` functions is used to request a draw from the other user. The `switchTurn` function enables (light green) and disables (grey) the columns (markers) to the other player based on the player number (numPlayer). `putToken` emits the selected column's id along with he name, room data.

### views

Each handlebar page is loaded on to the main.handlebars page. On visiting the `localhost:3000` page the player lands on the `index` page. A jQuery script is used to generate a random room number and random name on each document load and the input is disabled.  If the user selects an available room from the drop-down menu, a jQuery script captures that room number and utilizes that value on form submit. In this page, we have a box for a game settings form and that is posted to the server. There are some other boxes with Instructions, trivia and a chat room. We also have some helper handlebars (partials) to manipulate the game board column's and serve a consistent header. Upon starting (`start`) or connecting to a game redirecting to the `four` page if only one player is present in the room the modal content is served with a waiting gif and the rest of the page is disabled till another player is connected to the game room. Once another player is connected and a game is initiated. The content on the page is enabled. The column selectors are enabled and their colors are changed based on the turn of the player. The page has several content columns of the displaying the game room number, player's pseudo name, the game's connection status, chat room, turn state and other messages.  The `Request a draw` button can be used to request the other player for a draw. The forfeit button abandons the game room. 


## Possible improvements

Implement a queue based logic than the current logic based on game room number.
Convert the game into an API based implementation for better management.
Ability to spectate games.
Realistically animations of tiles falling through the board. 
Chatroom within a specific game.

References
---------------
- [RainingChain](https://www.youtube.com/channel/UC8Yp-YagXZ4C5vOduEhcjRw)
- [Survival Game](https://github.com/gsk12/Survival-Game)
- [Connect-four-server](https://github.com/shonkap/Connect-Four-server)
- [Gif Credits](https://tenor.com/)
- [Title Image credit](https://itunes.apple.com/us/app/connect-fun-four-in-a-row/id703429662?mt=8)
- [Animated modal header](https://www.w3schools.com/howto/tryit.asp?filename=tryhow_css_modal2)
- [GameHub](https://github.com/benas/gamehub.io)
