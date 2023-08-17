// cards 1 = hearts 2 = spades 3 = diamond 4 = clubs
const SUIT_VALUE = [null, "hearts", "spades", "diamonds", "clubs"];
function GenDeck()
{
    let deck = [];
    let str = "[\n";
    for (let i = 1; i <= 13; i++)
    {
        for (let j = 1; j <= 4; j++)
        {
            str += "\t{ value: " + i + ", suit: " + j + "}, ";
            deck.push({value: i, suit: j});
        }
        str += "\n";
    }
    str += "]";
    Shuffle(deck);
    return deck;
}
function Shuffle(deck)
{
    let tmp = [];
    let num;
    let dl = deck.length;
    for (let i = 0; i < dl; i++)
    {
        num = Math.floor(Math.random() * deck.length);
        tmp.push(deck[num]);
        deck.splice(num, 1);
    }
    for (let i = 0; i < tmp.length; i++)
    {
        deck[i] = tmp[i];
    }
}

function GenStack(deck_amount)
{
    let cardstack = [];
    let deck;
    for (let i = 0; i < deck_amount; i++)
    {
        deck = GenDeck();
        Shuffle(deck);
        cardstack = cardstack.concat(deck);
    }
    Shuffle(cardstack);
    return cardstack;
}

module.exports = { GenStack, Shuffle, SUIT_VALUE }