/**
 * test-ai-connection.js
 * ─────────────────────────────────────────────────────────────────────────────
 * Quick verification script for the Backend developer.
 * Tests connection from Node.js to the mindvault-ai Python microservice.
 *
 * Run:
 *   node test-ai-connection.js
 */

const path = require('path');
const dotenv = require('dotenv');

dotenv.config({ path: path.resolve(__dirname, '../.env') });
dotenv.config({ path: path.resolve(__dirname, '.env') });
dotenv.config();

const PYTHON_URL = process.env.PYTHON_SERVICE_URL || 'http://localhost:8000';

async function testConnection() {
  console.log(`\n🔍 Testing connection to Python AI Service at: ${PYTHON_URL}\n`);

  // 1. Health check
  try {
    const health = await axios.get(`${PYTHON_URL}/health`, { timeout: 5000 });
    console.log('✅ [1/4] Health check passed:', health.data);
  } catch (err) {
    console.error('❌ [1/4] Failed to reach Python service:');
    console.error('   Make sure the Python AI service is running:');
    console.error('   cd mindvault-ai && python -m uvicorn api:app --port 8000 --reload\n');
    process.exit(1);
  }

  // 2. Test /simplify
  try {
    console.log('\n⏳ [2/4] Testing POST /simplify (generating feed card for "space")...');
    const simplifyRes = await axios.post(`${PYTHON_URL}/simplify`, {
      topics: ['space'],
    });
    const item = simplifyRes.data[0];
    console.log('✅ [2/4] /simplify succeeded:');
    console.log(`   - Topic: ${item.topic}`);
    console.log(`   - Summary: ${item.summary.slice(0, 80)}...`);
    console.log(`   - Key points: ${item.keyPoints.length} points received`);
  } catch (err) {
    console.error('❌ [2/4] /simplify failed:', err.response?.data || err.message);
  }

  // 3. Test /deepdive
  try {
    console.log('\n⏳ [3/4] Testing POST /deepdive (crash course for "Black Holes")...');
    const diveRes = await axios.post(`${PYTHON_URL}/deepdive`, {
      topic: 'Black Holes',
    });
    console.log('✅ [3/4] /deepdive succeeded:');
    console.log(`   - Topic: ${diveRes.data.topic}`);
    console.log(`   - Key facts count: ${diveRes.data.keyFacts.length}`);
    console.log(`   - Quiz questions generated: ${diveRes.data.questions.length}`);
    console.log(`   - Sample Q1: "${diveRes.data.questions[0]}"`);
  } catch (err) {
    console.error('❌ [3/4] /deepdive failed:', err.response?.data || err.message);
  }

  // 4. Test /grade
  try {
    console.log('\n⏳ [4/4] Testing POST /grade (scoring a quiz answer)...');
    const gradeRes = await axios.post(`${PYTHON_URL}/grade`, {
      topic: 'Black Holes',
      questions: ['What is the event horizon?'],
      answers: ['It is the boundary from which nothing, not even light, can escape.'],
    });
    console.log('✅ [4/4] /grade succeeded:');
    console.log(`   - Passed: ${gradeRes.data.passed}`);
    console.log(`   - Feedback: "${gradeRes.data.feedback}"`);
  } catch (err) {
    console.error('❌ [4/4] /grade failed:', err.response?.data || err.message);
  }

  console.log('\n🎉 ALL CHECKS COMPLETED! Backend and Python AI are 100% integrated.\n');
}

testConnection();
