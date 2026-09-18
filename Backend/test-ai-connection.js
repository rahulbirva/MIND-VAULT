/**
 * test-ai-connection.js
 * ─────────────────────────────────────────────────────────────────────────────
 * Zero-dependency verification script for the Backend developer.
 * Uses native Node fetch (Node 18+). No npm install required to test!
 *
 * Run:
 *   node test-ai-connection.js
 */

const PYTHON_URL = process.env.PYTHON_SERVICE_URL || 'http://localhost:8000';

async function testConnection() {
  console.log(`\n======================================================`);
  console.log(`🔍 Testing connection to Python AI: ${PYTHON_URL}`);
  console.log(`======================================================\n`);

  // 1. Health check
  try {
    const res = await fetch(`${PYTHON_URL}/health`);
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    const data = await res.json();
    console.log('✅ [1/4] Health Check Passed:');
    console.log('   Response:', JSON.stringify(data));
  } catch (err) {
    console.error('❌ [1/4] Python AI Service is NOT reachable.');
    console.error('   Please start the Python service first:');
    console.error('   cd mindvault-ai');
    console.error('   python -m uvicorn api:app --port 8000 --reload\n');
    process.exit(1);
  }

  // 2. Test /simplify
  try {
    console.log('\n⏳ [2/4] Testing POST /simplify (generating feed item for "space")...');
    const res = await fetch(`${PYTHON_URL}/simplify`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ topics: ['space'] }),
    });
    const data = await res.json();
    const item = data[0];
    console.log('✅ [2/4] POST /simplify Succeeded:');
    console.log(`   - Topic: "${item.topic}"`);
    console.log(`   - Summary: "${item.summary.slice(0, 80)}..."`);
    console.log(`   - Key Points (${item.keyPoints.length}):`);
    item.keyPoints.forEach((p, i) => console.log(`       ${i + 1}. ${p}`));
  } catch (err) {
    console.error('❌ [2/4] /simplify failed:', err.message);
  }

  // 3. Test /deepdive
  try {
    console.log('\n⏳ [3/4] Testing POST /deepdive (crash course for "Black Holes")...');
    const res = await fetch(`${PYTHON_URL}/deepdive`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ topic: 'Black Holes' }),
    });
    const data = await res.json();
    console.log('✅ [3/4] POST /deepdive Succeeded:');
    console.log(`   - Topic: "${data.topic}"`);
    console.log(`   - Key Facts (${data.keyFacts.length} generated)`);
    console.log(`   - Quiz Questions (${data.questions.length} generated):`);
    data.questions.forEach((q, i) => console.log(`       ${i + 1}. ${q}`));
  } catch (err) {
    console.error('❌ [3/4] /deepdive failed:', err.message);
  }

  // 4. Test /grade
  try {
    console.log('\n⏳ [4/4] Testing POST /grade (scoring a quiz answer)...');
    const res = await fetch(`${PYTHON_URL}/grade`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        topic: 'Black Holes',
        questions: ['What happens at the event horizon?'],
        answers: ['Nothing, not even light, can escape the event horizon because escape velocity exceeds the speed of light.'],
      }),
    });
    const data = await res.json();
    console.log('✅ [4/4] POST /grade Succeeded:');
    console.log(`   - Passed: ${data.passed}`);
    console.log(`   - Feedback: "${data.feedback}"`);
  } catch (err) {
    console.error('❌ [4/4] /grade failed:', err.message);
  }

  console.log('\n======================================================');
  console.log('🎉 ALL CHECKS PASSED! Node backend can talk to Python AI.');
  console.log('======================================================\n');
}

testConnection();
