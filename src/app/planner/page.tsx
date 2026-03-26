"use client";

import { useState, useEffect, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import DrawingBoard from "@/components/canvas/DrawingBoard";
import CalendarPicker from "@/components/calendar/CalendarPicker";
import Image from "next/image";
import { CheckCircle2, Circle, ArrowLeft, Trophy, Trash2, Plus, Sparkles, X } from "lucide-react";
import Link from "next/link";
import { getTasks, saveTask, deleteTask, getCapyState, updateCapyState, Task, CapyState } from "./actions";

export default function PlannerPage() {
  const [selectedDate, setSelectedDate] = useState(new Date());
  const [tasks, setTasks] = useState<Task[]>([]);
  const [capy, setCapy] = useState<CapyState | null>(null);
  const [loading, setLoading] = useState(true);
  const [showReward, setShowReward] = useState(false);
  const [newTaskText, setNewTaskText] = useState("");

  const fetchDayData = useCallback(async () => {
    setLoading(true);
    const dateStr = selectedDate.toISOString().split('T')[0];
    try {
      const [dayTasks, capyState] = await Promise.all([
        getTasks(dateStr),
        getCapyState()
      ]);
      setTasks(dayTasks);
      setCapy(capyState);
    } catch (error) {
      console.error("Erro ao carregar dados:", error);
    } finally {
      setLoading(false);
    }
  }, [selectedDate]);

  useEffect(() => {
    fetchDayData();
  }, [fetchDayData]);

  const handleToggleTask = async (task: Task) => {
    const isFirstCompletion = !task.completed;
    const updatedTask = { ...task, completed: !task.completed };
    
    // Optimistic UI
    setTasks(prev => prev.map(t => t.id === task.id ? updatedTask : t));

    if (isFirstCompletion && capy) {
      setCapy(prev => prev ? ({ ...prev, oranges: prev.oranges + 1 }) : null);
      setShowReward(true);
      setTimeout(() => setShowReward(false), 2000);
      await updateCapyState({ oranges: capy.oranges + 1 });
    }

    await saveTask(updatedTask);
  };

  const handleAddTask = async () => {
    if (!newTaskText) return;
    const dateStr = selectedDate.toISOString().split('T')[0];
    const newTask: Task = {
      id: Math.random().toString(36).substring(7),
      text: newTaskText,
      completed: false,
      type: "school",
      date: dateStr
    };
    
    setTasks(prev => [...prev, newTask]);
    setNewTaskText("");
    await saveTask(newTask);
  };

  const handleDeleteTask = async (id: string) => {
    const dateStr = selectedDate.toISOString().split('T')[0];
    setTasks(prev => prev.filter(t => t.id !== id));
    await deleteTask(id, dateStr);
  };

  const currentLevel = capy ? Math.floor(capy.oranges / 3) + 1 : 1;
  const orangesThisLevel = capy ? capy.oranges % 3 : 0;

  const handleEquipItem = async (itemId: string) => {
    if (!capy) return;
    const isEquipped = capy.equippedItems.includes(itemId);
    const updatedEquipped = isEquipped ? capy.equippedItems.filter(id => id !== itemId) : [...capy.equippedItems, itemId]; // Allow multiple items
    
    setCapy({ ...capy, equippedItems: updatedEquipped });
    await updateCapyState({ equippedItems: updatedEquipped });
  };

  const handleBuyItem = async (itemId: string, cost: number) => {
    if (!capy || capy.oranges < cost) return;
    
    const updatedOwned = [...capy.ownedItems, itemId];
    const updatedOranges = capy.oranges - cost;
    
    setCapy({ ...capy, ownedItems: updatedOwned, oranges: updatedOranges });
    await updateCapyState({ ownedItems: updatedOwned, oranges: updatedOranges });
  };

  const items = [
    { id: "hat", name: "Laço Rosa", emoji: "🎀", cost: 2, position: "top" },
    { id: "glasses", name: "Óculos Cool", emoji: "😎", cost: 5, position: "eyes" },
    { id: "crown", name: "Coroa Real", emoji: "👑", cost: 10, position: "top" },
    { id: "flower", name: "Florzinha", emoji: "🌸", cost: 1, position: "side" },
    { id: "star", name: "Estrela", emoji: "⭐", cost: 3, position: "side" },
  ];

  const [showWardrobe, setShowWardrobe] = useState(false);

  return (
    <main className="min-h-screen lg:h-screen bg-pastel-pink/20 flex flex-col lg:flex-row overflow-x-hidden overflow-y-auto lg:overflow-hidden">
      {/* Sidebar - Capy & Tasks */}
      <aside className="w-full lg:w-80 bg-white border-b-4 lg:border-b-0 lg:border-r-4 border-foreground p-6 flex flex-col gap-6 shrink-0">
        <div className="flex justify-between items-center">
          <Link href="/">
            <button className="p-2 rounded-xl border-2 border-foreground hover:bg-pastel-blue transition-all cursor-pointer">
              <ArrowLeft size={24} />
            </button>
          </Link>
          <button 
            onClick={() => setShowWardrobe(true)}
            className="p-2 rounded-xl border-2 border-foreground bg-white hover:bg-pastel-yellow transition-all shadow-[2px_2px_0px_0px_rgba(62,39,35,1)]"
          >
            <Sparkles className="text-pastel-orange" />
          </button>
        </div>

        {/* Capy Pet */}
        <div className="flex flex-col items-center bg-pastel-orange/30 p-4 rounded-3xl border-4 border-foreground shadow-[4px_4px_0px_0px_rgba(62,39,35,1)] relative">
          <div className="relative w-32 h-32">
            <Image
              src="/capy.png"
              alt="Capy Pet"
              fill
              className="object-contain"
            />
            {capy && capy.equippedItems.map(itemId => {
              const item = items.find(i => i.id === itemId);
              if (!item) return null;

              let emojiStyle = {};
              if (item.position === "top") {
                emojiStyle = { top: "-10px", right: "-10px" };
              } else if (item.position === "eyes") {
                emojiStyle = { top: "30%", left: "50%", transform: "translateX(-50%)" };
              } else if (item.position === "side") {
                emojiStyle = { bottom: "10px", right: "-10px" };
              }

              return (
                <motion.div
                  key={item.id}
                  initial={{ scale: 0 }}
                  animate={{ scale: 1 }}
                  className="absolute text-4xl drop-shadow-lg"
                  style={emojiStyle}
                >
                  {item.emoji}
                </motion.div>
              );
            })}
          </div>
          <span className="font-chewy text-2xl mt-4">Nível {currentLevel}</span>
          <div className="flex gap-1 mt-2">
            {[...Array(orangesThisLevel)].map((_, i) => (
              <span key={i} className="text-xl">🍊</span>
            ))}
            {[...Array(3 - orangesThisLevel)].map((_, i) => (
              <span key={i} className="text-xl opacity-20">🍊</span>
            ))}
          </div>
        </div>

        {/* Calendar Picker */}
        <CalendarPicker selectedDate={selectedDate} onChange={setSelectedDate} />

        {/* Task List */}
        <div className="flex-1 flex flex-col gap-4">
          <h2 className="font-chewy text-3xl flex items-center gap-2">
            Minhas Missões
          </h2>

          {/* Add Task Input */}
          <div className="flex gap-2">
            <input
              type="text"
              value={newTaskText}
              onChange={(e) => setNewTaskText(e.target.value)}
              placeholder="Nova missão..."
              className="flex-1 p-3 rounded-xl border-2 border-foreground font-outfit text-sm outline-none shadow-[2px_2px_0px_0px_rgba(62,39,35,1)]"
              onKeyDown={(e) => e.key === 'Enter' && handleAddTask()}
            />
            <button
              onClick={handleAddTask}
              className="p-3 bg-pastel-pink rounded-xl border-2 border-foreground shadow-[2px_2px_0px_0px_rgba(62,39,35,1)] active:translate-y-0.5"
            >
              <Plus size={20} />
            </button>
          </div>

          <div className="space-y-3">
            {tasks.map(task => (
              <div key={task.id} className="group relative">
                <button
                  onClick={() => handleToggleTask(task)}
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
                <button
                  onClick={() => handleDeleteTask(task.id)}
                  className="absolute -top-2 -right-2 bg-white text-red-500 p-1 rounded-full border-2 border-foreground opacity-0 group-hover:opacity-100 transition-opacity"
                >
                  <Trash2 size={16} />
                </button>
              </div>
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
      {/* Wardrobe Modal */}
      <AnimatePresence>
        {showWardrobe && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-6 backdrop-blur-sm"
          >
            <motion.div
              initial={{ scale: 0.8, y: 50 }}
              animate={{ scale: 1, y: 0 }}
              exit={{ scale: 0.8, y: 50 }}
              className="bg-white w-full max-w-md p-8 rounded-3xl border-4 border-foreground shadow-[8px_8px_0px_0px_rgba(62,39,35,1)]"
            >
              <div className="flex justify-between items-center mb-6">
                <h2 className="font-chewy text-3xl flex items-center gap-2">
                  <Sparkles className="text-pastel-orange" /> Guarda-Roupa
                </h2>
                <button onClick={() => setShowWardrobe(false)}><X size={28} /></button>
              </div>

              <div className="bg-pastel-orange/10 p-4 rounded-2xl border-2 border-foreground mb-6 flex justify-between items-center">
                <span className="font-chewy text-xl">Suas Laranjas:</span>
                <span className="text-2xl font-bold">🍊 {capy?.oranges || 0}</span>
              </div>

              <div className="grid grid-cols-2 gap-4 max-h-96 overflow-y-auto p-1">
                {items.map((item) => {
                  const isOwned = capy?.ownedItems.includes(item.id);
                  const isEquipped = capy?.equippedItems.includes(item.id);
                  const canAfford = (capy?.oranges || 0) >= item.cost;

                  return (
                    <div
                      key={item.id}
                      className={`p-4 rounded-2xl border-2 border-foreground flex flex-col items-center gap-2 transition-all ${
                        isEquipped ? "bg-pastel-yellow" : "bg-white"
                      }`}
                    >
                      <span className="text-5xl mb-2">{item.emoji}</span>
                      <span className="font-chewy text-lg text-center">{item.name}</span>
                      
                      {isOwned ? (
                        <button
                          onClick={() => handleEquipItem(item.id)}
                          className={`w-full py-2 rounded-xl border-2 border-foreground font-chewy text-sm ${
                            isEquipped ? "bg-white" : "bg-pastel-pink"
                          } active:translate-y-0.5 transition-all`}
                        >
                          {isEquipped ? "Tirar" : "Usar"}
                        </button>
                      ) : (
                        <button
                          disabled={!canAfford}
                          onClick={() => handleBuyItem(item.id, item.cost)}
                          className={`w-full py-2 rounded-xl border-2 border-foreground font-chewy text-sm flex items-center justify-center gap-1 ${
                            canAfford ? "bg-pastel-green" : "bg-gray-200 opacity-50 cursor-not-allowed"
                          } active:translate-y-0.5 transition-all`}
                        >
                          {item.cost} <span className="text-xs">🍊</span>
                        </button>
                      )}
                    </div>
                  );
                })}
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </main>
  );
}
