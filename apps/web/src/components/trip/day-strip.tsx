"use client";

import React from "react";
import { Button } from "@/ui";
import { Plus } from "lucide-react";

interface Day {
  index: number;
  date: string;
}

interface DayStripProps {
  days: Day[];
  selectedDayIndex: number;
  onDaySelect: (dayIndex: number) => void;
  onAddDay?: () => void;
}

const DayStrip: React.FC<DayStripProps> = ({
  days,
  selectedDayIndex,
  onDaySelect,
  onAddDay,
}) => {
  return (
    <div className="border-b border-clay/20 bg-bone px-4 py-3">
      <div className="flex items-center gap-2 overflow-x-auto">
        {days.map((day) => (
          <Button
            key={day.index}
            variant={selectedDayIndex === day.index ? "default" : "outline"}
            size="sm"
            onClick={() => onDaySelect(day.index)}
            className="flex-shrink-0"
          >
            <div className="text-center">
              <div className="text-xs">Day {day.index + 1}</div>
              <div className="text-xs opacity-75">
                {new Date(day.date).toLocaleDateString("en-US", { 
                  month: "short", 
                  day: "numeric" 
                })}
              </div>
            </div>
          </Button>
        ))}
        
        {onAddDay && (
          <Button
            variant="ghost"
            size="sm"
            onClick={onAddDay}
            className="flex-shrink-0"
          >
            <Plus className="h-4 w-4" />
          </Button>
        )}
      </div>
    </div>
  );
};

export default DayStrip;