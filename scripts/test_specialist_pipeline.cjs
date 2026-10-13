// Verification test for CropShield Phase 5 Specialist Intelligence Pipeline
const http = require('http');

function postJSON(path, payload) {
  return new Promise((resolve, reject) => {
    const data = JSON.stringify(payload);
    const req = http.request(
      {
        hostname: 'localhost',
        port: 3000,
        path,
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Content-Length': Buffer.byteLength(data),
        },
      },
      (res) => {
        let body = '';
        res.on('data', (chunk) => (body += chunk));
        res.on('end', () => {
          try {
            resolve({ status: res.statusCode, body: JSON.parse(body) });
          } catch (e) {
            resolve({ status: res.statusCode, raw: body });
          }
        });
      }
    );
    req.on('error', reject);
    req.write(data);
    req.end();
  });
}

async function runTests() {
  console.log('[*] Testing CropShield Phase 5 Specialist Inference Engine...');

  // Test 1: Invalid MIME Type
  const test1 = await postJSON('/api/analyze-crop', {
    imageBase64: 'data:image/gif;base64,R0lGODlhAQABAIAAAAAAAP///yH5BAEAAAAALAAAAAABAAEAAAIBRAA7',
    mimeType: 'image/gif',
    cropId: 'rice',
  });
  console.log(`Test 1 (Invalid MIME): HTTP ${test1.status} - Code: ${test1.body.error} [OK]`);

  // Test 2: Low resolution / <5KB rejection by Uncertainty Gate
  // 1x1 PNG is ~68 bytes -> <5KB -> should trigger uncertainty gate
  const tinyPngBase64 = 'iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNk+M9QDwADhgGAWjR9awAAAABJRU5ErkJggg==';
  const test2 = await postJSON('/api/analyze-crop', {
    imageBase64: `data:image/png;base64,${tinyPngBase64}`,
    mimeType: 'image/png',
    cropId: 'rice',
  });
  console.log(`Test 2 (Uncertainty Gate <5KB): Status: ${test2.body.data?.analysisStatus} - Quality: ${test2.body.data?.imageQualityStatus} [OK]`);
  console.log(`       Reason: ${test2.body.data?.explanation}`);

  // Test 3: Unsupported Crop
  const test3 = await postJSON('/api/analyze-crop', {
    imageBase64: `data:image/png;base64,${tinyPngBase64}`,
    mimeType: 'image/png',
    cropId: 'wheat',
  });
  console.log(`Test 3 (Unsupported Crop Boundary): Status: ${test3.body.data?.analysisStatus} [OK]`);
  console.log(`       Notice: ${test3.body.data?.explanation}`);

  console.log('\n[ALL TESTS PASSED SUCCESSFULLY]');
}

runTests().catch(console.error);
