import '@testing-library/jest-dom';
import { vi } from 'vitest';

// Mock environment variables for testing
process.env.NEXT_PUBLIC_SUPABASE_URL = 'http://localhost:54321';
process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY = 'test-anon-key';
process.env.SUPABASE_SERVICE_ROLE_KEY = 'test-service-key';
process.env.NEXT_PUBLIC_API_URL = 'http://localhost:8000';
process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY = 'test-google-maps-key';
process.env.NEXT_PUBLIC_APP_URL = 'http://localhost:3000';
process.env.NEXT_PUBLIC_DEMO_MODE = 'true';
process.env.NEXT_PUBLIC_USE_SHARE_ID = 'true';
process.env.NEXT_PUBLIC_ENABLE_OPTIMIZE = 'true';

// Mock Google Maps API
global.google = {
  maps: {
    Map: class {
      addListener = vi.fn();
    },
    LatLng: class {
      constructor(public lat: number, public lng: number) {}
      lat() { return this.lat; }
      lng() { return this.lng; }
    },
    Marker: class {},
    InfoWindow: class {},
    DirectionsService: class {},
    DirectionsRenderer: class {},
  },
} as any;

// Mock IntersectionObserver
global.IntersectionObserver = class IntersectionObserver {
  constructor() {}
  observe() {}
  disconnect() {}
  unobserve() {}
};

// Mock ResizeObserver
global.ResizeObserver = class ResizeObserver {
  constructor() {}
  observe() {}
  disconnect() {}
  unobserve() {}
};

// Mock window.matchMedia
Object.defineProperty(window, 'matchMedia', {
  writable: true,
  value: vi.fn().mockImplementation(query => ({
    matches: false,
    media: query,
    onchange: null,
    addListener: vi.fn(),
    removeListener: vi.fn(),
    addEventListener: vi.fn(),
    removeEventListener: vi.fn(),
    dispatchEvent: vi.fn(),
  })),
});