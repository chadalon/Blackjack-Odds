
export function* cycleDat(dat)
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