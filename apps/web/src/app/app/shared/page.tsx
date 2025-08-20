"use client";

import React from "react";
import { Share2, Users, Globe, Heart } from "lucide-react";

export default function SharedPage() {
  return (
    <div className="min-h-screen bg-[#FAF6EF] text-[#2F2B25]">
      <main className="mx-auto max-w-4xl px-4 py-16">
        <div className="text-center space-y-8">
          <div className="flex justify-center">
            <div className="rounded-full bg-[#F5F1E8] p-6">
              <Share2 className="h-12 w-12 text-[#C85C5C]" />
            </div>
          </div>
          
          <div className="space-y-4">
            <h1 className="font-serif text-4xl font-bold text-[#2F2B25]">
              Shared with Me
            </h1>
            <p className="text-lg text-[#6B5F53] max-w-2xl mx-auto">
              Discover adventures shared by friends, family, and fellow travelers. 
              Collaborate on group trips and find inspiration from trusted sources.
            </p>
          </div>

          <div className="bg-white rounded-xl border border-[#E5DFD0] p-8 shadow-sm">
            <div className="space-y-6">
              <div className="flex items-center justify-center gap-3 text-[#6B5F53]">
                <Users className="h-5 w-5" />
                <span className="font-medium">Coming Soon</span>
              </div>
              
              <div className="space-y-4 text-sm text-[#6B5F53]">
                <p>We&apos;re building a collaborative platform that will include:</p>
                <ul className="space-y-2 text-left max-w-md mx-auto">
                  <li className="flex items-center gap-2">
                    <Heart className="h-4 w-4 text-[#C85C5C]" />
                    <span>Trips shared by friends and family</span>
                  </li>
                  <li className="flex items-center gap-2">
                    <Globe className="h-4 w-4 text-[#C85C5C]" />
                    <span>Public itineraries from the community</span>
                  </li>
                  <li className="flex items-center gap-2">
                    <Users className="h-4 w-4 text-[#C85C5C]" />
                    <span>Real-time collaboration on group trips</span>
                  </li>
                  <li className="flex items-center gap-2">
                    <Share2 className="h-4 w-4 text-[#C85C5C]" />
                    <span>Easy sharing with custom permissions</span>
                  </li>
                </ul>
              </div>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 pt-8">
            <div className="bg-[#F5F1E8] rounded-lg p-6 text-left">
              <h3 className="font-semibold text-[#2F2B25] mb-2">Private Sharing</h3>
              <p className="text-sm text-[#6B5F53]">
                Share your itineraries with specific people. Perfect for family trips and close friend groups.
              </p>
            </div>
            <div className="bg-[#F5F1E8] rounded-lg p-6 text-left">
              <h3 className="font-semibold text-[#2F2B25] mb-2">Community Inspiration</h3>
              <p className="text-sm text-[#6B5F53]">
                Browse public itineraries from fellow travelers. Get inspired by real experiences.
              </p>
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