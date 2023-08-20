const game = require("./game.js");
const p = require("./player.js");

var g;
var player;
var initPlayerHand;
var initDealerHand;
const otherPlayers = [];
var standWins = 0;
var standTots = 0;
var standPushs = 0;
var standWLP = [0, 0, 0]; // WIN LOSS PUSH
var sessionData = []; // 2d array of objects - player score, then dealer score
/* TODO test if this or array is faster
const MOVE_TEMPLATE = {
    playerCards: null,
    dealerCard: null,

}*/
/*
[player cards - wait these would b outside, wins, losses, pushes, ] dealer card is already known
*/
function initSession()
{
    /**
     * This way we can index into session data with our current score.
     * I don't care that it's ugly, I care that it's fast.
     * Outer
     * 
     * TODO separate hands with aces from hard value hands
     */
    for (let i = 0; i < 4; i++)
    {
        sessionData.push(null);
    }
    for (let i = 4; i < 22; i++)
    {
        // now for the possible dealer values
        let outerArray = [null];
        for (let j = 1; j < 11; j++)
        {
            outerArray.push([]); // these will contain the objects {stand: , hit: , double: , ... etc}
        }
        sessionData.push(outerArray);
    }
    console.log(sessionData);
}
function analyze()
{
    initSession();
    createGame();
    addPlayers();
    g.beginGame();
    for (let i = 0; i < 1000; i++)
    analyzeRound();

    console.log("w",standWins);
    console.log("p",standPushs);
    console.log("t",standTots);

}
function newRound()
{
    standWLP = [0, 0, 0]; // W L P

}
function analyzeRound()
{
    newRound();
    g.placeBets();
    g.dealCards();
    initDealerHand = g.getDealerTopCard();
    initPlayerHand = JSON.parse(JSON.stringify(player.currentHand[0]));

    //printPreRoundDat();
    if (!checkInstantBlackJack())
    {
        // save state
        // store what the hand is (dealer and player)
        // test each thing
            // log results
        g.saveState();
        testStand();

        pushRoundResults();
    }
    // for now if you get an instant bj,
    // save in hard totals, etc (ref that chart to store dat)

    g.endOfRound();
}
function pushRoundResults()
{
    // initdealerhand, initpla...
    // stand, hit, etc..

    throw new Error("finish push round results");
}
function checkInstantBlackJack()
{
    if (player.finishedTurn())
    {
        console.log("Player got a blackjack man.");
        return true;
    }
    return false;
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
function printPreRoundDat()
{
    console.log("the count is at:", g.count);
    console.log("Total cards in play:", g.shoe.length + g.discards.length + otherPlayers.length * 2 + 4); // 4 is 2 cards for the dealer, 2 for the player
    console.log("player cash:", player.funds);
    console.log("dealer hand:",game.cardtoString(initDealerHand),"\n");
    console.log("player hand:");
    game.printHand(initPlayerHand);
}

function closeRound()
{
    // finish any other player moves
    if (otherPlayers.length > 0)
    {
        otherPlayersMoves();
    }
    g.dealerTurn();
}
function otherPlayersMoves()
{
    throw new Error("other player moves not implemented");
}
function testStand()
{
    g.playerStand(player, 0);
    closeRound();
    let prevR = player.prevRoundResults[0];
    console.log("p",player.prevRoundResults[0]);
    console.log(player.funds);
    if (prevR > 0)
        standWLP[0]++;
    else if (prevR < 0)
        standWLP[1]++;
    else
        standWLP[2]++;
}

module.exports = {analyze}