/**
 * Card数据测试脚本
 * Card data test script - 78张塔罗牌完整测试
 */

import { DatabaseService } from '../lib/services/DatabaseService';
import { CardService } from '../lib/services/CardService';
import { DatabaseSeeder } from '../lib/database/seeder';
import { DatabaseMigrations } from '../lib/database/migrations';
import { getCardStatistics } from '../lib/database/seed/cards';

async function testCards() {
  console.log('🃏 Testing Card data functionality (78张塔罗牌)...\n');
  
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
    
    // 2. 填充所有数据（包括card_style, card, spread）
    console.log('🌱 Seeding all data...');
    const seedResult = await seeder.seedAll();
    if (!seedResult.success) {
      throw new Error(`Failed to seed data: ${seedResult.error}`);
    }
    console.log('✅ All data seeded\n');
    
    // 3. 验证总卡牌数量
    console.log('🔢 Verifying card counts...');
    const allCardsResult = await cardService.getAllCards();
    if (!allCardsResult.success) {
      throw new Error(`Failed to get all cards: ${allCardsResult.error}`);
    }
    
    const totalCards = allCardsResult.data?.length || 0;
    console.log(`✅ Total cards: ${totalCards}`);
    
    if (totalCards !== 78) {
      throw new Error(`Expected 78 cards, but found ${totalCards}`);
    }
    
    // 4. 验证大阿卡纳
    console.log('🌟 Testing Major Arcana...');
    const majorResult = await cardService.getMajorArcana();
    if (!majorResult.success) {
      throw new Error(`Failed to get major arcana: ${majorResult.error}`);
    }
    
    const majorCards = majorResult.data || [];
    console.log(`✅ Major Arcana: ${majorCards.length} cards`);
    if (majorCards.length !== 22) {
      throw new Error(`Expected 22 major arcana, but found ${majorCards.length}`);
    }
    
    // 显示部分大阿卡纳
    console.log('   Sample Major Arcana:');
    majorCards.slice(0, 5).forEach(card => {
      console.log(`   - ${card.name} (${card.number}): ${card.image_url}`);
    });
    console.log(`   ... and ${majorCards.length - 5} more\n`);
    
    // 5. 验证小阿卡纳
    console.log('⚔️ Testing Minor Arcana...');
    const minorResult = await cardService.getMinorArcana();
    if (!minorResult.success) {
      throw new Error(`Failed to get minor arcana: ${minorResult.error}`);
    }
    
    const minorCards = minorResult.data || [];
    console.log(`✅ Minor Arcana: ${minorCards.length} cards`);
    if (minorCards.length !== 56) {
      throw new Error(`Expected 56 minor arcana, but found ${minorCards.length}`);
    }
    
    // 6. 测试各花色
    const suits = ['权杖', '圣杯', '宝剑', '钱币'];
    console.log('🎴 Testing suits...');
    
    for (const suit of suits) {
      const suitResult = await cardService.getMinorArcana(suit);
      if (!suitResult.success) {
        throw new Error(`Failed to get ${suit} cards: ${suitResult.error}`);
      }
      
      const suitCards = suitResult.data || [];
      console.log(`✅ ${suit}: ${suitCards.length} cards`);
      
      if (suitCards.length !== 14) {
        throw new Error(`Expected 14 ${suit} cards, but found ${suitCards.length}`);
      }
      
      // 显示该花色的王牌和国王
      const ace = suitCards.find(card => card.number === 1);
      const king = suitCards.find(card => card.number === 14);
      if (ace && king) {
        console.log(`   ${ace.name} → ${king.name}`);
      }
    }
    console.log('');
    
    // 7. 测试随机抽牌功能
    console.log('🎲 Testing random card draw...');
    const randomResult = await cardService.drawRandomCards(3);
    if (!randomResult.success) {
      throw new Error(`Failed to draw random cards: ${randomResult.error}`);
    }
    
    const randomCards = randomResult.data || [];
    console.log(`✅ Drew ${randomCards.length} random cards:`);
    randomCards.forEach((card, index) => {
      console.log(`   ${index + 1}. ${card.name} (${card.arcana})`);
    });
    console.log('');
    
    // 8. 测试卡牌搜索
    console.log('🔍 Testing card search...');
    const searchResult = await cardService.searchCards('王');
    if (!searchResult.success) {
      throw new Error(`Failed to search cards: ${searchResult.error}`);
    }
    
    const foundCards = searchResult.data || [];
    console.log(`✅ Search for "王" found ${foundCards.length} cards:`);
    foundCards.slice(0, 5).forEach(card => {
      console.log(`   - ${card.name} (${card.suit || card.arcana})`);
    });
    if (foundCards.length > 5) {
      console.log(`   ... and ${foundCards.length - 5} more`);
    }
    console.log('');
    
    // 9. 验证数据统计
    const stats = getCardStatistics();
    console.log('📊 Card statistics:');
    console.log(`✅ Total: ${stats.total}`);
    console.log(`✅ Major Arcana: ${stats.majorArcana}`);
    console.log(`✅ Minor Arcana: ${stats.minorArcana}`);
    console.log('✅ Suits:');
    console.log(`   - 权杖: ${stats.suits.wands}`);
    console.log(`   - 圣杯: ${stats.suits.cups}`);
    console.log(`   - 宝剑: ${stats.suits.swords}`);
    console.log(`   - 钱币: ${stats.suits.pentacles}`);
    console.log('');
    
    // 10. 测试原始SQL查询
    console.log('🔧 Testing raw SQL queries...');
    const countResult = await dbService.query('SELECT arcana, COUNT(*) as count FROM card GROUP BY arcana ORDER BY arcana');
    if (!countResult.success) {
      throw new Error(`Raw query failed: ${countResult.error}`);
    }
    
    console.log('✅ Card counts by arcana:');
    (countResult.data || []).forEach((row: any) => {
      console.log(`   ${row.arcana}: ${row.count} cards`);
    });
    console.log('');
    
    console.log('🎉 All card tests passed! 78张塔罗牌数据完全正确！');
    return true;
    
  } catch (error) {
    console.error('❌ Card test failed:', error);
    return false;
  }
}

// 如果直接运行此文件则执行测试
if (require.main === module) {
  testCards().then(success => {
    process.exit(success ? 0 : 1);
  });
}

export { testCards };