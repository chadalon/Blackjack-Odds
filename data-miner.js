const game = require("./game.js");
const p = require("./player.js");
const hf = require("./helperFuncs.js");
const readline = require('readline');
const fs = require('fs');
const { performance } = require("perf_hooks");

var rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout,
});
function askQuestion(query) {

    return new Promise(resolve => rl.question(query, ans => {
        rl.close();
        resolve(ans);
    }))
}
// for logging
var totalTime = 0; // avg ~ 1.69ms
// if file not exist, create one to save amt of rounds ran, total time
var g;
var player;
var initPlayerHand;
var initDealerHand;
const otherPlayers = [];
var standWLP; // WIN = 0 LOSS = 1 PUSH = 2
var standDat;
var hitDat;
var doubleWLP;
var resSplitHands = []; // array of arrays
var sessionData = {}; // keys are player cards, and then dealer card is indexed
var exiting = false;
// TODO test if this or array is faster
const MOVE_TEMPLATE_WLP = [
    [0,0,0,0,0,0,0,0,0,0], // we won WLP[0][3] times hitting 3 times in this situation
    [0,0,0,0,0,0,0,0,0,0],
    [0,0,0,0,0,0,0,0,0,0]
];
const SPLIT_TEMPLATE = [
    // store how many decks split
    // how many won/lost
    // and maybe same data as hit could be stored - but we need a way to separate it
    // so we can check stats on decks that were split vs not
    null, // INDEX in to list with value of cards split
    [
        //second card
        null,
        [
            // index is dealer's card
            null,
            [
                // index is how many times hit
                [[0,0,0,0,0,0], {/**16: 1, 18: 5, 21: 4 */}],
                [[0,0,0,0,0,0], {/**16: 1, 18: 5, 21: 4 */}],
                [[0,0,0,0,0,0], {/**16: 1, 18: 5, 21: 4 */}],
                [[0,0,0,0,0,0], {/**16: 1, 18: 5, 21: 4 */}],
                [[0,0,0,0,0,0], {/**16: 1, 18: 5, 21: 4 */}],
                [[0,0,0,0,0,0], {/**16: 1, 18: 5, 21: 4 */}],
                [[0,0,0,0,0,0], {/**16: 1, 18: 5, 21: 4 */}],
                [[0,0,0,0,0,0], {/**16: 1, 18: 5, 21: 4 */}],
                [[0,0,0,0,0,0], {/**16: 1, 18: 5, 21: 4 */}],
                [[0,0,0,0,0,0], {/**16: 1, 18: 5, 21: 4 */}]
            ]
        ]
    ]


];
var splitData = {};
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
        innerArr.push(JSON.parse(JSON.stringify(MOVE_TEMPLATE_WLP)));
    }
    let indexStr;
    for (let i = 1; i < 11; i++)
    {
        for (let j = i; j < 11; j++)
        {
            indexStr = i.toString() + "," + j.toString();
            sessionData[indexStr] = JSON.parse(JSON.stringify(innerArr));
            splitData[indexStr] = JSON.parse(JSON.stringify([innerArr,innerArr,innerArr])); // after 1 split, 2 splits, or 3
        }
    }
}
function main()
{
    analyze();
}
async function analyze(saveEvery = 10000)
{
    readline.emitKeypressEvents(process.stdin);
    process.stdin.setRawMode(true);
    
    process.stdin.on('keypress', (str, key) => {
        console.log(str, key, run);
        // Conditions on key
        if(key.name == 'escape'){
            exiting = true;
        }  
        if(key.name == 'c' && key.ctrl == true){
            process.exit(1);
        }
    });
    readFileIfExists();
    createGame();
    addPlayers();
    g.beginGame();
    let i = 0;
    let start = performance.now();
    let end;
    while(true)
    {
        if (exiting)
        {
            break;
        }
        if (i % saveEvery === 0 && i > 0)
        {
            end = performance.now()
            totalTime += end - start
            console.log("saving.. have now ran",i,"times");
            console.log(`avg time per round: ${totalTime / i}ms`) // avg time over 1 million was 3.3ms (mightve been slow cause teams was running)
            //console.log("You have 5 seconds to move on with your life.");
            //await setTimeout(function(){console.log("continuing...");},10); // doesnt work for some fucking reason
            start = performance.now();
            saveDat();
        }
        analyzeRound();
        i++;
    }
    console.log("Saving and exiting...");
    saveDat();
    console.log("Ran",i,"times.");
    console.log(JSON.stringify(sessionData));

}
function saveDat(fname = "dat.json")
{
    fs.writeFileSync(fname, JSON.stringify(sessionData));

}
function readFileIfExists(fname = "dat.json")
{
    if (fs.existsSync(fname))
    {
        console.log("Reading file.");
        sessionData = JSON.parse(fs.readFileSync(fname));
    }
    else
    {
        initSession();
    }
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
    let b = getDealerAndPlayerTotal();
    checkHand();
    /*
    g.saveState();
    hitDat = await testHit();

    g.loadState([player]);
    await testSplit();
    */
    // console.log(g.savePlayers.length);
    pushRoundResults();
    g.endOfRound();
}
function pushRoundResults()
{
    // TODO test speed storing roundkey in vars vs calling twice
    let roundObj = sessionData[hf.getRoundKey(initPlayerHand, initDealerHand)[0]][hf.getRoundKey(initPlayerHand, initDealerHand)[1]];
    if (!hitDat)
    {
        askQuestion("add in split data");
    }
    for (let i = 0; i < 3; i++) // magic number is size of hitDat
    {
        if (hitDat[i].length === 0) continue;
        for (let j = 0; j < hitDat[i].length; j++)
        {
            roundObj[i][hitDat[i][j]]++;
        }
    }
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
    // console.log("closing round.");
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
function getDealerAndPlayerTotal(handNum = 0)
{
    return [game.finalScore(game.handTotal(g.dealerHand)), game.finalScore(game.handTotal(player.currentHand[handNum]))];
}
function getPlayerTotal(handNum = 0)
{
    return game.finalScore(game.handTotal(player.currentHand[handNum]));
}
function getPlayerMinimum(handNum = 0)
{
    return game.minScore(game.handTotal(player.currentHand[handNum]));
}
function testStand()
{
    g.playerStand(player, 0);
    closeRound();
    standDat = getDealerAndPlayerTotal();
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
    return hitHelper(0);

    // we could also check avg max num of hits (and get percentagew of losing with each following one)
}
function hitHelper(handNum = 0)
{
    let hitWins = [];
    let hitPushes = [];
    let hitLosses = [];
    let prevR;
    let hitCounts = 0;
    function checkResults()
    {
        g.saveState();
        if (player.canPlayHand(handNum)) // player or dealer got a bj, or player is over 21
        {
            // console.log(JSON.stringify(player.currentHand));
            // console.log("hh standing hand",handNum);
            g.playerStand(player, handNum);
            //console.log(JSON.stringify(player.currentHand));

            closeRound();
        }
        prevR = player.prevRoundResults[handNum];
        if (prevR > 0)
        {
            hitWins.push(hitCounts);
        }
        else if (prevR === 0)
        {
            hitPushes.push(hitCounts);
        }
        else
        {
            hitLosses.push(hitCounts);
        }
        //console.log(getDealerAndPlayerTotal());
        //game.printHand(player.currentHand[handNum]);
        g.loadState([player]);
    }
    // test standing first
    checkResults();
    if (!player.canPlayHand(handNum))
    {
        if (handNum !== 0)
        {
            throw new Error("for some reason hand num is not zero:",handNum);
        }
        if (hitPushes.length > 0)
        {
            console.log([hitWins, hitLosses, hitPushes]);
            game.printHand(player.currentHand[handNum]);
            game.printHand(g.dealerHand);
        }
        return [hitWins, hitLosses, hitPushes];
    }
    while (getPlayerTotal(handNum) < 21 && player.canPlayHand(handNum)) // if you get a soft 21 you are forced to b done
    {
        /*
        console.log("playertot", getPlayerTotal(handNum));
        console.log(JSON.stringify(player.currentHand));

        try {
            console.log(JSON.stringify(player.currentHand));
            console.log("hh Hitting hand", handNum);
            // error here when we split aces and go over hit limit. that's why its closed
            g.playerHit(player, handNum);

        }
        catch (error)
        {
            console.log(error);
            throw new Error(error);
        }
        */
        g.playerHit(player, handNum);
        hitCounts++;
        checkResults();
        //await askQuestion("pausin");
    }
    /*
    console.log("hitwins",hitWins);
    console.log("hitPushes",hitPushes);
    console.log("hitlosses",hitLosses);
    await askQuestion("left the loop.");*/
    return [hitWins, hitLosses, hitPushes];

}
function checkHand(handNum = 0)
{
    function checkResults()
    {
        g.saveState();
        if (player.canPlayHand(handNum))
        {
            // console.log(JSON.stringify(player.currentHand));
            // console.log("ch standing hand",handNum);
            g.playerStand(player, handNum);
        }
        let c = checkHand(handNum + 1);
        // results
        // console.log(c);
        g.loadState([player]);
    }
    let load = [];
    let splitCount = 0;
    g.saveState();
    // console.log(JSON.stringify(player.currentHand));
    // TODO check if this is right. we'll just hithelper on the last available hand
    let b;
    if (!player.canPlayHand(handNum + 1))
    {
        b = hitHelper(handNum);
        load.push(b);
    }
    //console.log(b);
    g.loadState([player]);
    // console.log(JSON.stringify(player.currentHand));
    // console.log(g.savePlayers.length);

    if (handNum === 0)
    {
        hitDat = b;
    }
    if (!roundIsOver())
    {
        while (canSplitHand(handNum))
        {
            // console.log(player.handComplete);
            // console.log("splitting hand",handNum);
            splitCount++;
            // error here when dealer has gotten a blackjack. - SHOULD BE FIXED NOW
            g.playerSplit(player, handNum);
            g.saveState();
            
            checkResults();
            let hitcount = 0;
            while (getPlayerTotal(handNum) < 21 && player.canPlayHand(handNum))
            {
                // console.log(JSON.stringify(player.currentHand));
                // console.log("ch hitting hand",handNum);
                // error here when splitting aces and going over hit limit
                g.playerHit(player, handNum);
                hitcount++;

                checkResults();
            }

            g.loadState([player]);
        }
    }
    return load;
}
function roundIsOver()
{
    return !g.hiddenDealerCard;
}
function canSplitHand(handNum)
{
    return (game.cardValue(player.currentHand[handNum][0].value) === game.cardValue(player.currentHand[handNum][1].value) && player.handCount() < 4 && !(player.currentHand[handNum][0].value === 1 && player.handCount() > 1)); // and not resplitting aces
}
function hitAndCheckScore()
{
    g.saveState();
    g.playerHit(player, 0);
    // if we are over 20, this was our last hit.
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
        resSplitHands = null;
        return;
    }
    if (player.currentHand[0].length > 2)
    {
        throw new Error("can't split hand. length is more than 2");
    }
    g.playerSplit(player, 0);

    for (let i = 0; i < 4; i++) // 4 here is max amt of hands player can have
    {
        // if hand is splittable
        // add to resSplitHands
        // check each hand again. if it's splittable, first try just hitting, then try splitting again.
        // of course we can't hit if we have an ace, etc
        let b = hitHelper(i);
        console.log(b);

    }
}
function dealWithSplitHand(handNum)
{
    // measure hits?
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