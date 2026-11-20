// Spike S1: can a Lambda running on Floci reach the internet over HTTPS?
export const handler = async () => {
  const started = Date.now();
  try {
    const r = await fetch('https://challenges.cloudflare.com/turnstile/v0/siteverify', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ secret: '1x0000000000000000000000000000000AA', response: 'XXXX.DUMMY.TOKEN.XXXX' }),
      signal: AbortSignal.timeout(5000)
    });
    const body = await r.json();
    const result = { ok: true, node: process.version, status: r.status, success: body.success, ms: Date.now() - started };
    console.log(JSON.stringify(result));
    return result;
  } catch (error) {
    const result = { ok: false, node: process.version, error: error.message };
    console.log(JSON.stringify(result));
    return result;
  }
};
