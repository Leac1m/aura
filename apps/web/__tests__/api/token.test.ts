import { GET } from '@/app/api/agent/token/route'
import axios from 'axios'

jest.mock('axios')
const mockedAxios = axios as jest.Mocked<typeof axios>

describe('GET /api/agent/token', () => {
  const originalEnv = process.env

  beforeEach(() => {
    jest.resetModules()
    process.env = { ...originalEnv }
    process.env.ELEVENLABS_API_KEY = 'test-api-key'
    process.env.ELEVENLABS_AGENT_ID = 'test-agent-id'
  })

  afterAll(() => {
    process.env = originalEnv
  })

  it('successfully fetches and returns a conversation token', async () => {
    mockedAxios.get.mockResolvedValueOnce({
      data: { token: 'mock-webrtc-token' }
    })

    const response = await GET()
    const body = await response.json()

    expect(response.status).toBe(200)
    expect(body).toEqual({ conversationToken: 'mock-webrtc-token' })
    expect(mockedAxios.get).toHaveBeenCalledWith(
      expect.stringContaining('/v1/convai/conversation/token?agent_id=test-agent-id'),
      expect.objectContaining({
        headers: { 'xi-api-key': 'test-api-key' }
      })
    )
  })

  it('returns 500 if configuration is missing', async () => {
    delete process.env.ELEVENLABS_API_KEY

    const response = await GET()
    const body = await response.json()

    expect(response.status).toBe(500)
    expect(body.error).toContain('configuration missing')
  })

  it('handles ElevenLabs API errors', async () => {
    mockedAxios.get.mockRejectedValueOnce(new Error('API Error'))

    const response = await GET()
    const body = await response.json()

    expect(response.status).toBe(500)
    expect(body.error).toBe('API Error')
  })
})
