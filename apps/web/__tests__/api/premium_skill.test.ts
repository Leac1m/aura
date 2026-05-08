import { GET } from '@/app/api/skills/premium/route'

describe('GET /api/skills/premium', () => {
  it('returns 402 Payment Required if no signature is provided', async () => {
    const request = new Request('http://localhost:3000/api/skills/premium')
    const response = await GET(request)
    
    expect(response.status).toBe(402)
    expect(response.headers.get('X-402-Payment-Required')).toContain('solana:')
  })

  it('returns 200 if a signature is provided', async () => {
    const request = new Request('http://localhost:3000/api/skills/premium', {
      headers: {
        'X-402-Payment-Signature': 'mock-signature'
      }
    })
    const response = await GET(request)
    
    expect(response.status).toBe(200)
    const body = await response.json()
    expect(body).toHaveProperty('premium_data')
  })
})
