/**
 * 简单的JSON导入测试脚本
 * Simple JSON import test script
 */

const fs = require('fs');
const path = require('path');

function testJsonFiles() {
  console.log('🧪 Testing JSON data import logic...\n');
  
  try {
    // 测试JSON文件是否存在
    const dataDir = path.join(__dirname, '..', 'assets', 'data');
    const jsonFiles = ['cards.json', 'card_styles.json', 'spreads.json'];
    
    console.log('📁 Checking JSON files existence...');
    for (const filename of jsonFiles) {
      const filepath = path.join(dataDir, filename);
      if (fs.existsSync(filepath)) {
        console.log(`✅ ${filename} exists`);
      } else {
        throw new Error(`❌ ${filename} not found`);
      }
    }
    console.log('');
    
    // 测试JSON文件格式
    console.log('📋 Validating JSON file formats...');
    
    // 验证 card_styles.json
    const cardStylesPath = path.join(dataDir, 'card_styles.json');
    const cardStylesData = JSON.parse(fs.readFileSync(cardStylesPath, 'utf8'));
    
    if (!cardStylesData.version || !cardStylesData.data || !Array.isArray(cardStylesData.data)) {
      throw new Error('Invalid card_styles.json format');
    }
    console.log(`✅ card_styles.json: ${cardStylesData.data.length} styles`);
    
    // 验证 cards.json  
    const cardsPath = path.join(dataDir, 'cards.json');
    const cardsData = JSON.parse(fs.readFileSync(cardsPath, 'utf8'));
    
    if (!cardsData.version || !cardsData.data || !Array.isArray(cardsData.data)) {
      throw new Error('Invalid cards.json format');
    }
    
    const cards = cardsData.data;
    console.log(`✅ cards.json: ${cards.length} cards`);
    
    // 验证卡牌数据完整性
    if (cards.length !== 78) {
      throw new Error(`Expected 78 cards, found ${cards.length}`);
    }
    
    const majorCards = cards.filter(c => c.arcana === 'Major');
    const minorCards = cards.filter(c => c.arcana === 'Minor');
    
    if (majorCards.length !== 22) {
      throw new Error(`Expected 22 major arcana, found ${majorCards.length}`);
    }
    
    if (minorCards.length !== 56) {
      throw new Error(`Expected 56 minor arcana, found ${minorCards.length}`);
    }
    
    console.log(`   - Major Arcana: ${majorCards.length}`);
    console.log(`   - Minor Arcana: ${minorCards.length}`);
    
    // 验证花色
    const suits = ['权杖', '圣杯', '宝剑', '钱币'];
    for (const suit of suits) {
      const suitCards = cards.filter(c => c.suit === suit);
      if (suitCards.length !== 14) {
        throw new Error(`Expected 14 ${suit} cards, found ${suitCards.length}`);
      }
      console.log(`   - ${suit}: ${suitCards.length} cards`);
    }
    
    // 验证 spreads.json
    const spreadsPath = path.join(dataDir, 'spreads.json');
    const spreadsData = JSON.parse(fs.readFileSync(spreadsPath, 'utf8'));
    
    if (!spreadsData.version || !spreadsData.data || !Array.isArray(spreadsData.data)) {
      throw new Error('Invalid spreads.json format');
    }
    console.log(`✅ spreads.json: ${spreadsData.data.length} spreads`);
    console.log('');
    
    // 验证数据关联性
    console.log('🔗 Validating data relationships...');
    
    const styleNames = cardStylesData.data.map(style => style.name);
    const usedStyleNames = [...new Set(cards.map(card => card.style_name))];
    
    for (const styleName of usedStyleNames) {
      if (!styleNames.includes(styleName)) {
        throw new Error(`Unknown style_name referenced: ${styleName}`);
      }
    }
    console.log(`✅ All card style references are valid`);
    
    // 验证必需字段
    console.log('🔍 Validating required fields...');
    
    for (const card of cards) {
      if (!card.name || !card.arcana || card.number === undefined || 
          !card.image_url || !card.style_name || !card.deck) {
        throw new Error(`Card missing required fields: ${JSON.stringify(card)}`);
      }
    }
    console.log(`✅ All cards have required fields`);
    
    console.log('');
    console.log('🎉 All JSON data validation passed!');
    console.log('📊 Summary:');
    console.log(`   - Card Styles: ${cardStylesData.data.length}`);
    console.log(`   - Cards: ${cards.length} (22 Major + 56 Minor)`);
    console.log(`   - Spreads: ${spreadsData.data.length}`);
    console.log('   - Data integrity: ✅ Valid');
    console.log('   - Foreign key relationships: ✅ Valid');
    
    return true;
    
  } catch (error) {
    console.error('❌ JSON validation failed:', error.message);
    return false;
  }
}

// 运行测试
if (require.main === module) {
  const success = testJsonFiles();
  process.exit(success ? 0 : 1);
}

module.exports = { testJsonFiles };