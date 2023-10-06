const game = require("./game.js");

function getRoundKey(handObj, dealerCard)
{
    /**
     * @param {Array} handObj [{}, {}]
     * @param {obj} dealerCard
     * @returns {Array} [key, index of inner array]
     */
    let v1 = game.cardValue(handObj[0].value);
    let v2 = game.cardValue(handObj[1].value);
    if (v1 > v2)
    {
        return [v2.toString() + "," + v1.toString(), game.cardValue(dealerCard.value)];
    }
    // now first is either less or they are the same so it doesn't matter
    return [v1.toString() + "," + v2.toString(), game.cardValue(dealerCard.value)];
}

function* cycleDat(dat)
{
    /**
     * @yields [playerhand, dealerhand, value]
     */
    
    let k = Object.keys(dat);
    let pHand;
    for (let i = 0; i < k.length; i++)
    {
        pHand = k[i];
        for (let j = 1; j < dat[pHand].length; j++)
        {
            yield [pHand, j];
        }
    }
}

module.exports = {getRoundKey, cycleDat}