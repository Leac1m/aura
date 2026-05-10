const BASE_URL = (process.env.EXPO_PUBLIC_API_URL || "http://localhost:3000").trim();

export async function fetchConversationToken(walletAddress?: string) {
  const url = walletAddress ? `${BASE_URL}/api/agent/token?address=${walletAddress}` : `${BASE_URL}/api/agent/token`;
  const response = await fetch(url);
  
  if (response.status === 402) {
    const errorData = await response.json();
    return { status: 402, ...errorData };
  }
  
  if (!response.ok) {
    let detail = '';
    try {
      const errorData = await response.json();
      detail = errorData.error || errorData.details || '';
    } catch {
      detail = await response.text();
    }
    throw new Error(`Failed to fetch conversation token (${response.status}): ${detail}`);
  }
  
  const data = await response.json();
  return { status: 200, ...data };
}

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
  if (!response.ok) {
    const errorData = await response.json();
    throw new Error(errorData.details || errorData.error || 'Failed to fetch route');
  }
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
