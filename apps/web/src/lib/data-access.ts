import { supabase } from './supabase';
import { Database } from './database.types';

// Type aliases for cleaner code
type Place = Database['public']['Tables']['places']['Row'];
type PlaceInsert = Database['public']['Tables']['places']['Insert'];
type PlaceUpdate = Database['public']['Tables']['places']['Update'];

type DayPlace = Database['public']['Tables']['day_places']['Row'];
type DayPlaceInsert = Database['public']['Tables']['day_places']['Insert'];
type DayPlaceUpdate = Database['public']['Tables']['day_places']['Update'];

export interface AddStopData {
  title: string;
  lat: number;
  lng: number;
  note?: string;
  cost?: number;
}

export interface StopMeta {
  lat?: number;
  lng?: number;
  note?: string;
  cost?: number;
}

/**
 * Data access layer for trip persistence operations
 * Provides typed wrappers around Supabase operations with error handling
 */
export class TripDataAccess {
  /**
   * Add a new stop to a day with optimistic UI support
   */
  static async addStopToDay(
    dayId: string,
    stopData: AddStopData,
    sortOrder: number
  ): Promise<{ dayPlaceId: string; placeId: string }> {
    try {
      // First, create or find the place
      const { data: existingPlace, error: placeSearchError } = await supabase
        .from('places')
        .select('id')
        .eq('name', stopData.title)
        .eq('lat', stopData.lat)
        .eq('lng', stopData.lng)
        .maybeSingle();

      if (placeSearchError) {
        throw new Error(`Failed to search for existing place: ${placeSearchError.message}`);
      }

      let placeId: string;

      if (existingPlace) {
        placeId = existingPlace.id;
      } else {
        // Create new place
        const placeInsert: PlaceInsert = {
          name: stopData.title,
          lat: stopData.lat,
          lng: stopData.lng,
          address: null,
          google_place_id: null,
          types: null,
          photo_ref: null,
          metadata: null,
        };

        const { data: newPlace, error: placeInsertError } = await supabase
          .from('places')
          .insert(placeInsert)
          .select('id')
          .single();

        if (placeInsertError || !newPlace) {
          throw new Error(`Failed to create place: ${placeInsertError?.message || 'Unknown error'}`);
        }

        placeId = newPlace.id;
      }

      // Create day_place relationship
      const dayPlaceInsert: DayPlaceInsert = {
        day_id: dayId,
        place_id: placeId,
        sort_order: sortOrder,
        notes: stopData.note || null,
        cost_cents: stopData.cost ? Math.round(stopData.cost * 100) : null,
        start_time: null,
        end_time: null,
        tags: null,
      };

      const { data: dayPlace, error: dayPlaceError } = await supabase
        .from('day_places')
        .insert(dayPlaceInsert)
        .select('id')
        .single();

      if (dayPlaceError || !dayPlace) {
        throw new Error(`Failed to add stop to day: ${dayPlaceError?.message || 'Unknown error'}`);
      }

      return { dayPlaceId: dayPlace.id, placeId };
    } catch (error) {
      console.error('Error adding stop to day:', error);
      throw error;
    }
  }

  /**
   * Remove a stop from a day
   */
  static async removeStopFromDay(dayPlaceId: string): Promise<void> {
    try {
      const { error } = await supabase
        .from('day_places')
        .delete()
        .eq('id', dayPlaceId);

      if (error) {
        throw new Error(`Failed to remove stop: ${error.message}`);
      }
    } catch (error) {
      console.error('Error removing stop from day:', error);
      throw error;
    }
  }

  /**
   * Update stop metadata (notes, cost, position)
   */
  static async updateStopMeta(
    dayPlaceId: string,
    placeId: string,
    meta: StopMeta
  ): Promise<void> {
    try {
      // Update place if position changed
      if (meta.lat !== undefined || meta.lng !== undefined) {
        const placeUpdate: PlaceUpdate = {};
        if (meta.lat !== undefined) placeUpdate.lat = meta.lat;
        if (meta.lng !== undefined) placeUpdate.lng = meta.lng;

        const { error: placeError } = await supabase
          .from('places')
          .update(placeUpdate)
          .eq('id', placeId);

        if (placeError) {
          throw new Error(`Failed to update place: ${placeError.message}`);
        }
      }

      // Update day_place if notes or cost changed
      if (meta.note !== undefined || meta.cost !== undefined) {
        const dayPlaceUpdate: DayPlaceUpdate = {};
        if (meta.note !== undefined) dayPlaceUpdate.notes = meta.note || null;
        if (meta.cost !== undefined) {
          dayPlaceUpdate.cost_cents = meta.cost ? Math.round(meta.cost * 100) : null;
        }

        const { error: dayPlaceError } = await supabase
          .from('day_places')
          .update(dayPlaceUpdate)
          .eq('id', dayPlaceId);

        if (dayPlaceError) {
          throw new Error(`Failed to update stop metadata: ${dayPlaceError.message}`);
        }
      }
    } catch (error) {
      console.error('Error updating stop metadata:', error);
      throw error;
    }
  }

  /**
   * Reorder stops within a day by updating sort_order
   */
  static async reorderStops(
    dayId: string,
    stopIds: string[],
    newSortOrders: number[]
  ): Promise<void> {
    if (stopIds.length !== newSortOrders.length) {
      throw new Error('Stop IDs and sort orders arrays must have the same length');
    }

    try {
      // Batch update sort orders
      const updates = stopIds.map((id, index) => ({
        id,
        sort_order: newSortOrders[index],
      }));

      // Use a transaction-like approach by updating in a single RPC call
      // For now, we'll do individual updates but could optimize with a stored procedure
      for (const update of updates) {
        const { error } = await supabase
          .from('day_places')
          .update({ sort_order: update.sort_order })
          .eq('id', update.id);

        if (error) {
          throw new Error(`Failed to update sort order for stop ${update.id}: ${error.message}`);
        }
      }
    } catch (error) {
      console.error('Error reordering stops:', error);
      throw error;
    }
  }

  /**
   * Get the next sort order for a day
   */
  static async getNextSortOrder(dayId: string): Promise<number> {
    try {
      const { data, error } = await supabase
        .from('day_places')
        .select('sort_order')
        .eq('day_id', dayId)
        .order('sort_order', { ascending: false })
        .limit(1);

      if (error) {
        throw new Error(`Failed to get max sort order: ${error.message}`);
      }

      return data && data.length > 0 ? data[0].sort_order + 1 : 0;
    } catch (error) {
      console.error('Error getting next sort order:', error);
      throw error;
    }
  }

  /**
   * Get all day places for a specific day
   */
  static async getDayPlaces(dayId: string): Promise<DayPlace[]> {
    try {
      const { data, error } = await supabase
        .from('day_places')
        .select('*')
        .eq('day_id', dayId)
        .order('sort_order');

      if (error) {
        throw new Error(`Failed to get day places: ${error.message}`);
      }

      return data || [];
    } catch (error) {
      console.error('Error getting day places:', error);
      throw error;
    }
  }
}

/**
 * Error wrapper for data access operations
 */
export class DataAccessError extends Error {
  constructor(
    message: string,
    public readonly operation: string,
    public readonly originalError?: unknown
  ) {
    super(message);
    this.name = 'DataAccessError';
  }
}

/**
 * Helper function to wrap data access operations with consistent error handling
 */
export async function withDataAccess<T>(
  operation: string,
  fn: () => Promise<T>
): Promise<T> {
  try {
    return await fn();
  } catch (error) {
    throw new DataAccessError(
      `${operation} failed: ${error instanceof Error ? error.message : 'Unknown error'}`,
      operation,
      error
    );
  }
}