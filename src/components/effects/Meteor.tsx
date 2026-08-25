import { useEffect, useRef } from 'react';

interface Meteoroid {
  x: number;
  y: number;
  vx: number;
  vy: number;
  size: number;
  color: string;
  glowColor: string;
  twinkleSpeed: number;
  twinkleOffset: number;
  headTailLength: number;
  lastDustTime: number;
}

interface DustParticle {
  x: number;
  y: number;
  vx: number;
  vy: number;
  size: number;
  color: string;
  birthTime: number;
  life: number;
}

export const MeteorShowerCanvas: React.FC<{ progress: number }> = ({ progress }) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const progressRef = useRef(progress);

  useEffect(() => {
    progressRef.current = Math.min(100, Math.max(0, progress));
  }, [progress]);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    let animId: number;
    let meteoroids: Meteoroid[] = [];
    let dust: DustParticle[] = [];
    let lastTime = performance.now();
    let nextSpawnTime = performance.now();

    const resize = () => {
      if (!canvas) return;
      canvas.width = canvas.parentElement?.clientWidth || window.innerWidth;
      canvas.height = canvas.parentElement?.clientHeight || window.innerHeight;
    };

    resize();
    window.addEventListener('resize', resize);

    const spawnMeteor = (now: number) => {
      const w = canvas.width;
      const h = canvas.height;
      const colors = [
        { core: '#ffffff', glow: 'rgba(165, 243, 252, 0.9)' },
        { core: '#ffffff', glow: 'rgba(254, 240, 138, 0.9)' },
        { core: '#ffffff', glow: 'rgba(216, 180, 254, 0.9)' },
        { core: '#ffffff', glow: 'rgba(147, 197, 253, 0.9)' },
      ];
      const theme = colors[Math.floor(Math.random() * colors.length)];

      const speed = 250 + Math.random() * 320;
      const angle = (Math.PI * 0.96) + (Math.random() - 0.5) * 0.16;

      meteoroids.push({
        x: w + 20,
        y: Math.random() * (h * 0.9) + h * 0.05,
        vx: Math.cos(angle) * speed,
        vy: Math.sin(angle) * speed,
        size: 1.2 + Math.random() * 1.6,
        color: theme.core,
        glowColor: theme.glow,
        twinkleSpeed: 15 + Math.random() * 20,
        twinkleOffset: Math.random() * Math.PI * 2,
        headTailLength: 12 + Math.random() * 18,
        lastDustTime: now,
      });

      // 3x längerer Abstand nach erfolgreichem Spawn
      const p = progressRef.current / 100;
      const baseDelay = 900 + (1 - p) * 4500; 
      nextSpawnTime = now + baseDelay + Math.random() * 1500;
    };

    const render = (now: number) => {
      const dt = Math.min((now - lastTime) / 1000, 0.1);
      lastTime = now;

      ctx.clearRect(0, 0, canvas.width, canvas.height);

      const currentProgress = progressRef.current;

      if (meteoroids.length < 2 && now >= nextSpawnTime) {
        if (currentProgress >= 100) {
          spawnMeteor(now);
        } else if (currentProgress > 0) {
          // Chance auf 1/3 reduziert
          const chance = (currentProgress / 100) / 3;
          if (Math.random() < chance) {
            spawnMeteor(now);
          } else {
            // 3x längere Pause bei fehlgeschlagener Chance
            nextSpawnTime = now + 1200 + Math.random() * 1200;
          }
        }
      }

      // Update & Draw Dust Trail
      dust = dust.filter((p) => {
        const age = now - p.birthTime;
        if (age >= p.life) return false;

        const progress = age / p.life;
        const alpha = Math.max(0, (1 - progress) * (1 - progress));

        p.x += p.vx * dt;
        p.y += p.vy * dt;

        ctx.save();
        ctx.globalAlpha = alpha;
        ctx.fillStyle = p.color;
        ctx.shadowBlur = 4;
        ctx.shadowColor = p.color;

        const sparkleScale = 0.6 + Math.sin(age * 0.03 + p.birthTime) * 0.4;
        const currentSize = Math.max(0.4, p.size * (1 - progress * 0.5) * sparkleScale);

        ctx.beginPath();
        ctx.arc(p.x, p.y, currentSize, 0, Math.PI * 2);
        ctx.fill();
        ctx.restore();

        return true;
      });

      // Update & Draw Meteoroids
      meteoroids = meteoroids.filter((m) => {
        m.x += m.vx * dt;
        m.y += m.vy * dt;

        if (now - m.lastDustTime > 25) {
          m.lastDustTime = now;
          const dustCount = 1 + Math.floor(Math.random() * 2);
          for (let i = 0; i < dustCount; i++) {
            const spread = (Math.random() - 0.5) * 3;
            dust.push({
              x: m.x + (Math.random() - 0.5) * 4,
              y: m.y + spread,
              vx: m.vx * 0.05 + (Math.random() - 0.5) * 12,
              vy: m.vy * 0.05 + (Math.random() - 0.5) * 12,
              size: 0.8 + Math.random() * 1.2,
              color: Math.random() > 0.3 ? m.glowColor : '#ffffff',
              birthTime: now,
              life: 1000,
            });
          }
        }

        const twinkle = 0.75 + Math.sin(now * 0.001 * m.twinkleSpeed + m.twinkleOffset) * 0.25;

        ctx.save();
        ctx.shadowColor = m.glowColor;
        ctx.shadowBlur = 10 * twinkle;
        ctx.fillStyle = m.glowColor;

        const dirX = m.vx / Math.hypot(m.vx, m.vy);
        const dirY = m.vy / Math.hypot(m.vx, m.vy);

        const grad = ctx.createLinearGradient(
          m.x,
          m.y,
          m.x - dirX * m.headTailLength,
          m.y - dirY * m.headTailLength
        );
        grad.addColorStop(0, '#ffffff');
        grad.addColorStop(0.3, m.glowColor);
        grad.addColorStop(1, 'transparent');

        ctx.strokeStyle = grad;
        ctx.lineWidth = m.size * 1.5 * twinkle;
        ctx.lineCap = 'round';
        ctx.beginPath();
        ctx.moveTo(m.x, m.y);
        ctx.lineTo(m.x - dirX * m.headTailLength, m.y - dirY * m.headTailLength);
        ctx.stroke();

        ctx.fillStyle = '#ffffff';
        ctx.beginPath();
        ctx.arc(m.x, m.y, m.size * twinkle, 0, Math.PI * 2);
        ctx.fill();

        ctx.strokeStyle = m.glowColor;
        ctx.lineWidth = 1;
        const sparkR = m.size * 2.8 * twinkle;
        ctx.beginPath();
        ctx.moveTo(m.x - sparkR, m.y);
        ctx.lineTo(m.x + sparkR, m.y);
        ctx.moveTo(m.x, m.y - sparkR);
        ctx.lineTo(m.x, m.y + sparkR);
        ctx.stroke();

        ctx.restore();

        return m.x > -60;
      });

      animId = requestAnimationFrame(render);
    };

    animId = requestAnimationFrame(render);

    return () => {
      cancelAnimationFrame(animId);
      window.removeEventListener('resize', resize);
    };
  }, []);

  return <canvas ref={canvasRef} className="absolute inset-0 pointer-events-none z-10" />;
};