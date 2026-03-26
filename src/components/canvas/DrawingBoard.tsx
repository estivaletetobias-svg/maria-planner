"use client";

import React, { useRef, useEffect, useState } from "react";
import { motion } from "framer-motion";
import { Eraser, Pencil, Sparkles, Highlighter, RotateCcw } from "lucide-react";

interface Point {
  x: number;
  y: number;
  pressure: number;
}

interface Stroke {
  points: Point[];
  color: string;
  width: number;
  type: "gel" | "glitter" | "highlighter" | "pencil";
}

export default function DrawingBoard() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [isDrawing, setIsDrawing] = useState(false);
  const [currentStroke, setCurrentStroke] = useState<Stroke | null>(null);
  const [strokes, setStrokes] = useState<Stroke[]>([]);
  const [penType, setPenType] = useState<"gel" | "glitter" | "highlighter" | "pencil">("gel");
  const [color, setColor] = useState("#3E2723");

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    // Resize canvas to parent
    const resize = () => {
      const parent = canvas.parentElement;
      if (parent) {
        canvas.width = parent.clientWidth;
        canvas.height = parent.clientHeight;
        redraw();
      }
    };
    resize();
    window.addEventListener("resize", resize);
    return () => window.removeEventListener("resize", resize);
  }, []);

  const redraw = () => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    ctx.clearRect(0, 0, canvas.width, canvas.height);
    strokes.forEach(drawStroke);
  };

  const drawStroke = (stroke: Stroke) => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    if (stroke.points.length < 2) return;

    ctx.beginPath();
    ctx.lineCap = "round";
    ctx.lineJoin = "round";
    ctx.strokeStyle = stroke.color;
    
    if (stroke.type === "highlighter") {
      ctx.globalAlpha = 0.4;
      ctx.lineWidth = stroke.width * 2;
    } else {
      ctx.globalAlpha = 1.0;
    }

    ctx.moveTo(stroke.points[0].x, stroke.points[0].y);

    for (let i = 1; i < stroke.points.length; i++) {
      const p = stroke.points[i];
      // Use pressure for variable width (Apple Pencil focus)
      ctx.lineWidth = stroke.width * (p.pressure || 1);
      
      if (stroke.type === "glitter") {
        // Simple glitter effect
        ctx.shadowBlur = 5;
        ctx.shadowColor = stroke.color;
      } else {
        ctx.shadowBlur = 0;
      }

      ctx.lineTo(p.x, p.y);
    }
    ctx.stroke();
  };

  const startDrawing = (e: React.PointerEvent) => {
    setIsDrawing(true);
    const rect = canvasRef.current?.getBoundingClientRect();
    if (!rect) return;
    
    const newStroke: Stroke = {
      points: [{ x: e.clientX - rect.left, y: e.clientY - rect.top, pressure: e.pressure }],
      color,
      width: penType === "pencil" ? 2 : 5,
      type: penType
    };
    setCurrentStroke(newStroke);
  };

  const draw = (e: React.PointerEvent) => {
    if (!isDrawing || !currentStroke) return;
    const rect = canvasRef.current?.getBoundingClientRect();
    if (!rect) return;

    const newPoint = { x: e.clientX - rect.left, y: e.clientY - rect.top, pressure: e.pressure };
    const updatedStroke = { ...currentStroke, points: [...currentStroke.points, newPoint] };
    
    setCurrentStroke(updatedStroke);
    
    // Draw only the last segment for performance
    const ctx = canvasRef.current?.getContext("2d");
    if (ctx) {
      ctx.beginPath();
      ctx.lineCap = "round";
      ctx.lineJoin = "round";
      ctx.strokeStyle = updatedStroke.color;
      ctx.lineWidth = updatedStroke.width * (newPoint.pressure || 1);
      
      if (updatedStroke.type === "highlighter") ctx.globalAlpha = 0.4;
      if (updatedStroke.type === "glitter") {
        ctx.shadowBlur = 5;
        ctx.shadowColor = updatedStroke.color;
      }
      
      const prevPoint = updatedStroke.points[updatedStroke.points.length - 2];
      ctx.moveTo(prevPoint.x, prevPoint.y);
      ctx.lineTo(newPoint.x, newPoint.y);
      ctx.stroke();
    }
  };

  const stopDrawing = () => {
    if (currentStroke) {
      setStrokes([...strokes, currentStroke]);
    }
    setIsDrawing(false);
    setCurrentStroke(null);
  };

  const clear = () => {
    setStrokes([]);
    const canvas = canvasRef.current;
    if (canvas) {
      const ctx = canvas.getContext("2d");
      ctx?.clearRect(0, 0, canvas.width, canvas.height);
    }
  };

  return (
    <div className="flex flex-col w-full h-full bg-white rounded-3xl border-4 border-foreground shadow-[8px_8px_0px_0px_rgba(62,39,35,1)] overflow-hidden">
      {/* Tools Toolbar */}
      <div className="p-4 bg-pastel-green border-b-4 border-foreground flex items-center justify-between">
        <div className="flex gap-2">
          {[
            { id: "gel", icon: Pencil, label: "Gel" },
            { id: "glitter", icon: Sparkles, label: "Glitter" },
            { id: "highlighter", icon: Highlighter, label: "Marca" },
            { id: "pencil", icon: Pencil, label: "Lápis" },
          ].map((tool) => (
            <button
              key={tool.id}
              onClick={() => setPenType(tool.id as any)}
              className={`p-2 rounded-xl border-2 border-foreground shadow-[2px_2px_0px_0px_rgba(62,39,35,1)] active:translate-y-0.5 transition-all ${
                penType === tool.id ? "bg-pastel-pink translate-y-0.5" : "bg-white"
              }`}
            >
              <tool.icon size={24} />
            </button>
          ))}
        </div>

        <div className="flex gap-2">
          {["#3E2723", "#E91E63", "#4CAF50", "#2196F3", "#FFEB3B", "#FF9800"].map((c) => (
            <button
              key={c}
              onClick={() => setColor(c)}
              className={`w-8 h-8 rounded-full border-2 border-foreground ${
                color === c ? "ring-4 ring-pastel-pink" : ""
              }`}
              style={{ backgroundColor: c }}
            />
          ))}
        </div>

        <button
          onClick={clear}
          className="p-2 rounded-xl border-2 border-foreground bg-white hover:bg-red-100 shadow-[2px_2px_0px_0px_rgba(62,39,35,1)] active:translate-y-0.5"
        >
          <RotateCcw size={24} />
        </button>
      </div>

      {/* Canvas Area */}
      <div className="flex-1 bg-[url('https://www.transparenttextures.com/patterns/paper.png')] bg-repeat relative touch-none">
        <canvas
          ref={canvasRef}
          onPointerDown={startDrawing}
          onPointerMove={draw}
          onPointerUp={stopDrawing}
          onPointerLeave={stopDrawing}
          className="w-full h-full cursor-crosshair"
        />
      </div>
    </div>
  );
}
