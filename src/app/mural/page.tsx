"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import PostIt from "@/components/mural/PostIt";
import { Plus, X, ArrowLeft } from "lucide-react";
import Link from "next/link";

interface Note {
  id: string;
  content: string;
  color: string;
  author: string;
  x: number;
  y: number;
  rotation: number;
}

export default function MuralPage() {
  const [notes, setNotes] = useState<Note[]>([
    {
      id: "1",
      content: "Maria, que você tenha um dia incrível!",
      color: "var(--pastel-pink)",
      author: "Mãe",
      x: 100,
      y: 150,
      rotation: -5,
    },
    {
      id: "2",
      content: "Arrasa na escola hoje, filha!",
      color: "var(--pastel-yellow)",
      author: "Pai",
      x: 400,
      y: 200,
      rotation: 8,
    },
    {
      id: "3",
      content: "Capy diz: Lembre-se de beber água!",
      color: "var(--pastel-green)",
      author: "Capy",
      x: 250,
      y: 400,
      rotation: 2,
    },
  ]);

  const [showAdd, setShowAdd] = useState(false);
  const [newContent, setNewContent] = useState("");
  const [newAuthor, setNewAuthor] = useState("Pai");

  const addNote = () => {
    if (!newContent) return;
    const colors = ["var(--pastel-blue)", "var(--pastel-pink)", "var(--pastel-yellow)", "var(--pastel-green)", "var(--pastel-orange)"];
    const newNote: Note = {
      id: Math.random().toString(),
      content: newContent,
      author: newAuthor,
      color: colors[Math.floor(Math.random() * colors.length)],
      x: Math.random() * 500 + 50,
      y: Math.random() * 300 + 100,
      rotation: Math.random() * 20 - 10,
    };
    setNotes([...notes, newNote]);
    setNewContent("");
    setShowAdd(false);
  };

  return (
    <main className="min-h-screen bg-pastel-orange/20 relative overflow-hidden flex flex-col">
      {/* Background Pattern */}
      <div className="absolute inset-0 opacity-10 pointer-events-none bg-[radial-gradient(#3E2723_1px,transparent_1px)] [background-size:40px_40px]" />

      {/* Header */}
      <header className="p-6 flex items-center justify-between z-10">
        <div className="flex items-center gap-4">
          <Link href="/">
            <button className="bg-white p-2 rounded-xl border-2 border-foreground hover:bg-pastel-pink transition-colors cursor-pointer">
              <ArrowLeft size={24} />
            </button>
          </Link>
          <h1 className="font-chewy text-4xl text-foreground">Mural da Família</h1>
        </div>
        
        <button
          onClick={() => setShowAdd(true)}
          className="flex items-center gap-2 bg-white px-6 py-3 rounded-2xl border-4 border-foreground font-chewy text-2xl shadow-[4px_4px_0px_0px_rgba(62,39,35,1)] hover:translate-y-1 transition-all"
        >
          <Plus size={24} /> Novo Recado
        </button>
      </header>

      {/* Mural Area */}
      <div className="flex-1 relative cursor-default">
        {notes.map((note) => (
          <PostIt key={note.id} {...note} />
        ))}
      </div>

      {/* Add Note Modal */}
      <AnimatePresence>
        {showAdd && (
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
                <h2 className="font-chewy text-3xl">Escrever Recado</h2>
                <button onClick={() => setShowAdd(false)}><X size={28} /></button>
              </div>

              <div className="space-y-6">
                <div>
                  <label className="block font-chewy text-xl mb-2">Quem escreve?</label>
                  <select 
                    value={newAuthor}
                    onChange={(e) => setNewAuthor(e.target.value)}
                    className="w-full p-4 rounded-xl border-2 border-foreground font-outfit text-lg outline-none bg-pastel-green"
                  >
                    <option>Pai</option>
                    <option>Mãe</option>
                    <option>Maria</option>
                  </select>
                </div>

                <div>
                  <label className="block font-chewy text-xl mb-2">Sua mensagem:</label>
                  <textarea
                    value={newContent}
                    onChange={(e) => setNewContent(e.target.value)}
                    className="w-full h-40 p-4 rounded-xl border-2 border-foreground font-pacifico text-2xl outline-none placeholder:font-outfit"
                    placeholder="Escreva algo especial..."
                  />
                </div>

                <button
                  onClick={addNote}
                  className="w-full py-4 bg-pastel-pink rounded-xl border-4 border-foreground font-chewy text-2xl shadow-[4px_4px_0px_0px_rgba(62,39,35,1)] hover:translate-y-1 transition-all"
                >
                  Colocar no Mural 🍊
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      <footer className="p-6 text-center font-outfit text-foreground/50 text-sm">
        Dica: Você pode arrastar os recados para organizá-los!
      </footer>
    </main>
  );
}
