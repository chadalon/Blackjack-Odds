const cards = require("./cards.js");
const pl = require("./player.js");
class Game
{
    /**
     * @param {*} decks
     * Num of decks in shoe
     * @param {*} opts
     * - DEALER_SHUFFLE:
     * At what percent of the shoe left do the cards get shuffled (from what i googled - usually 40-60%)
     * - countMethod:
     *  Make sure you can use card value as index (0th item is throwaway)
     * - standSoft:
     * Whether the dealer stands a soft 17 or not
     * - DAS:
     * Whether the casino allows doubling after splitting or not (default true)
     * - RSA:
     * Whether the casino allows re-splitting aces or not (default false)
     * - DAS_ACES:
     * Whether the casino allows doubling after splitting aces (default false)
     * - NUM_HITS_ACE_SPLIT:
     * How many times we can hit after splitting aces (default 1)
     * - RESPLIT_ACES:
     * If you can resplit aces (default false)
     * 
     * After constructing:
     * Add any players if you want (else it will add default num)
     * then you HAVE to call begingame
     * - deal cards
     * 
     */
    constructor(decks, opts = {})
    {
        /**
         * TODO: can new players join, etc.
         */
        this.DEFAULT_PLAYERS = 1;
        this.RESHUFFLE_AMTS = 0; // how many times do we shuffle again after shuffling
        this.MAX_PLAYERS = 5; // TODO idk if this is most common
        this.gameStarted = false;
        this.decks = decks;
        this.shoe = cards.GenStack(decks);
        this.players = [];
        this.discards = []; // discarded cards
        this.roundDealt = false;

        this.count = 0;
        this.hiddenDealerCard = false; // true if dealer has a hidden card (adds to deck for true count)
        this.dealerHand = [];

        this.TEN_VAL_CARDS = [10, 11, 12, 13];

        this.DEALER_SHUFFLE = 50;
        if (opts['DEALER_SHUFFLE'])
            this.DEALER_SHUFFLE = opts['DEALER_SHUFFLE'];

        if (opts['countMethod'])
            this.COUNT_METHOD = opts['countMethod'];
        else
            this.COUNT_METHOD = [0,-1,1,1,1,1,1,1,0,0,0,-1,-1,-1,-1];
        if (opts['standSoft'])
            this.STAND_SOFT = opts['standSoft'];
        else
            this.STAND_SOFT = false;
        if (opts['DAS'])
            this.DAS = opts['DAS'];
        else
            this.DAS = true;
        if (opts['RSA'])
            this.RSA = opts['RSA'];
        else
            this.RSA = false;
        if (opts['DAS_ACES'])
            this.DAS_ACES = opts['DAS_ACES'];
        else
            this.DAS_ACES = false;
        if (opts['NUM_HITS_ACE_SPLIT'])
            this.NUM_HITS_ACE_SPLIT = opts['NUM_HITS_ACE_SPLIT'];
        else
            this.NUM_HITS_ACE_SPLIT = 1;
        if (opts['RESPLIT_ACES'])
            this.RESPLIT_ACES = opts['RESPLIT_ACES'];
        else
            this.RESPLIT_ACES = false;

    }
    beginGame()
    {
        /**
         * might want to remove this
         */
        if (this.players.length == 0)
        {
            for (let i = 0; i < this.DEFAULT_PLAYERS; i++)
            {
                this.playerJoin(i);
            }
        }
        this.gameStarted = true;
    }
    placeBets()
    {
        /**
         * players place bets, etc
         * what do we do when someone runs out?
         * 
         */
        let buyIn;
        let p;
        for (let i = 0; i < this.players.length; i++)
        {
            p = this.players[i];
            if (p.sittingOut) continue;
            buyIn = p.buyIn;
            if (p.funds >= buyIn || !p.canBust)
            {
                p.addBet(buyIn, 0);
            }
            else
            {
                if (p.canBust)
                    p.sittingOut = true;
            }
        }
    }
    dealCards()
    {
        /**
         * Player 0 is to the left of the dealer
         * we pop() from this.shoe when dealing cards
         */
        if (!this.checkForActivePlayer())
        {
            console.log("no active players mate...");
            return;
        }
        if (this.roundDealt)
        {
            throw new Error("We already dealt cards for this round.");
        }
        // check deck
        console.log()
        if (this.shoe.length / (this.decks * 52) * 100 <= this.DEALER_SHUFFLE)
        {
            console.log("shufflin");
            // shuffle
            this.shoe = this.shoe.concat(this.discards);
            this.discards = [];
            for (let i = 0; i < this.RESHUFFLE_AMTS + 1; i++)
            {
                cards.Shuffle(this.shoe);
            }
        }
        // activate hands
        for (let i = 0; i < this.players.length; i++)
        {
            this.players[i].activateHand(0);
        }
        for (let i = 0; i < 2; i++)
        {
            let p;
            for (let j = 0; j < this.players.length; j++)
            {
                p = this.players[j];
                this.dealPlayer(p);
                if (j == 1)
                {
                    // check for blackjack
                    let playerVal = handTotal(p.currentHand[0]);
                    if (arrayEquals(playerVal, [10, 1]))
                    {
                        p.closeHand(0);
                    }
                }
            }
            // deal dealer - hidden card is first one obvi
            // remember to update the count of that card l8er
            this.dealDealer(i === 0);
        }
        this.roundDealt = true;
    }
    dealDealer(hiddenCard = false)
    {
        this.dealerHand.push(this.shoe.pop());
        if (hiddenCard)
        {
            this.hiddenDealerCard = true;
            return;
        }
        this.updateCount(this.dealerHand[this.dealerHand.length - 1]);
    }
    getDealerTopCard()
    {
        return JSON.parse(JSON.stringify(this.dealerHand[1]));
    }
    dealPlayer(player, handNum = 0)
    {
        /**
         * playernum is 0 to numplayers - 1
         * handNum is 0-3 (up to four hands at once)
         */
        if (player.sittingOut) return;
        player.currentHand[handNum].push(this.shoe.pop());
        this.updateCount(player.currentHand[handNum][player.currentHand[handNum].length - 1]);
    }
    saveState()
    {
        // count
        // player hands
        // shoe, discards
        this.savePlayers = JSON.parse(JSON.stringify(this.players));
        this.saveShoe = JSON.parse(JSON.stringify(this.shoe));
        this.saveDiscards = JSON.parse(JSON.stringify(this.discards));
        this.saveCount = this.count;
        this.saveRoundDealt = this.roundDealt;
        this.saveHiddenDealerCard = this.hiddenDealerCard;
        this.saveDealerHand = JSON.parse(JSON.stringify(this.dealerHand));
        this.saveGameStarted = this.gameStarted;
        this.saveDecks = this.decks;
    }
    loadState()
    {
        this.players = JSON.parse(JSON.stringify(this.savePlayers));
        this.shoe = JSON.parse(JSON.stringify(this.saveShoe));
        this.discards = JSON.parse(JSON.stringify(this.saveDiscards));
        this.count = this.saveCount;
        this.roundDealt = this.saveRoundDealt;
        this.hiddenDealerCard = this.saveHiddenDealerCard;
        this.dealerHand = JSON.parse(JSON.stringify(this.saveDealerHand));
        this.gameStarted = this.saveGameStarted;
        this.decks = this.saveDecks;

    }
    playerStand(player, handNum)
    {
        if (!player.canPlayHand(handNum))
            this.throwHandErr(player, handNum);
        player.closeHand(handNum);
    }
    playerHit(player, handNum)
    {
        // can i hit on split aces? typically no
        if (!player.canPlayHand(handNum))
            this.throwHandErr(player, handNum);

        let curHand = player.currentHand;
        // if we've split on aces
        if (player.hasSplit() && curHand[handNum][0].value === 1)
        {
            if (curHand[handNum].length - 2 >= this.NUM_HITS_ACE_SPLIT)
                throw new Error("can't go over max hit of " + this.NUM_HITS_ACE_SPLIT + " after splitting aces.");
        }
        
        this.dealPlayer(player, handNum);
        let fs = finalScore(handTotal(player.currentHand[handNum]));
        if (fs >= 21) player.closeHand(handNum);
        // if we've split on aces and now have hit to the limit, closehand
        if (player.hasSplit() > 0 && curHand[handNum][0].value === 1 && curHand[handNum].length - 2 >= this.NUM_HITS_ACE_SPLIT)
            player.closeHand(handNum);
    }
    playerDouble(player, handNum)
    {
        if (!player.canPlayHand(handNum))
            this.throwHandErr(player, handNum);
        // check if deck is split
        if (player.hasSplit())
        {
            if (!this.DAS) throw new Error("Can't double after split mane.");
            if (player.currentHand[handNum][0].value === 1 && !this.DAS_ACES)
                throw new Error("Cant double after splitting aces bruv");
        }
        // make sure we only have 2 cards in hand
        // double bet
        // deal card
        // close this hand
        if (player.currentHand[handNum].length > 2)
            throw new Error("Can't double, we already hit or somethin");
        player.doubleBet(handNum);
        this.dealPlayer(player, handNum);
        player.closeHand(handNum);
    }
    playerSplit(player, handNum)
    {
        if (!player.canPlayHand(handNum))
            this.throwHandErr(player, handNum);
        if (handNum >= 3)
            throw new Error("bruh can't split bc we already have 4 decks. how tf we even get here??");
        if (player.currentHand[handNum].length > 2)
            throw new Error("Can't split a deck that's already been played.");
        if (!checkCardValsEqual(player.currentHand[handNum][0].value, player.currentHand[handNum][1].value))
            throw new Error("You can only split when card values are equal. Card vals are " + player.currentHand[handNum]);
        if (player.hasSplit() && player.currentHand[handNum][0].value === 1 && !this.RESPLIT_ACES)
            throw new Error("You can't resplit aces.");
        // create new hand
        // add bet for new hand
        // deal card for this hand plus new one
        let newHandNum = player.splitHand(handNum);
        this.dealPlayer(player, handNum);
        this.dealPlayer(player, newHandNum);
    }
    playerSurrender(player)
    {
        // Maybe add in option to surrender after any move
        if (!player.canPlayHand(handNum))
            this.throwHandErr(player, handNum);

        if (player.hasSplit())
            throw new Error("You can't surrender after splitting.");
        if (player.currentHand[0].length > 2)
            throw new Error("You can't surrender after hitting.");
        player.surrender(0);
    }

    dealerTurn()
    {
        /**
         * dealer flips card and goes up to 17
         */
        // check if turn is over
        if (!this.allPlayersDone())
            throw new Error("Dealer can't move because not all players are done!");
    
        this.hiddenDealerCard = false;
        this.updateCount(this.dealerHand[0]);

        if (this.STAND_SOFT)
        {
            while (finalScore(handTotal(this.dealerHand)) < 17)
            {
                this.dealDealer();
            }
        }
        else
        {
            while (finalScore(handTotal(this.dealerHand)) < 17 || softSeventeen(this.dealerHand))
            {
                this.dealDealer();
            }

        }
        // roundresults??
        this.roundResults();
    }
    roundResults()
    {
        if (!this.allPlayersDone())
            throw new Error("Can't do round results bc not everbody is done");
        if (this.hiddenDealerCard)
            throw new Error("Can't do round results bc dealer hasn't played");
        let p;
        let dealerScore = finalScore(handTotal(this.dealerHand));
        let pScore;
        for (let i = 0; i < this.players.length; i++)
        {
            p = this.players[i];
            if (p.surrendered)
            {
                p.prevRoundResults = [p.prevRoundResults[0] / -2, null, null, null];
            }
            else
            {
                // test this
                for (let j = 0; j < p.currentHand.length; j++)
                {
                    if (p.currentHand[j].length === 0)
                    {
                        p.prevRoundResults[j] = null;
                        continue;
                    }
                    pScore = finalScore(handTotal(p.currentHand[j]));
                    console.log("pscore, dscore:",pScore, dealerScore);
                    if (pScore > 21)
                    {
                        p.prevRoundResults[j] = -p.currentBet[j];
                    }
                    else if (pScore === dealerScore)
                    {
                        p.prevRoundResults[j] = 0;
                    }
                    else if (pScore > dealerScore || dealerScore > 21) // win
                    {
                        p.prevRoundResults[j] = p.currentBet[j] / 2;
                    }
                    else
                    {
                        p.prevRoundResults[j] = -p.currentBet[j];
                    }
                }
            }
            // pay out
            // check rounding errors
            p.payOut();
        }
    }


    allPlayersDone()
    {
        for (let i = 0; i < this.players.length; i++)
        {
            if (!this.players[i].finishedTurn())
            {
                return false;
            }
        }
        return true;
    }

    updateCount(card)
    {
        this.count += this.COUNT_METHOD[card.value]; // smooth af :)
    }
    playerJoin(playerId, playerObj = null)
    {
        /**
         * is there a better way to do this? params have to equal player params
        */
        if (playerObj)
            this.players.push(playerObj);
        else
            this.players.push(new pl.Player(playerId));
    }
    checkForActivePlayer()
    {
        /**
         * TODO this check will add in a lot of time over time
         */
        if (this.players.length == 0)
        {
            return false;
        }
        for (let i = 0; i < this.players.length; i++)
        {
            if (!this.players[i].sittingOut) return true;
        }
        return false;
    }
    realCount()
    {
        let hiddenLen = this.shoe.length;
        if (this.hiddenDealerCard)
            hiddenLen++;
        return this.count / (hiddenLen / 52); // count / num of decks left
    }

    endOfRound()
    {
        for (let i = 0; i < this.players.length; i++)
        {
            for (let j = 0; j < this.players[i].currentHand.length; j++)
            {
                this.discards = this.discards.concat(this.players[i].currentHand[j]);
            }
            this.players[i].clearRoundData();
        }
        this.discards = this.discards.concat(this.dealerHand);
        this.dealerHand = [];
        this.hiddenDealerCard = false;
        this.roundDealt = false;
    }
    throwHandErr(player, handNum)
    {
        throw new Error("Playerid " + player.playerId + " Can't place a move with hand " + handNum + "!");
    }
}
function checkCardValsEqual(val1, val2)
{
    if (val1 === val2) return true;
    if (this.TEN_VAL_CARDS.includes(val1) && this.TEN_VAL_CARDS.includes(val2)) return true;
    return false;
}
function softSeventeen(hand)
{
    let ht = handTotal(hand);
    if (ht[1] === 0) return false; // no aces
    return 11 + (ht[1] - 1) + ht[0] === 17;
}
function handTotal(hand)
{
    /**
     * @returns [hardcount, aceCount]
     * @param {*} handNum
     * number from 0-3 (which hand we're checking)
     */
    let total = 0;
    let card;
    let aceCount = 0;
    for (let i = 0; i < hand.length; i++)
    {
        card = hand[i];
        if (card.value == 1)
            aceCount++;
        else if (card.value < 10)
            total += card.value;
        else
            total += 10;
    }
    return [total, aceCount];
}
function finalScore(handVal)
{
    let fv = handVal[0];
    let av = handVal[1];

    if (av === 0) return fv;
    let sc = 11 + (av - 1) + fv; // make one ace 11 if we can
    if (sc <= 21) return sc;

    return sc - 10;
}

function arrayEquals(a, b) {
    return Array.isArray(a) &&
        Array.isArray(b) &&
        a.length === b.length &&
        a.every((val, index) => val === b[index]);
}
function cardtoString(card)
{
    let cString;
    if (card.value === 1)
        cString = "Ace";
    else if (card.value === 11)
        cString = "Jack";
    else if (card.value === 12)
        cString = "Queen";
    else if (card.value === 13)
        cString = "King";
    else
        cString = card.value.toString();
    cString += " of " + cards.SUIT_VALUE[card.suit];
    return cString;
}

function printHand(hand)
{
    for (let i = 0; i < hand.length; i++)
    {
        console.log(cardtoString(hand[i]));
    }
    console.log("\n");
}
function printPlayerHand(player)
{
    let hand = player.currentHand;
    console.log("Your hands:");
    for (let i = 0; i < hand.length; i++)
    {
        if (hand[i].length === 0) continue;
        console.log("Hand #" + i + ":");
        printHand(hand[i]);
    }
}

module.exports = { Game, handTotal, finalScore, softSeventeen, printHand, printPlayerHand, cardtoString }