import { describe, it, expect, vi, beforeEach } from 'vitest';

// Mock the supabase import - must be hoisted
vi.mock('./supabase', () => ({
  supabase: {
    from: vi.fn(),
  },
}));

import { TripDataAccess, withDataAccess, DataAccessError } from './data-access';
import { supabase } from './supabase';

const mockSupabase = supabase as any;

describe('TripDataAccess', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('addStopToDay', () => {
    it('should create a new place and day_place relationship', async () => {
      const mockPlaceSearch = {
        select: vi.fn().mockReturnThis(),
        eq: vi.fn().mockReturnThis(),
        maybeSingle: vi.fn().mockResolvedValue({ data: null, error: null }),
      };

      const mockPlaceInsert = {
        insert: vi.fn().mockReturnThis(),
        select: vi.fn().mockReturnThis(),
        single: vi.fn().mockResolvedValue({
          data: { id: 'place-123' },
          error: null,
        }),
      };

      const mockDayPlaceInsert = {
        insert: vi.fn().mockReturnThis(),
        select: vi.fn().mockReturnThis(),
        single: vi.fn().mockResolvedValue({
          data: { id: 'dayplace-456' },
          error: null,
        }),
      };

      mockSupabase.from
        .mockReturnValueOnce(mockPlaceSearch) // Search for existing place
        .mockReturnValueOnce(mockPlaceInsert) // Create new place
        .mockReturnValueOnce(mockDayPlaceInsert); // Create day_place

      const result = await TripDataAccess.addStopToDay(
        'day-123',
        {
          title: 'Test Stop',
          lat: 40.7128,
          lng: -74.0060,
          note: 'Test note',
          cost: 25.50,
        },
        0
      );

      expect(result).toEqual({
        dayPlaceId: 'dayplace-456',
        placeId: 'place-123',
      });

      expect(mockSupabase.from).toHaveBeenCalledWith('places');
      expect(mockPlaceSearch.eq).toHaveBeenCalledWith('name', 'Test Stop');
      expect(mockPlaceInsert.insert).toHaveBeenCalledWith({
        name: 'Test Stop',
        lat: 40.7128,
        lng: -74.0060,
        address: null,
        google_place_id: null,
        types: null,
        photo_ref: null,
        metadata: null,
      });
      expect(mockDayPlaceInsert.insert).toHaveBeenCalledWith({
        day_id: 'day-123',
        place_id: 'place-123',
        sort_order: 0,
        notes: 'Test note',
        cost_cents: 2550,
        start_time: null,
        end_time: null,
        tags: null,
      });
    });

    it('should use existing place if found', async () => {
      const mockPlaceSearch = {
        select: vi.fn().mockReturnThis(),
        eq: vi.fn().mockReturnThis(),
        maybeSingle: vi.fn().mockResolvedValue({
          data: { id: 'existing-place-123' },
          error: null,
        }),
      };

      const mockDayPlaceInsert = {
        insert: vi.fn().mockReturnThis(),
        select: vi.fn().mockReturnThis(),
        single: vi.fn().mockResolvedValue({
          data: { id: 'dayplace-456' },
          error: null,
        }),
      };

      mockSupabase.from
        .mockReturnValueOnce(mockPlaceSearch) // Search for existing place
        .mockReturnValueOnce(mockDayPlaceInsert); // Create day_place

      const result = await TripDataAccess.addStopToDay(
        'day-123',
        {
          title: 'Existing Stop',
          lat: 40.7128,
          lng: -74.0060,
        },
        1
      );

      expect(result).toEqual({
        dayPlaceId: 'dayplace-456',
        placeId: 'existing-place-123',
      });

      expect(mockSupabase.from).toHaveBeenCalledTimes(2); // Only search and day_place insert
    });

    it('should throw error if place creation fails', async () => {
      const mockPlaceSearch = {
        select: vi.fn().mockReturnThis(),
        eq: vi.fn().mockReturnThis(),
        maybeSingle: vi.fn().mockResolvedValue({ data: null, error: null }),
      };

      const mockPlaceInsert = {
        insert: vi.fn().mockReturnThis(),
        select: vi.fn().mockReturnThis(),
        single: vi.fn().mockResolvedValue({
          data: null,
          error: { message: 'Place creation failed' },
        }),
      };

      mockSupabase.from
        .mockReturnValueOnce(mockPlaceSearch)
        .mockReturnValueOnce(mockPlaceInsert);

      await expect(
        TripDataAccess.addStopToDay(
          'day-123',
          { title: 'Test Stop', lat: 40.7128, lng: -74.0060 },
          0
        )
      ).rejects.toThrow('Failed to create place: Place creation failed');
    });
  });

  describe('removeStopFromDay', () => {
    it('should delete day_place relationship', async () => {
      const mockDelete = {
        delete: vi.fn().mockReturnThis(),
        eq: vi.fn().mockResolvedValue({ error: null }),
      };

      mockSupabase.from.mockReturnValue(mockDelete);

      await TripDataAccess.removeStopFromDay('dayplace-123');

      expect(mockSupabase.from).toHaveBeenCalledWith('day_places');
      expect(mockDelete.delete).toHaveBeenCalled();
      expect(mockDelete.eq).toHaveBeenCalledWith('id', 'dayplace-123');
    });

    it('should throw error if deletion fails', async () => {
      const mockDelete = {
        delete: vi.fn().mockReturnThis(),
        eq: vi.fn().mockResolvedValue({
          error: { message: 'Deletion failed' },
        }),
      };

      mockSupabase.from.mockReturnValue(mockDelete);

      await expect(
        TripDataAccess.removeStopFromDay('dayplace-123')
      ).rejects.toThrow('Failed to remove stop: Deletion failed');
    });
  });

  describe('reorderStops', () => {
    it('should update sort_order for multiple stops', async () => {
      const mockUpdate = {
        update: vi.fn().mockReturnThis(),
        eq: vi.fn().mockResolvedValue({ error: null }),
      };

      mockSupabase.from.mockReturnValue(mockUpdate);

      await TripDataAccess.reorderStops(
        'day-123',
        ['dayplace-1', 'dayplace-2', 'dayplace-3'],
        [0, 1, 2]
      );

      expect(mockSupabase.from).toHaveBeenCalledWith('day_places');
      expect(mockUpdate.update).toHaveBeenCalledTimes(3);
      expect(mockUpdate.eq).toHaveBeenCalledWith('id', 'dayplace-1');
      expect(mockUpdate.eq).toHaveBeenCalledWith('id', 'dayplace-2');
      expect(mockUpdate.eq).toHaveBeenCalledWith('id', 'dayplace-3');
    });

    it('should throw error if arrays have different lengths', async () => {
      await expect(
        TripDataAccess.reorderStops(
          'day-123',
          ['dayplace-1', 'dayplace-2'],
          [0, 1, 2] // Different length
        )
      ).rejects.toThrow('Stop IDs and sort orders arrays must have the same length');
    });
  });

  describe('getNextSortOrder', () => {
    it('should return 0 for empty day', async () => {
      const mockSelect = {
        select: vi.fn().mockReturnThis(),
        eq: vi.fn().mockReturnThis(),
        order: vi.fn().mockReturnThis(),
        limit: vi.fn().mockResolvedValue({
          data: [],
          error: null,
        }),
      };

      mockSupabase.from.mockReturnValue(mockSelect);

      const result = await TripDataAccess.getNextSortOrder('day-123');

      expect(result).toBe(0);
      expect(mockSelect.select).toHaveBeenCalledWith('sort_order');
      expect(mockSelect.eq).toHaveBeenCalledWith('day_id', 'day-123');
      expect(mockSelect.order).toHaveBeenCalledWith('sort_order', { ascending: false });
    });

    it('should return max + 1 for existing stops', async () => {
      const mockSelect = {
        select: vi.fn().mockReturnThis(),
        eq: vi.fn().mockReturnThis(),
        order: vi.fn().mockReturnThis(),
        limit: vi.fn().mockResolvedValue({
          data: [{ sort_order: 5 }],
          error: null,
        }),
      };

      mockSupabase.from.mockReturnValue(mockSelect);

      const result = await TripDataAccess.getNextSortOrder('day-123');

      expect(result).toBe(6);
    });
  });
});

describe('withDataAccess', () => {
  it('should wrap successful operations', async () => {
    const mockOperation = vi.fn().mockResolvedValue('success');

    const result = await withDataAccess('test operation', mockOperation);

    expect(result).toBe('success');
    expect(mockOperation).toHaveBeenCalled();
  });

  it('should wrap errors in DataAccessError', async () => {
    const mockError = new Error('Test error');
    const mockOperation = vi.fn().mockRejectedValue(mockError);

    await expect(
      withDataAccess('test operation', mockOperation)
    ).rejects.toThrow(DataAccessError);

    await expect(
      withDataAccess('test operation', mockOperation)
    ).rejects.toThrow('test operation failed: Test error');
  });
});