/**
 * Card Style 测试脚本
 * Quick test for card style functionality
 */

import { DatabaseService } from '../lib/services/DatabaseService';
import { CardService } from '../lib/services/CardService';
import { DatabaseSeeder } from '../lib/database/seeder';
import { DatabaseMigrations } from '../lib/database/migrations';

async function testCardStyles() {
  console.log('🎨 Testing Card Style functionality...\n');
  
  try {
    const dbService = DatabaseService.getInstance();
    const cardService = CardService.getInstance();
    const migrations = new DatabaseMigrations();
    const seeder = new DatabaseSeeder();
    
    // 1. 初始化数据库
    console.log('📋 Initializing database...');
    const initResult = await dbService.initialize();
    if (!initResult.success) {
      throw new Error(`Failed to initialize database: ${initResult.error}`);
    }
    console.log('✅ Database initialized\n');
    
    // 2. 填充card_style数据
    console.log('🌱 Seeding card style data...');
    const seedResult = await seeder.seedCardStyles();
    if (!seedResult.success) {
      throw new Error(`Failed to seed card styles: ${seedResult.error}`);
    }
    console.log('✅ Card styles seeded\n');
    
    // 3. 查询card_style数据
    console.log('🔍 Querying card styles...');
    const cardStylesResult = await cardService.getAllCardStyles();
    if (!cardStylesResult.success) {
      throw new Error(`Failed to get card styles: ${cardStylesResult.error}`);
    }
    
    const cardStyles = cardStylesResult.data || [];
    console.log(`✅ Found ${cardStyles.length} card style(s):`);
    cardStyles.forEach((style, index) => {
      console.log(`   ${index + 1}. ID: ${style.id}, Name: "${style.name}", Base URL: "${style.image_base_url}"`);
    });
    console.log('');
    
    // 4. 验证1920-raider-waite风格存在
    const raiderWaiteStyle = cardStyles.find(style => style.name === '1920-raider-waite');
    if (!raiderWaiteStyle) {
      throw new Error('1920-raider-waite style not found');
    }
    console.log('✅ 1920-raider-waite style verified');
    console.log(`   ID: ${raiderWaiteStyle.id}`);
    console.log(`   Name: ${raiderWaiteStyle.name}`);
    console.log(`   Base URL: "${raiderWaiteStyle.image_base_url}" (empty as expected)`);
    console.log('');
    
    // 5. 测试原始SQL查询
    console.log('🔧 Testing raw SQL query for card styles...');
    const rawResult = await dbService.query('SELECT * FROM card_style ORDER BY id');
    if (!rawResult.success) {
      throw new Error(`Raw query failed: ${rawResult.error}`);
    }
    console.log(`✅ Raw query returned ${rawResult.data?.length || 0} record(s)`);
    console.log('');
    
    console.log('🎉 All card style tests passed!');
    return true;
    
  } catch (error) {
    console.error('❌ Card style test failed:', error);
    return false;
  }
}

// 如果直接运行此文件则执行测试
if (require.main === module) {
  testCardStyles().then(success => {
    process.exit(success ? 0 : 1);
  });
}

export { testCardStyles };