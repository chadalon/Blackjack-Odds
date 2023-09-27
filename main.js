const game = require("./game.js");
const p = require("./player.js");
const readline = require('readline');
const dm = require("./data-miner.js");
/**
 * Some things to consider:
 * Player strategies - random vs if others are playing 'perfectly', if they tend to hit more, etc
 */


// gen stack of cards
// start game
// draw from top of pile
// dealer and player
// player 4 options

//here are my choices (do both):
// 1. run each option for every turn
// 2. pick an option at random for every turn and that's it
// 3. there's gotta be more

// DESIGN!!!!!!!!!!!!!
// after all this, run tons of games based on results and see percentage win (and do this vs online stuff)

/**
 * Spitballin:
 * 1. 
 * run to find out best move for any possible turn
 * (just turn-based ? )
 * Options:
 * turn-based: give points
 * what do we mean by the 'best' move?
 * best move to do to win current hand
 * or best move to do to not lose
 * or best move to do to win big later
 * 
 */
function askQuestion(query) {
    const rl = readline.createInterface({
        input: process.stdin,
        output: process.stdout,
    });

    return new Promise(resolve => rl.question(query, ans => {
        rl.close();
        resolve(ans);
    }))
}

var g = new game.Game(6);
var player = new p.Player(false);
async function main()
{
    console.log(g.shoe);
    g.playerJoin(0, player);
    g.beginGame();
    let stop = false;
    while (!stop)
    {
        console.log("\n");
        g.placeBets();
        g.dealCards();
        let hNum = 0;
        while (!stop)
        {
            console.log("cb",player.currentBet);
            console.log("prr",player.prevRoundResults);
            hNum = -1;
            for (let i = 0; i < 4; i++)
            {
                if (!player.handComplete[i])
                {
                    hNum = i;
                    break;
                }
            }
            if (hNum === -1)
            {
                //test
                finishRound();

                break;
            }
            game.printPlayerHand(player);
            console.log("Dealer hand:\n", game.cardtoString(g.getDealerTopCard()));
            //playerAction('s', hNum);
            let ans = await askQuestion("What do you want to do? (on hand number " + hNum + ")\n");
            console.log("\n");
            try
            {
                playerAction(ans, hNum);
            }
            catch (e)
            {
                console.log(e);
            }
        }
    }
}
function finishRound()
{
    console.log("Finishing the round.");
    g.dealerTurn();
    console.log("Results:");
    console.log("Dealer's Hand:");
    game.printHand(g.dealerHand);
    game.printPlayerHand(player);
    console.log("RoundGainz:");
    console.log(player.prevRoundResults);
    console.log("The count is at",g.count,"and the real count is",g.realCount());
    g.endOfRound();
    console.log("Shoe size",g.shoe.length,"total cards (shouldnt change):",g.shoe.length + g.discards.length, "discards len:",g.discards.length);

}
function playerAction(ans, handNum)
{
    if (ans === 'h')
    {
        g.playerHit(player, handNum);
    }
    else if (ans === 's')
    {
        g.playerStand(player, handNum);
    }
    else if (ans === 'd')
    {
        g.playerDouble(player, handNum);
    }
    else if (ans === 'p')
    {
        g.playerSplit(player, handNum);
    }
    else if (ans === 'u')
    {
        g.playerSurrender(player);
    }
    else
    {
        throw new Error("Please enter a valid option ([h]it, [s]tand, [d]ouble, s[p]lit, s[u]rrender");
    }
}
dm.analyze(8000);
return;
main();