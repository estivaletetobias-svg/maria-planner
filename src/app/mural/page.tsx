"use client";

import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import PostIt from "@/components/mural/PostIt";
import { Mic, Square, Volume2, Plus, X, ArrowLeft, Loader2 } from "lucide-react";
import Link from "next/link";
import { getNotes, addNote as saveNote, deleteNote as removeNote, Note } from "./actions";

export default function MuralPage() {
  const [notes, setNotes] = useState<Note[]>([]);
  const [loading, setLoading] = useState(true);
  const [showAdd, setShowAdd] = useState(false);
  const [newContent, setNewContent] = useState("");
  const [newAuthor, setNewAuthor] = useState("Pai");
  const [newColor, setNewColor] = useState("var(--pastel-pink)");
  
  // Audio state
  const [isRecording, setIsRecording] = useState(false);
  const [mediaRecorder, setMediaRecorder] = useState<MediaRecorder | null>(null);
  const [audioBase64, setAudioBase64] = useState<string | null>(null);

  useEffect(() => {
    fetchNotes();
  }, []);

  const startRecording = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      
      // Detecção de tipo suportado (iOS vs Android/Desktop)
      const mimeType = MediaRecorder.isTypeSupported("audio/webm") 
        ? "audio/webm" 
        : "audio/mp4";
      
      const recorder = new MediaRecorder(stream, { mimeType });
      const chunks: Blob[] = [];

      recorder.ondataavailable = (e) => chunks.push(e.data);
      recorder.onstop = async () => {
        const blob = new Blob(chunks, { type: mimeType });
        
        // Verificar tamanho (Limite do Redis é 1MB, vamos usar 500KB para segurança)
        if (blob.size > 500000) {
          alert("Opa! O áudio ficou muito comprido. Tente gravar um recado mais curtinho! 🍊");
          stream.getTracks().forEach(track => track.stop());
          return;
        }

        const reader = new FileReader();
        reader.readAsDataURL(blob);
        reader.onloadend = () => {
          setAudioBase64(reader.result as string);
        };
        stream.getTracks().forEach(track => track.stop());
      };

      recorder.start();
      setMediaRecorder(recorder);
      setIsRecording(true);
    } catch (err) {
      console.error("Erro ao acessar microfone:", err);
      alert("Não consegui acessar o microfone. Verifique as permissões! 🎙️");
    }
  };

  const stopRecording = () => {
    if (mediaRecorder) {
      mediaRecorder.stop();
      setIsRecording(false);
    }
  };

  const fetchNotes = async () => {
    try {
      const data = await getNotes();
      setNotes(data);
    } catch (error) {
      console.error("Erro ao carregar notas:", error);
    } finally {
      setLoading(false);
    }
  };

  const colors = [
    { name: "Pink", value: "var(--pastel-pink)" },
    { name: "Yellow", value: "var(--pastel-yellow)" },
    { name: "Green", value: "var(--pastel-green)" },
    { name: "Blue", value: "var(--pastel-blue)" },
    { name: "Orange", value: "var(--pastel-orange)" },
  ];

  const handleAddNote = async () => {
    if (!newContent && !audioBase64) return;
    const newNote: Note = {
      id: Math.random().toString(36).substring(7),
      content: newContent,
      author: newAuthor,
      color: newColor,
      audio: audioBase64 || undefined,
      x: Math.random() * 500 + 50,
      y: Math.random() * 300 + 100,
      rotation: Math.random() * 20 - 10,
    };
    
    try {
      await saveNote(newNote);
      // Wait for re-fetch to see it truly saved
      await fetchNotes();
      setNewContent("");
      setAudioBase64(null);
      setShowAdd(false);
    } catch (error) {
      console.error("Erro ao salvar:", error);
      alert("Puxa vida! O recado não foi para o mural. Verifique se as permissões de internet estão ok! 📝");
      fetchNotes(); // Rollback
    }
  };

  const handleDeleteNote = async (id: string) => {
    // Optimistic update
    setNotes(notes.filter(n => n.id !== id));
    try {
      await removeNote(id);
    } catch (error) {
      console.error("Erro ao deletar:", error);
      fetchNotes(); // Rollback
    }
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

      <div className="flex-1 relative cursor-default">
        {loading ? (
          <div className="absolute inset-0 flex items-center justify-center">
            <Loader2 size={48} className="animate-spin text-pastel-pink" />
          </div>
        ) : (
          notes.map((note) => (
            <PostIt key={note.id} {...note} onDelete={handleDeleteNote} />
          ))
        )}
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

                <div>
                  <label className="block font-chewy text-xl mb-2">Cor do papel:</label>
                  <div className="flex gap-3">
                    {colors.map((c) => (
                      <button
                        key={c.name}
                        onClick={() => setNewColor(c.value)}
                        className={`w-10 h-10 rounded-full border-2 border-foreground transition-all ${
                          newColor === c.value ? "ring-4 ring-black scale-110" : ""
                        }`}
                        style={{ backgroundColor: c.value }}
                      />
                    ))}
                  </div>
                </div>

                <div>
                  <label className="block font-chewy text-xl mb-2">Adicionar Voz:</label>
                  <div className="flex items-center gap-4">
                    <button
                      onClick={isRecording ? stopRecording : startRecording}
                      className={`p-4 rounded-full border-4 border-foreground transition-all shadow-[4px_4px_0px_0px_rgba(62,39,35,1)] ${
                        isRecording ? "bg-red-500 animate-pulse text-white" : "bg-white hover:bg-red-100"
                      }`}
                    >
                      {isRecording ? <Square size={32} /> : <Mic size={32} />}
                    </button>
                    {audioBase64 && !isRecording && (
                      <div className="flex items-center gap-2 bg-pastel-green px-4 py-2 rounded-xl border-2 border-foreground animate-bounce">
                        <Volume2 size={24} />
                        <span className="font-chewy">Voz Gravada!</span>
                        <button onClick={() => setAudioBase64(null)} className="ml-2 text-red-500"><X size={16} /></button>
                      </div>
                    )}
                    {isRecording && <span className="font-chewy text-red-500 animate-pulse">Gravando...</span>}
                  </div>
                </div>

                <button
                  onClick={handleAddNote}
                  className="w-full py-4 rounded-xl border-4 border-foreground font-chewy text-2xl shadow-[4px_4px_0px_0px_rgba(62,39,35,1)] hover:translate-y-1 transition-all"
                  style={{ backgroundColor: newColor }}
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
