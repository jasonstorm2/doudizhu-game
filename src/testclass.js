const playerCards = [
    { suit: '♦', value: '5', selected: false },
    { suit: '♦', value: '3', selected: false },
    { suit: '♦', value: '3', selected: false },
    { suit: '♦', value: '3', selected: false },
    { suit: '♦', value: '4', selected: false },
    { suit: '♦', value: '9', selected: false },
    { suit: '♦', value: '4', selected: false },
    { suit: '♦', value: '4', selected: false },

];

function sortCards(cards) {
    // 首先计算每个值的出现次数
    const valueCounts = {};
    cards.forEach(card => {
        valueCounts[card.value] = (valueCounts[card.value] || 0) + 1;
    });

    // 定义牌的顺序（从小到大）
    const cardOrder = ['Big', 'Small', '2', 'A', 'K', 'Q', 'J', '10', '9', '8', '7', '6', '5', '4', '3'];
    // 自定义排序函数
    return cards.sort((a, b) => {
        // 首先比较牌的数量（数量多的排前面），如果a的数量多，那么值为负，那么负值则a排在前面
        const countDiff = valueCounts[b.value] - valueCounts[a.value];
        if (countDiff !== 0) return countDiff;

        // 如果数量相同，则按照牌的大小排序
        return cardOrder.indexOf(a.value) - cardOrder.indexOf(b.value);
    });
}

const sortedCards = sortCards(playerCards);
console.log(sortedCards);