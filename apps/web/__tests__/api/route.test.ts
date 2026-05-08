import { POST } from '@/app/api/route/route'

describe('POST /api/route', () => {
  it('returns a LI.FI routing object for a given action', async () => {
    const mockIntent = {
      action: 'swap',
      amount: 1,
      asset: 'SOL',
      toAsset: 'USDC'
    }

    const request = new Request('http://localhost:3000/api/route', {
      method: 'POST',
      body: JSON.stringify(mockIntent)
    })

    const response = await POST(request)
    const body = await response.json()

    expect(response.status).toBe(200)
    expect(body).toHaveProperty('route_id')
    expect(body).toHaveProperty('steps')
    expect(body).toHaveProperty('transaction_request')
  })
})
