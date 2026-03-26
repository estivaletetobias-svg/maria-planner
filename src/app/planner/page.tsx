"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import DrawingBoard from "@/components/canvas/DrawingBoard";
import CalendarPicker from "@/components/calendar/CalendarPicker";
import Image from "next/image";
import { CheckCircle2, Circle, ArrowLeft, Trophy } from "lucide-react";
import Link from "next/link";

interface Task {
  id: string;
  text: string;
  completed: boolean;
  type: "school" | "home" | "hobby";
}

export default function PlannerPage() {
  const [selectedDate, setSelectedDate] = useState(new Date());
  const [tasks, setTasks] = useState<Task[]>([
    { id: "1", text: "Estudar Matemática", completed: false, type: "school" },
    { id: "2", text: "Regar as plantas", completed: true, type: "home" },
    { id: "3", text: "Praticar Violão", completed: false, type: "hobby" },
  ]);

  const [oranges, setOranges] = useState(1);
  const [showReward, setShowReward] = useState(false);

  const toggleTask = (id: string) => {
    setTasks(tasks.map(t => {
      if (t.id === id && !t.completed) {
        setOranges(prev => prev + 1);
        setShowReward(true);
        setTimeout(() => setShowReward(false), 2000);
      }
      return t.id === id ? { ...t, completed: !t.completed } : t;
    }));
  };

  return (
    <main className="min-h-screen lg:h-screen bg-pastel-pink/20 flex flex-col lg:flex-row overflow-x-hidden overflow-y-auto lg:overflow-hidden">
      {/* Sidebar - Capy & Tasks */}
      <aside className="w-full lg:w-80 bg-white border-b-4 lg:border-b-0 lg:border-r-4 border-foreground p-6 flex flex-col gap-6 shrink-0">
        <Link href="/">
          <button className="p-2 rounded-xl border-2 border-foreground hover:bg-pastel-blue transition-all cursor-pointer">
            <ArrowLeft size={24} />
          </button>
        </Link>

        {/* Capy Pet */}
        <div className="flex flex-col items-center bg-pastel-orange/30 p-4 rounded-3xl border-4 border-foreground shadow-[4px_4px_0px_0px_rgba(62,39,35,1)]">
          <div className="relative w-32 h-32">
            <Image
              src="/capy.png"
              alt="Capy Pet"
              fill
              className="object-contain"
            />
            {oranges > 5 && (
              <motion.div
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                className="absolute -top-2 -right-2 text-2xl"
              >
                👑
              </motion.div>
            )}
          </div>
          <span className="font-chewy text-2xl mt-4">Nível {Math.floor(oranges / 3) + 1}</span>
          <div className="flex gap-1 mt-2">
            {[...Array(oranges % 3)].map((_, i) => (
              <span key={i} className="text-xl">🍊</span>
            ))}
            {[...Array(3 - (oranges % 3))].map((_, i) => (
              <span key={i} className="text-xl opacity-20">🍊</span>
            ))}
          </div>
        </div>

        {/* Calendar Picker */}
        <CalendarPicker selectedDate={selectedDate} onChange={setSelectedDate} />

        {/* Task List */}
        <div className="flex-1 flex flex-col">
          <h2 className="font-chewy text-3xl mb-4 flex items-center gap-2">
            Minhas Missões
          </h2>
          <div className="space-y-4">
            {tasks.map(task => (
              <button
                key={task.id}
                onClick={() => toggleTask(task.id)}
                className={`w-full p-4 rounded-2xl border-2 border-foreground flex items-center gap-3 active:translate-y-1 transition-all ${
                  task.completed ? "bg-pastel-green opacity-60" : "bg-white"
                } shadow-[2px_2px_0px_0px_rgba(62,39,35,1)]`}
              >
                {task.completed ? <CheckCircle2 size={24} className="text-foreground" /> : <Circle size={24} />}
                <span className={`font-outfit text-lg text-left flex-1 ${task.completed ? "line-through" : ""}`}>
                  {task.text}
                </span>
                {task.completed && <span className="text-xl">🍊</span>}
              </button>
            ))}
          </div>
        </div>
      </aside>

      {/* Main Content - Drawing Board */}
      <section className="flex-1 p-4 lg:p-6 flex flex-col gap-6 relative min-h-[700px] lg:min-h-0">
        <header className="flex flex-col sm:flex-row justify-between items-center gap-4">
          <h1 className="font-chewy text-4xl text-foreground">Diário da Maria</h1>
          <div className="bg-white px-6 py-2 rounded-full border-2 border-foreground font-pacifico text-xl shadow-[4px_4px_0px_0px_rgba(62,39,35,1)]">
            {selectedDate.toLocaleDateString('pt-BR', { day: 'numeric', month: 'long' })}
          </div>
        </header>
        
        <div className="flex-1">
          <DrawingBoard date={selectedDate} />
        </div>

        {/* Reward Overlay */}
        <AnimatePresence>
          {showReward && (
            <motion.div
              initial={{ scale: 0.5, opacity: 0, y: 100 }}
              animate={{ scale: 1, opacity: 1, y: -200 }}
              exit={{ scale: 1.5, opacity: 0 }}
              className="absolute left-1/2 -translate-x-1/2 pointer-events-none z-50 flex flex-col items-center"
            >
              <Trophy size={80} className="text-yellow-500 mb-4" />
              <span className="font-chewy text-4xl text-foreground drop-shadow-md">
                +1 Laranja para a Capy! 🍊
              </span>
            </motion.div>
          )}
        </AnimatePresence>
      </section>
    </main>
  );
}
