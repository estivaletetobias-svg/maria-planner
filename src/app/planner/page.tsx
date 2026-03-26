"use client";

import { useState, useEffect, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import DrawingBoard from "@/components/canvas/DrawingBoard";
import CalendarPicker from "@/components/calendar/CalendarPicker";
import Image from "next/image";
import { CheckCircle2, Circle, ArrowLeft, Trophy, Trash2, Plus, Sparkles, X, Calendar as CalendarIcon } from "lucide-react";
import Link from "next/link";
import { getTasks, saveTask, deleteTask, getCapyState, updateCapyState, Task, CapyState } from "./actions";

export default function PlannerPage() {
  const [selectedDate, setSelectedDate] = useState(new Date());
  const [tasks, setTasks] = useState<Task[]>([]);
  const [capy, setCapy] = useState<CapyState | null>(null);
  const [loading, setLoading] = useState(true);
  const [showReward, setShowReward] = useState(false);
  const [newTaskText, setNewTaskText] = useState("");

  // Helper to format date consistent for DB (YYYY-MM-DD)
  const getLocalDateString = useCallback((date: Date) => {
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
  }, []);

  const fetchDayData = useCallback(async () => {
    setLoading(true);
    const dateStr = getLocalDateString(selectedDate);
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
  }, [selectedDate, getLocalDateString]);

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
    const dateStr = getLocalDateString(selectedDate);
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
    const dateStr = getLocalDateString(selectedDate);
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

  const [editingTask, setEditingTask] = useState<string | null>(null);
  const [editText, setEditText] = useState("");
  const [showDiary, setShowDiary] = useState(false);

  const handleUpdateTask = async (task: Task) => {
    if (!editText) return;
    const updatedTask = { ...task, text: editText };
    setTasks(prev => prev.map(t => t.id === task.id ? updatedTask : t));
    setEditingTask(null);
    await saveTask(updatedTask);
  };

  const [showCalendar, setShowCalendar] = useState(false);

  return (
    <main className="h-screen bg-pastel-pink/10 flex flex-col lg:flex-row overflow-hidden">
      {/* Mobile Header (Hidden on LG) */}
      <header className="lg:hidden bg-white border-b-4 border-foreground p-4 flex justify-between items-center z-30 shrink-0">
        <Link href="/">
          <button className="p-2 rounded-xl border-2 border-foreground hover:bg-pastel-blue transition-all">
            <ArrowLeft size={24} />
          </button>
        </Link>
        <button 
          onClick={() => setShowCalendar(true)}
          className="flex items-center gap-2 font-chewy text-xl bg-pastel-blue/20 px-4 py-2 rounded-xl border-2 border-foreground shadow-[2px_2px_0px_0px_rgba(62,39,35,1)]"
        >
          <CalendarIcon size={20} />
          {selectedDate.toLocaleDateString('pt-BR', { day: 'numeric', month: 'short' })}
        </button>
        <div className="flex gap-2">
          <button onClick={() => setShowWardrobe(true)} className="p-2 rounded-xl border-2 border-foreground bg-white"><Sparkles className="text-pastel-orange" size={20} /></button>
          <button onClick={() => setShowDiary(true)} className="p-2 rounded-xl border-2 border-foreground bg-pastel-pink text-white"><Plus size={20} /></button>
        </div>
      </header>

      {/* Sidebar - Desktop Only (Mostly) */}
      <aside className="hidden lg:flex w-72 bg-white border-r-4 border-foreground p-6 flex flex-col gap-6 shrink-0 transition-all overflow-y-auto">
        <div className="flex justify-between items-center">
          <Link href="/">
            <button className="p-3 rounded-2xl border-2 border-foreground hover:bg-pastel-blue transition-all cursor-pointer">
              <ArrowLeft size={24} />
            </button>
          </Link>
          <button 
            onClick={() => setShowWardrobe(true)}
            className="p-3 rounded-2xl border-2 border-foreground bg-white hover:bg-pastel-yellow transition-all shadow-[2px_2px_0px_0px_rgba(62,39,35,1)]"
          >
            <Sparkles className="text-pastel-orange" />
          </button>
        </div>

        {/* Capy Pet (Desktop Sidebar) */}
        <div className="flex flex-col items-center bg-pastel-orange/30 p-4 rounded-3xl border-4 border-foreground shadow-[4px_4px_0px_0px_rgba(62,39,35,1)] relative">
          <div className="relative w-24 h-24">
            <Image src="/capy.png" alt="Capy Pet" fill className="object-contain" />
            {capy && capy.equippedItems.map(itemId => {
               const item = items.find(i => i.id === itemId);
               if (!item) return null;
               const styles = item.position === "top" ? { top: -5, right: -5 } : item.position === "eyes" ? { top: "30%", left: "50%", transform: "translateX(-50%)" } : { bottom: 5, right: -5 };
               return <div key={item.id} className="absolute text-3xl" style={styles}>{item.emoji}</div>;
            })}
          </div>
          <span className="font-chewy text-xl mt-2">Nível {currentLevel}</span>
        </div>

        <CalendarPicker selectedDate={selectedDate} onChange={setSelectedDate} />
      </aside>

      {/* Main Content - Missions */}
      <section className="flex-1 p-4 lg:p-8 flex flex-col gap-6 bg-white overflow-y-auto">
        <header className="hidden lg:flex justify-between items-center bg-white/80 backdrop-blur pb-6 border-b-4 border-pastel-pink/20">
          <div>
            <h1 className="font-chewy text-6xl text-foreground">Missões da Maria</h1>
            <p className="font-pacifico text-3xl text-pastel-pink mt-2">
              {selectedDate.toLocaleDateString('pt-BR', { day: 'numeric', month: 'long', year: 'numeric' })}
            </p>
          </div>
          
          <div className="flex gap-4">
            <div className="bg-white px-8 py-4 rounded-3xl border-4 border-foreground font-chewy text-3xl shadow-[4px_4px_0px_0px_rgba(62,39,35,1)] flex items-center gap-2">
              🍊 <span className="text-pastel-orange">{capy?.oranges || 0}</span>
            </div>
            <button
              onClick={() => setShowDiary(true)}
              className="bg-pastel-pink px-8 py-4 rounded-3xl border-4 border-foreground font-chewy text-3xl shadow-[4px_4px_0px_0px_rgba(62,39,35,1)] hover:translate-y-1 transition-all flex items-center gap-2"
            >
              📖 Abrir Diário
            </button>
          </div>
        </header>

        {/* Mobile Sub-Header */}
        <div className="lg:hidden mb-2">
           <h1 className="font-chewy text-4xl text-foreground">Missões da Maria</h1>
           <div className="flex items-center gap-2 mt-2">
              <div className="bg-white px-4 py-1 rounded-full border-2 border-foreground font-chewy text-lg shadow-[2px_2px_0px_0px_rgba(62,39,35,1)]">
                🍊 {capy?.oranges || 0}
              </div>
              <span className="font-pacifico text-pastel-pink text-lg">
                {selectedDate.toLocaleDateString('pt-BR', { day: 'numeric', month: 'long' })}
              </span>
           </div>
        </div>

        {/* Add Mission Form (Larger) */}
        <div className="flex gap-4 max-w-4xl">
          <input
            type="text"
            value={newTaskText}
            onChange={(e) => setNewTaskText(e.target.value)}
            placeholder="O que vamos fazer hoje, Maria?"
            className="flex-1 p-5 rounded-3xl border-4 border-foreground font-outfit text-xl outline-none shadow-[4px_4px_0px_0px_rgba(62,39,35,1)] focus:ring-4 ring-pastel-pink/20"
            onKeyDown={(e) => e.key === 'Enter' && handleAddTask()}
          />
          <button
            onClick={handleAddTask}
            className="px-8 bg-pastel-green rounded-3xl border-4 border-foreground font-chewy text-3xl shadow-[4px_4px_0px_0px_rgba(62,39,35,1)] hover:translate-y-1 active:translate-y-2 transition-all"
          >
            <Plus size={32} />
          </button>
        </div>

        {/* Mission Cards Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 pb-10">
          {tasks.map(task => (
            <motion.div
              layout
              key={task.id}
              className={`group relative p-6 rounded-[2.5rem] border-4 border-foreground flex items-center gap-6 transition-all ${
                task.completed ? "bg-pastel-green/20 opacity-80" : "bg-white"
              } shadow-[6px_6px_0px_0px_rgba(62,39,35,1)]`}
            >
              <button
                onClick={() => handleToggleTask(task)}
                className={`w-14 h-14 rounded-2xl border-4 border-foreground flex items-center justify-center shrink-0 transition-all ${
                  task.completed ? "bg-pastel-green" : "hover:bg-pastel-pink/10"
                }`}
              >
                {task.completed ? <CheckCircle2 size={32} /> : <Circle size={32} />}
              </button>

              <div className="flex-1">
                {editingTask === task.id ? (
                  <div className="flex gap-2">
                    <input
                      autoFocus
                      className="w-full bg-transparent font-outfit text-2xl outline-none border-b-2 border-foreground"
                      value={editText}
                      onChange={(e) => setEditText(e.target.value)}
                      onKeyDown={(e) => e.key === 'Enter' && handleUpdateTask(task)}
                    />
                    <button onClick={() => handleUpdateTask(task)} className="bg-pastel-green p-2 rounded-lg border-2 border-foreground">OK</button>
                  </div>
                ) : (
                  <p className={`font-outfit text-2xl ${task.completed ? "line-through text-foreground/40" : "text-foreground"}`}>
                    {task.text}
                  </p>
                )}
              </div>

              {task.completed && <span className="text-4xl animate-bounce">🍊</span>}

              <div className="absolute top-4 right-4 flex gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                <button
                  onClick={() => { setEditingTask(task.id); setEditText(task.text); }}
                  className="bg-white p-2 rounded-xl border-2 border-foreground hover:bg-pastel-blue transition-colors"
                >
                  <Sparkles size={20} />
                </button>
                <button
                  onClick={() => handleDeleteTask(task.id)}
                  className="bg-white p-2 rounded-xl border-2 border-foreground hover:bg-red-400 transition-colors"
                >
                  <Trash2 size={20} />
                </button>
              </div>
            </motion.div>
          ))}
        </div>
      </section>

      {/* Diary Modal (Collapsible) */}
      <AnimatePresence>
        {showDiary && (
          <motion.div
            initial={{ x: "100%" }}
            animate={{ x: 0 }}
            exit={{ x: "100%" }}
            transition={{ type: "spring", damping: 25 }}
            className="fixed top-0 right-0 w-full lg:w-[60%] h-full bg-white border-l-8 border-foreground z-40 shadow-[-20px_0px_60px_rgba(0,0,0,0.1)] flex flex-col p-8"
          >
            <div className="flex justify-between items-center mb-6">
              <h2 className="font-chewy text-4xl flex items-center gap-3">
                📖 Meu Diário Mágico
              </h2>
              <button 
                onClick={() => setShowDiary(false)}
                className="p-3 rounded-full bg-pastel-pink border-4 border-foreground shadow-[4px_4px_0px_0px_rgba(62,39,35,1)] hover:translate-y-1"
              >
                <X size={32} />
              </button>
            </div>
            <div className="flex-1 bg-pastel-pink/5 rounded-[3rem] border-4 border-foreground border-dashed overflow-hidden p-2">
              <DrawingBoard date={selectedDate} />
            </div>
            <p className="text-center font-pacifico text-xl text-foreground/40 mt-4">
              Cada traço é uma memória especial... ✨
            </p>
          </motion.div>
        )}
      </AnimatePresence>
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
        {showCalendar && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/50 z-[60] flex items-center justify-center p-6 backdrop-blur-sm lg:hidden"
          >
            <motion.div
              initial={{ scale: 0.8, y: 50 }}
              animate={{ scale: 1, y: 0 }}
              exit={{ scale: 0.8, y: 50 }}
              className="bg-white w-full max-w-sm p-6 rounded-3xl border-4 border-foreground shadow-[8px_8px_0px_0px_rgba(62,39,35,1)]"
            >
              <div className="flex justify-between items-center mb-6">
                <h2 className="font-chewy text-3xl flex items-center gap-2">
                  <CalendarIcon className="text-pastel-blue" /> Escolher Dia
                </h2>
                <button onClick={() => setShowCalendar(false)} className="p-2 rounded-full hover:bg-gray-100"><X size={24} /></button>
              </div>
              <CalendarPicker 
                selectedDate={selectedDate} 
                onChange={(d) => {
                  setSelectedDate(d);
                  setShowCalendar(false);
                }} 
              />
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </main>
  );
}
