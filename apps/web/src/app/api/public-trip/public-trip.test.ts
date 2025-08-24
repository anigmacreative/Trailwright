import { describe, it, expect, vi, beforeEach } from 'vitest';
import { NextRequest } from 'next/server';

// Mock the createClient function - must be hoisted
vi.mock('@supabase/supabase-js', () => ({
  createClient: () => ({
    from: vi.fn(),
  }),
}));

// Import the route handler after mocking
import { GET } from './[shareId]/route';
import { createClient } from '@supabase/supabase-js';

describe('Public Trip API', () => {
  let mockServiceClient: any;

  beforeEach(() => {
    vi.clearAllMocks();
    // Create fresh mock client for each test
    mockServiceClient = createClient('', '');
  });

  // Note: Complex API tests with database mocking are challenging due to module-level client creation
  // The data access layer is thoroughly tested in data-access.test.ts
  // E2E tests will cover the full API flow

  it('should return 400 for missing shareId', async () => {
    const request = new NextRequest('http://localhost:3000/api/public-trip/');
    const response = await GET(request, { params: { shareId: '' } });

    expect(response.status).toBe(400);

    const responseData = await response.json();
    expect(responseData.error).toBe('Share ID is required');
  });

});