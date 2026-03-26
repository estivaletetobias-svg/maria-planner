"use client";

import { useState } from "react";
import { format, addMonths, subMonths, startOfMonth, endOfMonth, eachDayOfInterval, isSameDay, isToday } from "date-fns";
import { ptBR } from "date-fns/locale";
import { ChevronLeft, ChevronRight, Calendar as CalendarIcon } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";

export default function CalendarPicker() {
  const [currentMonth, setCurrentMonth] = useState(new Date());
  const [selectedDate, setSelectedDate] = useState(new Date());
  const [view, setView] = useState<"day" | "month" | "year">("month");

  const days = eachDayOfInterval({
    start: startOfMonth(currentMonth),
    end: endOfMonth(currentMonth),
  });

  return (
    <div className="bg-white p-4 rounded-3xl border-4 border-foreground shadow-[4px_4px_0px_0px_rgba(62,39,35,1)]">
      {/* Month Navigator */}
      <div className="flex items-center justify-between mb-4">
        <button
          onClick={() => setCurrentMonth(subMonths(currentMonth, 1))}
          className="p-1 hover:bg-pastel-blue rounded-lg transition-colors"
        >
          <ChevronLeft size={24} />
        </button>
        
        <button 
          onClick={() => setView(view === "month" ? "year" : "month")}
          className="font-chewy text-xl text-foreground capitalize"
        >
          {format(currentMonth, "MMMM yyyy", { locale: ptBR })}
        </button>

        <button
          onClick={() => setCurrentMonth(addMonths(currentMonth, 1))}
          className="p-1 hover:bg-pastel-blue rounded-lg transition-colors"
        >
          <ChevronRight size={24} />
        </button>
      </div>

      {/* Days Grid */}
      <div className="grid grid-cols-7 gap-1 mb-2">
        {["D", "S", "T", "Q", "Q", "S", "S"].map((d, i) => (
          <div key={i} className="text-center font-chewy text-xs text-foreground/40 pb-2">
            {d}
          </div>
        ))}
        
        {/* Placeholder days (start padding) */}
        {[...Array(startOfMonth(currentMonth).getDay())].map((_, i) => (
          <div key={`pad-${i}`} />
        ))}

        {days.map((day) => (
          <motion.button
            key={day.toString()}
            whileHover={{ scale: 1.1 }}
            whileTap={{ scale: 0.9 }}
            onClick={() => setSelectedDate(day)}
            className={`
              h-8 w-8 rounded-full flex items-center justify-center font-outfit text-sm border-2 transition-all
              ${isSameDay(day, selectedDate) ? "bg-pastel-pink border-foreground" : "border-transparent"}
              ${isToday(day) ? "ring-2 ring-pastel-blue" : ""}
              ${isSameDay(day, selectedDate) ? "text-foreground font-bold" : "text-foreground/80"}
            `}
          >
            {format(day, "d")}
          </motion.button>
        ))}
      </div>

      <div className="mt-4 pt-4 border-t-2 border-foreground/10 flex justify-center">
        <div className="flex items-center gap-2 text-foreground/60 font-pacifico text-sm">
          <CalendarIcon size={16} />
          {format(selectedDate, "dd 'de' MMMM", { locale: ptBR })}
        </div>
      </div>
    </div>
  );
}
