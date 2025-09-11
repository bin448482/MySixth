/**
 * 数据库功能测试脚本
 * Database functionality test script
 */

import { DatabaseInitializer } from '../lib/database/initializer';
import { SpreadService } from '../lib/services/SpreadService';
import { CardService } from '../lib/services/CardService';
import { DatabaseService } from '../lib/services/DatabaseService';

async function testDatabase() {
  console.log('🧪 Starting database functionality test...\n');
  
  try {
    // 创建服务实例
    const initializer = new DatabaseInitializer();
    const spreadService = SpreadService.getInstance();
    const cardService = CardService.getInstance();
    const dbService = DatabaseService.getInstance();
    
    // 1. 测试数据库初始化
    console.log('📋 Testing database initialization...');
    const initSuccess = await initializer.initialize();
    if (!initSuccess) {
      throw new Error('Database initialization failed');
    }
    console.log('✅ Database initialized successfully\n');
    
    // 2. 测试卡牌风格数据
    console.log('🎨 Testing card style data...');
    const cardStylesResult = await cardService.getAllCardStyles();
    if (!cardStylesResult.success) {
      throw new Error(`Failed to get card styles: ${cardStylesResult.error}`);
    }
    
    const cardStyles = cardStylesResult.data || [];
    console.log(`✅ Found ${cardStyles.length} card style(s):`);
    cardStyles.forEach((style, index) => {
      console.log(`   ${index + 1}. ${style.name} (base URL: "${style.image_base_url || 'empty'}")`);
    });
    console.log('');
    
    // 3. 测试牌阵数据
    console.log('🃏 Testing spread data...');
    const spreadsResult = await spreadService.getAllSpreads();
    if (!spreadsResult.success) {
      throw new Error(`Failed to get spreads: ${spreadsResult.error}`);
    }
    
    const spreads = spreadsResult.data || [];
    console.log(`✅ Found ${spreads.length} spread(s):`);
    spreads.forEach((spread, index) => {
      console.log(`   ${index + 1}. ${spread.name} (${spread.card_count} cards)`);
      console.log(`      ${spread.description.substring(0, 100)}...`);
    });
    console.log('');
    
    // 3. 测试三张牌牌阵查询
    console.log('🔍 Testing three-card spread query...');
    const threeCardResult = await spreadService.getThreeCardSpread();
    if (!threeCardResult.success || !threeCardResult.data) {
      throw new Error('Failed to get three-card spread');
    }
    console.log(`✅ Three-card spread found: "${threeCardResult.data.name}"`);
    console.log('');
    
    // 4. 测试数据库状态
    console.log('📊 Testing database status...');
    const status = await initializer.getStatus();
    if (!status) {
      throw new Error('Failed to get database status');
    }
    console.log('✅ Database status:');
    console.log(`   Initialized: ${status.database.isInitialized}`);
    console.log(`   Version: ${status.database.version}`);
    console.log(`   Card styles count: ${status.cardStyles?.count || 0}`);
    console.log(`   Spreads count: ${status.spreads.count}`);
    console.log('');
    
    // 5. 测试原始SQL查询
    console.log('🔧 Testing raw SQL query...');
    const rawResult = await dbService.query('SELECT COUNT(*) as count FROM spread');
    if (!rawResult.success) {
      throw new Error(`Raw query failed: ${rawResult.error}`);
    }
    const count = (rawResult.data?.[0] as any)?.count || 0;
    console.log(`✅ Raw query result: ${count} spreads in database`);
    console.log('');
    
    console.log('🎉 All tests passed successfully!');
    return true;
    
  } catch (error) {
    console.error('❌ Test failed:', error);
    return false;
  }
}

// 如果直接运行此文件则执行测试
if (require.main === module) {
  testDatabase().then(success => {
    process.exit(success ? 0 : 1);
  });
}

export { testDatabase };