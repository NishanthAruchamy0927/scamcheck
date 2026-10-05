import { describe, it, expect, vi, afterEach } from 'vitest';
import { checkCompany, investigateOpportunity } from '../services/api';

const mockFetch = (status: number, body: unknown) =>
  vi.spyOn(globalThis, 'fetch').mockResolvedValue(new Response(JSON.stringify(body), { status, headers: { 'Content-Type': 'application/json' } }));

afterEach(() => vi.restoreAllMocks());

describe('api client', () => {
  it('surfaces the server error message for a failed company check', async () => {
    mockFetch(429, { error: 'Too many analysis requests. Please wait a minute and try again.' });
    await expect(checkCompany({ companyName: 'Acme' })).rejects.toThrow('Too many analysis requests');
  });

  it('sends text investigations as JSON including the LinkedIn URL', async () => {
    const spy = mockFetch(200, { id: 'SC-1' });
    await investigateOpportunity({ text: 'offer text here', linkedinUrl: 'https://www.linkedin.com/company/acme/' });
    const [url, init] = spy.mock.calls[0];
    expect(url).toBe('/api/investigate');
    expect(JSON.parse(init!.body as string)).toEqual({
      text: 'offer text here',
      linkedinUrl: 'https://www.linkedin.com/company/acme/'
    });
  });

  it('sends files as multipart form data', async () => {
    const spy = mockFetch(200, { id: 'SC-2' });
    const file = new File(['hello'], 'offer.txt', { type: 'text/plain' });
    await investigateOpportunity({ files: [file], linkedinUrl: 'https://www.linkedin.com/company/acme/' });
    const body = spy.mock.calls[0][1]!.body as FormData;
    expect(body).toBeInstanceOf(FormData);
    expect((body.get('files') as File).name).toBe('offer.txt');
    expect(body.get('linkedinUrl')).toBe('https://www.linkedin.com/company/acme/');
  });
});
