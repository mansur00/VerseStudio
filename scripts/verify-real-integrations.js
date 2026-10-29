/**
 * VerseStudio 4K Pro — Live Real-Service Integration Check Harness (Pass E)
 *
 * Runs live tests against third-party production APIs when credentials are provided in env:
 * 1. Google Drive API (GOOGLE_OAUTH_TOKEN)
 * 2. Gemini AI Speech & Translation (GEMINI_API_KEY)
 * 3. ElevenLabs Neural TTS (ELEVENLABS_API_KEY)
 * 4. Billing Gateway (STRIPE_SECRET_KEY or LEMONSQUEEZY_API_KEY)
 *
 * When an environment variable is unset, the harness skips cleanly with explicit human instructions.
 */

async function checkGoogleDrive() {
  console.log('\n--- 1. Checking Google Drive Cloud Integration ---');
  const token = process.env.GOOGLE_OAUTH_TOKEN;

  if (!token) {
    console.log('   ⏭️  [Google Drive]: SKIPPED (Needs human)');
    console.log('       Reason: GOOGLE_OAUTH_TOKEN environment variable is not set.');
    console.log('       How to test: Run with GOOGLE_OAUTH_TOKEN="ya29.a0..." node scripts/verify-real-integrations.js');
    return { status: 'skipped', reason: 'Missing GOOGLE_OAUTH_TOKEN' };
  }

  try {
    console.log('   Connecting to Google Drive API (v3)...');
    // 1. Check Quota via about.get
    const aboutRes = await fetch('https://www.googleapis.com/drive/v3/about?fields=storageQuota', {
      headers: { Authorization: `Bearer ${token}` },
    });

    if (!aboutRes.ok) {
      throw new Error(`about.get failed with HTTP ${aboutRes.status}: ${await aboutRes.text()}`);
    }

    const aboutData = await aboutRes.json();
    console.log('   ✓ Storage Quota verified:', aboutData.storageQuota);

    // 2. Test Resumable Upload
    const initRes = await fetch(
      'https://www.googleapis.com/upload/drive/v3/files?uploadType=resumable',
      {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'application/json',
          'X-Upload-Content-Type': 'video/webm',
          'X-Upload-Content-Length': '16',
        },
        body: JSON.stringify({
          name: 'VerseStudio_Live_Harness_Test.webm',
          description: 'Automated Pass E validation artifact',
        }),
      }
    );

    if (!initRes.ok) {
      throw new Error(`Resumable session init failed with HTTP ${initRes.status}`);
    }

    const sessionUri = initRes.headers.get('Location');
    if (!sessionUri) throw new Error('Missing Location header in upload response');

    // Upload 16 bytes chunk
    const chunkRes = await fetch(sessionUri, {
      method: 'PUT',
      headers: {
        'Content-Range': 'bytes 0-15/16',
        'Content-Type': 'video/webm',
      },
      body: Buffer.from('TEST_VIDEO_BYTES'),
    });

    if (!chunkRes.ok && chunkRes.status !== 200 && chunkRes.status !== 201) {
      throw new Error(`Chunk upload failed with HTTP ${chunkRes.status}`);
    }

    const fileData = await chunkRes.json();
    console.log(`   ✓ Uploaded test file: ${fileData.name} (ID: ${fileData.id})`);

    // 3. Move to Trash (Safe deletion)
    await fetch(`https://www.googleapis.com/drive/v3/files/${fileData.id}`, {
      method: 'PATCH',
      headers: {
        Authorization: `Bearer ${token}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ trashed: true }),
    });
    console.log('   ✓ Moved test file to Trash (permanent file deletion avoided)');

    return { status: 'passed' };
  } catch (err) {
    console.error('   ❌ Google Drive Verification Failed:', err.message);
    return { status: 'failed', error: err.message };
  }
}

async function checkGemini() {
  console.log('\n--- 2. Checking Gemini AI Integration ---');
  const apiKey = process.env.GEMINI_API_KEY;

  if (!apiKey) {
    console.log('   ⏭️  [Gemini AI]: SKIPPED (Needs human)');
    console.log('       Reason: GEMINI_API_KEY environment variable is not set.');
    console.log('       How to test: Run with GEMINI_API_KEY="AIzaSy..." node scripts/verify-real-integrations.js');
    return { status: 'skipped', reason: 'Missing GEMINI_API_KEY' };
  }

  try {
    console.log('   Sending test prompt to Gemini 1.5 Flash...');
    const url = `https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${apiKey}`;
    const res = await fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        contents: [
          {
            parts: [
              {
                text: 'Translate this Bengali sentence to English for subtitles: "আজকে আমরা ভার্স স্টুডিও ব্যবহার করব।"',
              },
            ],
          },
        ],
      }),
    });

    if (!res.ok) {
      throw new Error(`Gemini API failed with HTTP ${res.status}: ${await res.text()}`);
    }

    const data = await res.json();
    const candidateText = data.candidates?.[0]?.content?.parts?.[0]?.text;
    console.log('   ✓ Gemini Translation Response:', candidateText?.trim());
    return { status: 'passed' };
  } catch (err) {
    console.error('   ❌ Gemini Verification Failed:', err.message);
    return { status: 'failed', error: err.message };
  }
}

async function checkElevenLabs() {
  console.log('\n--- 3. Checking ElevenLabs Neural Voice Integration ---');
  const apiKey = process.env.ELEVENLABS_API_KEY;

  if (!apiKey) {
    console.log('   ⏭️  [ElevenLabs TTS]: SKIPPED (Needs human)');
    console.log('       Reason: ELEVENLABS_API_KEY environment variable is not set.');
    console.log('       How to test: Run with ELEVENLABS_API_KEY="sk_..." node scripts/verify-real-integrations.js');
    return { status: 'skipped', reason: 'Missing ELEVENLABS_API_KEY' };
  }

  try {
    console.log('   Requesting voice synthesis from ElevenLabs API...');
    const voiceId = '21m00Tcm4TlvDq8ikWAM'; // Rachel
    const res = await fetch(`https://api.elevenlabs.io/v1/text-to-speech/${voiceId}`, {
      method: 'POST',
      headers: {
        'xi-api-key': apiKey,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        text: 'Hello, welcome to VerseStudio 4K Pro.',
        model_id: 'eleven_multilingual_v2',
      }),
    });

    if (!res.ok) {
      throw new Error(`ElevenLabs API failed with HTTP ${res.status}: ${await res.text()}`);
    }

    const audioBuf = await res.arrayBuffer();
    console.log(`   ✓ Received synthesized audio stream (${audioBuf.byteLength} bytes)`);
    return { status: 'passed' };
  } catch (err) {
    console.error('   ❌ ElevenLabs Verification Failed:', err.message);
    return { status: 'failed', error: err.message };
  }
}

async function checkBilling() {
  console.log('\n--- 4. Checking Billing Provider Integration ---');
  const stripeKey = process.env.STRIPE_SECRET_KEY;
  const lemonKey = process.env.LEMONSQUEEZY_API_KEY;

  if (!stripeKey && !lemonKey) {
    console.log('   ⏭️  [Billing Gateway]: SKIPPED (Needs human)');
    console.log('       Reason: Neither STRIPE_SECRET_KEY nor LEMONSQUEEZY_API_KEY is configured.');
    console.log('       How to test: Run with STRIPE_SECRET_KEY="sk_test_..." or LEMONSQUEEZY_API_KEY="..."');
    return { status: 'skipped', reason: 'Missing Billing API Keys' };
  }

  try {
    if (stripeKey) {
      console.log('   Verifying Stripe API credentials...');
      const res = await fetch('https://api.stripe.com/v1/customers?limit=1', {
        headers: { Authorization: `Bearer ${stripeKey}` },
      });
      if (!res.ok) throw new Error(`Stripe API returned HTTP ${res.status}`);
      console.log('   ✓ Stripe API connection authenticated successfully');
      return { status: 'passed', provider: 'stripe' };
    }

    if (lemonKey) {
      console.log('   Verifying Lemon Squeezy API credentials...');
      const res = await fetch('https://api.lemonsqueezy.com/v1/stores', {
        headers: {
          Authorization: `Bearer ${lemonKey}`,
          Accept: 'application/vnd.api+json',
        },
      });
      if (!res.ok) throw new Error(`LemonSqueezy API returned HTTP ${res.status}`);
      console.log('   ✓ Lemon Squeezy API connection authenticated successfully');
      return { status: 'passed', provider: 'lemonsqueezy' };
    }
  } catch (err) {
    console.error('   ❌ Billing Verification Failed:', err.message);
    return { status: 'failed', error: err.message };
  }
}

async function main() {
  console.log('=== VerseStudio Live Real-Service Integration Harness ===');
  const results = {
    googleDrive: await checkGoogleDrive(),
    gemini: await checkGemini(),
    elevenLabs: await checkElevenLabs(),
    billing: await checkBilling(),
  };

  console.log('\n========================================================');
  console.log('Integration Harness Summary:');
  console.log(`- Google Drive:  ${results.googleDrive.status.toUpperCase()}`);
  console.log(`- Gemini AI:     ${results.gemini.status.toUpperCase()}`);
  console.log(`- ElevenLabs:    ${results.elevenLabs.status.toUpperCase()}`);
  console.log(`- Billing:       ${results.billing.status.toUpperCase()}`);
  console.log('========================================================\n');
}

main().catch(console.error);

