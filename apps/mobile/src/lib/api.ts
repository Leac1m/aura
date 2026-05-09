const BASE_URL = "http://10.1.1.58:3000" //'http://localhost:3000'; // Change to your local IP for physical device testing

export async function fetchIntent(text: string) {
  const response = await fetch(`${BASE_URL}/api/intent?text=${encodeURIComponent(text)}`);
  if (!response.ok) throw new Error('Failed to fetch intent');
  return response.json();
}

export async function fetchRoute(intent: any) {
  const response = await fetch(`${BASE_URL}/api/route`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(intent),
  });
  if (!response.ok) throw new Error('Failed to fetch route');
  return response.json();
}

export async function fetchPremiumSkill(signature?: string) {
  const headers: Record<string, string> = {};
  if (signature) {
    headers['X-402-Payment-Signature'] = signature;
  }
  
  const response = await fetch(`${BASE_URL}/api/skills/premium`, { headers });
  
  if (response.status === 402) {
    const paymentRequired = response.headers.get('X-402-Payment-Required');
    return { status: 402, paymentRequired, data: await response.json() };
  }
  
  if (!response.ok) throw new Error('Failed to fetch premium skill');
  return { status: 200, data: await response.json() };
}
