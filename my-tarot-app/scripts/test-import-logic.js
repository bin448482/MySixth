/**
 * 模拟测试 JsonLoader 和 DataImporter 类的逻辑
 * Mock test for JsonLoader and DataImporter class logic
 */

const fs = require('fs');
const path = require('path');

// 模拟 fetch API
global.fetch = async (url) => {
  const filePath = path.join(__dirname, '..', url);
  if (fs.existsSync(filePath)) {
    const content = fs.readFileSync(filePath, 'utf8');
    return {
      ok: true,
      json: async () => JSON.parse(content)
    };
  } else {
    return { ok: false, status: 404 };
  }
};

// 模拟的类和接口（简化版本）
class MockJsonLoader {
  static getInstance() {
    if (!this.instance) {
      this.instance = new MockJsonLoader();
    }
    return this.instance;
  }

  async loadCardStyles() {
    const response = await fetch('/assets/data/card_styles.json');
    if (!response.ok) {
      throw new Error(`Failed to load card_styles.json: ${response.status}`);
    }
    
    const data = await response.json();
    this.validateJsonStructure(data, 'card_styles');
    
    console.log(`✅ Loaded ${data.data.length} card style(s) from JSON`);
    return data;
  }

  async loadCards() {
    const response = await fetch('/assets/data/cards.json');
    if (!response.ok) {
      throw new Error(`Failed to load cards.json: ${response.status}`);
    }
    
    const data = await response.json();
    this.validateJsonStructure(data, 'cards');
    this.validateCardData(data.data);
    
    console.log(`✅ Loaded ${data.data.length} card(s) from JSON`);
    return data;
  }

  async loadSpreads() {
    const response = await fetch('/assets/data/spreads.json');
    if (!response.ok) {
      throw new Error(`Failed to load spreads.json: ${response.status}`);
    }
    
    const data = await response.json();
    this.validateJsonStructure(data, 'spreads');
    
    console.log(`✅ Loaded ${data.data.length} spread(s) from JSON`);
    return data;
  }

  async loadAll() {
    console.log('📦 Loading all JSON data files...');
    
    const [cardStyles, cards, spreads] = await Promise.all([
      this.loadCardStyles(),
      this.loadCards(),
      this.loadSpreads()
    ]);

    console.log('✅ All JSON data loaded successfully');
    
    return { cardStyles, cards, spreads };
  }

  validateJsonStructure(data, fileName) {
    if (!data.version || !data.updated_at || !data.data || !Array.isArray(data.data)) {
      throw new Error(`Invalid JSON structure in ${fileName}: missing required fields`);
    }

    if (data.data.length === 0) {
      console.warn(`⚠️ ${fileName} contains no data items`);
    }
  }

  validateCardData(cards) {
    // 验证总数
    if (cards.length !== 78) {
      throw new Error(`Expected 78 cards, but found ${cards.length}`);
    }

    // 统计各类卡牌
    const majorCount = cards.filter(c => c.arcana === 'Major').length;
    const minorCount = cards.filter(c => c.arcana === 'Minor').length;
    
    if (majorCount !== 22) {
      throw new Error(`Expected 22 major arcana, but found ${majorCount}`);
    }
    
    if (minorCount !== 56) {
      throw new Error(`Expected 56 minor arcana, but found ${minorCount}`);
    }

    // 验证小阿卡纳花色
    const suits = ['权杖', '圣杯', '宝剑', '钱币'];
    for (const suit of suits) {
      const suitCount = cards.filter(c => c.suit === suit).length;
      if (suitCount !== 14) {
        throw new Error(`Expected 14 ${suit} cards, but found ${suitCount}`);
      }
    }

    // 验证必需字段
    for (const card of cards) {
      if (!card.name || !card.arcana || card.number === undefined || 
          !card.image_url || !card.style_name || !card.deck) {
        throw new Error(`Card missing required fields: ${JSON.stringify(card)}`);
      }
    }

    console.log('✅ Card data validation passed');
  }
}

class MockDataImporter {
  constructor() {
    this.jsonLoader = MockJsonLoader.getInstance();
  }

  static getInstance() {
    if (!this.instance) {
      this.instance = new MockDataImporter();
    }
    return this.instance;
  }

  async importAll() {
    const sessionId = `import_${Date.now()}`;
    const session = {
      sessionId,
      startTime: new Date().toISOString(),
      tables: [
        { table: 'card_style', status: 'pending' },
        { table: 'card', status: 'pending' },
        { table: 'spread', status: 'pending' }
      ],
      totalProgress: 0,
      isCompleted: false
    };

    try {
      console.log(`🚀 Starting import session: ${sessionId}`);

      // 加载所有JSON数据
      const jsonData = await this.jsonLoader.loadAll();

      // 模拟导入过程（按依赖顺序）
      session.tables[0] = await this.mockImportCardStyles(jsonData.cardStyles.data);
      session.tables[1] = await this.mockImportCards(jsonData.cards.data, jsonData.cardStyles.data);
      session.tables[2] = await this.mockImportSpreads(jsonData.spreads.data);

      // 计算总进度
      const completedTables = session.tables.filter(t => t.status === 'completed').length;
      session.totalProgress = Math.round((completedTables / session.tables.length) * 100);
      session.isCompleted = completedTables === session.tables.length;

      if (session.isCompleted) {
        console.log(`✅ Import session completed: ${sessionId}`);
      } else {
        console.log(`⚠️ Import session completed with errors: ${sessionId}`);
      }

      return session;

    } catch (error) {
      console.error(`❌ Import session failed: ${sessionId}`, error);
      session.isCompleted = true;
      session.tables.forEach(table => {
        if (table.status === 'pending' || table.status === 'importing') {
          table.status = 'error';
          table.error = error.message;
        }
      });
      return session;
    }
  }

  async mockImportCardStyles(styles) {
    console.log('📄 Mock importing card styles...');
    return {
      table: 'card_style',
      status: 'completed',
      result: {
        success: true,
        imported: styles.length,
        skipped: 0,
        errors: []
      }
    };
  }

  async mockImportCards(cards, styles) {
    console.log('🃏 Mock importing cards...');
    
    // 验证style_name存在
    const styleNames = styles.map(s => s.name);
    for (const card of cards) {
      if (!styleNames.includes(card.style_name)) {
        throw new Error(`Unknown style_name: ${card.style_name}`);
      }
    }
    
    return {
      table: 'card',
      status: 'completed',
      result: {
        success: true,
        imported: cards.length,
        skipped: 0,
        errors: []
      }
    };
  }

  async mockImportSpreads(spreads) {
    console.log('🎴 Mock importing spreads...');
    return {
      table: 'spread',
      status: 'completed',
      result: {
        success: true,
        imported: spreads.length,
        skipped: 0,
        errors: []
      }
    };
  }
}

async function testImportLogic() {
  console.log('🧪 Testing JSON import logic with mock classes...\n');
  
  try {
    // 测试 JsonLoader
    console.log('📥 Testing JsonLoader...');
    const jsonLoader = MockJsonLoader.getInstance();
    const jsonData = await jsonLoader.loadAll();
    
    console.log('✅ JsonLoader test passed\n');
    
    // 测试 DataImporter
    console.log('📤 Testing DataImporter...');
    const dataImporter = MockDataImporter.getInstance();
    const importSession = await dataImporter.importAll();
    
    console.log('\n📊 Import Session Results:');
    console.log(`   Session ID: ${importSession.sessionId}`);
    console.log(`   Completed: ${importSession.isCompleted}`);
    console.log(`   Progress: ${importSession.totalProgress}%`);
    
    importSession.tables.forEach(table => {
      const result = table.result || {};
      console.log(`   ${table.table}: ${table.status} (${result.imported || 0} imported)`);
    });
    
    if (importSession.isCompleted && importSession.totalProgress === 100) {
      console.log('\n✅ DataImporter test passed');
      console.log('\n🎉 All JSON import logic tests passed!');
      return true;
    } else {
      throw new Error('Import session did not complete successfully');
    }
    
  } catch (error) {
    console.error('❌ Import logic test failed:', error.message);
    return false;
  }
}

// 运行测试
if (require.main === module) {
  testImportLogic().then(success => {
    process.exit(success ? 0 : 1);
  });
}

module.exports = { testImportLogic };