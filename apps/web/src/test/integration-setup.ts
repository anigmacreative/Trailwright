import { setupServer } from 'msw/node';
import { http, HttpResponse } from 'msw';

// Mock handlers for integration tests
const handlers = [
  // Mock public trip API
  http.get('/api/public-trip/:shareId', ({ params }) => {
    const { shareId } = params;
    
    if (shareId === 'demo-trip-1') {
      return HttpResponse.json({
        trip: {
          id: 'test-trip-id',
          title: 'Test Iceland Trip',
          share_id: 'demo-trip-1',
          is_public: true,
          activeDayIndex: 0,
          days: [
            {
              id: 'day-1',
              title: 'Day 1',
              stops: [
                {
                  id: 'stop-1',
                  title: 'Test Stop 1',
                  lat: 64.1466,
                  lng: -21.9426,
                  note: 'Test note',
                  cost: 0,
                },
                {
                  id: 'stop-2',
                  title: 'Test Stop 2',
                  lat: 64.1466,
                  lng: -21.9426,
                  note: 'Test note 2',
                  cost: 50,
                },
              ],
            },
          ],
        },
      });
    }
    
    return HttpResponse.json({ error: 'Trip not found' }, { status: 404 });
  }),

  // Mock AI suggestions API
  http.post('/api/ai/suggest-day', () => {
    return HttpResponse.json({
      suggestions: [
        {
          name: 'Test AI Suggestion',
          description: 'A test suggestion from AI',
          category: 'attraction',
          estimated_duration: 60,
          lat: 64.1466,
          lng: -21.9426,
        },
      ],
      reasoning: 'This is a test AI suggestion for testing purposes.',
    });
  }),

  // Mock optimization API
  http.post('http://localhost:8000/optimize-day', () => {
    return HttpResponse.json({
      order: ['stop-2', 'stop-1'], // Reverse order for testing
      distances: [1.5, 2.0],
      durations: [5, 8],
      total_distance: 3.5,
      total_duration: 13,
    });
  }),
];

export const server = setupServer(...handlers);

// Start server before all tests
beforeAll(() => {
  server.listen({ onUnhandledRequest: 'error' });
});

// Reset handlers after each test
afterEach(() => {
  server.resetHandlers();
});

// Clean up after all tests
afterAll(() => {
  server.close();
});