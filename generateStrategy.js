const fs = require("fs");
const hf = require("./helperFuncs.js");

var dat;
const W = 0;
const L = 1;
const P = 2;

var specificHandsHardTotals = {};

let innerArr = [null];
for (let k = 1; k < 11; k++)
{
    innerArr.push(null);
}
let indexStr;
for (let i = 1; i < 11; i++)
{
    for (let j = i; j < 11; j++)
    {
        indexStr = i.toString() + "," + j.toString();
        specificHandsHardTotals[indexStr] = [...innerArr];
    }
}
var hardTotals = {};



function readData(fName = "./dat.json")
{
    dat = JSON.parse(fs.readFileSync(fName));
}



function generate()
{
    readData();
    let b = hf.cycleDat(dat);
    for (const c of b)
    {
        blockStuff(c[0], c[1]);
    }
    return specificHandsHardTotals;
}
function blockStuff(pHand, dHand)
{
    // console.log(dat[pHand]);
    let wlp = dat[pHand][dHand];
    let i = 0;
    let lossPercentage = 1;
    let lowestLossPer = 2;
    let lowestLossInd;
    while (totalPlays(wlp, i) > 0)
    {
        lossPercentage = wlp[L][i] / totalPlays(wlp, i);
        // console.log(totalPlays(wlp, i), lossPercentage);
        // for now we'll just say less hits is better if two nums are equal
        // TODO what if it goes up then down/down then up?
        // TODO ANYTHING ABOVE 50% WIN RATE!!! (OR BELOW 50% LOSS RATE???)
        if (lossPercentage < lowestLossPer)
        {
            lowestLossPer = lossPercentage;
            lowestLossInd = i;
        }

        i++;
    }
    let innerVal = lowestLossInd;
    if (lowestLossInd === 0)
    {
        innerVal = 'S';
    }
    else if (lowestLossInd === 1)
    {
        // Dbl ?
        if (lowestLossPer < .5)
        {
            innerVal = 'D';
        }
    }
    specificHandsHardTotals[pHand][dHand] = innerVal;
}

function totalPlays(WLPBlock, ind)
{
    return WLPBlock[W][ind] + WLPBlock[L][ind] + WLPBlock[P][ind] 
}

let allHit = [null, 'H', 'H', 'H', 'H', 'H', 'H', 'H', 'H', 'H', 'H'];
let allStand = [null, 'S', 'S', 'S', 'S', 'S', 'S', 'S', 'S', 'S', 'S'];
// online stuff
const baselineHardTotals = [
    null, null, null, null,
    [...allHit], // 4 -- had to add this in - i think we should dbl ?
    [...allHit], // 5
    [...allHit], // 6
    [...allHit], // 7
    [...allHit], // 8
    [null, 'H', 'H', 'D', 'D', 'D', 'D', 'H', 'H', 'H', 'H'], // 9
    [null, 'H', 'D', 'D', 'D', 'D', 'D', 'D', 'D', 'D', 'H'], // 10
    [null, 'H', 'D', 'D', 'D', 'D', 'D', 'D', 'D', 'D', 'D'], // 11
    [null, 'H', 'H', 'H', 'S', 'S', 'S', 'H', 'H', 'H', 'H'], // 12
    [null, 'H', 'S', 'S', 'S', 'S', 'S', 'H', 'H', 'H', 'H'], // 13
    [null, 'H', 'S', 'S', 'S', 'S', 'S', 'H', 'H', 'H', 'H'], // 14
    [null, 'H', 'S', 'S', 'S', 'S', 'S', 'H', 'H', 'H', 'H'], // 15
    [null, 'H', 'S', 'S', 'S', 'S', 'S', 'H', 'H', 'H', 'H'], // 16
    [...allStand], // 17
    [...allStand], // 18
    [...allStand], // 19
    [...allStand], // 20
    [...allStand] // 21
]
function convertHardTotals(obj)
{
    let finalDat = {};
    let oi;
    let oj;
    for (let i = 1; i < 11; i++)
    {
        (i === 1) ? oi = 11 : oi = i;
        for (let j = i; j < 11; j++)
        {
            (j === 1) ? oj = 11 : oj = j;
            indexStr = i.toString() + "," + j.toString();
            if (oi === 11 && oj === 11) oj = 1;
            finalDat[indexStr] = obj[oi + oj];
        }
    }
    console.log(finalDat);
    return finalDat;
}
function getDefaultStrat()
{
    return convertHardTotals(baselineHardTotals);
}

module.exports = {generate, getDefaultStrat, baselineHardTotals}