"use client";
import { useState, useCallback } from "react";
import { TripDraft, DayPlan, Stop } from "@/types/itinerary";
import { ToastNotification, PersistenceOperation, AddStopOperation, RemoveStopOperation, ReorderStopsOperation } from "@/types/persistence";
import { TripDataAccess, withDataAccess } from "@/lib/data-access";
import { uid } from "@/lib/id";

interface PersistentItineraryState {
  trip: TripDraft;
  notifications: ToastNotification[];
  pendingOperations: Map<string, PersistenceOperation>;
}

export function usePersistentItinerary() {
  const [state, setState] = useState<PersistentItineraryState>(() => ({
    trip: {
      id: uid(),
      title: "Untitled Trip",
      activeDayIndex: 0,
      days: [{ id: uid(), title: "Day 1", stops: [] }],
    },
    notifications: [],
    pendingOperations: new Map(),
  }));

  const { trip, notifications, pendingOperations } = state;
  const activeDay = trip.days[trip.activeDayIndex];

  // Toast management
  const addNotification = useCallback((notification: Omit<ToastNotification, 'id'>) => {
    const id = uid();
    setState(prev => ({
      ...prev,
      notifications: [...prev.notifications, { ...notification, id }],
    }));
  }, []);

  const dismissNotification = useCallback((id: string) => {
    setState(prev => ({
      ...prev,
      notifications: prev.notifications.filter(n => n.id !== id),
    }));
  }, []);

  // Rollback function for failed operations
  const rollbackOperation = useCallback((operation: PersistenceOperation) => {
    setState(prev => {
      let newTrip = prev.trip;

      switch (operation.type) {
        case 'add_stop':
          // Remove the stop that was optimistically added
          newTrip = {
            ...prev.trip,
            days: prev.trip.days.map(day => 
              day.id === operation.dayId
                ? { ...day, stops: day.stops.filter(s => s.id !== operation.stopId) }
                : day
            ),
          };
          break;

        case 'remove_stop':
          // Re-add the stop that was optimistically removed
          const dayIndex = prev.trip.days.findIndex(d => d.id === operation.dayId);
          if (dayIndex !== -1) {
            const stops = [...prev.trip.days[dayIndex].stops];
            const restoredStop: Stop = {
              id: operation.stopId,
              title: operation.stopData.title,
              lat: operation.stopData.lat,
              lng: operation.stopData.lng,
              note: operation.stopData.note,
              cost: operation.stopData.cost,
              dayPlaceId: operation.dayPlaceId,
            };
            
            // Insert at the original position (sort order)
            stops.splice(operation.sortOrder, 0, restoredStop);
            
            newTrip = {
              ...prev.trip,
              days: prev.trip.days.map((day, idx) => 
                idx === dayIndex ? { ...day, stops } : day
              ),
            };
          }
          break;

        case 'reorder_stops':
          // Restore original order
          const reorderDayIndex = prev.trip.days.findIndex(d => d.id === operation.dayId);
          if (reorderDayIndex !== -1) {
            const currentStops = [...prev.trip.days[reorderDayIndex].stops];
            const originalStops: Stop[] = [];
            
            // Reconstruct original order
            operation.originalOrder.forEach(stopId => {
              const stop = currentStops.find(s => s.id === stopId);
              if (stop) originalStops.push(stop);
            });
            
            newTrip = {
              ...prev.trip,
              days: prev.trip.days.map((day, idx) => 
                idx === reorderDayIndex ? { ...day, stops: originalStops } : day
              ),
            };
          }
          break;
      }

      return {
        ...prev,
        trip: newTrip,
        pendingOperations: new Map([...prev.pendingOperations].filter(([_, op]) => op.id !== operation.id)),
      };
    });
  }, []);

  // Add stop with persistence
  const addStopToActiveDay = useCallback(async (stopData: Omit<Stop, "id">) => {
    const stopId = uid();
    const operationId = uid();
    const sortOrder = activeDay.stops.length;

    // Create optimistic operation
    const operation: AddStopOperation = {
      id: operationId,
      type: 'add_stop',
      timestamp: Date.now(),
      dayId: activeDay.id,
      stopId,
      stopData: {
        title: stopData.title,
        lat: stopData.lat,
        lng: stopData.lng,
        note: stopData.note,
        cost: stopData.cost,
      },
      sortOrder,
    };

    // Optimistic UI update
    setState(prev => ({
      ...prev,
      trip: {
        ...prev.trip,
        days: prev.trip.days.map(day => 
          day.id === activeDay.id
            ? { ...day, stops: [...day.stops, { ...stopData, id: stopId }] }
            : day
        ),
      },
      pendingOperations: new Map([...prev.pendingOperations, [operationId, operation]]),
    }));

    // Persist to database
    try {
      const result = await withDataAccess('add stop', () =>
        TripDataAccess.addStopToDay(activeDay.id, stopData, sortOrder)
      );

      // Update with database IDs
      setState(prev => ({
        ...prev,
        trip: {
          ...prev.trip,
          days: prev.trip.days.map(day => 
            day.id === activeDay.id
              ? {
                  ...day,
                  stops: day.stops.map(stop =>
                    stop.id === stopId
                      ? { ...stop, dayPlaceId: result.dayPlaceId, placeId: result.placeId }
                      : stop
                  ),
                }
              : day
          ),
        },
        pendingOperations: new Map([...prev.pendingOperations].filter(([id]) => id !== operationId)),
      }));

      addNotification({
        type: 'success',
        title: 'Stop added',
        message: `${stopData.title} has been added to your day.`,
        duration: 3000,
      });

    } catch (error) {
      console.error('Failed to add stop:', error);
      rollbackOperation(operation);
      
      addNotification({
        type: 'error',
        title: 'Failed to add stop',
        message: error instanceof Error ? error.message : 'Unknown error occurred',
        action: {
          label: 'Retry',
          onClick: () => addStopToActiveDay(stopData),
        },
      });
    }
  }, [activeDay, addNotification, rollbackOperation]);

  // Remove stop with persistence
  const removeStop = useCallback(async (stopId: string) => {
    const stop = activeDay.stops.find(s => s.id === stopId);
    if (!stop || !stop.dayPlaceId) return;

    const operationId = uid();
    const stopIndex = activeDay.stops.findIndex(s => s.id === stopId);

    const operation: RemoveStopOperation = {
      id: operationId,
      type: 'remove_stop',
      timestamp: Date.now(),
      dayId: activeDay.id,
      stopId,
      dayPlaceId: stop.dayPlaceId,
      stopData: {
        title: stop.title,
        lat: stop.lat,
        lng: stop.lng,
        note: stop.note,
        cost: stop.cost,
      },
      sortOrder: stopIndex,
    };

    // Optimistic UI update
    setState(prev => ({
      ...prev,
      trip: {
        ...prev.trip,
        days: prev.trip.days.map(day => 
          day.id === activeDay.id
            ? { ...day, stops: day.stops.filter(s => s.id !== stopId) }
            : day
        ),
      },
      pendingOperations: new Map([...prev.pendingOperations, [operationId, operation]]),
    }));

    // Persist to database
    try {
      await withDataAccess('remove stop', () =>
        TripDataAccess.removeStopFromDay(stop.dayPlaceId!)
      );

      setState(prev => ({
        ...prev,
        pendingOperations: new Map([...prev.pendingOperations].filter(([id]) => id !== operationId)),
      }));

      addNotification({
        type: 'success',
        title: 'Stop removed',
        message: `${stop.title} has been removed from your day.`,
        duration: 3000,
      });

    } catch (error) {
      console.error('Failed to remove stop:', error);
      rollbackOperation(operation);
      
      addNotification({
        type: 'error',
        title: 'Failed to remove stop',
        message: error instanceof Error ? error.message : 'Unknown error occurred',
        action: {
          label: 'Retry',
          onClick: () => removeStop(stopId),
        },
      });
    }
  }, [activeDay, addNotification, rollbackOperation]);

  // Reorder stops with persistence
  const reorderStops = useCallback(async (from: number, to: number) => {
    if (from === to) return;

    const operationId = uid();
    const originalStops = [...activeDay.stops];
    const originalOrder = originalStops.map(s => s.id);
    
    // Create new order
    const newStops = [...originalStops];
    const [moved] = newStops.splice(from, 1);
    newStops.splice(to, 0, moved);
    const newOrder = newStops.map(s => s.id);

    const operation: ReorderStopsOperation = {
      id: operationId,
      type: 'reorder_stops',
      timestamp: Date.now(),
      dayId: activeDay.id,
      originalOrder,
      newOrder,
      originalSortOrders: originalStops.map((_, idx) => idx),
      newSortOrders: newStops.map((_, idx) => idx),
    };

    // Optimistic UI update
    setState(prev => ({
      ...prev,
      trip: {
        ...prev.trip,
        days: prev.trip.days.map(day => 
          day.id === activeDay.id
            ? { ...day, stops: newStops }
            : day
        ),
      },
      pendingOperations: new Map([...prev.pendingOperations, [operationId, operation]]),
    }));

    // Persist to database
    try {
      const stopIds = newStops.map(s => s.dayPlaceId).filter(Boolean) as string[];
      const sortOrders = newStops.map((_, idx) => idx);

      await withDataAccess('reorder stops', () =>
        TripDataAccess.reorderStops(activeDay.id, stopIds, sortOrders)
      );

      setState(prev => ({
        ...prev,
        pendingOperations: new Map([...prev.pendingOperations].filter(([id]) => id !== operationId)),
      }));

    } catch (error) {
      console.error('Failed to reorder stops:', error);
      rollbackOperation(operation);
      
      addNotification({
        type: 'error',
        title: 'Failed to reorder stops',
        message: error instanceof Error ? error.message : 'Unknown error occurred',
        action: {
          label: 'Retry',
          onClick: () => reorderStops(from, to),
        },
      });
    }
  }, [activeDay, addNotification, rollbackOperation]);

  // Optimize day with persistence (for batch reordering)
  const optimizeDay = useCallback(async (newOrder: string[]) => {
    const operationId = uid();
    const originalStops = [...activeDay.stops];
    const originalOrder = originalStops.map(s => s.id);
    
    // Create optimized order
    const optimizedStops: Stop[] = [];
    newOrder.forEach(stopId => {
      const stop = originalStops.find(s => s.id === stopId);
      if (stop) optimizedStops.push(stop);
    });

    const operation: ReorderStopsOperation = {
      id: operationId,
      type: 'reorder_stops',
      timestamp: Date.now(),
      dayId: activeDay.id,
      originalOrder,
      newOrder,
      originalSortOrders: originalStops.map((_, idx) => idx),
      newSortOrders: optimizedStops.map((_, idx) => idx),
    };

    // Optimistic UI update
    setState(prev => ({
      ...prev,
      trip: {
        ...prev.trip,
        days: prev.trip.days.map(day => 
          day.id === activeDay.id
            ? { ...day, stops: optimizedStops }
            : day
        ),
      },
      pendingOperations: new Map([...prev.pendingOperations, [operationId, operation]]),
    }));

    // Persist to database
    try {
      const stopIds = optimizedStops.map(s => s.dayPlaceId).filter(Boolean) as string[];
      const sortOrders = optimizedStops.map((_, idx) => idx);

      await withDataAccess('optimize day', () =>
        TripDataAccess.reorderStops(activeDay.id, stopIds, sortOrders)
      );

      setState(prev => ({
        ...prev,
        pendingOperations: new Map([...prev.pendingOperations].filter(([id]) => id !== operationId)),
      }));

      return true; // Success
    } catch (error) {
      console.error('Failed to persist optimization:', error);
      rollbackOperation(operation);
      
      addNotification({
        type: 'error',
        title: 'Failed to save optimized route',
        message: error instanceof Error ? error.message : 'Unknown error occurred',
        action: {
          label: 'Retry',
          onClick: () => optimizeDay(newOrder),
        },
      });

      return false; // Failed
    }
  }, [activeDay, addNotification, rollbackOperation]);

  // Other functions (non-persistent for now)
  const setActiveDayIndex = (i: number) =>
    setState(prev => ({
      ...prev,
      trip: { ...prev.trip, activeDayIndex: Math.max(0, Math.min(i, prev.trip.days.length - 1)) },
    }));

  const addDay = () =>
    setState(prev => ({
      ...prev,
      trip: {
        ...prev.trip,
        days: [...prev.trip.days, { id: uid(), title: `Day ${prev.trip.days.length + 1}`, stops: [] }],
      },
    }));

  const removeDay = (dayId: string) =>
    setState(prev => {
      if (prev.trip.days.length <= 1) return prev;
      const idx = prev.trip.days.findIndex((d) => d.id === dayId);
      if (idx === -1) return prev;
      const days = prev.trip.days.filter((d) => d.id !== dayId);
      const active = Math.min(prev.trip.activeDayIndex, days.length - 1);
      return { ...prev, trip: { ...prev.trip, days, activeDayIndex: active } };
    });

  const setStopMeta = (stopId: string, patch: Partial<Stop>) =>
    setState(prev => {
      const days = prev.trip.days.slice();
      const day = days[prev.trip.activeDayIndex];
      const idx = day.stops.findIndex((s) => s.id === stopId);
      if (idx === -1) return prev;
      const nextStops = day.stops.slice();
      nextStops[idx] = { ...nextStops[idx], ...patch };
      days[prev.trip.activeDayIndex] = { ...day, stops: nextStops };
      return { ...prev, trip: { ...prev.trip, days } };
    });

  const setRouteStats = (distanceText?: string, durationText?: string) =>
    setState(prev => {
      const days = prev.trip.days.slice();
      days[prev.trip.activeDayIndex] = { ...days[prev.trip.activeDayIndex], distanceText, durationText };
      return { ...prev, trip: { ...prev.trip, days } };
    });

  const replaceTrip = (newTrip: TripDraft) => {
    const safeDayIndex = Math.max(0, Math.min(newTrip.activeDayIndex, newTrip.days.length - 1));
    setState(prev => ({
      ...prev,
      trip: { ...newTrip, activeDayIndex: safeDayIndex },
    }));
  };

  const totalCost = trip.days.reduce((sum, d) => sum + d.stops.reduce((s, p) => s + (p.cost || 0), 0), 0);
  const activeDayCost = activeDay.stops.reduce((s, p) => s + (p.cost || 0), 0);

  return {
    // Trip state
    trip,
    activeDay,
    totalCost,
    activeDayCost,

    // Actions (with persistence)
    addStopToActiveDay,
    removeStop,
    reorderStops,
    optimizeDay,

    // Actions (local only for now)
    setActiveDayIndex,
    addDay,
    removeDay,
    setStopMeta,
    setRouteStats,
    replaceTrip,

    // Toast notifications
    notifications,
    addNotification,
    dismissNotification,
    
    // Debug info
    pendingOperations: Array.from(pendingOperations.values()),
  };
}