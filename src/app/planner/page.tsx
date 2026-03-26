"use client";

import { useState, useEffect, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import DrawingBoard from "@/components/canvas/DrawingBoard";
import CalendarPicker from "@/components/calendar/CalendarPicker";
import Image from "next/image";
import { CheckCircle2, Circle, ArrowLeft, Trophy, Trash2, Plus, Sparkles, X, Calendar as CalendarIcon, Clock, Bell, BellOff, RefreshCw } from "lucide-react";
import { subscribeToNotifications, checkNotificationPermission } from "@/lib/notifications";
import Link from "next/link";
import { getTasks, saveTask, deleteTask, getCapyState, updateCapyState, Task, CapyState } from "./actions";

const ALL_STICKERS = [
  { id: 'star', emoji: '⭐', name: 'Estrela Brilhante' },
  { id: 'heart', emoji: '❤️', name: 'Super Coração' },
  { id: 'rainbow', emoji: '🌈', name: 'Arco-Íris Mágico' },
  { id: 'butterfly', emoji: '🦋', name: 'Borboleta Azul' },
  { id: 'moon', emoji: '🌙', name: 'Lua de Cristal' },
  { id: 'sun', emoji: '☀️', name: 'Sol da Alegria' },
  { id: 'crown', emoji: '👑', name: 'Coroa Real' },
  { id: 'diamond', emoji: '💎', name: 'Diamante Raro' },
  { id: 'lollipop', emoji: '🍭', name: 'Pirulito Doce' },
  { id: 'cupcake', emoji: '🧁', name: 'Cupcake de Fada' },
  { id: 'cat', emoji: '🐱', name: 'Gatinho Fofo' },
  { id: 'dog', emoji: '🐶', name: 'Cachorrinho Amigo' },
  { id: 'flower', emoji: '🌸', name: 'Flor de Cerejeira' },
  { id: 'cloud', emoji: '☁️', name: 'Nuvem de Algodão' },
  { id: 'music', emoji: '🎵', name: 'Nota Musical' },
  { id: 'balloon', emoji: '🎈', name: 'Balão de Festa' },
];

export default function PlannerPage() {
  const [selectedDate, setSelectedDate] = useState<Date | null>(null);
  const [tasks, setTasks] = useState<Task[]>([]);
  const [capy, setCapy] = useState<CapyState | null>(null);
  const [loading, setLoading] = useState(true);
  const [showReward, setShowReward] = useState(false);
  const [showAlbum, setShowAlbum] = useState(false);
  const [unlockedSticker, setUnlockedSticker] = useState<typeof ALL_STICKERS[0] | null>(null);
  const [newTaskText, setNewTaskText] = useState("");
  const [newTaskTime, setNewTaskTime] = useState("");
  const [showWardrobe, setShowWardrobe] = useState(false);
  const [editingTask, setEditingTask] = useState<string | null>(null);
  const [editText, setEditText] = useState("");
  const [editTime, setEditTime] = useState("");
  const [showDiary, setShowDiary] = useState(false);
  const [showCalendar, setShowCalendar] = useState(false);
  const [notificationStatus, setNotificationStatus] = useState<string>("default");

  // Fix hydration by initializing date on the client
  useEffect(() => {
    setSelectedDate(new Date());
    checkNotificationPermission().then(setNotificationStatus);
  }, []);

  const handleToggleNotifications = async () => {
    if (notificationStatus === 'granted') return;
    try {
      await subscribeToNotifications();
      setNotificationStatus('granted');
      alert("Uhul! Notificações ativadas com sucesso! ✨");
    } catch (err) {
      console.error(err);
      alert("Ei, Maria! Verifique se seu celular permite as notificações ou se você 'Instalou' o app na tela inicial. 🦦");
    }
  };

  const getLocalDateString = (date: Date) => {
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
  };

  const fetchDayData = useCallback(async () => {
    if (!selectedDate) return;
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
  }, [selectedDate]);

  useEffect(() => {
    fetchDayData();
  }, [fetchDayData]);

  const handleToggleTask = async (task: Task) => {
    if (!selectedDate) return;
    const updatedTask = { ...task, completed: !task.completed };
    
    setTasks(prev => {
      const newTasks = prev.map(t => t.id === task.id ? updatedTask : t);
      const allDone = newTasks.length > 0 && newTasks.every(t => t.completed);
      
      if (allDone && capy) {
        const todayString = getLocalDateString(new Date());
        const selectedIsToday = getLocalDateString(selectedDate) === todayString;
        if (selectedIsToday && capy.lastActiveDate !== todayString) {
          handleDayCompletion(todayString);
        }
      }
      return newTasks;
    });

    if (!task.completed && capy) {
       setCapy(prev => prev ? ({ ...prev, oranges: prev.oranges + 1 }) : null);
       setShowReward(true);
       setTimeout(() => setShowReward(false), 2000);
       await updateCapyState({ oranges: capy.oranges + 1 });
    }

    await saveTask(updatedTask);
  };

  const handleDayCompletion = async (todayString: string) => {
    if (!capy) return;
    const available = ALL_STICKERS.filter(s => !capy.stickers.includes(s.id));
    const sticker = available.length > 0 ? available[Math.floor(Math.random() * available.length)] : null;
    let newStreak = capy.streak;
    const yesterdayString = getLocalDateString(new Date(Date.now() - 86400000));
    
    if (capy.lastActiveDate === yesterdayString) {
      newStreak += 1;
    } else {
      newStreak = 1;
    }

    const newStickers = sticker ? [...capy.stickers, sticker.id] : capy.stickers;
    setCapy(prev => prev ? ({ ...prev, streak: newStreak, lastActiveDate: todayString, stickers: newStickers }) : null);
    if (sticker) setUnlockedSticker(sticker);
    await updateCapyState({ streak: newStreak, lastActiveDate: todayString, stickers: newStickers });
  };

  const handleAddTask = async () => {
    if (!newTaskText || !selectedDate) return;
    const dateStr = getLocalDateString(selectedDate);
    const newTask: Task = {
      id: Math.random().toString(36).substring(7),
      text: newTaskText,
      time: newTaskTime || undefined,
      completed: false,
      type: "school",
      date: dateStr
    };
    
    setTasks(prev => [...prev, newTask]);
    setNewTaskText("");
    setNewTaskTime("");
    await saveTask(newTask);
  };

  const handleDeleteTask = async (id: string) => {
    if (!selectedDate) return;
    const dateStr = getLocalDateString(selectedDate);
    setTasks(prev => prev.filter(t => t.id !== id));
    await deleteTask(id, dateStr);
  };

  const handleUpdateTask = async (task: Task) => {
    if (!editText) return;
    const updatedTask = { ...task, text: editText, time: editTime || undefined };
    setTasks(prev => prev.map(t => t.id === task.id ? updatedTask : t));
    setEditingTask(null);
    setEditTime("");
    await saveTask(updatedTask);
  };

  if (!selectedDate) return (
    <div className="h-screen w-full flex items-center justify-center bg-white">
      <div className="w-16 h-16 border-8 border-pastel-orange border-t-transparent rounded-full animate-spin"></div>
    </div>
  );

  const currentLevel = capy ? Math.floor(capy.oranges / 3) + 1 : 1;

  const items = [
    { id: "hat", name: "Laço Rosa", emoji: "🎀", cost: 2, position: "top" },
    { id: "glasses", name: "Óculos Cool", emoji: "😎", cost: 5, position: "eyes" },
    { id: "crown", name: "Coroa Real", emoji: "👑", cost: 10, position: "top" },
    { id: "flower", name: "Florzinha", emoji: "🌸", cost: 1, position: "side" },
    { id: "star", name: "Estrela", emoji: "⭐", cost: 3, position: "side" },
  ];

  return (
    <main className="h-screen bg-pastel-pink/10 flex flex-col lg:flex-row overflow-hidden">
      {/* Mobile Header */}
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
          <button 
            onClick={handleToggleNotifications} 
            className={`p-2 rounded-xl border-2 border-foreground ${notificationStatus === 'granted' ? 'bg-pastel-green' : 'bg-white'}`}
          >
            {notificationStatus === 'granted' ? <Bell size={20} /> : <BellOff size={20} className="text-gray-400" />}
          </button>
          <button onClick={() => setShowAlbum(true)} className="p-2 rounded-xl border-2 border-foreground bg-white"><Trophy className="text-pastel-yellow" size={20} /></button>
          <button onClick={() => setShowWardrobe(true)} className="p-2 rounded-xl border-2 border-foreground bg-white"><Sparkles className="text-pastel-orange" size={20} /></button>
          <button onClick={() => setShowDiary(true)} className="p-2 rounded-xl border-2 border-foreground bg-pastel-pink text-white"><Plus size={20} /></button>
        </div>
      </header>

      {/* Sidebar - Desktop */}
      <aside className="hidden lg:flex w-72 bg-white border-r-4 border-foreground p-6 flex flex-col gap-6 shrink-0 transition-all overflow-y-auto">
        <div className="flex justify-between items-center">
          <Link href="/">
            <button className="p-3 rounded-2xl border-2 border-foreground hover:bg-pastel-blue transition-all cursor-pointer">
              <ArrowLeft size={24} />
            </button>
          </Link>
          <div className="flex gap-2">
            <button 
              onClick={fetchDayData}
              className="p-3 rounded-2xl border-2 border-foreground bg-white hover:bg-pastel-blue transition-all"
            ><RefreshCw size={24} /></button>
            <button 
              onClick={handleToggleNotifications}
              className={`p-3 rounded-2xl border-2 border-foreground hover:bg-opacity-80 transition-all shadow-[2px_2px_0px_0px_rgba(62,39,35,1)] ${notificationStatus === 'granted' ? 'bg-pastel-green' : 'bg-white'}`}
            >
              {notificationStatus === 'granted' ? <Bell size={24} /> : <BellOff size={24} className="text-gray-400" />}
            </button>
            <button 
              onClick={() => setShowAlbum(true)}
              className="p-3 rounded-2xl border-2 border-foreground bg-white hover:bg-pastel-yellow transition-all shadow-[2px_2px_0px_0px_rgba(62,39,35,1)]"
            >
              <Trophy className="text-pastel-yellow" />
            </button>
          </div>
        </div>

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
          {capy && capy.streak > 0 && (
            <div className="mt-1 flex items-center gap-1 bg-white/50 px-3 py-0.5 rounded-full border-2 border-foreground/20 text-sm font-bold">
               🔥 {capy.streak} dias!
            </div>
          )}
        </div>

        <CalendarPicker selectedDate={selectedDate} onChange={setSelectedDate} />
      </aside>

      {/* Main Content */}
      <section className="flex-1 p-4 lg:p-8 flex flex-col gap-6 bg-white overflow-y-auto">
        <header className="hidden lg:flex justify-between items-center bg-white/80 backdrop-blur pb-6 border-b-4 border-pastel-pink/20">
          <div>
            <h1 className="font-chewy text-6xl text-foreground text-left">Missões da Maria</h1>
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

        <div className="lg:hidden mb-2">
           <h1 className="font-chewy text-4xl text-foreground">Missões da Maria</h1>
           <div className="flex items-center gap-2 mt-2">
              <div className="bg-white px-4 py-1 rounded-full border-2 border-foreground font-chewy text-lg shadow-[2px_2px_0px_0px_rgba(62,39,35,1)]">
                🍊 {capy?.oranges || 0}
              </div>
              <span className="font-pacifico text-pastel-pink text-lg text-left">
                {selectedDate.toLocaleDateString('pt-BR', { day: 'numeric', month: 'long' })}
              </span>
           </div>
        </div>

        <div className="flex flex-col sm:flex-row gap-4 max-w-4xl">
          <input
            type="text"
            value={newTaskText}
            onChange={(e) => setNewTaskText(e.target.value)}
            placeholder="O que vamos fazer hoje?"
            className="flex-1 p-5 rounded-3xl border-4 border-foreground font-outfit text-xl outline-none shadow-[4px_4px_0px_0px_rgba(62,39,35,1)] focus:ring-4 ring-pastel-pink/20"
            onKeyDown={(e) => e.key === 'Enter' && handleAddTask()}
          />
          <input
            type="time"
            value={newTaskTime}
            onChange={(e) => setNewTaskTime(e.target.value)}
            className="w-full sm:w-40 p-5 rounded-3xl border-4 border-foreground font-chewy text-xl outline-none shadow-[4px_4px_0px_0px_rgba(62,39,35,1)] text-foreground bg-white"
          />
          <button
            onClick={handleAddTask}
            className="px-8 bg-pastel-green rounded-3xl border-4 border-foreground font-chewy text-3xl shadow-[4px_4px_0px_0px_rgba(62,39,35,1)] hover:translate-y-1 active:translate-y-2 transition-all p-4"
          >
            <Plus size={32} />
          </button>
        </div>

        <div className="flex-1 min-h-[300px] flex flex-col items-center justify-center p-10">
          {loading ? (
            <div className="flex flex-col items-center gap-4">
              <div className="w-16 h-16 border-8 border-pastel-orange border-t-transparent rounded-full animate-spin"></div>
              <p className="font-chewy text-2xl text-foreground text-center">Abrindo a mochila...</p>
            </div>
          ) : tasks.length === 0 ? (
            <div className="flex flex-col items-center gap-6 text-center max-w-sm">
              <div className="relative w-32 h-32 opacity-20 scale-75">
                <Image src="/capy.png" alt="Capy" fill className="object-contain grayscale" />
              </div>
              <div>
                <p className="font-chewy text-3xl text-foreground/40">Nenhuma missão por aqui!</p>
                <p className="font-outfit text-xl text-foreground/30 mt-2">Que tal planejar algo divertido para hoje? ✨</p>
              </div>
              <button 
                onClick={fetchDayData}
                className="font-chewy text-pastel-blue text-xl flex items-center gap-2"
              >
                <RefreshCw size={20} /> Tentar atualizar
              </button>
            </div>
          ) : (
            <div className="w-full grid grid-cols-1 md:grid-cols-2 gap-6">
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
                      <div className="flex flex-wrap gap-2">
                        <input
                          autoFocus
                          className="flex-1 min-w-[200px] bg-white text-foreground font-outfit text-2xl outline-none border-b-2 border-foreground"
                          value={editText}
                          onChange={(e) => setEditText(e.target.value)}
                          onKeyDown={(e) => e.key === 'Enter' && handleUpdateTask(task)}
                        />
                        <input
                          type="time"
                          className="w-32 bg-white text-foreground font-chewy text-xl outline-none border-b-2 border-foreground"
                          value={editTime}
                          onChange={(e) => setEditTime(e.target.value)}
                        />
                        <button onClick={() => handleUpdateTask(task)} className="bg-pastel-green px-4 py-2 rounded-xl border-2 border-foreground shadow-[2px_2px_0] active:translate-y-0.5">OK</button>
                      </div>
                    ) : (
                      <div className="flex flex-col">
                        <p className={`font-outfit text-2xl ${task.completed ? "line-through text-foreground/40 text-left" : "text-foreground text-left"}`}>
                          {task.text}
                        </p>
                        {task.time && (
                          <div className="flex items-center gap-1 text-pastel-pink font-chewy text-lg mt-1">
                            <Clock size={16} />
                            {task.time}
                          </div>
                        )}
                      </div>
                    )}
                  </div>

                  {task.completed && <span className="text-4xl animate-bounce">🍊</span>}

                  <div className="absolute top-4 right-4 flex gap-2">
                    <button
                      onClick={() => { setEditingTask(task.id); setEditText(task.text); setEditTime(task.time || ""); }}
                      className="bg-white p-2 rounded-xl border-2 border-foreground hover:bg-pastel-blue transition-colors text-foreground"
                    >
                      <Sparkles size={20} />
                    </button>
                    <button
                      onClick={() => handleDeleteTask(task.id)}
                      className="bg-white p-2 rounded-xl border-2 border-foreground hover:bg-red-400 transition-colors text-foreground"
                    >
                      <Trash2 size={20} />
                    </button>
                  </div>
                </motion.div>
              ))}
            </div>
          )}
        </div>
      </section>

      <AnimatePresence>
        {showDiary && (
          <motion.div
            initial={{ x: "100%" }}
            animate={{ x: 0 }}
            exit={{ x: "100%" }}
            className="fixed top-0 right-0 w-full lg:w-[60%] h-full bg-white border-l-8 border-foreground z-40 shadow-[-20px_0px_60px_rgba(0,0,0,0.1)] flex flex-col p-8"
          >
            <div className="flex justify-between items-center mb-6">
              <h2 className="font-chewy text-3xl sm:text-4xl">📖 Meu Diário</h2>
              <button onClick={() => setShowDiary(false)} className="p-3 bg-pastel-pink border-4 border-foreground rounded-full shadow-[4px_4px_0px_0px_rgba(62,39,35,1)]"><X size={32} /></button>
            </div>
            <div className="flex-1 bg-pastel-pink/5 rounded-[3rem] border-4 border-foreground border-dashed overflow-hidden p-2">
              <DrawingBoard date={selectedDate} />
            </div>
          </motion.div>
        )}

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
              className="bg-white w-full max-w-md p-8 rounded-3xl border-4 border-foreground"
            >
              <div className="flex justify-between items-center mb-6">
                <h2 className="font-chewy text-3xl flex items-center gap-2">👕 Guarda-Roupa</h2>
                <button onClick={() => setShowWardrobe(false)}><X size={28} /></button>
              </div>
              <div className="grid grid-cols-2 gap-4 max-h-96 overflow-y-auto">
                {items.map((item) => {
                  const isOwned = capy?.ownedItems.includes(item.id);
                  const isEquipped = capy?.equippedItems.includes(item.id);
                  return (
                    <div key={item.id} className="p-4 rounded-2xl border-2 border-foreground flex flex-col items-center gap-2">
                      <span className="text-5xl">{item.emoji}</span>
                      <span className="font-chewy">{item.name}</span>
                      {isOwned ? (
                        <button
                          onClick={() => handleEquipItem(item.id)}
                          className={`w-full py-2 rounded-xl border-2 border-foreground font-chewy ${isEquipped ? "bg-white" : "bg-pastel-pink"}`}
                        >
                          {isEquipped ? "Tirar" : "Usar"}
                        </button>
                      ) : (
                        <button
                          onClick={() => handleBuyItem(item.id, item.cost)}
                          disabled={capy ? capy.oranges < item.cost : true}
                          className="w-full py-2 rounded-xl border-2 border-foreground bg-pastel-green font-chewy disabled:opacity-50"
                        >
                          {item.cost} 🍊
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
            className="fixed inset-0 bg-black/50 z-[60] flex items-center justify-center p-6 backdrop-blur-sm"
          >
            <motion.div
              initial={{ scale: 0.8 }}
              animate={{ scale: 1 }}
              className="bg-white w-full max-w-sm p-6 rounded-3xl border-4 border-foreground"
            >
              <div className="flex justify-between items-center mb-6">
                <h2 className="font-chewy text-3xl">Escolher Dia</h2>
                <button onClick={() => setShowCalendar(false)}><X size={24} /></button>
              </div>
              <CalendarPicker 
                selectedDate={selectedDate} 
                onChange={(d) => { setSelectedDate(d); setShowCalendar(false); }} 
              />
            </motion.div>
          </motion.div>
        )}

        {unlockedSticker && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/70 z-[100] flex items-center justify-center p-6 backdrop-blur-md"
          >
            <motion.div
              initial={{ scale: 0.5, rotate: -10 }}
              animate={{ scale: 1, rotate: 0 }}
              className="bg-white p-12 rounded-[4rem] border-8 border-foreground text-center flex flex-col items-center gap-6"
            >
              <h2 className="font-chewy text-5xl">Adesivo Novo! 🎊</h2>
              <div className="text-[120px] animate-bounce">{unlockedSticker.emoji}</div>
              <p className="font-chewy text-3xl text-pastel-pink">{unlockedSticker.name}</p>
              <button
                onClick={() => setUnlockedSticker(null)}
                className="mt-4 bg-pastel-green px-12 py-4 rounded-3xl border-4 border-foreground font-chewy text-4xl shadow-[8px_8px_0px_0px_rgba(62,39,35,1)]"
              >
                UAU! ✨
              </button>
            </motion.div>
          </motion.div>
        )}

        {showAlbum && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/50 z-[80] flex items-center justify-center p-4 backdrop-blur-sm"
          >
            <motion.div
              initial={{ scale: 0.8, y: 50 }}
              animate={{ scale: 1, y: 0 }}
              className="bg-white w-full max-w-2xl p-10 rounded-[3rem] border-4 border-foreground shadow-[8px_8px_0px_0px_rgba(62,39,35,1)] flex flex-col max-h-[90vh]"
            >
              <div className="flex justify-between items-center mb-8">
                <h2 className="font-chewy text-5xl flex items-center gap-3"><Trophy className="text-pastel-yellow" size={40} /> Álbum</h2>
                <button onClick={() => setShowAlbum(false)}><X size={32} /></button>
              </div>
              <div className="grid grid-cols-4 sm:grid-cols-5 gap-4 overflow-y-auto p-2 scrollbar-hide">
                {ALL_STICKERS.map((sticker) => {
                  const unlocked = capy?.stickers.includes(sticker.id);
                  return (
                    <div key={sticker.id} className={`aspect-square rounded-2xl border-4 border-foreground flex items-center justify-center text-5xl transition-all ${unlocked ? "bg-white rotate-3" : "bg-gray-100 opacity-20 grayscale"}`}>
                      {unlocked ? sticker.emoji : "?"}
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
