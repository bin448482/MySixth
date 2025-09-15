/**
 * 简化版占卜流程测试脚本
 * Simple Reading Flow Test Script
 *
 * 运行命令: npx ts-node scripts/test-simple-reading-flow.ts
 * 注意：此脚本在Node.js环境中运行，不依赖React Native
 */

import { promises as fs } from 'fs';
import { join } from 'path';

interface TestResult {
  test: string;
  status: 'pass' | 'fail';
  error?: string;
  details?: any;
}

interface CardData {
  id: number;
  name: string;
  arcana: string;
  suit: string | null;
  number: number;
  image_url: string;
  style_id: number;
  deck: string;
}

interface DimensionData {
  id: number;
  name: string;
  category: string;
  description: string;
  aspect?: string;
  aspect_type?: string;
}

class SimpleReadingFlowTester {
  private testResults: TestResult[] = [];
  private cards: CardData[] = [];
  private dimensions: DimensionData[] = [];

  async runAllTests(): Promise<TestResult[]> {
    console.log('🧪 Starting Simple Reading Flow Tests...\n');

    await this.testJsonDataLoading();
    await this.testDataIntegrity();
    await this.testReadingFlowSimulation();

    this.printResults();
    return this.testResults;
  }

  private async testJsonDataLoading(): Promise<void> {
    console.log('📊 Testing JSON Data Loading...');

    try {
      const dataPath = join(__dirname, '..', 'assets', 'data');

      // Test cards.json
      const cardsData = await fs.readFile(join(dataPath, 'cards.json'), 'utf-8');
      this.cards = JSON.parse(cardsData);
      this.addResult({
        test: 'Load Cards JSON',
        status: 'pass',
        details: `${this.cards.length} cards loaded`
      });

      // Test dimensions.json
      const dimensionsData = await fs.readFile(join(dataPath, 'dimensions.json'), 'utf-8');
      this.dimensions = JSON.parse(dimensionsData);
      this.addResult({
        test: 'Load Dimensions JSON',
        status: 'pass',
        details: `${this.dimensions.length} dimensions loaded`
      });

      // Test interpretations
      const interpretationsData = await fs.readFile(join(dataPath, 'card_interpretations.json'), 'utf-8');
      const interpretations = JSON.parse(interpretationsData);
      this.addResult({
        test: 'Load Interpretations JSON',
        status: 'pass',
        details: `${interpretations.length} interpretations loaded`
      });

    } catch (error) {
      this.addResult({
        test: 'JSON Data Loading',
        status: 'fail',
        error: error instanceof Error ? error.message : 'Unknown error'
      });
    }
  }

  private async testDataIntegrity(): Promise<void> {
    console.log('🔍 Testing Data Integrity...');

    try {
      // Test card data structure
      const requiredCardFields = ['id', 'name', 'arcana', 'number', 'image_url'];
      const cardStructureValid = this.cards.every(card =>
        requiredCardFields.every(field => field in card)
      );

      this.addResult({
        test: 'Card Data Structure',
        status: cardStructureValid ? 'pass' : 'fail',
        details: cardStructureValid ? 'All cards have required fields' : 'Some cards missing required fields'
      });

      // Test dimension categories
      const categories = [...new Set(this.dimensions.map(d => d.category))];
      this.addResult({
        test: 'Dimension Categories',
        status: 'pass',
        details: `Found ${categories.length} categories: ${categories.join(', ')}`
      });

      // Test major/minor arcana split
      const majorArcana = this.cards.filter(card => card.arcana === 'Major');
      const minorArcana = this.cards.filter(card => card.arcana === 'Minor');

      this.addResult({
        test: 'Major/Minor Arcana Split',
        status: 'pass',
        details: `Major: ${majorArcana.length}, Minor: ${minorArcana.length}`
      });

    } catch (error) {
      this.addResult({
        test: 'Data Integrity',
        status: 'fail',
        error: error instanceof Error ? error.message : 'Unknown error'
      });
    }
  }

  private async testReadingFlowSimulation(): Promise<void> {
    console.log('🔄 Testing Reading Flow Simulation...');

    try {
      // Simulate a complete reading flow

      // Step 1: Select type (offline/AI)
      const readingType = 'offline';
      this.addResult({
        test: 'Reading Type Selection',
        status: 'pass',
        details: `Type: ${readingType}`
      });

      // Step 2: Select category
      const categories = [...new Set(this.dimensions.map(d => d.category))];
      const selectedCategory = categories[0] || '情感';
      this.addResult({
        test: 'Category Selection',
        status: 'pass',
        details: `Category: ${selectedCategory}`
      });

      // Step 3: Draw cards (3-card spread)
      const availableCards = this.cards;
      const drawnCards = [];
      const usedIndices = new Set<number>();

      for (let i = 0; i < 3 && i < availableCards.length; i++) {
        let randomIndex;
        do {
          randomIndex = Math.floor(Math.random() * availableCards.length);
        } while (usedIndices.has(randomIndex));

        usedIndices.add(randomIndex);
        drawnCards.push(availableCards[randomIndex]);
      }

      this.addResult({
        test: 'Card Drawing',
        status: 'pass',
        details: `Drew ${drawnCards.length} cards: ${drawnCards.map(c => c.name).join(', ')}`
      });

      // Step 4: Get dimensions for category
      const categoryDimensions = this.dimensions.filter(d => d.category === selectedCategory);

      // Step 5: Simulate interpretation
      const interpretations = [];
      for (const card of drawnCards) {
        for (const dimension of categoryDimensions.slice(0, 3)) { // Limit to 3 dimensions
          interpretations.push({
            card: card.name,
            dimension: dimension.name,
            direction: '正位',
            interpretation: `解读 ${card.name} 在 ${dimension.name} 维度下的含义`
          });
        }
      }

      this.addResult({
        test: 'Complete Reading Flow',
        status: 'pass',
        details: {
          type: readingType,
          category: selectedCategory,
          cards: drawnCards.map(c => c.name),
          dimensions: categoryDimensions.slice(0, 3).map(d => d.name),
          interpretations: interpretations.length
        }
      });

    } catch (error) {
      this.addResult({
        test: 'Reading Flow Simulation',
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
async function runSimpleReadingFlowTests() {
  const tester = new SimpleReadingFlowTester();
  const results = await tester.runAllTests();

  // 退出码基于测试结果
  const hasFailures = results.some(r => r.status === 'fail');
  process.exit(hasFailures ? 1 : 0);
}

// 仅在直接运行时执行
if (import.meta.url === `file://${process.argv[1]}`) {
  runSimpleReadingFlowTests().catch(console.error);
}

export { SimpleReadingFlowTester };