"use client";

import { useState, useEffect } from "react";
import { invoke } from "@tauri-apps/api/core";
import { motion, AnimatePresence } from "framer-motion";

// --- Вспомогательные компоненты ---

function Symbol({ type, className }: { type: "X" | "O"; className?: string }) {
    if (type === "X") {
        return (
            <svg
                viewBox="0 0 24 24"
                className={`w-12 h-12 stroke-[3px] ${className}`}
                fill="none"
                stroke="currentColor"
            >
                <path
                    d="M18 6L6 18M6 6l12 12"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                />
            </svg>
        );
    }
    return (
        <svg
            viewBox="0 0 24 24"
            className={`w-11 h-11 stroke-[3px] ${className}`}
            fill="none"
            stroke="currentColor"
        >
            <motion.circle
                cx="12"
                cy="12"
                r="9"
                initial={{ pathLength: 0 }}
                animate={{ pathLength: 1 }}
                strokeLinecap="round"
            />
        </svg>
    );
}

function PlayerInfo({ label, type, active, color }: any) {
    return (
        <div
            className={`flex items-center gap-3 px-4 py-2 rounded-xl transition-all duration-500 ${
                active ? "bg-white/5 ring-1 ring-white/10" : "opacity-20"
            }`}
        >
            <Symbol type={type} className={`w-5 h-5 ${color}`} />
            <span className="text-xs font-bold tracking-widest">{label}</span>
        </div>
    );
}

// --- Основной компонент ---

interface GameState {
    board: string[];
    current_player: "X" | "O";
    game_over: boolean;
    winner: string | null;
}

export default function TicTacToe() {
    const [game, setGame] = useState<GameState | null>(null);

    const fetchState = async () => {
        try {
            const state = await invoke<GameState>("get_game_state");
            setGame(state);
        } catch (e) {
            console.error(e);
        }
    };

    useEffect(() => {
        fetchState();
    }, []);

    const handleMove = async (index: number) => {
        if (!game || game.game_over || game.board[index] !== " ") return;
        const newState = await invoke<GameState>("make_move", {
            position: index,
        });
        setGame(newState);
    };

    const restart = async () => {
        const newState = await invoke<GameState>("reset_game");
        setGame(newState);
    };

    if (!game) return <div className="min-h-screen bg-[#0b0e14]" />;

    return (
        <main className="min-h-screen bg-[#0b0e14] flex flex-col items-center justify-center p-4 text-slate-200">
            {/* Header & Status */}
            <div className="mb-10 text-center">
                <motion.h1 className="text-2xl font-black tracking-[0.3em] text-white/90 mb-8">
                    TIC TAC TOE
                </motion.h1>

                <div className="flex items-center justify-center gap-6 bg-slate-900/80 p-2 rounded-2xl border border-white/5 shadow-2xl">
                    <PlayerInfo
                        label="PLAYER X"
                        type="X"
                        active={game.current_player === "X" && !game.game_over}
                        color="text-cyan-400"
                    />
                    <div className="w-[1px] h-8 bg-white/10" />
                    <PlayerInfo
                        label="PLAYER O"
                        type="O"
                        active={game.current_player === "O" && !game.game_over}
                        color="text-fuchsia-500"
                    />
                </div>
            </div>

            {/* Game Board */}
            <div className="relative group">
                <div className="absolute -inset-1 bg-gradient-to-br from-cyan-500 to-fuchsia-600 rounded-[2rem] blur opacity-10 group-hover:opacity-25 transition duration-700"></div>
                <div className="relative bg-[#161b22] p-4 rounded-[1.8rem] border border-white/10 shadow-2xl grid grid-cols-3 grid-rows-3 gap-3">
                    {game.board.map((cell, i) => (
                        <button
                            key={i}
                            onClick={() => handleMove(i)}
                            disabled={game.game_over || cell !== " "}
                            className={`w-[100px] h-[100px] rounded-xl flex items-center justify-center transition-all duration-300 ${
                                cell === " " && !game.game_over
                                    ? "bg-slate-800/40 hover:bg-slate-700/60 cursor-pointer"
                                    : "bg-slate-800/20"
                            }`}
                        >
                            <AnimatePresence mode="wait">
                                {cell !== " " && (
                                    <motion.div
                                        initial={{ scale: 0, rotate: -45 }}
                                        animate={{ scale: 1, rotate: 0 }}
                                    >
                                        <Symbol
                                            type={cell as "X" | "O"}
                                            className={
                                                cell === "X"
                                                    ? "text-cyan-400"
                                                    : "text-fuchsia-500"
                                            }
                                        />
                                    </motion.div>
                                )}
                            </AnimatePresence>
                        </button>
                    ))}
                </div>
            </div>

            {/* Bottom Controls */}
            {/* Нижняя панель управления - теперь с фиксированной высотой */}
            <div className="mt-8 w-full max-w-[340px] h-32 flex items-center justify-center">
                <AnimatePresence mode="wait">
                    {game.game_over ? (
                        <motion.div
                            key="game-over"
                            initial={{ opacity: 0, scale: 0.9 }}
                            animate={{ opacity: 1, scale: 1 }}
                            exit={{ opacity: 0, scale: 0.9 }}
                            className="w-full bg-white/5 border border-white/10 rounded-2xl p-5 text-center shadow-xl backdrop-blur-sm"
                        >
                            <p className="text-lg font-bold tracking-widest uppercase mb-4 flex items-center justify-center gap-3">
                                {game.winner === "D" ? (
                                    "🤝 DRAW"
                                ) : (
                                    <>
                                        <Symbol
                                            type={game.winner as any}
                                            className={`w-6 h-6 ${
                                                game.winner === "X"
                                                    ? "text-cyan-400"
                                                    : "text-fuchsia-500"
                                            }`}
                                        />
                                        <span>WON!</span>
                                    </>
                                )}
                            </p>
                            <button
                                onClick={restart}
                                className="w-full bg-gradient-to-r from-cyan-500 to-cyan-600 text-white py-3 rounded-xl font-black text-sm tracking-tighter hover:brightness-110 active:scale-[0.98] transition-all shadow-lg shadow-cyan-500/20"
                            >
                                PLAY AGAIN
                            </button>
                        </motion.div>
                    ) : (
                        <motion.div
                            key="in-progress"
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            exit={{ opacity: 0 }}
                            className="flex flex-col items-center gap-4"
                        >
                            <div className="flex items-center gap-3 text-slate-500">
                                <span className="relative flex h-2 w-2">
                                    <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-cyan-400 opacity-75"></span>
                                    <span className="relative inline-flex rounded-full h-2 w-2 bg-cyan-500"></span>
                                </span>
                                <span className="text-[10px] font-black tracking-[0.3em] uppercase opacity-60">
                                    Match in progress
                                </span>
                            </div>

                            <button
                                onClick={restart}
                                className="group flex items-center gap-2 px-5 py-2 rounded-full border border-white/5 hover:bg-white/5 transition-all active:scale-95"
                            >
                                <svg
                                    viewBox="0 0 24 24"
                                    className="w-3.5 h-3.5 text-slate-500 group-hover:rotate-180 transition-transform duration-500"
                                    fill="none"
                                    stroke="currentColor"
                                    strokeWidth="3"
                                >
                                    <path
                                        d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15"
                                        strokeLinecap="round"
                                        strokeLinejoin="round"
                                    />
                                </svg>
                                <span className="text-[9px] font-black tracking-widest text-slate-500 uppercase">
                                    Reset
                                </span>
                            </button>
                        </motion.div>
                    )}
                </AnimatePresence>
            </div>
        </main>
    );
}
