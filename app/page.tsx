import Image from "next/image";

export default function Home() {
  return (
   <body>
    <div class="phone-frame">
        <div class="screen">
            <div class="header">
                <div class="title">NOKIA</div>
                <div class="score-display">
                    <span>SCORE: <span id="score">0</span></span>
                    <span>HIGH: <span id="high">0</span></span>
                </div>
            </div>

            <canvas id="game" width="300" height="300"></canvas>

            <div id="startScreen" class="start-screen">
                <h2>PRESS START</h2>
                <p>↑ ↓ ← → to move</p>
                <p>Eat • to grow</p>
            </div>

            <div class="controls">
                <button class="btn btn-up" onclick="turn('UP')">▲</button>
                <button class="btn btn-left" onclick="turn('LEFT')">◄</button>
                <button class="btn btn-center" onclick="startGame()">START</button>
                <button class="btn btn-right" onclick="turn('RIGHT')">►</button>
                <button class="btn btn-down" onclick="turn('DOWN')">▼</button>
            </div>
        </div>
    </div>

    <div class="game-over-screen" id="gameOver">
        <div class="game-over-box">
            <h2>GAME OVER</h2>
            <p>SCORE: <span id="finalScore">0</span></p>
            <p>HIGH SCORE: <span id="finalHigh">0</span></p>
            <button class="restart" onclick="restart()">PLAY AGAIN</button>
        </div>
    </div>

    <script>
        const canvas = document.getElementById('game');
        const ctx = canvas.getContext('2d');
        const box = 15;
        const canvasSize = 20;
        
        let snake, dir, food, score, high, game, started;

        function init() {
            snake = [{x: 10, y: 10}];
            dir = null;
            food = {x: 15, y: 15};
            score = 0;
            high = localStorage.getItem('nokiaSnakeHigh') || 0;
            started = false;
            document.getElementById('score').textContent = score;
            document.getElementById('high').textContent = high;
            document.getElementById('startScreen').style.display = 'block';
        }

        function startGame() {
            if (started) return;
            started = true;
            document.getElementById('startScreen').style.display = 'none';
            dir = 'RIGHT';
            game = setInterval(draw, 120);
        }

        function draw() {
            // Clear
            ctx.fillStyle = '#879987';
            ctx.fillRect(0, 0, canvas.width, canvas.height);

            // Draw grid
            ctx.strokeStyle = 'rgba(0,0,0,0.05)';
            ctx.lineWidth = 1;
            for (let i = 0; i <= canvasSize; i++) {
                ctx.beginPath();
                ctx.moveTo(i * box, 0);
                ctx.lineTo(i * box, canvas.height);
                ctx.moveTo(0, i * box);
                ctx.lineTo(canvas.width, i * box);
                ctx.stroke();
            }

            // Draw snake
            for (let i = 0; i < snake.length; i++) {
                ctx.fillStyle = i === 0 ? '#1a1a1a' : '#2c3e50';
                ctx.fillRect(snake[i].x * box, snake[i].y * box, box - 1, box - 1);
            }

            // Draw food
            ctx.fillStyle = '#1a1a1a';
            ctx.beginPath();
            ctx.arc(
                food.x * box + box/2, 
                food.y * box + box/2, 
                box/2.5, 
                0, 
                Math.PI * 2
            );
            ctx.fill();

            // Move
            let head = {x: snake[0].x, y: snake[0].y};
            
            if (dir === 'UP') head.y--;
            if (dir === 'DOWN') head.y++;
            if (dir === 'LEFT') head.x--;
            if (dir === 'RIGHT') head.x++;

            // Wall collision
            if (head.x < 0 || head.x >= canvasSize || head.y < 0 || head.y >= canvasSize) {
                endGame();
                return;
            }

            // Self collision
            for (let i = 0; i < snake.length; i++) {
                if (head.x === snake[i].x && head.y === snake[i].y) {
                    endGame();
                    return;
                }
            }

            snake.unshift(head);

            // Eat food
            if (head.x === food.x && head.y === food.y) {
                score++;
                document.getElementById('score').textContent = score;
                
                if (score > high) {
                    high = score;
                    localStorage.setItem('nokiaSnakeHigh', high);
                    document.getElementById('high').textContent = high;
                }

                // New food
                food = {
                    x: Math.floor(Math.random() * canvasSize),
                    y: Math.floor(Math.random() * canvasSize)
                };
            } else {
                snake.pop();
            }
        }

        function turn(newDir) {
            if (!started) {
                startGame();
                return;
            }

            if (newDir === 'UP' && dir !== 'DOWN') dir = 'UP';
            if (newDir === 'DOWN' && dir !== 'UP') dir = 'DOWN';
            if (newDir === 'LEFT' && dir !== 'RIGHT') dir = 'LEFT';
            if (newDir === 'RIGHT' && dir !== 'LEFT') dir = 'RIGHT';
        }

        function endGame() {
            clearInterval(game);
            document.getElementById('finalScore').textContent = score;
            document.getElementById('finalHigh').textContent = high;
            document.getElementById('gameOver').style.display = 'flex';
        }

        function restart() {
            clearInterval(game);
            document.getElementById('gameOver').style.display = 'none';
            init();
        }

        // Keyboard
        document.addEventListener('keydown', (e) => {
            if (e.key === 'ArrowUp') { e.preventDefault(); turn('UP'); }
            if (e.key === 'ArrowDown') { e.preventDefault(); turn('DOWN'); }
            if (e.key === 'ArrowLeft') { e.preventDefault(); turn('LEFT'); }
            if (e.key === 'ArrowRight') { e.preventDefault(); turn('RIGHT'); }
            if (e.key === ' ' || e.key === 'Enter') { e.preventDefault(); startGame(); }
        });

        // Touch swipe
        let touchX, touchY;
        canvas.addEventListener('touchstart', (e) => {
            touchX = e.touches[0].clientX;
            touchY = e.touches[0].clientY;
        });

        canvas.addEventListener('touchmove', (e) => {
            e.preventDefault();
        });

        canvas.addEventListener('touchend', (e) => {
            if (!started) {
                startGame();
                return;
            }

            let dx = e.changedTouches[0].clientX - touchX;
            let dy = e.changedTouches[0].clientY - touchY;

            if (Math.abs(dx) > Math.abs(dy)) {
                turn(dx > 0 ? 'RIGHT' : 'LEFT');
            } else {
                turn(dy > 0 ? 'DOWN' : 'UP');
            }
        });

        init();
    </script>
</body>
  );
}
