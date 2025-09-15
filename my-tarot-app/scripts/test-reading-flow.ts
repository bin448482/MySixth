/**
 * 占卜流程测试脚本
 * Reading Flow Test Script
 *
 * 运行命令: npx ts-node scripts/test-reading-flow.ts
 * 或: npm run test-reading
 */

import { DatabaseInitializer } from '../lib/database/initializer.ts';
import { CardService } from '../lib/services/CardService.ts';
import { DimensionService } from '../lib/services/DimensionService.ts';
import { CardInterpretationService } from '../lib/services/CardInterpretationService.ts';

interface TestResult {
  test: string;
  status: 'pass' | 'fail';
  error?: string;
  details?: any;
}

class ReadingFlowTester {
  private testResults: TestResult[] = [];
  private cardService: CardService;
  private dimensionService: DimensionService;
  private interpretationService: CardInterpretationService;

  constructor() {
    this.cardService = CardService.getInstance();
    this.dimensionService = DimensionService.getInstance();
    this.interpretationService = CardInterpretationService.getInstance();
  }

  async runAllTests(): Promise<TestResult[]> {
    console.log('🧪 Starting Reading Flow Tests...\n');

    await this.testDatabaseInitialization();
    await this.testCardLoading();
    await this.testDimensionLoading();
    await this.testInterpretationLoading();
    await this.testCompleteFlow();

    this.printResults();
    return this.testResults;
  }

  private async testDatabaseInitialization(): Promise<void> {
    console.log('📊 Testing Database Initialization...');

    try {
      const initializer = new DatabaseInitializer();
      const result = await initializer.initialize();

      this.addResult({
        test: 'Database Initialization',
        status: result ? 'pass' : 'fail',
        details: result ? 'Database initialized successfully' : 'Database initialization failed'
      });

      if (result) {
        const status = await initializer.getStatus();
        console.log('📈 Database Status:', {
          cards: status?.cards?.count,
          cardStyles: status?.cardStyles?.count,
          spreads: status?.spreads?.count
        });
      }
    } catch (error) {
      this.addResult({
        test: 'Database Initialization',
        status: 'fail',
        error: error instanceof Error ? error.message : 'Unknown error'
      });
    }
  }

  private async testCardLoading(): Promise<void> {
    console.log('🃏 Testing Card Loading...');

    try {
      // 测试获取所有卡牌
      const allCards = await this.cardService.getAllCards();
      this.addResult({
        test: 'Load All Cards',
        status: allCards.success ? 'pass' : 'fail',
        details: allCards.success ? `${allCards.data?.length} cards loaded` : allCards.error
      });

      // 测试获取大阿卡纳
      const majorArcana = await this.cardService.getMajorArcana();
      this.addResult({
        test: 'Load Major Arcana',
        status: majorArcana.success ? 'pass' : 'fail',
        details: majorArcana.success ? `${majorArcana.data?.length} major cards` : majorArcana.error
      });

      // 测试获取小阿卡纳
      const minorArcana = await this.cardService.getMinorArcana();
      this.addResult({
        test: 'Load Minor Arcana',
        status: minorArcana.success ? 'pass' : 'fail',
        details: minorArcana.success ? `${minorArcana.data?.length} minor cards` : minorArcana.error
      });

      // 测试随机抽牌
      const randomCards = await this.cardService.drawRandomCards(3);
      this.addResult({
        test: 'Random Card Selection',
        status: randomCards.success ? 'pass' : 'fail',
        details: randomCards.success ? `${randomCards.data?.length} random cards selected` : randomCards.error
      });

    } catch (error) {
      this.addResult({
        test: 'Card Loading',
        status: 'fail',
        error: error instanceof Error ? error.message : 'Unknown error'
      });
    }
  }

  private async testDimensionLoading(): Promise<void> {
    console.log('📏 Testing Dimension Loading...');

    try {
      // 测试获取所有类别
      const categories = await this.dimensionService.getUniqueCategories();
      this.addResult({
        test: 'Load Unique Categories',
        status: categories.success ? 'pass' : 'fail',
        details: categories.success ? categories.data : categories.error
      });

      if (categories.success && categories.data) {
        // 测试第一个类别的维度
        const firstCategory = categories.data[0];
        const dimensions = await this.dimensionService.getDimensionsByCategory(firstCategory);
        this.addResult({
          test: `Load Dimensions for ${firstCategory}`,
          status: dimensions.success ? 'pass' : 'fail',
          details: dimensions.success ? `${dimensions.data?.length} dimensions loaded` : dimensions.error
        });
      }

    } catch (error) {
      this.addResult({
        test: 'Dimension Loading',
        status: 'fail',
        error: error instanceof Error ? error.message : 'Unknown error'
      });
    }
  }

  private async testInterpretationLoading(): Promise<void> {
    console.log('📖 Testing Interpretation Loading...');

    try {
      // 获取一张卡牌进行测试
      const cards = await this.cardService.getAllCards();
      if (cards.success && cards.data && cards.data.length > 0) {
        const testCard = cards.data[0];

        // 测试基础解读
        const basicInterpretation = await this.interpretationService.getCardInterpretation(
          testCard.id,
          '正位'
        );
        this.addResult({
          test: 'Load Basic Interpretation',
          status: basicInterpretation.success ? 'pass' : 'fail',
          details: basicInterpretation.success ? 'Basic interpretation loaded' : basicInterpretation.error
        });

        // 测试逆位解读
        const reversedInterpretation = await this.interpretationService.getCardInterpretation(
          testCard.id,
          '逆位'
        );
        this.addResult({
          test: 'Load Reversed Interpretation',
          status: reversedInterpretation.success ? 'pass' : 'fail',
          details: reversedInterpretation.success ? 'Reversed interpretation loaded' : reversedInterpretation.error
        });

        // 测试维度解读
        const dimensions = await this.dimensionService.getAllDimensions();
        if (dimensions.success && dimensions.data && dimensions.data.length > 0) {
          const testDimension = dimensions.data[0];
          const dimensionInterpretation = await this.interpretationService.getCardDimensionInterpretation(
            testCard.id,
            '正位',
            testDimension.id
          );
          this.addResult({
            test: 'Load Dimension Interpretation',
            status: dimensionInterpretation.success ? 'pass' : 'fail',
            details: dimensionInterpretation.success ? 'Dimension interpretation loaded' : dimensionInterpretation.error
          });
        }
      }

    } catch (error) {
      this.addResult({
        test: 'Interpretation Loading',
        status: 'fail',
        error: error instanceof Error ? error.message : 'Unknown error'
      });
    }
  }

  private async testCompleteFlow(): Promise<void> {
    console.log('🔄 Testing Complete Reading Flow...');

    try {
      // 模拟完整占卜流程
      const flow = {
        step1: 'select_type',
        step2: 'select_category',
        step3: 'draw_cards',
        step4: 'generate_interpretation'
      };

      // 步骤1: 选择类型
      const categories = await this.dimensionService.getUniqueCategories();
      if (!categories.success || !categories.data?.length) {
        throw new Error('No categories available');
      }

      // 步骤2: 选择类别
      const category = categories.data[0];
      const dimensions = await this.dimensionService.getDimensionsByCategory(category);
      if (!dimensions.success || !dimensions.data?.length) {
        throw new Error('No dimensions for category');
      }

      // 步骤3: 抽牌
      const cards = await this.cardService.drawRandomCards(3);
      if (!cards.success || !cards.data?.length) {
        throw new Error('Failed to draw cards');
      }

      // 步骤4: 生成解读
      const interpretations = [];
      for (let i = 0; i < Math.min(3, cards.data.length); i++) {
        const card = cards.data[i];
        const dimension = dimensions.data[i];

        const interpretation = await this.interpretationService.getCardDimensionInterpretation(
          card.id,
          '正位',
          dimension.id
        );

        if (interpretation.success) {
          interpretations.push(interpretation.data);
        }
      }

      this.addResult({
        test: 'Complete Reading Flow',
        status: 'pass',
        details: {
          category,
          cards: cards.data?.map((c: any) => c.name),
          dimensions: dimensions.data?.map((d: any) => d.name),
          interpretations: interpretations.length
        }
      });

    } catch (error) {
      this.addResult({
        test: 'Complete Reading Flow',
        status: 'fail',
        error: error instanceof Error ? error.message : 'Unknown error'
      });
    }
  }

  private addResult(result: TestResult): void {
    this.testResults.push(result);
    const icon = result.status === 'pass' ? '✅' : '❌';
    console.log(`${icon} ${result.test}: ${result.status}`);
    if (result.error) {
      console.log(`   Error: ${result.error}`);
    }
    if (result.details) {
      console.log(`   Details:`, result.details);
    }
  }

  private printResults(): void {
    console.log('\n🎯 Test Summary:');
    const passed = this.testResults.filter(r => r.status === 'pass').length;
    const failed = this.testResults.filter(r => r.status === 'fail').length;
    const total = this.testResults.length;

    console.log(`Total: ${total} tests`);
    console.log(`Passed: ${passed} tests`);
    console.log(`Failed: ${failed} tests`);
    console.log(`Success Rate: ${((passed / total) * 100).toFixed(1)}%`);

    if (failed > 0) {
      console.log('\n❌ Failed Tests:');
      this.testResults
        .filter(r => r.status === 'fail')
        .forEach(r => console.log(`- ${r.test}: ${r.error}`));
    }
  }
}

// 运行测试
async function runReadingFlowTests() {
  const tester = new ReadingFlowTester();
  const results = await tester.runAllTests();

  // 退出码基于测试结果
  const hasFailures = results.some(r => r.status === 'fail');
  process.exit(hasFailures ? 1 : 0);
}

// 仅在直接运行时执行
if (require.main === module) {
  runReadingFlowTests().catch(console.error);
}

export { ReadingFlowTester };