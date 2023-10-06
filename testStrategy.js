const game = require("./game.js");
const p = require("./player.js");
const genStrat = require("./generateStrategy.js");
const hf = require("./helperFuncs.js");


var strategy = genStrat.generate();
var stratIsHardTotal = false;
// console.log(strategy);
var g;
var player;

let handIndex;
function createGame()
{
    g = new game.Game(6); // TODO automate shoe size (ALL game conditions!!!)
}
function addPlayers()
{
    player = new p.Player(false);
    g.playerJoin(player);
}
function runGames(gameAmt = 100000)
{
    g.beginGame();
    for (let i = 0; i < gameAmt; i++)
    {
        singleRound();
    }

}
function singleRound()
{
    g.placeBets();
    g.dealCards();
    try {
    playHand();
    }
    catch {
    }
    g.endOfRound();
}
function playHand()
{
    if (stratIsHardTotal)
    {
        playHandHardTotal();
    }
    else
    {
        playHandCustomStrat();
    }
}
function playHandCustomStrat()
{
    handIndex = hf.getRoundKey(player.currentHand[0], g.getDealerTopCard());
    let move = strategy[handIndex[0]][handIndex[1]];
    switch (move)
    {
        case 'D':
            g.playerDouble(player, 0);
            break;
        case 'S':
            g.playerStand(player);
            break;
        default:
            for (let i = 0; i < move; i++)
            {
                if (!player.canPlayHand(0)) break;
                g.playerHit(player, 0);
            }
    }
}
function playHandHardTotal()
{
    let firstInd = game.handTotal(player.currentHand[0])[0];
    let secondInd = game.cardValue(g.getDealerTopCard().value);
    let move = strategy[firstInd][secondInd];
    switch (move)
    {
        case 'D':
            g.playerDouble(player, 0);
            break;
        case 'S':
            g.playerStand(player);
            break;
        default:
            g.playerHit(player, 0);
            while (player.canPlayHand(0))
            {
                // TODO just assuming we cant double after hitting. check here g.candouble or whatveveritits
                firstInd = game.handTotal(player.currentHand[0])[0];
                if (strategy[firstInd][secondInd] === 'S')
                {
                    g.playerStand(player, 0);
                    break;
                }
                else
                {
                    g.playerHit(player, 0);
                }
            }
    }

}
function runStrat()
{
    createGame();
    addPlayers();
    runGames();
}

function main()
{
    runStrat();
    console.log(`With our strategy we ended up with \$${player.funds}`);
    // console.log(strategy);
    strategy = [...genStrat.baselineHardTotals];
    // console.log(strategy);
    stratIsHardTotal = true;
    // // console.log(`Now running one found online...`);
    runStrat();
    console.log(`doing what online shit tells you to do we ended up with \$${player.funds}`);
}
main();