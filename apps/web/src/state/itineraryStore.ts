"use client";
import { useState } from "react";
import { TripDraft, DayPlan, Stop } from "@/types/itinerary";
import { uid } from "@/lib/id";

export function useItineraryState() {
  const [trip, setTrip] = useState<TripDraft>(() => ({
    id: uid(),
    title: "Untitled Trip",
    activeDayIndex: 0,
    days: [
      { id: uid(), title: "Day 1", stops: [] }
    ],
  }));

  const activeDay = trip.days[trip.activeDayIndex];

  const setActiveDayIndex = (i: number) =>
    setTrip((t) => ({ ...t, activeDayIndex: Math.max(0, Math.min(i, t.days.length - 1)) }));

  const addDay = () =>
    setTrip((t) => ({ ...t, days: [...t.days, { id: uid(), title: `Day ${t.days.length + 1}`, stops: [] }] }));

  const removeDay = (dayId: string) =>
    setTrip((t) => {
      if (t.days.length <= 1) return t;
      const idx = t.days.findIndex((d) => d.id === dayId);
      if (idx === -1) return t;
      const days = t.days.filter((d) => d.id !== dayId);
      const active = Math.min(t.activeDayIndex, days.length - 1);
      return { ...t, days, activeDayIndex: active };
    });

  const addStopToActiveDay = (s: Omit<Stop, "id">) =>
    setTrip((t) => {
      const days = t.days.slice();
      days[t.activeDayIndex] = { ...days[t.activeDayIndex], stops: [...days[t.activeDayIndex].stops, { ...s, id: uid() }] };
      return { ...t, days };
    });

  const removeStop = (stopId: string) =>
    setTrip((t) => {
      const days = t.days.slice();
      const day = days[t.activeDayIndex];
      const stops = day.stops.filter((s) => s.id !== stopId);
      days[t.activeDayIndex] = { ...day, stops };
      return { ...t, days };
    });

  const reorderStops = (from: number, to: number) =>
    setTrip((t) => {
      const days = t.days.slice();
      const day = days[t.activeDayIndex];
      const arr = day.stops.slice();
      const [moved] = arr.splice(from, 1);
      arr.splice(to, 0, moved);
      days[t.activeDayIndex] = { ...day, stops: arr };
      return { ...t, days };
    });

  const setStopMeta = (stopId: string, patch: Partial<Stop>) =>
    setTrip((t) => {
      const days = t.days.slice();
      const day = days[t.activeDayIndex];
      const idx = day.stops.findIndex((s) => s.id === stopId);
      if (idx === -1) return t;
      const nextStops = day.stops.slice();
      nextStops[idx] = { ...nextStops[idx], ...patch };
      days[t.activeDayIndex] = { ...day, stops: nextStops };
      return { ...t, days };
    });

  const setRouteStats = (distanceText?: string, durationText?: string) =>
    setTrip((t) => {
      const days = t.days.slice();
      days[t.activeDayIndex] = { ...days[t.activeDayIndex], distanceText, durationText };
      return { ...t, days };
    });

  const replaceTrip = (newTrip: TripDraft) => {
    // Ensure activeDayIndex is within bounds
    const safeDayIndex = Math.max(0, Math.min(newTrip.activeDayIndex, newTrip.days.length - 1));
    setTrip({ ...newTrip, activeDayIndex: safeDayIndex });
  };

  const totalCost = trip.days.reduce((sum, d) => sum + d.stops.reduce((s, p) => s + (p.cost || 0), 0), 0);
  const activeDayCost = activeDay.stops.reduce((s, p) => s + (p.cost || 0), 0);

  return {
    trip,
    activeDay,
    setActiveDayIndex,
    addDay,
    removeDay,
    addStopToActiveDay,
    removeStop,
    reorderStops,
    setStopMeta,
    setRouteStats,
    replaceTrip,
    totalCost,
    activeDayCost,
  };
}