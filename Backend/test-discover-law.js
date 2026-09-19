/**
 * test-discover-law.js
 * ─────────────────────────────────────────────────────────────────────────────
 * Automated test script to verify POST /api/discover-law with Ollama llama3.
 */

const express = require('express');
const discoveryRoutes = require('./src/routes/discoveryRoutes');

const app = express();
app.use(express.json());
app.use('/api', discoveryRoutes);

async function runTest() {
  console.log('\n🧪 Testing Mental Model Discovery Engine (POST /api/discover-law)...');

  const server = app.listen(5001, async () => {
    try {
      const payload = {
        vaultContext: ['React', 'MongoDB', 'GATE Exam Prep'],
      };

      console.log('Sending vaultContext:', payload.vaultContext);
      const res = await fetch('http://localhost:5001/api/discover-law', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });

      console.log('HTTP Status:', res.status);
      const data = await res.json();
      console.log('Response JSON:', JSON.stringify(data, null, 2));

      // Assert all 5 schema keys exist
      const requiredKeys = [
        'discovered_law',
        'real_world_utility',
        'anchor_explanation',
        'bridge_analogy',
        'actionable_takeaway',
      ];

      const missing = requiredKeys.filter((k) => !data[k]);
      if (missing.length === 0) {
        console.log('\n✅ TEST PASSED: All 5 schema fields present and populated!\n');
      } else {
        console.error('\n❌ TEST FAILED: Missing fields:', missing);
      }
    } catch (err) {
      console.error('❌ Request error:', err.message);
    } finally {
      server.close();
      process.exit(0);
    }
  });
}

runTest();
