"use client";
import { useEffect, useRef, useState } from "react";

interface Props { env: string; }

export default function EnvBackground({ env }: Props) {
  // Shared animated values — all driven by time
  const [t, setT] = useState(0);
  useEffect(() => {
    let frame = 0;
    const id = setInterval(() => { frame++; setT(frame); }, 50); // 20fps for bg
    return () => clearInterval(id);
  }, []);

  const timeMs = t * 50;
  // Sun position: rises from left, sets to right over ~4 min cycle
  const dayProgress = (timeMs % 240000) / 240000; // 0→1 over 4 min
  const sunX = 60 + dayProgress * 780;
  const sunY = 280 - Math.sin(dayProgress * Math.PI) * 230;
  const isSunrise = dayProgress < 0.15;
  const isSunset = dayProgress > 0.8;
  const isDusk = isSunrise || isSunset;

  // Sky colors
  const skyTop = isDusk ? (isSunrise ? "#1a0a2e" : "#0d0520") : dayProgress < 0.5 ? "#87ceeb" : "#5ab0d8";
  const skyBot = isDusk ? (isSunrise ? "#ff6b2b" : "#cc3300") : dayProgress < 0.5 ? "#c8e8ff" : "#aad4f0";

  // Cloud positions (slow drift)
  const clouds = [
    { cx: ((timeMs * 0.01) % 1100) - 100, cy: 60, rx: 80, ry: 26, opacity: 0.88 },
    { cx: ((timeMs * 0.007 + 300) % 1100) - 100, cy: 90, rx: 65, ry: 22, opacity: 0.75 },
    { cx: ((timeMs * 0.015 + 600) % 1100) - 100, cy: 45, rx: 55, ry: 18, opacity: 0.65 },
    { cx: ((timeMs * 0.009 + 800) % 1100) - 100, cy: 75, rx: 70, ry: 24, opacity: 0.7 },
  ];

  // Birds (V-shape flocks)
  const birds = [
    { x: ((timeMs * 0.04 + 0) % 1100) - 50, y: 100 + Math.sin(timeMs * 0.001) * 15, flap: Math.sin(timeMs * 0.012) },
    { x: ((timeMs * 0.04 + 25) % 1100) - 50, y: 112 + Math.sin(timeMs * 0.001 + 0.5) * 15, flap: Math.sin(timeMs * 0.012 + 0.4) },
    { x: ((timeMs * 0.04 - 25) % 1100) - 50, y: 112 + Math.sin(timeMs * 0.001 - 0.5) * 15, flap: Math.sin(timeMs * 0.012 - 0.4) },
    { x: ((timeMs * 0.028 + 200) % 1100) - 50, y: 70 + Math.sin(timeMs * 0.0008 + 1) * 12, flap: Math.sin(timeMs * 0.01) },
    { x: ((timeMs * 0.028 + 220) % 1100) - 50, y: 80 + Math.sin(timeMs * 0.0008 + 1.4) * 12, flap: Math.sin(timeMs * 0.01 + 0.3) },
  ];

  return (
    <div className="env-bg" aria-hidden style={{ width: "100%", height: "100%", position: "absolute", inset: 0 }}>
      <svg viewBox="0 0 900 500" xmlns="http://www.w3.org/2000/svg" style={{ width: "100%", height: "100%", display: "block" }} preserveAspectRatio="xMidYMid slice">
        <defs>
          <linearGradient id="sky-grad" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor={skyTop}/>
            <stop offset="100%" stopColor={skyBot}/>
          </linearGradient>
          <radialGradient id="sun-glow" cx="50%" cy="50%" r="50%">
            <stop offset="0%" stopColor="#fff9c4" stopOpacity="0.6"/>
            <stop offset="100%" stopColor="#fff9c4" stopOpacity="0"/>
          </radialGradient>
          <radialGradient id="moon-glow" cx="50%" cy="50%" r="50%">
            <stop offset="0%" stopColor="#e8eaf6" stopOpacity="0.3"/>
            <stop offset="100%" stopColor="#e8eaf6" stopOpacity="0"/>
          </radialGradient>
        </defs>

        {/* Sky */}
        <rect width="900" height="500" fill="url(#sky-grad)"/>

        {/* Horizon glow at sunrise/sunset */}
        {isDusk && (
          <ellipse cx={sunX} cy="240" rx="200" ry="80" fill={isSunrise ? "#ff8c42" : "#ff5722"} opacity="0.35"/>
        )}

        {/* Stars (only at night / dusk) */}
        {isDusk && [50,130,220,380,500,660,750,840,170,440,600,800].map((sx,i) => (
          <circle key={i} cx={sx} cy={15+i%5*14} r="1.5" fill="white" opacity={0.4+i*0.05}/>
        ))}

        {/* Sun / Moon */}
        {dayProgress > 0.05 && dayProgress < 0.95 ? (
          <>
            <circle cx={sunX} cy={sunY} r="60" fill="#fff9c4" opacity="0.18"/>
            <circle cx={sunX} cy={sunY} r="36" fill={isDusk ? "#ff8c42" : "#ffe066"} opacity="0.95"/>
            <circle cx={sunX} cy={sunY} r="28" fill={isDusk ? "#ffcc00" : "#fffde7"} opacity="0.9"/>
          </>
        ) : (
          <>
            <circle cx={850} cy={55} r="50" fill="#e8eaf6" opacity="0.12"/>
            <circle cx={850} cy={55} r="28" fill="#fffde7" opacity="0.88"/>
            <circle cx={862} cy={48} r="24" fill={skyTop} opacity="0.5"/>
          </>
        )}

        {/* Clouds */}
        {clouds.map((cl, i) => (
          <g key={i} opacity={cl.opacity}>
            <ellipse cx={cl.cx} cy={cl.cy} rx={cl.rx} ry={cl.ry} fill="white"/>
            <ellipse cx={cl.cx + cl.rx * 0.3} cy={cl.cy - cl.ry * 0.6} rx={cl.rx * 0.65} ry={cl.ry * 0.8} fill="white"/>
            <ellipse cx={cl.cx - cl.rx * 0.25} cy={cl.cy - cl.ry * 0.4} rx={cl.rx * 0.5} ry={cl.ry * 0.7} fill="white"/>
          </g>
        ))}

        {/* Birds */}
        {birds.map((b, i) => (
          <g key={i} transform={`translate(${b.x}, ${b.y})`}>
            <path d={`M0,0 Q-6,${-4 + b.flap * 4} -12,0`} fill="none" stroke={isDusk ? "#ffd0a0" : "#334"} strokeWidth="1.8" strokeLinecap="round"/>
            <path d={`M0,0 Q6,${-4 + b.flap * 4} 12,0`} fill="none" stroke={isDusk ? "#ffd0a0" : "#334"} strokeWidth="1.8" strokeLinecap="round"/>
          </g>
        ))}

        {/* Environment-specific ground & elements */}
        {env === "garden" && <GardenGround dayProgress={dayProgress}/>}
        {env === "beach"  && <BeachGround  dayProgress={dayProgress}/>}
        {env === "forest" && <ForestGround dayProgress={dayProgress}/>}
        {env === "mountains" && <MountainsGround dayProgress={dayProgress}/>}
        {env === "racetrack" && <RacetrackGround dayProgress={dayProgress}/>}
        {env === "city"   && <CityGround   dayProgress={dayProgress} t={timeMs}/>}
      </svg>
    </div>
  );
}

function GardenGround({ dayProgress }: { dayProgress: number }) {
  const isNight = dayProgress < 0.1 || dayProgress > 0.9;
  const grass = isNight ? "#1b4332" : "#52b788";
  const grassDark = isNight ? "#0d2b1e" : "#40916c";
  return (
    <>
      <rect x="0" y="240" width="900" height="260" fill={grass}/>
      <ellipse cx="450" cy="242" rx="460" ry="20" fill={grassDark}/>
      {/* Hedges */}
      {[0,90,180,270,360,450,540,630,720,810].map((x,i) => (
        <ellipse key={i} cx={x+45} cy={260} rx={50} ry={30} fill={isNight ? "#1a3a2a" : ["#52b788","#40916c","#74c69d"][i%3]}/>
      ))}
      {/* Flowers */}
      {[60,140,240,340,480,560,660,760,840].map((x,i) => {
        const colors = ["#f48fb1","#ce93d8","#fff176","#80deea","#ff8a65"];
        const cy = 290 + (i%4)*22;
        return (
          <g key={i}>
            <circle cx={x} cy={cy} r={isNight ? 4 : 7} fill={isNight ? "#555" : colors[i%colors.length]}/>
            <circle cx={x} cy={cy} r={isNight ? 2 : 3} fill={isNight ? "#333" : "#fff176"}/>
            <rect x={x-1} y={cy+6} width="3" height="14" fill={isNight ? "#1b4332" : "#52b788"}/>
          </g>
        );
      })}
      {/* Path */}
      <ellipse cx="450" cy="340" rx="55" ry="240" fill={isNight ? "#2d2418" : "#c8a96e"} opacity="0.45" transform="rotate(90 450 340)"/>
      {/* Bench */}
      <rect x="400" y="316" width="80" height="7" fill="#8d6e63" rx="3"/>
      <rect x="404" y="323" width="6" height="16" fill="#8d6e63" rx="2"/>
      <rect x="470" y="323" width="6" height="16" fill="#8d6e63" rx="2"/>
      <rect x="400" y="305" width="80" height="5" fill="#8d6e63" rx="3"/>
      {/* Rose bushes */}
      <ellipse cx="155" cy="278" rx="28" ry="20" fill={isNight ? "#1a3a2a" : "#2d6a4f"}/>
      {[145,160,168,152].map((x,i) => (
        <circle key={i} cx={x} cy={270+(i%2)*8} r={isNight ? 4 : 7} fill={isNight ? "#4a1a2a" : ["#e91e63","#f06292","#ad1457","#f48fb1"][i]}/>
      ))}
    </>
  );
}

function BeachGround({ dayProgress }: { dayProgress: number }) {
  const isNight = dayProgress < 0.1 || dayProgress > 0.9;
  return (
    <>
      {/* Ocean */}
      <rect x="0" y="200" width="900" height="90" fill={isNight ? "#0d3a5c" : "#29b6f6"} opacity="0.9"/>
      {/* Waves animate */}
      <path d="M0,215 Q50,205 100,215 Q150,225 200,215 Q250,205 300,215 Q350,225 400,215 Q450,205 500,215 Q550,225 600,215 Q650,205 700,215 Q750,225 800,215 Q850,205 900,215"
        fill="none" stroke="white" strokeWidth="2.5" opacity="0.45"/>
      <path d="M0,230 Q60,220 120,230 Q180,240 240,230 Q300,220 360,230 Q420,240 480,230 Q540,220 600,230 Q660,240 720,230 Q780,220 840,230 Q870,236 900,230"
        fill="none" stroke="white" strokeWidth="1.5" opacity="0.3"/>
      {/* Sand */}
      <rect x="0" y="278" width="900" height="222" fill={isNight ? "#b5935a" : "#f5deb3"}/>
      <ellipse cx="450" cy="280" rx="460" ry="16" fill={isNight ? "#9e7a40" : "#e8c97e"} opacity="0.6"/>
      {/* Palm trees */}
      <rect x="90" y="200" width="8" height="85" fill="#8d6e63" rx="3"/>
      <ellipse cx="94" cy="206" rx="36" ry="20" fill="#2e7d32" opacity="0.9" transform="rotate(-15 94 206)"/>
      <ellipse cx="94" cy="206" rx="30" ry="16" fill="#43a047" opacity="0.8" transform="rotate(12 94 206)"/>
      <rect x="788" y="196" width="8" height="82" fill="#8d6e63" rx="3"/>
      <ellipse cx="792" cy="202" rx="34" ry="19" fill="#2e7d32" opacity="0.9" transform="rotate(18 792 202)"/>
      <ellipse cx="792" cy="202" rx="28" ry="15" fill="#43a047" opacity="0.8" transform="rotate(-8 792 202)"/>
      {/* Beach umbrella */}
      <ellipse cx="400" cy="315" rx="52" ry="17" fill="#ff7043" opacity="0.85"/>
      <ellipse cx="400" cy="315" rx="26" ry="17" fill="#ffcc02" opacity="0.85"/>
      <rect x="398" y="310" width="4" height="52" fill="#795548"/>
      {/* Shells */}
      <ellipse cx="290" cy="370" rx="8" ry="5" fill="#ffccbc" opacity="0.8"/>
      <ellipse cx="550" cy="385" rx="6" ry="4" fill="#f8bbd0" opacity="0.8"/>
      <ellipse cx="680" cy="360" rx="9" ry="5" fill="#ffe0b2" opacity="0.8"/>
    </>
  );
}

function ForestGround({ dayProgress }: { dayProgress: number }) {
  const isNight = dayProgress < 0.12 || dayProgress > 0.88;
  return (
    <>
      {/* Back trees */}
      {[20,100,185,275,370,465,560,645,730,815].map((x,i) => (
        <g key={i}>
          <rect x={x+14} y={130+i%3*10} width={10} height={130} fill={isNight ? "#1b5e20" : "#2e7d32"}/>
          <polygon points={`${x+19},${80+i%3*10} ${x-12},${155+i%3*10} ${x+50},${155+i%3*10}`} fill={isNight ? "#1b5e20" : "#388e3c"}/>
          <polygon points={`${x+19},${102+i%3*10} ${x-6},${162+i%3*10} ${x+44},${162+i%3*10}`} fill={isNight ? "#2e7d32" : "#43a047"}/>
        </g>
      ))}
      {/* Ground */}
      <rect x="0" y="268" width="900" height="232" fill={isNight ? "#1b4332" : "#33691e"}/>
      <ellipse cx="450" cy="270" rx="460" ry="16" fill={isNight ? "#0d2b1e" : "#1b5e20"}/>
      {/* Mushrooms */}
      <ellipse cx="205" cy="305" rx="15" ry="9" fill="#e53935"/>
      <rect x="201" y="301" width="8" height="18" fill="#f5f5f5"/>
      {[203,210,206].map((x,i) => <circle key={i} cx={x} cy={300} r="1.5" fill="white"/>)}
      <ellipse cx="675" cy="310" rx="12" ry="8" fill="#fb8c00"/>
      <rect x="672" y="306" width="7" height="15" fill="#f5f5f5"/>
      {/* Fireflies at night */}
      {isNight && [150,290,490,640,770,105,415].map((x,i) => (
        <circle key={i} cx={x} cy={200+i*12} r="3" fill="#ffe57f" opacity="0.75"/>
      ))}
      {/* Path */}
      <path d="M395 500 Q435 390 425 275 Q420 265 450 265 Q480 265 475 275 Q465 390 505 500Z" fill="#5d4037" opacity="0.5"/>
    </>
  );
}

function MountainsGround({ dayProgress }: { dayProgress: number }) {
  const isNight = dayProgress < 0.12 || dayProgress > 0.88;
  return (
    <>
      {/* Far mountains */}
      <polygon points="0,320 140,130 300,320" fill={isNight ? "#283593" : "#5c6bc0"} opacity="0.75"/>
      <polygon points="90,320 265,100 450,320" fill={isNight ? "#3949ab" : "#7986cb"} opacity="0.65"/>
      <polygon points="340,320 530,88 720,320" fill={isNight ? "#283593" : "#5c6bc0"} opacity="0.72"/>
      <polygon points="540,320 710,118 900,320" fill={isNight ? "#3949ab" : "#7986cb"} opacity="0.65"/>
      {/* Snow caps */}
      {[[140,130],[265,100],[530,88],[710,118]].map(([px,py],i) => (
        <polygon key={i} points={`${px},${py} ${px-20},${py+42} ${px+20},${py+42}`} fill="white" opacity="0.92"/>
      ))}
      {/* Ground */}
      <rect x="0" y="318" width="900" height="182" fill={isNight ? "#1b5e20" : "#4caf50"}/>
      <ellipse cx="450" cy="320" rx="460" ry="14" fill={isNight ? "#0d2b1e" : "#388e3c"}/>
      {/* Pines */}
      {[35,125,218,630,730,835].map((x,i) => (
        <g key={i}>
          <rect x={x+7} y={282} width={6} height={38} fill="#5d4037"/>
          <polygon points={`${x+10},${248} ${x-10},${288} ${x+30},${288}`} fill={isNight ? "#1b5e20" : "#2e7d32"}/>
          <polygon points={`${x+10},${264} ${x-4},${292} ${x+24},${292}`} fill={isNight ? "#2e7d32" : "#388e3c"}/>
        </g>
      ))}
    </>
  );
}

function RacetrackGround({ dayProgress }: { dayProgress: number }) {
  const isNight = dayProgress < 0.12 || dayProgress > 0.88;
  return (
    <>
      {/* Stands */}
      <rect x="0" y="100" width="900" height="118" fill={isNight ? "#1a1a2e" : "#37474f"}/>
      {/* Crowd */}
      {Array.from({length: 75}, (_,i) => (
        <circle key={i} cx={22+i*12} cy={115+(i%4)*24} r={8}
          fill={["#ef5350","#42a5f5","#66bb6a","#ffca28","#ab47bc"][i%5]}
          opacity={isNight ? 0.5 : 0.85}/>
      ))}
      {/* Track */}
      <rect x="0" y="215" width="900" height="175" fill={isNight ? "#424242" : "#757575"}/>
      <rect x="0" y="262" width="900" height="6" fill="white" opacity="0.55"/>
      <rect x="0" y="322" width="900" height="6" fill="white" opacity="0.55"/>
      {/* Dashes */}
      {Array.from({length: 18}, (_,i) => (
        <rect key={i} x={i*52} y={292} width="32" height="5" fill="yellow" opacity="0.8"/>
      ))}
      {/* Finish */}
      {Array.from({length: 20}, (_,i) => (
        <rect key={i} x={420} y={218+i*9} width="18" height="9" fill={i%2===0?"white":"black"} opacity="0.9"/>
      ))}
      {/* Barriers */}
      {Array.from({length: 30}, (_,i) => (
        <rect key={i} x={i*30} y={212} width="16" height="8" fill={i%2===0?"#f44336":"white"} rx="2"/>
      ))}
      {/* Track lights at night */}
      {isNight && [100,250,450,650,800].map((x,i) => (
        <g key={i}>
          <rect x={x} y={200} width="4" height="16" fill="#546e7a"/>
          <ellipse cx={x+2} cy={202} rx="14" ry="6" fill="#ffd54f" opacity="0.7"/>
          <ellipse cx={x+2} cy={202} rx="20" ry="10" fill="#ffd54f" opacity="0.12"/>
        </g>
      ))}
    </>
  );
}

function CityGround({ dayProgress, t }: { dayProgress: number; t: number }) {
  const isNight = dayProgress < 0.15 || dayProgress > 0.85;
  const windowFlicker = (x: number, y: number) => Math.sin(t * 0.001 + x * 0.1 + y * 0.07) > 0.4;
  return (
    <>
      {/* Buildings */}
      {[
        {x:0,w:80,h:300},{x:70,w:60,h:240},{x:120,w:90,h:330},
        {x:200,w:70,h:270},{x:260,w:100,h:310},{x:350,w:65,h:215},
        {x:400,w:80,h:280},{x:470,w:110,h:340},{x:570,w:75,h:258},
        {x:630,w:90,h:295},{x:710,w:85,h:330},{x:790,w:70,h:248},{x:850,w:60,h:278},
      ].map((b,i) => (
        <g key={i}>
          <rect x={b.x} y={500-b.h} width={b.w} height={b.h} fill={isNight ? "#1a237e" : "#78909c"} opacity="0.9"/>
          {Array.from({length: Math.floor(b.h/26)}, (_,r) =>
            Array.from({length: Math.floor(b.w/18)}, (_,c) => {
              const lit = isNight ? windowFlicker(b.x+c*18, r*26) : Math.random() > 0.7;
              return <rect key={`${r}-${c}`} x={b.x+5+c*18} y={500-b.h+8+r*26} width="10" height="14"
                fill={lit ? "#ffe082" : (isNight ? "#0d47a1" : "#546e7a")} opacity="0.95"/>;
            })
          )}
        </g>
      ))}
      {/* Rooftop */}
      <rect x="0" y="270" width="900" height="230" fill={isNight ? "#1c1c2e" : "#263238"}/>
      <rect x="0" y="270" width="900" height="8" fill={isNight ? "#2a2a40" : "#37474f"}/>
      {/* Rooftop details */}
      <rect x="100" y="240" width="40" height="32" fill={isNight ? "#2a2a40" : "#37474f"}/>
      <rect x="600" y="245" width="50" height="26" fill={isNight ? "#2a2a40" : "#37474f"}/>
      <rect x="750" y="235" width="30" height="36" fill={isNight ? "#333355" : "#455a64"}/>
      <rect x="455" y="215" width="3" height="55" fill="#90a4ae"/>
      <circle cx="456" cy="213" r="5" fill="#f44336"/>
      {/* Neon sign */}
      <rect x="280" y="255" width="90" height="20" fill={isNight ? "#e91e63" : "#880e4f"} opacity="0.85" rx="4"/>
      <text x="325" y="269" textAnchor="middle" fill="white" fontSize="10" fontWeight="bold">OPEN 24H</text>
      {/* Street lights */}
      {[80,280,500,700,860].map((x,i) => (
        <g key={i}>
          <rect x={x} y={230} width="4" height="42" fill="#546e7a"/>
          <ellipse cx={x+2} cy={232} rx="12" ry="5" fill="#ffd54f" opacity={isNight ? 0.95 : 0.4}/>
          {isNight && <ellipse cx={x+2} cy={232} rx="20" ry="10" fill="#ffd54f" opacity="0.15"/>}
        </g>
      ))}
    </>
  );
}
