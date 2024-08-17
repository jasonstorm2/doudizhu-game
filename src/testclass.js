function extractResponseFromAIReply(aiReplyText) {
  // 使用更宽松的正则表达式来匹配出牌部分
  const formatMatch = aiReplyText.match(/出牌：\s*(\[.*?\])/);
  
  if (formatMatch && formatMatch[1]) {
    try {
      // 解析字符串数组
      const outPut = JSON.parse(formatMatch[1]);
      
      // 确保结果是数组
      if (Array.isArray(outPut)) {
        return outPut;
      } else {
        console.error("提取的内容不是数组");
        return null;
      }
    } catch (error) {
      console.error("解析出牌格式时出错:", error);
      return null;
    }
  } else {
    console.error("未找到有效的出牌格式");
    return null;
  }
}
  
  // 使用示例
  const aiReplyText = `AI回复的内容2: 根据提供的规则和游戏状态，上一个玩家出了单张5。根据规则，我们手中有6、J、Q、K、A和2 (两个2)，所有这些牌都大于5。
  
  考虑到我们有多个大于5的单牌，我们可以选择出单张6，因为6是大于5的最小牌，这样可以保留更大的牌以备后用。
  
  出牌：["6"]，注意：格式为javascript字符串数组。`;
  
  const extractedOutput = extractResponseFromAIReply(aiReplyText);
  console.log(extractedOutput); // 输出: ["6"]