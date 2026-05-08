import { GET } from '@/app/api/intent/route'

describe('GET /api/intent', () => {
  it('returns a structured JSON for a voice intent', async () => {
    const request = new Request('http://localhost:3000/api/intent?text=swap 1 SOL for USDC')
    const response = await GET(request)
    const body = await response.json()

    expect(response.status).toBe(200)
    expect(body).toHaveProperty('action', 'swap')
    expect(body).toHaveProperty('amount', 1)
    expect(body).toHaveProperty('asset', 'SOL')
  })

  it('returns 400 if text parameter is missing', async () => {
    const request = new Request('http://localhost:3000/api/intent')
    const response = await GET(request)
    
    expect(response.status).toBe(400)
  })
})
