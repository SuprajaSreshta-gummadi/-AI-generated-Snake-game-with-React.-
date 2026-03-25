import React, { useState, useEffect, useCallback, useRef } from 'react';

const TRACKS = [
  { id: 1, title: "SYS.AUDIO.01", url: "https://www.soundhelix.com/examples/mp3/SoundHelix-Song-1.mp3" },
  { id: 2, title: "SYS.AUDIO.02", url: "https://www.soundhelix.com/examples/mp3/SoundHelix-Song-2.mp3" },
  { id: 3, title: "SYS.AUDIO.03", url: "https://www.soundhelix.com/examples/mp3/SoundHelix-Song-3.mp3" },
];

const GRID_SIZE = 20;
const CELL_SIZE = 20; // px

type Point = { x: number; y: number };

export default function App() {
  // --- Music Player State ---
  const [currentTrackIndex, setCurrentTrackIndex] = useState(0);
  const [isPlayingMusic, setIsPlayingMusic] = useState(false);
  const [volume, setVolume] = useState(0.5);
  const [isMuted, setIsMuted] = useState(false);
  const audioRef = useRef<HTMLAudioElement>(null);

  // --- Snake Game State ---
  const [snake, setSnake] = useState<Point[]>([{ x: 10, y: 10 }]);
  const [direction, setDirection] = useState<Point>({ x: 0, y: -1 });
  const directionQueue = useRef<Point[]>([]);
  const [food, setFood] = useState<Point>({ x: 15, y: 5 });
  const [score, setScore] = useState(0);
  const [gameOver, setGameOver] = useState(false);
  const [isGameRunning, setIsGameRunning] = useState(false);

  // --- Music Player Logic ---
  useEffect(() => {
    if (audioRef.current) {
      audioRef.current.volume = isMuted ? 0 : volume;
    }
  }, [volume, isMuted]);

  const togglePlayMusic = () => {
    if (audioRef.current) {
      if (isPlayingMusic) {
        audioRef.current.pause();
      } else {
        audioRef.current.play();
      }
      setIsPlayingMusic(!isPlayingMusic);
    }
  };

  const playNextTrack = () => {
    setCurrentTrackIndex((prev) => (prev + 1) % TRACKS.length);
    setIsPlayingMusic(true);
  };

  const playPrevTrack = () => {
    setCurrentTrackIndex((prev) => (prev - 1 + TRACKS.length) % TRACKS.length);
    setIsPlayingMusic(true);
  };

  useEffect(() => {
    if (isPlayingMusic && audioRef.current) {
      audioRef.current.play().catch(e => console.error("Audio play failed", e));
    }
  }, [currentTrackIndex, isPlayingMusic]);

  // --- Snake Game Logic ---
  const generateFood = useCallback((currentSnake: Point[]) => {
    let newFood: Point;
    while (true) {
      newFood = {
        x: Math.floor(Math.random() * GRID_SIZE),
        y: Math.floor(Math.random() * GRID_SIZE),
      };
      if (!currentSnake.some((segment) => segment.x === newFood.x && segment.y === newFood.y)) {
        break;
      }
    }
    setFood(newFood);
  }, []);

  const moveSnake = useCallback(() => {
    if (!isGameRunning || gameOver) return;

    setSnake((prevSnake) => {
      let nextDir = direction;
      if (directionQueue.current.length > 0) {
        nextDir = directionQueue.current.shift()!;
        setDirection(nextDir);
      }

      const head = prevSnake[0];
      const newHead = { x: head.x + nextDir.x, y: head.y + nextDir.y };

      // Check collision with walls
      if (
        newHead.x < 0 ||
        newHead.x >= GRID_SIZE ||
        newHead.y < 0 ||
        newHead.y >= GRID_SIZE
      ) {
        setGameOver(true);
        setIsGameRunning(false);
        return prevSnake;
      }

      // Check collision with self
      if (prevSnake.some((segment) => segment.x === newHead.x && segment.y === newHead.y)) {
        setGameOver(true);
        setIsGameRunning(false);
        return prevSnake;
      }

      const newSnake = [newHead, ...prevSnake];

      // Check food collision
      if (newHead.x === food.x && newHead.y === food.y) {
        setScore((s) => s + 10);
        generateFood(newSnake);
      } else {
        newSnake.pop();
      }

      return newSnake;
    });
  }, [direction, food, isGameRunning, gameOver, generateFood]);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (["ArrowUp", "ArrowDown", "ArrowLeft", "ArrowRight", " "].includes(e.key)) {
        e.preventDefault();
      }

      if (e.key === ' ' && gameOver) {
        resetGame();
        return;
      }
      if (e.key === ' ' && !gameOver) {
        setIsGameRunning((prev) => !prev);
        return;
      }

      if (!isGameRunning) return;

      const lastQueueDir = directionQueue.current.length > 0 
        ? directionQueue.current[directionQueue.current.length - 1] 
        : direction;

      switch (e.key) {
        case 'ArrowUp':
        case 'w':
          if (lastQueueDir.y !== 1) directionQueue.current.push({ x: 0, y: -1 });
          break;
        case 'ArrowDown':
        case 's':
          if (lastQueueDir.y !== -1) directionQueue.current.push({ x: 0, y: 1 });
          break;
        case 'ArrowLeft':
        case 'a':
          if (lastQueueDir.x !== 1) directionQueue.current.push({ x: -1, y: 0 });
          break;
        case 'ArrowRight':
        case 'd':
          if (lastQueueDir.x !== -1) directionQueue.current.push({ x: 1, y: 0 });
          break;
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [direction, isGameRunning, gameOver]);

  useEffect(() => {
    const interval = setInterval(moveSnake, 120);
    return () => clearInterval(interval);
  }, [moveSnake]);

  const resetGame = () => {
    setSnake([{ x: 10, y: 10 }]);
    setDirection({ x: 0, y: -1 });
    directionQueue.current = [];
    setScore(0);
    setGameOver(false);
    setIsGameRunning(true);
    generateFood([{ x: 10, y: 10 }]);
  };

  return (
    <div className="min-h-screen bg-black text-[#00ffff] flex flex-col items-center justify-center font-digital relative animate-tear selection:bg-[#ff00ff]/50">
      {/* Overlays */}
      <div className="fixed inset-0 scanlines pointer-events-none z-50 mix-blend-overlay"></div>
      <div className="fixed inset-0 static-noise pointer-events-none z-40"></div>

      {/* Header */}
      <div className="mb-6 text-center z-10">
        <h1 className="text-7xl font-bold tracking-widest text-[#ff00ff] glitch uppercase" data-text="SYS.SNAKE_PROTOCOL">
          SYS.SNAKE_PROTOCOL
        </h1>
        <p 
          className="text-[#00ffff] mt-2 tracking-widest text-4xl uppercase glitch"
          data-text={`REGISTER.SCORE: ${score}`}
        >
          REGISTER.SCORE: {score}
        </p>
      </div>

      {/* Game Board */}
      <div 
        className="relative bg-black border-4 border-[#00ffff] z-10"
        style={{ width: GRID_SIZE * CELL_SIZE, height: GRID_SIZE * CELL_SIZE }}
      >
        {/* Grid lines */}
        <div 
          className="absolute inset-0 opacity-30 pointer-events-none"
          style={{
            backgroundImage: `linear-gradient(to right, #00ffff 1px, transparent 1px), linear-gradient(to bottom, #00ffff 1px, transparent 1px)`,
            backgroundSize: `${CELL_SIZE}px ${CELL_SIZE}px`
          }}
        />

        {/* Snake */}
        {snake.map((segment, index) => (
          <div
            key={index}
            className={`absolute ${index === 0 ? 'bg-[#ff00ff] z-10' : 'bg-[#00ffff]'}`}
            style={{
              left: segment.x * CELL_SIZE,
              top: segment.y * CELL_SIZE,
              width: CELL_SIZE,
              height: CELL_SIZE,
            }}
          />
        ))}

        {/* Food */}
        <div
          className="absolute bg-[#ff00ff] animate-pulse"
          style={{
            left: food.x * CELL_SIZE,
            top: food.y * CELL_SIZE,
            width: CELL_SIZE,
            height: CELL_SIZE,
          }}
        />

        {/* Overlays */}
        {(!isGameRunning && !gameOver && snake.length === 1) && (
          <div className="absolute inset-0 bg-black/80 flex items-center justify-center z-20 border-2 border-[#ff00ff] m-2">
            <p className="text-[#00ffff] animate-pulse tracking-widest text-3xl glitch" data-text="AWAITING_INPUT: [SPACE]">AWAITING_INPUT: [SPACE]</p>
          </div>
        )}
        
        {(!isGameRunning && !gameOver && snake.length > 1) && (
          <div className="absolute inset-0 bg-black/80 flex items-center justify-center z-20 border-2 border-[#00ffff] m-2">
            <p className="text-[#ff00ff] animate-pulse tracking-widest text-3xl glitch" data-text="EXECUTION_PAUSED">EXECUTION_PAUSED</p>
          </div>
        )}

        {gameOver && (
          <div className="absolute inset-0 bg-black/90 flex flex-col items-center justify-center z-20 border-4 border-[#ff00ff]">
            <h2 className="text-6xl font-bold text-[#ff00ff] mb-2 glitch" data-text="CRITICAL_FAILURE">CRITICAL_FAILURE</h2>
            <p className="text-[#00ffff] mb-8 tracking-widest text-2xl">FINAL_OUTPUT: {score}</p>
            <button 
              onClick={(e) => { e.stopPropagation(); resetGame(); }}
              className="px-6 py-2 border-2 border-[#00ffff] text-[#00ffff] hover:bg-[#00ffff] hover:text-black transition-none uppercase tracking-widest text-2xl font-bold cursor-pointer"
            >
              INITIATE_REBOOT
            </button>
          </div>
        )}
      </div>

      {/* Music Player */}
      <div className="mt-8 w-[400px] bg-black border-2 border-[#ff00ff] p-4 z-10 relative">
        <div className="absolute -top-3 left-4 bg-black text-[#ff00ff] px-2 text-lg font-bold">AUDIO_SUBSYSTEM</div>
        
        <div className="mt-2 flex items-center justify-between mb-4 border-b border-[#00ffff] pb-2">
          <div>
            <p className="text-lg text-[#00ffff] uppercase tracking-widest mb-1">DATA_STREAM.ACTIVE</p>
            <p className="text-2xl font-bold text-[#ff00ff] truncate w-48 glitch" data-text={TRACKS[currentTrackIndex].title}>
              {TRACKS[currentTrackIndex].title}
            </p>
          </div>
          
          {/* Visualizer bars */}
          <div className="flex items-end gap-1 h-8">
            {[1, 2, 3, 4, 5].map((bar) => (
              <div 
                key={bar} 
                className={`w-2 bg-[#00ffff] ${isPlayingMusic ? `animate-eq-${bar}` : ''}`}
                style={{ height: '20%' }}
              />
            ))}
          </div>
        </div>

        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <button 
              onClick={playPrevTrack}
              className="px-3 py-1 border border-[#00ffff] text-[#00ffff] hover:bg-[#00ffff] hover:text-black cursor-pointer text-xl"
            >
              [ &lt;&lt; ]
            </button>
            
            <button 
              onClick={togglePlayMusic}
              className="px-4 py-1 border border-[#ff00ff] text-[#ff00ff] hover:bg-[#ff00ff] hover:text-black font-bold cursor-pointer text-xl"
            >
              {isPlayingMusic ? '[ HALT ]' : '[ EXEC ]'}
            </button>
            
            <button 
              onClick={playNextTrack}
              className="px-3 py-1 border border-[#00ffff] text-[#00ffff] hover:bg-[#00ffff] hover:text-black cursor-pointer text-xl"
            >
              [ &gt;&gt; ]
            </button>
          </div>

          <div className="flex items-center gap-2">
            <button 
              onClick={() => setIsMuted(!isMuted)}
              className="text-[#00ffff] hover:text-[#ff00ff] cursor-pointer uppercase text-lg"
            >
              {isMuted || volume === 0 ? 'VOL:MUTE' : 'VOL:ACTV'}
            </button>
            <input 
              type="range" 
              min="0" 
              max="1" 
              step="0.01" 
              value={isMuted ? 0 : volume}
              onChange={(e) => {
                setVolume(parseFloat(e.target.value));
                if (isMuted) setIsMuted(false);
              }}
              className="w-20 h-2 bg-[#00ffff]/20 appearance-none cursor-pointer accent-[#ff00ff]"
            />
          </div>
        </div>

        <audio 
          ref={audioRef} 
          src={TRACKS[currentTrackIndex].url} 
          onEnded={playNextTrack}
        />
      </div>
    </div>
  );
}
