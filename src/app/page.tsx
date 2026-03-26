"use client";

import { motion } from "framer-motion";
import Image from "next/image";
import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Lock, Users, ArrowRight } from "lucide-react";

export default function Home() {
  const router = useRouter();
  const [showPin, setShowPin] = useState(false);
  const [pin, setPin] = useState("");

  const handlePin = (digit: string) => {
    if (pin.length < 4) setPin(pin + digit);
  };

  const handleLogin = () => {
    if (pin === "1234") {
      router.push("/planner");
    } else {
      setPin("");
      alert("PIN incorreto! Dica: 1234");
    }
  };

  return (
    <main className="min-h-screen flex flex-col items-center justify-center p-6 bg-pastel-blue">
      {/* Capybara Mascot */}
      <motion.div
        initial={{ y: -50, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ type: "spring", damping: 10 }}
        className="relative w-48 h-48 mb-8"
      >
        <Image
          src="/capy.png"
          alt="Capy Mascot"
          fill
          className="object-contain drop-shadow-xl"
        />
        <motion.div
          animate={{ scale: [1, 1.1, 1] }}
          transition={{ repeat: Infinity, duration: 2 }}
          className="absolute -top-2 -right-2 bg-pastel-orange rounded-full p-2 border-2 border-foreground"
        >
          🍊
        </motion.div>
      </motion.div>

      <h1 className="font-chewy text-5xl text-foreground mb-4 text-center">
        CapyPlanner da Maria
      </h1>
      
      {!showPin ? (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 w-full max-w-2xl">
          {/* Private Area Button */}
          <motion.button
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            onClick={() => setShowPin(true)}
            className="flex flex-col items-center p-8 bg-pastel-pink rounded-3xl border-4 border-foreground shadow-[8px_8px_0px_0px_rgba(62,39,35,1)]"
          >
            <div className="bg-white p-4 rounded-2xl mb-4 border-2 border-foreground">
              <Lock size={40} />
            </div>
            <span className="font-chewy text-2xl">Meu Cantinho</span>
            <p className="font-outfit text-sm text-center mt-2">(Acesso com PIN)</p>
          </motion.button>

          {/* Shared Area Button */}
          <Link href="/mural" className="w-full h-full">
            <motion.button
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              className="w-full h-full flex flex-col items-center p-8 bg-pastel-yellow rounded-3xl border-4 border-foreground shadow-[8px_8px_0px_0px_rgba(62,39,35,1)]"
            >
              <div className="bg-white p-4 rounded-2xl mb-4 border-2 border-foreground">
                <Users size={40} />
              </div>
              <span className="font-chewy text-2xl">Mural Família</span>
              <p className="font-outfit text-sm text-center mt-2">(Recados & Carinho)</p>
            </motion.button>
          </Link>
        </div>
      ) : (
        <motion.div
          initial={{ scale: 0.9, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          className="bg-white p-8 rounded-3xl border-4 border-foreground shadow-[8px_8px_0px_0px_rgba(62,39,35,1)] w-full max-w-sm"
        >
          <div className="flex justify-between items-center mb-6">
            <h2 className="font-chewy text-2xl">Digite seu PIN</h2>
            <button
              onClick={() => { setShowPin(false); setPin(""); }}
              className="text-sm font-outfit underline"
            >
              Voltar
            </button>
          </div>
          
          <div className="flex justify-center gap-4 mb-8">
            {[0, 1, 2, 3].map((i) => (
              <div
                key={i}
                className={`w-4 h-4 rounded-full border-2 border-foreground ${
                  pin.length > i ? "bg-pastel-pink" : "bg-gray-100"
                }`}
              />
            ))}
          </div>

          <div className="grid grid-cols-3 gap-4">
            {["1", "2", "3", "4", "5", "6", "7", "8", "9", "C", "0", "OK"].map((btn) => (
              <button
                key={btn}
                onClick={() => {
                  if (btn === "C") setPin("");
                  else if (btn === "OK") handleLogin();
                  else handlePin(btn);
                }}
                className="w-full h-16 flex items-center justify-center bg-pastel-green rounded-xl border-2 border-foreground font-chewy text-2xl active:translate-y-1 shadow-[2px_2px_0px_0px_rgba(62,39,35,1)]"
              >
                {btn}
              </button>
            ))}
          </div>
        </motion.div>
      )}

      <footer className="mt-12 text-foreground/50 font-pacifico text-lg">
        Feito com 🧡 para a Maria
      </footer>
    </main>
  );
}
