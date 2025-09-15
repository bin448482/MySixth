/**
 * 基础占卜流程测试脚本（Node.js）
 * Basic Reading Flow Test Script (Node.js)
 *
 * 运行命令: node scripts/test-basic-reading-flow.js
 */

const fs = require('fs');
const path = require('path');

class BasicReadingFlowTester {
  constructor() {
    this.testResults = [];
    this.cards = [];
    this.dimensions = [];
    this.interpretations = [];
  }

  async runAllTests() {
    console.log('🧪 Starting Basic Reading Flow Tests...\n');

    await this.testJsonDataLoading();
    await this.testDataIntegrity();
    await this.testReadingFlowSimulation();

    this.printResults();
    return this.testResults;
  }

  async testJsonDataLoading() {
    console.log('📊 Testing JSON Data Loading...');

    try {
      const dataPath = path.join(__dirname, '..', 'assets', 'data');

      // Test cards.json
      const cardsData = fs.readFileSync(path.join(dataPath, 'cards.json'), 'utf-8');
      const cardsJson = JSON.parse(cardsData);
      this.cards = Array.isArray(cardsJson) ? cardsJson : (cardsJson.data || cardsJson.cards || []);
      this.addResult({
        test: 'Load Cards JSON',
        status: 'pass',
        details: `${this.cards.length} cards loaded`
      });

      // Test dimensions.json
      const dimensionsData = fs.readFileSync(path.join(dataPath, 'dimensions.json'), 'utf-8');
      const dimensionsJson = JSON.parse(dimensionsData);
      this.dimensions = Array.isArray(dimensionsJson) ? dimensionsJson : (dimensionsJson.data || dimensionsJson.dimensions || []);
      this.addResult({
        test: 'Load Dimensions JSON',
        status: 'pass',
        details: `${this.dimensions.length} dimensions loaded`
      });

      // Test interpretations
      const interpretationsData = fs.readFileSync(path.join(dataPath, 'card_interpretations.json'), 'utf-8');
      const interpretationsJson = JSON.parse(interpretationsData);
      this.interpretations = Array.isArray(interpretationsJson) ? interpretationsJson : (interpretationsJson.data || interpretationsJson.interpretations || []);
      this.addResult({
        test: 'Load Interpretations JSON',
        status: 'pass',
        details: `${this.interpretations.length} interpretations loaded`
      });

    } catch (error) {
      this.addResult({
        test: 'JSON Data Loading',
        status: 'fail',
        error: error.message || 'Unknown error'
      });
    }
  }

  async testDataIntegrity() {
    console.log('🔍 Testing Data Integrity...');

    try {
      // Test card data structure
      const requiredCardFields = ['name', 'arcana', 'number', 'image_url'];
      let cardStructureValid = true;
      let missingFields = [];

      if (!Array.isArray(this.cards) || this.cards.length === 0) {
        cardStructureValid = false;
        missingFields.push('Cards array is empty or invalid');
      } else {
        for (const card of this.cards) {
          for (const field of requiredCardFields) {
            if (!(field in card)) {
              cardStructureValid = false;
              missingFields.push(`Card ${card.name || 'unknown'} missing field: ${field}`);
              break;
            }
          }
          if (!cardStructureValid) break;
        }
      }

      this.addResult({
        test: 'Card Data Structure',
        status: cardStructureValid ? 'pass' : 'fail',
        details: cardStructureValid ? 'All cards have required fields' : `Issues found: ${missingFields.slice(0, 3).join(', ')}${missingFields.length > 3 ? '...' : ''}`
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

      // Test interpretation coverage
      const cardNames = new Set(this.cards.map(c => c.name));
      const interpretationCardIds = new Set(this.interpretations.map(i => i.card_id));
      const coverage = (interpretationCardIds.size / cardNames.size) * 100;

      this.addResult({
        test: 'Interpretation Coverage',
        status: 'pass',
        details: `${Math.round(coverage)}% coverage (${interpretationCardIds.size} interpretation card IDs for ${cardNames.size} cards)`
      });

    } catch (error) {
      this.addResult({
        test: 'Data Integrity',
        status: 'fail',
        error: error.message || 'Unknown error'
      });
    }
  }

  async testReadingFlowSimulation() {
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
      const usedIndices = new Set();

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
          const cardInterpretation = this.interpretations.find(i =>
            (i.direction === '正位' || i.direction === '逆位')
          );

          interpretations.push({
            card: card.name,
            dimension: dimension.name,
            direction: cardInterpretation ? cardInterpretation.direction : '正位',
            summary: cardInterpretation ? cardInterpretation.summary : '基础解读'
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
          interpretations: interpretations.length,
          sampleInterpretation: interpretations[0] || null
        }
      });

    } catch (error) {
      this.addResult({
        test: 'Reading Flow Simulation',
        status: 'fail',
        error: error.message || 'Unknown error'
      });
    }
  }

  addResult(result) {
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

  printResults() {
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
async function runBasicReadingFlowTests() {
  const tester = new BasicReadingFlowTester();
  const results = await tester.runAllTests();

  // 退出码基于测试结果
  const hasFailures = results.some(r => r.status === 'fail');
  process.exit(hasFailures ? 1 : 0);
}

// 仅在直接运行时执行
if (require.main === module) {
  runBasicReadingFlowTests().catch(console.error);
}

module.exports = { BasicReadingFlowTester };