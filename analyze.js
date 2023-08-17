const game = require("./game.js");
const p = require("./player.js");

var g;
var player;
function analyze()
{
    createGame();
    addPlayers();
    g.beginGame();

}
function analyzeRound()
{
    g.placeBets();
    g.dealCards();
}
function createGame()
{
    g = new game.Game(6);
}
function addPlayers()
{
    player = new p.Player(0, false);
    g.playerJoin(0, player);
}
module.exports = {analyze}