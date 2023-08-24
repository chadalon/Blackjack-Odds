const game = require("./game.js");
const p = require("./player.js");

var g;
var player;
var initPlayerHand;
var initDealerHand;
const otherPlayers = [];
var standWLP; // WIN = 0 LOSS = 1 PUSH = 2
var hitBjSL;
var hitDat;
var doubleWLP;
var resSplitHands = []; // array of arrays
var sessionData = {}; // keys are player cards, and then dealer card is indexed
// TODO test if this or array is faster
// TODO i think we only need to test hit and split/hit now?
// bc we can gather data from that to determine the best thing to do (since the goal is to get the highest score)
const MOVE_TEMPLATE = {
    stand: [0,0,0], // wlp

    hit: [
        [[0,0,0,0,0,0], {/**16: 1, 18: 5, 21: 4 */}],
        [[0,0,0,0,0,0], {/**16: 1, 18: 5, 21: 4 */}],
        [[0,0,0,0,0,0], {/**16: 1, 18: 5, 21: 4 */}],
        [[0,0,0,0,0,0], {/**16: 1, 18: 5, 21: 4 */}],
        [[0,0,0,0,0,0], {/**16: 1, 18: 5, 21: 4 */}],
        [[0,0,0,0,0,0], {/**16: 1, 18: 5, 21: 4 */}],
        [[0,0,0,0,0,0], {/**16: 1, 18: 5, 21: 4 */}],
        [[0,0,0,0,0,0], {/**16: 1, 18: 5, 21: 4 */}],
        [[0,0,0,0,0,0], {/**16: 1, 18: 5, 21: 4 */}],
        [[0,0,0,0,0,0], {/**16: 1, 18: 5, 21: 4 */}] // max you could hit in any hand is 9 times (according to my genius)
    ], // count of dealerscores at values [17, 18, 19, 20, 21, 22+] and player-- how many times etc
    double: [0,0,0] // wlp. this is redundant with the way im doing hit (to a degree)

};
/*
[player cards - wait these would b outside, wins, losses, pushes, ] dealer card is already known
*/
function initSession()
{
    /**
     * idk if this is the best way to store but for now it's what's happening
     * {1,1: [], 1,2: [], 1,3: [], ... 10,10: []}
     */
    let innerArr = [null];
    for (let k = 1; k < 11; k++)
    {
        innerArr.push(JSON.parse(JSON.stringify(MOVE_TEMPLATE)));
    }
    let indexStr;
    for (let i = 1; i < 11; i++)
    {
        for (let j = i; j < 11; j++)
        {
            indexStr = i.toString() + "," + j.toString();
            sessionData[indexStr] = JSON.parse(JSON.stringify(innerArr));
        }
    }
}
function analyze()
{
    initSession();
    createGame();
    addPlayers();
    g.beginGame();
    for (let i = 0; i < 100000; i++)
    analyzeRound();

    console.log(JSON.stringify(sessionData));

}
function newRound()
{
    // standwlp ==[....] init anything needed to here
}
function analyzeRound()
{
    newRound();
    g.placeBets();
    g.dealCards();
    initDealerHand = g.getDealerTopCard();
    initPlayerHand = JSON.parse(JSON.stringify(player.currentHand[0]));

    if (!checkInstantBlackJack())
    {
        // save state
        // store what the hand is (dealer and player)
        // test each thing
            // log results
        g.saveState();
        // printRoundDat();
        testStand();
        // printRoundDat();
        g.loadState([player]);
        //printRoundDat();
        g.saveState();
        testHit();
        if (hitBjSL === 2)
        {
            // if we lost the hit we gonna lose the double
            doubleWLP = 1;
        }
        else
        {
            g.loadState([player]);
            g.saveState();
            testDouble();
        }
        
        /*
        g.loadState([player]);
        g.saveState();
        testSplit();*/
        //throw new Error("stah");
        pushRoundResults();
    }
    // for now if you get an instant bj,
    // save in hard totals, etc (ref that chart to store dat)

    g.clearSaves();
    g.endOfRound();
}
function pushRoundResults()
{
    // TODO test speed storing roundkey in vars vs calling twice
    let roundObj = sessionData[getRoundKey()[0]][getRoundKey()[1]];
    roundObj.stand[standWLP]++;
    //roundObj.hit[hitBjSL]++;
    roundObj.double[doubleWLP]++;

    // get num of times hit
    let timesHit = player.currentHand[0].length - 2;
    // add dealer counts
    if (hitDat[0] < 23)
        roundObj.hit[timesHit][0][hitDat[0] - 17]++;
    else
        roundObj.hit[timesHit][0][5]++;
    // add player counts
    // make this run faster when done with this function
    let pScore = game.finalScore(game.handTotal(player.currentHand[0]));
    if (roundObj.hit[timesHit][1].hasOwnProperty(pScore.toString()))
         roundObj.hit[timesHit][1][pScore.toString()]++;
    else
        roundObj.hit[timesHit][1][pScore.toString()] = 1;

    if (resSplitHands.length > 0)
    {

    }

    //console.log(roundObj);
    //console.log(sessionData);
    //console.log(JSON.stringify(sessionData));

}
function getRoundKey()
{
    /**
     * @returns {Array} [key, index of inner array]
     */
    let v1 = game.cardValue(initPlayerHand[0].value);
    let v2 = game.cardValue(initPlayerHand[1].value);
    if (v1 > v2)
    {
        return [v2.toString() + "," + v1.toString(), game.cardValue(initDealerHand.value)];
    }
    // now first is either less or they are the same so it doesn't matter
    return [v1.toString() + "," + v2.toString(), game.cardValue(initDealerHand.value)];
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
    player = new p.Player(false);
    g.playerJoin(player);
}
function printRoundDat()
{
    // TODO MOVE THIS TO GAME
    console.log("the count is at:", g.count);
    console.log("Total cards in play:", g.shoe.length + g.discards.length + getCardsInPlay()); // 4 is 2 cards for the dealer, 2 for the player
    console.log("player cash:", player.funds);
    if (g.hiddenDealerCard)
        console.log("dealer hand:",game.cardtoString(initDealerHand),"\n");
    else 
    {
        console.log("dealer hand:");
        game.printHand(g.dealerHand);
    }
    console.log("player hand:");
    game.printPlayerHand(player);
}
function getCardsInPlay()
{
    let cardsInPlay = 0;
    for (let i = 0; i < otherPlayers.length; i++)
    {
        // get amt of cards
        // TODO test
        for (let j = 0; j < otherPlayers[i].currentHand.length; j++)
        {
            cardsInPlay += otherPlayers[i].currentHand[j].length;
        }
    }
    for (let i = 0; i < player.currentHand.length; i++)
    {
        cardsInPlay += player.currentHand[i].length;
    }
    cardsInPlay += g.dealerHand.length;
    return cardsInPlay;
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
    //console.log("p",player.prevRoundResults[0]);
    //console.log(player.funds);
    if (prevR > 0)
        standWLP = 0;
    else if (prevR < 0)
        standWLP = 1;
    else
        standWLP = 2;
}
function testHit()
{
    hitUntilBeforeLoss(0);
    closeRound();
    // get player hand score
    // get dealer hand score
    // hitdat = 
    hitDat = [game.finalScore(game.handTotal(g.dealerHand)), game.finalScore(game.handTotal(player.currentHand[0]))];

    // logging:
    // hit: {0: [[dealer scores?],[final scores: 16: (how many times), 17: (how many times), etc.]]} - maybe store as arrays
    return;
    // hit
    g.playerHit(player, 0);
    if (player.handComplete[0])
    {
        if (game.finalScore(game.handTotal(player.currentHand[0])) === 21)
        {
            hitBjSL = 0;
            return;
        }
        // lost on first hit
        // add in whatever we log when losing
        hitBjSL = 2;
        return;
    }
    hitBjSL = 1;

    // we could also check avg max num of hits (and get percentagew of losing with each following one)
}

function testDouble()
{
    g.playerDouble(player, 0);
    closeRound();
    let prevR = player.prevRoundResults[0];
    if (prevR > 0)
        doubleWLP = 0;
    else if (prevR < 0)
        doubleWLP = 1;
    else
        doubleWLP = 2;
}

function testSplit()
{
    if (game.cardValue(initPlayerHand[0].value) !== game.cardValue(initPlayerHand[1].value))
    {
        resSplitHands = [];
        return;
    }

    while (player.handCount() < 4)
    {
        // if hand is splittable
        g.playerSplit(player, 0);
        // add to resSplitHands
        // check each hand again, etc

    }
}

// make a function finishOutHand(handNum) or something. this will be called after splitting deck and after surviving a hit
function hitUntilBeforeLoss(handNum)
{
    // loop:
    // save state
    // hit
    // if we lost

    // find out what the highest possible score is/was - if you have an ace
    while (player.canPlayHand(handNum))
    {
        // livin on the edge
        player.currentHand[handNum].push(g.getTopCardInShoe());
        if (game.finalScore(game.handTotal(player.currentHand[handNum])) > 21)
        {
            // next card will be too high, we've hit the max
            player.currentHand[handNum].length -= 1;
            break;
        }
        player.currentHand[handNum].length -= 1;
        g.playerHit(player, handNum);
    }
    if (player.canPlayHand(handNum))
    {
        // stand the player if they are still in the game
        g.playerStand(player, handNum);
    }

}
module.exports = {analyze}