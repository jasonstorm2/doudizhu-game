function extractResponseFromAIReply(aiReplyText) {
    // 使用正则表达式查找 JSON 结构
    const jsonMatch = aiReplyText.match(/```json\s*([\s\S]*?)\s*```/);
    
    if (jsonMatch && jsonMatch[1]) {
      try {
        // 解析 JSON 字符串
        const responseObject = JSON.parse(jsonMatch[1]);
        
        // 提取 outPut 数组
        const outPut = responseObject.responseFormat.outPut;
        
        return outPut;
      } catch (error) {
        console.error("解析 JSON 时出错:", error);
        return null;
      }
    } else {
      console.error("未找到有效的 JSON 结构");
      return null;
    }
  }
  
  // 使用示例
  const aiReplyText = `AI回复的内容2：根据提供的规则和当前的游戏状态，我们需要考虑以下几点：
  
  1. 上个玩家出的是一个单牌4。
  2. 我们需要出大于4的单牌，或者出炸弹。
  3. 根据玩家手牌，我们有5、6、7、8、J、Q、K、2和大小王。
  
  考虑到我们需要出大于4的单牌，我们可以选择出5。这是一个合法的出牌，因为它是大于4的单牌。
  
  出牌格式为JavaScript数组，所以我们的出牌应该是：
  
  \`\`\`json
  {
    "responseFormat": {
      "outPut": ["5"]
    }
  }
  \`\`\`
  
  因此，我们应该出牌，选择出的牌是5。`;
  
  const extractedOutput = extractResponseFromAIReply(aiReplyText);
  console.log(extractedOutput); // 输出: [5]