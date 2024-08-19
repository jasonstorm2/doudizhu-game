function extractResponseFromAIReply(aiReplyText) {
  const startKeyword = "出牌";
  const startIndex = aiReplyText.indexOf(startKeyword);
  
  if (startIndex === -1) {
    console.error("未找到'出牌'关键词");
    return null;
  }

  // 从"出牌"后面开始查找
  let colonIndex = aiReplyText.indexOf("：", startIndex + startKeyword.length);
  if (colonIndex === -1) {
    // 如果找不到"："，尝试找":"
    colonIndex = aiReplyText.indexOf(":", startIndex + startKeyword.length);
  }

  if (colonIndex === -1) {
    console.error("未找到冒号");
    return null;
  }

  // 查找左方括号 [
  const leftBracketIndex = aiReplyText.indexOf("[", colonIndex);
  if (leftBracketIndex === -1) {
    console.error("未找到左方括号 [");
    return null;
  }

  // 查找右方括号 ]
  const rightBracketIndex = aiReplyText.indexOf("]", leftBracketIndex);
  if (rightBracketIndex === -1) {
    console.error("未找到右方括号 ]");
    return null;
  }

  // 提取方括号内的内容
  const bracketContent = aiReplyText.substring(leftBracketIndex, rightBracketIndex + 1);

  try {
    // 解析JSON数组
    const output = JSON.parse(bracketContent);
    if (Array.isArray(output)) {
      return output;
    } else {
      console.error("解析结果不是数组");
      return null;
    }
  } catch (error) {
    console.error("解析JSON时出错:", error);
    return null;
  }
}

// 使用示例
const aiReplyText = `AI回复的内容2: 根据提供的规则和当前游戏状态，上一个玩家出了单张4。现在轮到你出牌，你手上有多种牌型可以选择，包括单牌、对子、炸弹等。考虑到对方只出了单张4，我们可以选择出比4大的单牌，或者出对子、炸弹等牌型来赢得这一轮。

在这种情况下，我们可以选择出单张A，因为A是比4大的单牌，可以压过4。同时，保留其他牌型以应对未来可能的牌局变化。

出牌：["A"]`;

const extractedOutput = extractResponseFromAIReply(aiReplyText);
console.log(extractedOutput); // 应该输出: ["A"]
console.log("提取数据：" + extractedOutput);
