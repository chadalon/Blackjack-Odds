// const fs = require('fs');

var dat;
const W = 0;
const L = 1;
const P = 2;
var outString = "Player hand, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10\n";

function analyze()
{
    let k = Object.keys(dat);
    // blockStuff("5,6",4);
    // return;
    for (let i = 0; i < k.length; i++)
    {
        checkHand(k[i]);
    }
}

function checkHand(hand)
{
    // console.log(dat[hand][1]);
    let curRow = hand + ", ";
    for (let i = 1; i < 11; i++)
    {
        blockStuff(hand, i);
        continue;
        let curBlock = dat[hand][i];
        console.log(dat[hand][i][W]);
        let wins = mostWLPs(dat[hand][i][W]);
        let loss = mostWLPs(curBlock[L]);
        let push = mostWLPs(curBlock[P]);
        if (wins[0] !== 0) {
            console.log(`most wins of hand ${hand} and dealer card ${i} was from hitting ${wins[1]} times. (won ${wins[0]} times.)`);
            console.log(`hitting ${wins[1]} times lost ${dat[hand][i][L][wins[1]]} times.`);
            // console.log(`total losses up to this hitting ${wins[1]} times: ${getTotalNumOfLossesUpToHit(loss, wins[1])}`);
        }
        if (loss[0] !== 0)
        console.log(`most losses was from hitting ${loss[1]} times and this happened ${loss[0]} times.`);
        if (push[0] !== 0)
        console.log(`most pushes happened from hitting ${push[1]} times and this happened ${push[0]} times`);
    }
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

    console.log(`with ${pHand} and ${dHand} you should hit ${lowestLossInd} times (${Math.round((wlp[W][lowestLossInd] / totalPlays(wlp, lowestLossInd)) * 100)}% win rate) - ${totalPlays(wlp, lowestLossInd)} rounds\n`);
}
function totalPlays(WLPBlock, ind)
{
    return WLPBlock[W][ind] + WLPBlock[L][ind] + WLPBlock[P][ind] 
}
function mostWLPs(d)
{
    let max = Math.max(...d);
    if (max === 0) return [0, -1];
    let max_inds = [];
    for (let i = 0; i < d.length; i++)
    {
        if (d[i] === max)
            max_inds.push(i)
    }
    return [max, max_inds];
}

function getTotalNumOfLossesUpToHit(lossArr, numHits)
{
    let tot = 0;
    for (let i = 0; i < numHits; i++)
    {
        tot += lossArr[i];
    }
    return tot;
}

function printFile(file) {
    file = new File(["foo"], "../dat.txt", {
        type: "text/plain",
      });
    const reader = new FileReader();
    reader.onload = (evt) => {
      console.log(evt.target.result);
    };
    reader.readAsText(file);
  }
  
function initializeTable()
{
    /**
     * Create table cells
     */
    let torw = document.getElementById("dealer-dat");
    for (let i = 1; i < 11; i++)
    {
        let th = document.createElement("th");
        th.innerHTML = i;
        torw.appendChild(th);
    }
    
    let k = Object.keys(dat);
    console.log(k);
    // blockStuff("5,6",4);
    // return;
    let pHand;
    let tr;
    let cell;
    let table = document.getElementById("hands");
    for (let i = 0; i < k.length; i++)
    {
        pHand = k[i];
        tr = document.createElement("tr");
        tr.id = pHand;
        cell = document.createElement("th");
        cell.innerHTML = pHand;
        tr.appendChild(cell);
        for (let j = 0; j < 10; j++)
        {
            tr.appendChild(document.createElement("td"));
        }
        table.appendChild(tr);
    }
    analyze();
}
var request = new XMLHttpRequest();
request.open('GET', "../dat.txt", true);
request.responseType = 'blob';
request.onload = function() {
    var reader = new FileReader();
    reader.readAsText(request.response);
    reader.onload =  function(e){
        dat = JSON.parse(e.target.result);
        initializeTable();
    };
};
request.send();

// printFile();
//initializeTable();