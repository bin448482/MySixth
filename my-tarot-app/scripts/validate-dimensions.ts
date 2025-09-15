/**
 * 验证dimensions表数据的脚本
 */

import { DatabaseService } from '../lib/services/DatabaseService';
import { DimensionService } from '../lib/services/DimensionService';

async function validateDimensionsData() {
  console.log('🔍 开始验证dimensions表数据...\n');

  try {
    const dbService = DatabaseService.getInstance();
    const dimensionService = DimensionService.getInstance();

    // 1. 检查数据库是否初始化
    console.log('1. 初始化数据库连接...');
    await dbService.initialize();
    console.log('✅ 数据库连接成功');

    // 2. 检查dimensions表总数
    console.log('\n2. 检查dimensions表总记录数...');
    const countResult = await dbService.queryFirst<{ count: number }>(
      'SELECT COUNT(*) as count FROM dimension'
    );

    if (!countResult.success || !countResult.data) {
      throw new Error('无法查询dimensions表记录数');
    }

    const totalCount = countResult.data.count;
    console.log(`✅ dimensions表共有 ${totalCount} 条记录`);

    if (totalCount === 0) {
      console.log('❌ dimensions表为空，需要先执行数据初始化');
      return;
    }

    // 3. 检查各类别的数据分布
    console.log('\n3. 检查各类别数据分布...');
    const categoryResult = await dbService.query<{ category: string; count: number }>(
      'SELECT category, COUNT(*) as count FROM dimension GROUP BY category ORDER BY category'
    );

    if (categoryResult.success && categoryResult.data) {
      console.log('各类别统计:');
      categoryResult.data.forEach(row => {
        console.log(`  ${row.category}: ${row.count} 条`);
      });
    }

    // 4. 测试DimensionService的功能
    console.log('\n4. 测试DimensionService功能...');

    // 获取唯一类别
    const categoriesResult = await dimensionService.getUniqueCategories();
    if (categoriesResult.success && categoriesResult.data) {
      console.log('✅ 获取主类别成功:');
      categoriesResult.data.forEach(category => {
        console.log(`  - ${category}`);
      });
    } else {
      console.error('❌ 获取主类别失败:', categoriesResult.error);
    }

    // 5. 测试按类别获取维度数据
    console.log('\n5. 测试获取特定类别的维度数据...');
    if (categoriesResult.success && categoriesResult.data && categoriesResult.data.length > 0) {
      const firstCategory = categoriesResult.data[0];
      const dimensionsResult = await dimensionService.getDimensionsByCategory(firstCategory);

      if (dimensionsResult.success && dimensionsResult.data) {
        console.log(`✅ ${firstCategory} 类别下有 ${dimensionsResult.data.length} 个维度:`);
        dimensionsResult.data.forEach(dim => {
          console.log(`  - ${dim.name} (aspect: ${dim.aspect}, type: ${dim.aspect_type})`);
        });
      } else {
        console.error(`❌ 获取 ${firstCategory} 类别维度失败:`, dimensionsResult.error);
      }
    }

    // 6. 验证aspect_type的值范围
    console.log('\n6. 验证aspect_type值范围...');
    const aspectTypeResult = await dbService.query<{ aspect_type: number; count: number }>(
      'SELECT aspect_type, COUNT(*) as count FROM dimension WHERE aspect_type IS NOT NULL GROUP BY aspect_type ORDER BY aspect_type'
    );

    if (aspectTypeResult.success && aspectTypeResult.data) {
      console.log('aspect_type分布:');
      aspectTypeResult.data.forEach(row => {
        console.log(`  aspect_type ${row.aspect_type}: ${row.count} 条`);
      });

      // 检查是否有超出预期范围的值
      const invalidTypes = aspectTypeResult.data.filter(row =>
        row.aspect_type < 1 || row.aspect_type > 10
      );

      if (invalidTypes.length > 0) {
        console.warn('⚠️ 发现超出预期范围的aspect_type值:');
        invalidTypes.forEach(row => {
          console.warn(`  aspect_type ${row.aspect_type}: ${row.count} 条`);
        });
      } else {
        console.log('✅ 所有aspect_type值都在预期范围内 (1-10)');
      }
    }

    // 7. 检查必填字段的完整性
    console.log('\n7. 检查数据完整性...');
    const integrityResult = await dbService.query<{
      empty_name: number;
      empty_category: number;
      empty_description: number;
    }>(
      `SELECT
        SUM(CASE WHEN name IS NULL OR name = '' THEN 1 ELSE 0 END) as empty_name,
        SUM(CASE WHEN category IS NULL OR category = '' THEN 1 ELSE 0 END) as empty_category,
        SUM(CASE WHEN description IS NULL OR description = '' THEN 1 ELSE 0 END) as empty_description
       FROM dimension`
    );

    if (integrityResult.success && integrityResult.data && integrityResult.data.length > 0) {
      const integrity = integrityResult.data[0];
      if (integrity.empty_name === 0 && integrity.empty_category === 0 && integrity.empty_description === 0) {
        console.log('✅ 所有必填字段都已正确填写');
      } else {
        console.warn('⚠️ 发现空字段:');
        if (integrity.empty_name > 0) console.warn(`  空name字段: ${integrity.empty_name} 条`);
        if (integrity.empty_category > 0) console.warn(`  空category字段: ${integrity.empty_category} 条`);
        if (integrity.empty_description > 0) console.warn(`  空description字段: ${integrity.empty_description} 条`);
      }
    }

    console.log('\n✅ dimensions数据验证完成！');
    console.log(`📊 总结: 共 ${totalCount} 条记录，数据结构完整`);

  } catch (error) {
    console.error('\n❌ 验证过程中发生错误:', error);
    throw error;
  }
}

// 导出供外部调用
export { validateDimensionsData };

// 如果直接运行此文件
if (require.main === module) {
  validateDimensionsData()
    .then(() => {
      console.log('\n🎉 验证成功完成');
      process.exit(0);
    })
    .catch((error) => {
      console.error('\n💥 验证失败:', error);
      process.exit(1);
    });
}