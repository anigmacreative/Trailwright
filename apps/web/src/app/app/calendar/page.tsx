"use client";

import React from "react";
import { Calendar, Clock, Users } from "lucide-react";

export default function CalendarPage() {
  return (
    <div className="min-h-screen bg-[#FAF6EF] text-[#2F2B25]">
      <main className="mx-auto max-w-4xl px-4 py-16">
        <div className="text-center space-y-8">
          <div className="flex justify-center">
            <div className="rounded-full bg-[#F5F1E8] p-6">
              <Calendar className="h-12 w-12 text-[#C85C5C]" />
            </div>
          </div>
          
          <div className="space-y-4">
            <h1 className="font-serif text-4xl font-bold text-[#2F2B25]">
              Calendar View
            </h1>
            <p className="text-lg text-[#6B5F53] max-w-2xl mx-auto">
              Plan your adventures across time. The calendar view will help you visualize your trips, 
              track important dates, and coordinate with fellow travelers.
            </p>
          </div>

          <div className="bg-white rounded-xl border border-[#E5DFD0] p-8 shadow-sm">
            <div className="space-y-6">
              <div className="flex items-center justify-center gap-3 text-[#6B5F53]">
                <Clock className="h-5 w-5" />
                <span className="font-medium">Coming Soon</span>
              </div>
              
              <div className="space-y-4 text-sm text-[#6B5F53]">
                <p>We&apos;re crafting an intuitive calendar experience that will include:</p>
                <ul className="space-y-2 text-left max-w-md mx-auto">
                  <li className="flex items-center gap-2">
                    <div className="w-1.5 h-1.5 bg-[#C85C5C] rounded-full"></div>
                    <span>Monthly and weekly trip overview</span>
                  </li>
                  <li className="flex items-center gap-2">
                    <div className="w-1.5 h-1.5 bg-[#C85C5C] rounded-full"></div>
                    <span>Booking reminders and deadlines</span>
                  </li>
                  <li className="flex items-center gap-2">
                    <div className="w-1.5 h-1.5 bg-[#C85C5C] rounded-full"></div>
                    <span>Integration with external calendars</span>
                  </li>
                  <li className="flex items-center gap-2">
                    <div className="w-1.5 h-1.5 bg-[#C85C5C] rounded-full"></div>
                    <span>Collaborative scheduling with your crew</span>
                  </li>
                </ul>
              </div>
            </div>
          </div>

          <div className="pt-8">
            <a 
              href="/app/trips" 
              className="inline-flex items-center gap-2 rounded-lg border border-[#E5DFD0] px-6 py-3 hover:bg-[#F5F1E8] text-[#2F2B25] transition-colors"
            >
              Back to Trips
            </a>
          </div>
        </div>
      </main>
    </div>
  );
}