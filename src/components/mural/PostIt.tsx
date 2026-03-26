"use client";

import { motion } from "framer-motion";
import { Pin, Trash2 } from "lucide-react";

interface PostItProps {
  id: string;
  content: string;
  color: string;
  author: string;
  x: number;
  y: number;
  rotation: number;
  onDelete: (id: string) => void;
}

export default function PostIt({ id, content, color, author, x, y, rotation, onDelete }: PostItProps) {
  return (
    <motion.div
      drag
      dragMomentum={false}
      initial={{ x, y, rotate: rotation, scale: 0.8, opacity: 0 }}
      animate={{ x, y, rotate: rotation, scale: 1, opacity: 1 }}
      className={`absolute w-64 h-64 p-6 flex flex-col items-center justify-center border-2 border-foreground shadow-[4px_4px_0px_0px_rgba(62,39,35,1)] cursor-grab active:cursor-grabbing`}
      style={{ backgroundColor: color }}
    >
      <div className="absolute top-2 left-1/2 -translate-x-1/2 text-foreground/30">
        <Pin size={24} fill="currentColor" />
      </div>

      <button
        onClick={() => onDelete(id)}
        className="absolute top-2 right-2 text-foreground/20 hover:text-red-400 transition-colors cursor-pointer"
      >
        <Trash2 size={20} />
      </button>
      
      <p className="font-pacifico text-2xl text-center leading-relaxed text-foreground">
        {content}
      </p>
      
      <span className="absolute bottom-4 right-4 font-chewy text-sm text-foreground/60 italic">
        - {author}
      </span>
    </motion.div>
  );
}
