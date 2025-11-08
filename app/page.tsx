// app/snake/page.tsx
'use client';

import { useEffect, useRef, useState, useCallback } from 'react';
import { ArrowUp, ArrowDown, ArrowLeft, ArrowRight, Play, Pause, RotateCw } from 'lucide-react';


type Direction = 'UP' | 'DOWN' | 'LEFT' | 'RIGHT' | null;
type Position = { x: number; y: number };

export default function SnakeGame() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const gameLoopRef = useRef<NodeJS.Timeout | null>(null);
  
  const [score, setScore] = useState(3);
  const [highScore, setHighScore] = useState(0);
  const [gameStarted, setGameStarted] = useState(false);
  const [gameOver, setGameOver] = useState(false);
  const [isPaused, setIsPaused] = useState(false);
  
  const snakeRef = useRef<Position[]>([
    { x: 10, y: 10 },
    { x: 9, y: 10 },
    { x: 8, y: 10 },
    { x: 7, y: 10 }
  ]);
  const directionRef = useRef<Direction>(null);
  const foodRef = useRef<Position>({ x: 15, y: 15 });
  
  const BOX_SIZE = 20;
  const CANVAS_SIZE = 25;
  const GAME_SPEED = 100;

  // Load high score
  useEffect(() => {
    const saved = localStorage.getItem('snakeHighScore');
    if (saved) setHighScore(parseInt(saved));
  }, []);

  // Draw game
  const draw = useCallback(() => {
    const canvas = canvasRef.current;
    if (!canvas || isPaused) return;
    
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    // Clear with gradient
    const gradient = ctx.createLinearGradient(0, 0, canvas.width, canvas.height);
    gradient.addColorStop(0, '#fef3c7');
    gradient.addColorStop(1, '#bfdbfe');
    ctx.fillStyle = gradient;
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    // Draw grid
    ctx.strokeStyle = 'rgba(0,0,0,0.05)';
    ctx.lineWidth = 1;
    for (let i = 0; i <= CANVAS_SIZE; i++) {
      ctx.beginPath();
      ctx.moveTo(i * BOX_SIZE, 0);
      ctx.lineTo(i * BOX_SIZE, canvas.height);
      ctx.moveTo(0, i * BOX_SIZE);
      ctx.lineTo(canvas.width, i * BOX_SIZE);
      ctx.stroke();
    }

    // Draw snake with rainbow effect
    snakeRef.current.forEach((segment, i) => {
      const hue = (i * 30) % 360;
      ctx.fillStyle = i === 0 ? '#ef4444' : `hsl(${hue}, 70%, 60%)`;
      ctx.shadowBlur = i === 0 ? 10 : 5;
      ctx.shadowColor = ctx.fillStyle;
      ctx.fillRect(
        segment.x * BOX_SIZE + 2,
        segment.y * BOX_SIZE + 2,
        BOX_SIZE - 4,
        BOX_SIZE - 4
      );
      
      // Shine on head
      if (i === 0) {
        ctx.fillStyle = 'rgba(255,255,255,0.4)';
        ctx.shadowBlur = 0;
        ctx.fillRect(
          segment.x * BOX_SIZE + 4,
          segment.y * BOX_SIZE + 4,
          BOX_SIZE / 2,
          BOX_SIZE / 2
        );
      }
    });
    ctx.shadowBlur = 0;

    // Draw food with glow
    ctx.shadowBlur = 20;
    ctx.shadowColor = '#22c55e';
    ctx.fillStyle = '#22c55e';
    ctx.beginPath();
    ctx.arc(
      foodRef.current.x * BOX_SIZE + BOX_SIZE / 2,
      foodRef.current.y * BOX_SIZE + BOX_SIZE / 2,
      BOX_SIZE / 2.5,
      0,
      Math.PI * 2
    );
    ctx.fill();
    ctx.shadowBlur = 0;

    // Move snake
    const head = { ...snakeRef.current[0] };
    const dir = directionRef.current;
    
    if (!dir) return;
    
    if (dir === 'UP') head.y--;
    if (dir === 'DOWN') head.y++;
    if (dir === 'LEFT') head.x--;
    if (dir === 'RIGHT') head.x++;

    // Check wall collision
    if (head.x < 0 || head.x >= CANVAS_SIZE || head.y < 0 || head.y >= CANVAS_SIZE) {
      endGame();
      return;
    }

    // Check self collision
    if (snakeRef.current.some(s => s.x === head.x && s.y === head.y)) {
      endGame();
      return;
    }

    snakeRef.current.unshift(head);

    // Check food
    if (head.x === foodRef.current.x && head.y === foodRef.current.y) {
      const newScore = score + 1;
      setScore(newScore);
      
      if (newScore > highScore) {
        setHighScore(newScore);
        localStorage.setItem('snakeHighScore', newScore.toString());
      }

      foodRef.current = {
        x: Math.floor(Math.random() * CANVAS_SIZE),
        y: Math.floor(Math.random() * CANVAS_SIZE),
      };
    } else {
      snakeRef.current.pop();
    }
  }, [score, highScore, isPaused]);

  // Start game
  const startGame = useCallback(() => {
    if (gameStarted) return;
    
    setGameStarted(true);
    setIsPaused(false);
    directionRef.current = 'RIGHT';
    
    gameLoopRef.current = setInterval(draw, GAME_SPEED);
  }, [gameStarted, draw]);

  // Pause/Resume
  const togglePause = useCallback(() => {
    if (!gameStarted) return;
    
    setIsPaused(prev => {
      if (!prev) {
        if (gameLoopRef.current) {
          clearInterval(gameLoopRef.current);
          gameLoopRef.current = null;
        }
      } else {
        gameLoopRef.current = setInterval(draw, GAME_SPEED);
      }
      return !prev;
    });
  }, [gameStarted, draw]);

  // End game
  const endGame = useCallback(() => {
    if (gameLoopRef.current) {
      clearInterval(gameLoopRef.current);
      gameLoopRef.current = null;
    }
    setGameOver(true);
    setGameStarted(false);
  }, []);

  // Restart
  const restartGame = useCallback(() => {
    snakeRef.current = [
      { x: 10, y: 10 },
      { x: 9, y: 10 },
      { x: 8, y: 10 },
      { x: 7, y: 10 }
    ];
    directionRef.current = null;
    foodRef.current = { x: 15, y: 15 };
    setScore(3);
    setGameOver(false);
    setGameStarted(false);
    setIsPaused(false);
  }, []);

  // Change direction
  const changeDirection = useCallback((newDir: Direction) => {
    if (!gameStarted && newDir) {
      startGame();
      return;
    }

    if (isPaused) return;

    const dir = directionRef.current;
    if (newDir === 'UP' && dir !== 'DOWN') directionRef.current = 'UP';
    if (newDir === 'DOWN' && dir !== 'UP') directionRef.current = 'DOWN';
    if (newDir === 'LEFT' && dir !== 'RIGHT') directionRef.current = 'LEFT';
    if (newDir === 'RIGHT' && dir !== 'LEFT') directionRef.current = 'RIGHT';
  }, [gameStarted, isPaused, startGame]);

  // Keyboard
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'ArrowUp') { e.preventDefault(); changeDirection('UP'); }
      if (e.key === 'ArrowDown') { e.preventDefault(); changeDirection('DOWN'); }
      if (e.key === 'ArrowLeft') { e.preventDefault(); changeDirection('LEFT'); }
      if (e.key === 'ArrowRight') { e.preventDefault(); changeDirection('RIGHT'); }
      if (e.key === ' ') { e.preventDefault(); gameStarted ? togglePause() : startGame(); }
      if (e.key === 'Enter') { e.preventDefault(); startGame(); }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [changeDirection, startGame, togglePause, gameStarted]);

  // Touch swipe
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    let touchX = 0;
    let touchY = 0;

    const handleTouchStart = (e: TouchEvent) => {
      touchX = e.touches[0].clientX;
      touchY = e.touches[0].clientY;
    };

    const handleTouchEnd = (e: TouchEvent) => {
      if (!gameStarted) {
        startGame();
        return;
      }

      const dx = e.changedTouches[0].clientX - touchX;
      const dy = e.changedTouches[0].clientY - touchY;

      if (Math.abs(dx) > Math.abs(dy)) {
        changeDirection(dx > 0 ? 'RIGHT' : 'LEFT');
      } else {
        changeDirection(dy > 0 ? 'DOWN' : 'UP');
      }
    };

    canvas.addEventListener('touchstart', handleTouchStart);
    canvas.addEventListener('touchend', handleTouchEnd);

    return () => {
      canvas.removeEventListener('touchstart', handleTouchStart);
      canvas.removeEventListener('touchend', handleTouchEnd);
    };
  }, [gameStarted, changeDirection, startGame]);

  // Cleanup
  useEffect(() => {
    return () => {
      if (gameLoopRef.current) {
        clearInterval(gameLoopRef.current);
      }
    };
  }, []);

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-600 via-pink-500 to-orange-400 flex items-center justify-center p-4">
      <div className="bg-white/95 backdrop-blur-sm rounded-3xl shadow-2xl p-6 md:p-8 max-w-2xl w-full animate-fade-in">
        {/* Header */}
        <div className="text-center mb-6">
          <h1 className="text-4xl md:text-5xl font-bold bg-gradient-to-r from-purple-600 to-pink-600 bg-clip-text text-transparent mb-2">
            🐍 Snake Game
          </h1>
          <p className="text-gray-600">Classic game with modern design</p>
        </div>

        {/* Score Board */}
        <div className="flex justify-around mb-6 gap-4">
          <div className="bg-gradient-to-br from-blue-500 to-purple-600 text-white px-6 py-3 rounded-xl shadow-lg flex-1 text-center">
            <div className="text-sm opacity-90">Score</div>
            <div className="text-3xl font-bold">{score}</div>
          </div>
          <div className="bg-gradient-to-br from-orange-500 to-pink-600 text-white px-6 py-3 rounded-xl shadow-lg flex-1 text-center">
            <div className="text-sm opacity-90">High Score</div>
            <div className="text-3xl font-bold">{highScore}</div>
          </div>
        </div>

        {/* Canvas */}
        <div className="relative mb-6">
          <canvas
            ref={canvasRef}
            width={500}
            height={500}
            className="w-full border-4 border-gray-800 rounded-2xl shadow-xl bg-gradient-to-br from-yellow-100 to-blue-200"
          />
          
          {/* Start Screen */}
          {!gameStarted && !gameOver && (
            <div className="absolute inset-0 flex items-center justify-center bg-black/50 rounded-2xl backdrop-blur-sm">
              <div className="text-center text-white p-6">
                <h2 className="text-4xl font-bold mb-4 animate-pulse">Press START</h2>
                <p className="text-lg mb-2"> Use Arrow keys to move</p>
                <p className="text-lg">🍎 Eat green dots to grow!</p>
              </div>
            </div>
          )}

          {/* Pause Screen */}
          {isPaused && (
            <div className="absolute inset-0 flex items-center justify-center bg-black/50 rounded-2xl backdrop-blur-sm">
              <div className="text-center text-white">
                <h2 className="text-5xl font-bold animate-pulse">⏸️ PAUSED</h2>
                <p className="text-lg mt-4">Press SPACE to continue</p>
              </div>
            </div>
          )}
        </div>

        {/* Controls */}
        <div className="grid grid-cols-3 gap-3 max-w-xs mx-auto mb-6">
          <div></div>
          <button
            onClick={() => changeDirection('UP')}
            className="bg-gradient-to-br from-green-400 to-green-600 text-white text-3xl rounded-full h-16 w-16 shadow-lg hover:shadow-xl hover:scale-105 active:scale-95 transition-all flex items-center justify-center mx-auto"
          >
            <ArrowUp />
          </button>
          <div></div>
          
          <button
            onClick={() => changeDirection('LEFT')}
            className="bg-gradient-to-br from-green-400 to-green-600 text-white text-3xl rounded-full h-16 w-16 shadow-lg hover:shadow-xl hover:scale-105 active:scale-95 transition-all flex items-center justify-center"
          >
            <ArrowLeft />
          </button>
          
          <button
            onClick={gameStarted ? togglePause : startGame}
            className="bg-gradient-to-br from-pink-500 to-red-600 text-white text-lg font-bold rounded-full h-16 w-16 shadow-lg hover:shadow-xl hover:scale-105 active:scale-95 transition-all flex items-center justify-center mx-auto"
          >
            {isPaused ? '▶️' : gameStarted ? '⏸️' : 'START'}
          </button>
          
          <button
            onClick={() => changeDirection('RIGHT')}
            className="bg-gradient-to-br from-green-400 to-green-600 text-white text-3xl rounded-full h-16 w-16 shadow-lg hover:shadow-xl hover:scale-105 active:scale-95 transition-all flex items-center justify-center"
          >
            <ArrowRight />
          </button>
          
          <div></div>
          <button
            onClick={() => changeDirection('DOWN')}
            className="bg-gradient-to-br from-green-400 to-green-600 text-white text-3xl rounded-full h-16 w-16 shadow-lg hover:shadow-xl hover:scale-105 active:scale-95 transition-all flex items-center justify-center mx-auto"
          >
            <ArrowDown />
          </button>
        </div>

        {/* Instructions */}
        <div className="text-center text-gray-600 text-sm space-y-1">
          <p><span className="font-semibold">Arrow Keys</span> or <span className="font-semibold">Swipe</span> to move</p>
          <p>Press <span className="font-semibold">SPACE</span> to pause/resume</p>
          <p>Start with 3 points • Rainbow snake!</p>
        </div>
      </div>

      {/* Game Over Modal */}
      {gameOver && (
        <div className="fixed inset-0 bg-black/80 flex items-center justify-center z-50 p-4 animate-fade-in">
          <div className="bg-white rounded-3xl p-8 md:p-12 text-center max-w-md w-full shadow-2xl animate-scale-in">
            <div className="text-6xl mb-4">💀</div>
            <h2 className="text-4xl font-bold text-gray-800 mb-4">Game Over!</h2>
            <div className="bg-gradient-to-r from-purple-500 to-pink-500 text-white rounded-2xl p-6 mb-6">
              <div className="text-lg mb-2">Final Score</div>
              <div className="text-5xl font-bold">{score}</div>
            </div>
            <div className="text-gray-600 mb-6">
              <div className="text-lg">🏆 High Score: <span className="font-bold text-2xl text-orange-500">{highScore}</span></div>
            </div>
            <button
              onClick={restartGame}
              className="bg-gradient-to-r from-purple-600 to-pink-600 text-white px-8 py-4 rounded-xl text-xl font-bold hover:shadow-xl hover:scale-105 active:scale-95 transition-all"
            >
              Play Again
            </button>
          </div>
        </div>
      )}

      <style jsx global>{`
        @keyframes fade-in {
          from { opacity: 0; transform: translateY(20px); }
          to { opacity: 1; transform: translateY(0); }
        }
        @keyframes scale-in {
          from { opacity: 0; transform: scale(0.9); }
          to { opacity: 1; transform: scale(1); }
        }
        .animate-fade-in {
          animation: fade-in 0.5s ease-out;
        }
        .animate-scale-in {
          animation: scale-in 0.4s ease-out;
        }
      `}</style>
    </div>
  );
}