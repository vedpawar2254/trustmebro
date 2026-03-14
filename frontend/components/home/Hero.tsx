'use client';

import { useEffect, useRef } from 'react';
import Link from 'next/link';

export default function HeroSection() {
    const canvasRef = useRef<HTMLCanvasElement>(null);

    useEffect(() => {
        const canvas = canvasRef.current;
        if (!canvas) return;
        const ctx = canvas.getContext('2d');
        if (!ctx) return;

        function resize() {
            if (!canvas) return;
            canvas.width = canvas.offsetWidth;
            canvas.height = canvas.offsetHeight;
        }
        resize();
        window.addEventListener('resize', resize);

        const P = 'rgba(109,84,181,';
        const W = 'rgba(180,160,255,';

        const COUNT = 90;
        const dots = Array.from({ length: COUNT }, () => ({
            x: Math.random() * canvas.width,
            y: Math.random() * canvas.height,
            r: Math.random() * 2.2 + 0.6,
            vx: (Math.random() - 0.5) * 0.35,
            vy: (Math.random() - 0.5) * 0.35,
            o: Math.random() * 0.7 + 0.25,
            pulse: Math.random() * Math.PI * 2,
        }));

        const orbs = [
            { x: 0.15, y: 0.3, r: 320, o: 0.18, phase: 0, speed: 0.0007 },
            { x: 0.85, y: 0.6, r: 380, o: 0.15, phase: 2.0, speed: 0.0005 },
            { x: 0.5, y: 0.05, r: 250, o: 0.12, phase: 4.0, speed: 0.0009 },
            { x: 0.7, y: 0.9, r: 200, o: 0.10, phase: 1.2, speed: 0.0011 },
        ];

        const rings = [
            { x: 0.2, y: 0.75, r: 0, maxR: 180, o: 0.25, speed: 0.6 },
            { x: 0.78, y: 0.2, r: 80, maxR: 200, o: 0.2, speed: 0.5 },
        ];

        let t = 0;
        let animId: number;

        function draw() {
            if (!canvas || !ctx) return;
            t++;
            ctx.clearRect(0, 0, canvas.width, canvas.height);

            orbs.forEach(orb => {
                const cx = orb.x * canvas.width + Math.sin(t * orb.speed + orb.phase) * 80;
                const cy = orb.y * canvas.height + Math.cos(t * orb.speed + orb.phase) * 55;
                const g = ctx.createRadialGradient(cx, cy, 0, cx, cy, orb.r);
                g.addColorStop(0, P + orb.o + ')');
                g.addColorStop(0.4, P + (orb.o * 0.5) + ')');
                g.addColorStop(1, P + '0)');
                ctx.beginPath();
                ctx.arc(cx, cy, orb.r, 0, Math.PI * 2);
                ctx.fillStyle = g;
                ctx.fill();
            });

            rings.forEach(ring => {
                ring.r = (ring.r + ring.speed) % ring.maxR;
                const progress = ring.r / ring.maxR;
                const alpha = (1 - progress) * 0.35;
                const cx = ring.x * canvas.width;
                const cy = ring.y * canvas.height;
                ctx.beginPath();
                ctx.arc(cx, cy, ring.r, 0, Math.PI * 2);
                ctx.strokeStyle = P + alpha + ')';
                ctx.lineWidth = 1.5;
                ctx.stroke();
                if (ring.r > ring.maxR * 0.5) {
                    ctx.beginPath();
                    ctx.arc(cx, cy, ring.r * 0.55, 0, Math.PI * 2);
                    ctx.strokeStyle = P + (alpha * 0.5) + ')';
                    ctx.lineWidth = 0.8;
                    ctx.stroke();
                }
            });

            dots.forEach(d => {
                d.x += d.vx; d.y += d.vy;
                d.pulse += 0.025;
                if (d.x < 0) d.x = canvas.width;
                if (d.x > canvas.width) d.x = 0;
                if (d.y < 0) d.y = canvas.height;
                if (d.y > canvas.height) d.y = 0;
            });

            for (let i = 0; i < dots.length; i++) {
                for (let j = i + 1; j < dots.length; j++) {
                    const a = dots[i], b = dots[j];
                    const dx = a.x - b.x, dy = a.y - b.y;
                    const dist = Math.sqrt(dx * dx + dy * dy);
                    if (dist < 140) {
                        const alpha = (1 - dist / 140) * 0.35;
                        ctx.beginPath();
                        ctx.moveTo(a.x, a.y);
                        ctx.lineTo(b.x, b.y);
                        ctx.strokeStyle = W + alpha + ')';
                        ctx.lineWidth = 0.7;
                        ctx.stroke();
                    }
                }
            }

            dots.forEach(d => {
                const pulse = 0.85 + Math.sin(d.pulse) * 0.15;
                ctx.beginPath();
                ctx.arc(d.x, d.y, d.r * pulse, 0, Math.PI * 2);
                ctx.fillStyle = W + d.o + ')';
                ctx.fill();
            });

            const scanY = ((t * 0.4) % (canvas.height + 60)) - 30;
            const scanGrad = ctx.createLinearGradient(0, scanY - 20, 0, scanY + 20);
            scanGrad.addColorStop(0, P + '0)');
            scanGrad.addColorStop(0.5, P + '0.06)');
            scanGrad.addColorStop(1, P + '0)');
            ctx.fillStyle = scanGrad;
            ctx.fillRect(0, scanY - 20, canvas.width, 40);

            animId = requestAnimationFrame(draw);
        }

        draw();

        return () => {
            window.removeEventListener('resize', resize);
            cancelAnimationFrame(animId);
        };
    }, []);

    return (
        <div
            className="relative min-h-screen w-full overflow-hidden"
            style={{ background: 'rgb(44,38,56)', fontFamily: "'DM Sans', sans-serif" }}
        >
            {/* Google Fonts — add to layout.tsx <head>:
          <link href="https://fonts.googleapis.com/css2?family=Syne:wght@400;600;700;800&family=DM+Sans:wght@300;400;500&display=swap" rel="stylesheet" />
      */}

            {/* CANVAS BACKGROUND */}
            <canvas
                ref={canvasRef}
                className="absolute inset-0 w-full h-full"
                style={{ zIndex: 0 }}
            />

            {/* CONTENT */}
            <div className="relative" style={{ zIndex: 2 }}>

                {/* NAVBAR */}
                <nav
                    className="flex justify-between items-center px-12 py-5"
                    style={{ borderBottom: '0.5px solid rgba(109,84,181,0.25)' }}
                >
                    <div
                        className="flex items-center gap-2 text-white font-bold text-lg"
                        style={{ fontFamily: "'Syne', sans-serif" }}
                    >
                        <span
                            className="w-2 h-2 rounded-full flex-shrink-0"
                            style={{ background: 'rgb(109,84,181)' }}
                        />
                        Trust Me Bro
                    </div>

                    <div className="hidden md:flex items-center gap-8">
                        <Link href="/about" style={{ fontSize: 13, color: 'rgba(255,255,255,0.48)', textDecoration: 'none' }}>About</Link>
                        <Link href="/how-it-works" style={{ fontSize: 13, color: 'rgba(255,255,255,0.48)', textDecoration: 'none' }}>How it Works</Link>
                        <Link href="/pricing" style={{ fontSize: 13, color: 'rgba(255,255,255,0.48)', textDecoration: 'none' }}>Pricing</Link>
                    </div>

                    <div className="flex items-center gap-3">
                        <Link
                            href="/login"
                            className="text-sm px-5 py-2 rounded-lg transition-all"
                            style={{
                                color: 'rgba(255,255,255,0.65)',
                                border: '0.5px solid rgba(255,255,255,0.2)',
                                fontSize: 13,
                            }}
                        >
                            Log in
                        </Link>
                        <Link
                            href="/register"
                            className="text-sm px-5 py-2 rounded-lg text-white transition-all"
                            style={{ background: 'rgb(109,84,181)', fontSize: 13 }}
                        >
                            Get started
                        </Link>
                    </div>
                </nav>

                {/* HERO */}
                <section className="flex flex-col items-center justify-center text-center px-12 pt-24 pb-20">

                    {/* BADGE */}
                    <div
                        className="inline-flex items-center gap-2 rounded-full px-4 py-1.5 mb-10"
                        style={{
                            background: 'rgba(109,84,181,0.15)',
                            border: '0.5px solid rgba(109,84,181,0.5)',
                        }}
                    >
                        <span
                            className="w-1.5 h-1.5 rounded-full animate-pulse"
                            style={{ background: 'rgb(109,84,181)' }}
                        />
                        <span style={{ fontSize: 12, color: 'rgba(255,255,255,0.6)', letterSpacing: '0.5px' }}>
                            AI-powered escrow platform
                        </span>
                    </div>

                    {/* HEADLINE */}
                    <h1
                        className="text-white mb-5"
                        style={{
                            fontFamily: "'Syne', sans-serif",
                            fontWeight: 800,
                            fontSize: 'clamp(38px, 5.5vw, 70px)',
                            lineHeight: 1.07,
                            letterSpacing: '-1.5px',
                        }}
                    >
                        <span className="block">The escrow platform</span>
                        <span className="block">
                            built for{' '}
                            <AnimatedWord words={['freelancers.', 'clients.']} />
                        </span>
                    </h1>

                    {/* SUBTEXT */}
                    <p
                        className="mb-12 font-light"
                        style={{
                            fontSize: 'clamp(14px, 1.8vw, 17px)',
                            color: 'rgba(255,255,255,0.45)',
                            maxWidth: 460,
                            lineHeight: 1.75,
                        }}
                    >
                        Secure payments, AI-verified milestones, and zero disputes.
                        <br />
                        Work smart. Get paid safely.
                    </p>

                    {/* CTA BUTTONS */}
                    <div className="flex flex-wrap gap-4 justify-center mb-16">
                        <Link
                            href="/register"
                            className="text-white rounded-xl transition-all"
                            style={{
                                background: 'rgb(109,84,181)',
                                fontSize: 15,
                                fontWeight: 500,
                                padding: '15px 34px',
                            }}
                        >
                            Get started →
                        </Link>
                        <Link
                            href="/login"
                            className="rounded-xl transition-all"
                            style={{
                                color: 'rgba(255,255,255,0.6)',
                                border: '0.5px solid rgba(255,255,255,0.2)',
                                fontSize: 15,
                                padding: '15px 34px',
                            }}
                        >
                            Join as a freelancer
                        </Link>
                    </div>

                    {/* STATS */}
                    <div
                        className="flex overflow-hidden rounded-2xl"
                        style={{
                            border: '0.5px solid rgba(109,84,181,0.3)',
                            background: 'rgba(44,38,56,0.55)',
                        }}
                    >
                        {[
                            { num: '$12M+', label: 'Secured in escrow' },
                            { num: '8,400+', label: 'Active freelancers' },
                            { num: '99.2%', label: 'Dispute-free rate' },
                        ].map((s, i) => (
                            <div
                                key={i}
                                className="px-11 py-5 text-center"
                                style={{
                                    borderRight: i < 2 ? '0.5px solid rgba(109,84,181,0.2)' : 'none',
                                }}
                            >
                                <span
                                    className="block text-white"
                                    style={{ fontFamily: "'Syne', sans-serif", fontWeight: 700, fontSize: 28, letterSpacing: '-0.5px' }}
                                >
                                    {s.num}
                                </span>
                                <span
                                    className="block mt-1"
                                    style={{ fontSize: 12, color: 'rgba(255,255,255,0.3)', letterSpacing: '0.4px' }}
                                >
                                    {s.label}
                                </span>
                            </div>
                        ))}
                    </div>

                </section>
            </div>
        </div>
    );
}

function AnimatedWord({ words }: { words: string[] }) {
    return (
        <span
            style={{
                display: 'inline-block',
                position: 'relative',
                minWidth: 280,
                height: '1.07em',
                verticalAlign: 'bottom',
                overflow: 'hidden',
            }}
        >
            <style>{`
        @keyframes slideWord1 {
          0%,38%  { transform: translateY(0);     opacity: 1; }
          46%     { transform: translateY(-110%); opacity: 0; }
          94%,100%{ transform: translateY(110%);  opacity: 0; }
        }
        @keyframes slideWord2 {
          0%,42%  { transform: translateY(110%);  opacity: 0; }
          50%,92% { transform: translateY(0);     opacity: 1; }
          100%    { transform: translateY(-110%); opacity: 0; }
        }
        .tmb-w1 { animation: slideWord1 7s infinite; }
        .tmb-w2 { animation: slideWord2 7s infinite; }
      `}</style>
            {words.map((w, i) => (
                <span
                    key={w}
                    className={i === 0 ? 'tmb-w1' : 'tmb-w2'}
                    style={{
                        position: 'absolute',
                        left: 0, right: 0,
                        textAlign: 'center',
                        color: 'rgb(149,120,221)',
                    }}
                >
                    {w}
                </span>
            ))}
        </span>
    );
}
