class Player
{
    static staticPlayerCounter = 0;
    constructor(canBust = true, buyIn = 5, funds = 1000)
    {
        this.playerId = Player.staticPlayerCounter++; // assign id then increment
        this.canBust = canBust;
        this.buyIn = buyIn;
        this.currentHand = [[],[],[],[]]; // stored with four possible hands
        this.handComplete = [true, true, true, true]
        this.sittingOut = false;
        this.currentBet = [0, 0, 0, 0];
        this.prevRoundResults = [null, null, null, null];
        this.funds = funds;
        this.surrendered = false;
    }
    handCount()
    {
        /**
         * @returns {Number} number of hands player has.
         */
        let count = 1;
        for (let i = 1; i < this.currentHand.length; i++)
        {
            if (this.currentHand[i].length === 0)
            {
                return count;
            }
            count++;
        }
        return count;
    }
    addBet(amt, handNum)
    {
        if (amt > this.funds && this.canBust)
            throw new Error("player doesn't have enough money to add to bet");
        this.funds -= amt;
        this.currentBet[handNum] += amt;
    }
    doubleBet(handNum)
    {
        this.addBet(this.currentBet[handNum], handNum);
    }
    splitHand(handNum)
    {
        /**
         * Splits hand, places bet, and returns the new handNum
         */
        if (this.currentHand[handNum].length > 2 || this.currentHand[handNum].length === 0)
            throw new Error("Can't split this hand. doesn't have 2 cards.");
        if (this.handComplete[handNum])
            throw new Error("Why u tryin to split a hand that can't be split");

        let newHandNum;
        for (let i = 0; i < this.currentHand.length; i++)
        {
            if (this.currentHand[i].length === 0)
                newHandNum = i;
        }
        this.currentHand[newHandNum].push(this.currentHand[handNum].pop());
        this.addBet(this.currentBet[handNum], newHandNum); // match what we initially put in
        this.activateHand(newHandNum);

        return newHandNum;
    }
    hasSplit()
    {
        return this.currentHand[1].length > 0;
    }
    surrender(handNum)
    {
        this.closeHand(handNum);
        this.surrendered = true;
    }
    payOut()
    {
        for (let i = 0; i < 4; i++)
        {
            if (this.prevRoundResults[i] === null)
                continue;
            this.funds += this.currentBet[i] + this.prevRoundResults[i];
        }
    }
    finishedTurn()
    {
        for (let i = 0; i < 4; i++)
        {
            if (!this.handComplete[i]) return false;
        }
        return true;
    }
    activateHand(handNum)
    {
        this.handComplete[handNum] = false;
    }
    closeHand(handNum)
    {
        // this will lock in a player's hand
        this.handComplete[handNum] = true;
    }
    canPlayHand(handNum)
    {
        return !this.handComplete[handNum];
    }
    standing()
    {
        throw new Error("STANDING() NEEDS TO BE CHANGED - PER HAND INSTEAD OF PER PLAYER");
    }
    clearRoundData()
    {
        this.currentHand = [[],[],[],[]];
        this.handComplete = [true, true, true, true];
        this.surrendered = false;
        this.currentBet = [0,0,0,0];
    }
}

module.exports = { Player }