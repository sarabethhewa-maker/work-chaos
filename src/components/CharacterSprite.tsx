"use client";
import type { Character, WeatherState } from "@/types";

interface Props {
  character: Character;
  frame: number;
  onClick?: () => void;
  isSelected?: boolean;
  weather?: WeatherState;
  windDirection?: "left" | "right";
  allCharacters?: Character[];
}

export default function CharacterSprite({ character, frame, onClick, isSelected, weather = "clear", windDirection = "right", allCharacters = [] }: Props) {
  const { x, y, direction, state, name, faceUrl, color, skinTone, speechBubble, isFlying, stateTimer } = character;
  const flipped = direction === "left";

  const run = (frame * 0.22) % (Math.PI * 2);
  const legA = Math.sin(run) * 22;
  const armA = Math.sin(run) * 26;
  const bodyBob = Math.abs(Math.sin(run)) * 2.5;
  const headBob = Math.sin(run * 1.3 + 0.5) * 3.5;
  const headTilt = Math.sin(run * 0.9 + 0.3) * 4;

  const isFighting = state === "fighting";
  const isTripping = state === "tripping";
  const isGettingUp = state === "getting-up";
  const isCarried = state === "carried";
  const isChasing = state === "chasing";
  const isCartwheel = state === "cartwheel";
  const isDancing = state === "dancing";
  const isNapping = state === "napping";
  const isMeeting = state === "meeting";
  const isPanic = state === "panic";
  const isPromote = state === "promote";
  const isWobble = state === "wobble";
  const isKnockedOut = state === "knocked-out";
  const isMelting = state === "melting";
  const meltProgress = isMelting ? (90 - stateTimer) / 90 : 0;
  const stopped = isTripping || isGettingUp || isFighting || isNapping || isPromote || isKnockedOut || isMelting;

  const cartwheelAngle = isCartwheel ? ((120 - stateTimer) / 120) * 720 : 0;
  const danceAngle = isDancing ? Math.sin(frame * 0.15) * 18 : 0;
  const danceArmWave = isDancing ? Math.sin(frame * 0.2) * 40 : 0;
  const panicShake = isPanic ? Math.sin(frame * 0.8) * 4 : 0;
  const wobbleSway = isWobble ? Math.sin(frame * 0.2) * 12 : 0;

  const promoteProgress = isPromote ? (150 - stateTimer) / 150 : 0;

  const windLean = weather === "wind" ? (windDirection === "right" ? 6 : -6) : 0;

  let fogOpacity = 1;
  if (weather === "fog" && allCharacters.length > 1) {
    let hasNearby = false;
    for (const other of allCharacters) {
      if (other.id === character.id) continue;
      const dx = character.x - other.x;
      const dy = character.y - other.y;
      if (Math.sqrt(dx * dx + dy * dy) < 150) { hasNearby = true; break; }
    }
    if (!hasNearby) fogOpacity = 0.2;
  }

  const pants = "#2d2040";
  const shoe = "#1a1a1a";

  // Unified body coordinates
  const headCX = 28;
  const headCY = 22;
  const headRX = 20;
  const headRY = 22;
  const faceClipR = 19;

  // Compute head offset for bobblehead wobble (applied via cy/y offsets, not separate transform)
  const hbob = stopped ? 0 : headBob;
  const htilt = stopped ? 0 : headTilt;

  return (
    <div
      className={`character ${isSelected ? "selected" : ""} ${onClick ? "clickable" : ""}`}
      style={{ left: x, top: y, transform: `scaleX(${flipped ? -1 : 1}) scale(${character.scale ?? 1})`, transformOrigin: "bottom center", opacity: isMelting ? Math.max(0.1, 1 - meltProgress * 0.8) * fogOpacity : fogOpacity, transition: "opacity 0.5s, transform 0.5s" }}
      onClick={onClick}
      title={name}
    >
      {speechBubble && (
        <div className="speech-bubble" style={{ transform: `scaleX(${flipped ? -1 : 1})` }}>
          {speechBubble}
        </div>
      )}

      {isNapping && (
        <div className="zzz-bubbles" style={{ transform: `scaleX(${flipped ? -1 : 1})` }}>
          <span className="zzz z1">Z</span>
          <span className="zzz z2">z</span>
          <span className="zzz z3">Z</span>
        </div>
      )}

      {weather === "rain" && !isNapping && !isKnockedOut && !isMelting && (
        <div className="umbrella-icon" style={{ transform: `scaleX(${flipped ? -1 : 1})` }}>
          ☂️
        </div>
      )}

      <svg width="56" height="96" viewBox="0 0 56 96" overflow="visible"
        style={{
          filter: `drop-shadow(2px 4px 5px rgba(0,0,0,0.35))${isSelected ? " drop-shadow(0 0 8px #fff)" : ""}`,
          transform: isCartwheel
            ? `rotate(${cartwheelAngle}deg)`
            : isDancing
            ? `rotate(${danceAngle}deg) translateY(${-bodyBob}px)`
            : isNapping
            ? `rotate(80deg) translateX(10px) translateY(15px)`
            : isKnockedOut
            ? `rotate(90deg) translateX(10px) translateY(15px)`
            : isMelting
            ? `scaleY(${1 - meltProgress * 0.95}) scaleX(${1 + meltProgress * 0.5}) translateY(${meltProgress * 40}px)`
            : `rotate(${isTripping ? 75 : isGettingUp ? 22 : isWobble ? wobbleSway : windLean}deg) translateY(${stopped ? 0 : -bodyBob}px) translateX(${panicShake}px)`,
          transformOrigin: "28px 60px",
          transition: isTripping ? "transform 0.12s ease-out" : "none",
        }}
      >
        <defs>
          <clipPath id={`fc-${character.id}`}><circle cx={headCX} cy={headCY} r={faceClipR}/></clipPath>
          <radialGradient id={`face-fade-${character.id}`} cx="50%" cy="50%" r="50%">
            <stop offset="75%" stopColor="white" stopOpacity="1"/>
            <stop offset="100%" stopColor="white" stopOpacity="0"/>
          </radialGradient>
          <mask id={`face-mask-${character.id}`}>
            <circle cx={headCX} cy={headCY} r={faceClipR} fill={`url(#face-fade-${character.id})`}/>
          </mask>
          <linearGradient id={`wing-${character.id}`} x1="0" y1="0" x2="1" y2="1">
            <stop offset="0%" stopColor="#e8f4ff" stopOpacity="0.95"/>
            <stop offset="100%" stopColor="#90c8ff" stopOpacity="0.65"/>
          </linearGradient>
        </defs>

        {!isFlying && !isNapping && <ellipse cx="28" cy="94" rx="16" ry="4" fill="rgba(0,0,0,0.15)"/>}

        {/* Wings */}
        {isFlying && (
          <>
            <ellipse cx="8" cy="52" rx="20" ry="11"
              fill={`url(#wing-${character.id})`} stroke="#70b8ff" strokeWidth="1"
              transform={`rotate(${-18 + Math.sin(Date.now()*0.007)*18}, 8, 52)`}/>
            <ellipse cx="48" cy="52" rx="20" ry="11"
              fill={`url(#wing-${character.id})`} stroke="#70b8ff" strokeWidth="1"
              transform={`rotate(${18 - Math.sin(Date.now()*0.007)*18}, 48, 52)`}/>
          </>
        )}

        {/* Legs — attached at y=70 */}
        {(!stopped && !isCartwheel && !isDancing && !isMeeting && !isPanic && !isWobble) ? (
          <>
            <g transform={`rotate(${-legA}, 28, 70)`}>
              <rect x="22" y="70" width="10" height="20" rx="5" fill={pants}/>
              <rect x="19" y="88" width="14" height="6" rx="3" fill={shoe}/>
            </g>
            <g transform={`rotate(${legA}, 28, 70)`}>
              <rect x="22" y="70" width="10" height="20" rx="5" fill={pants}/>
              <rect x="19" y="88" width="14" height="6" rx="3" fill={shoe}/>
            </g>
          </>
        ) : isTripping ? (
          <>
            <rect x="14" y="72" width="10" height="18" rx="5" fill={pants} transform="rotate(55 19 72)"/>
            <rect x="11" y="86" width="13" height="6" rx="3" fill={shoe} transform="rotate(55 17 89)"/>
            <rect x="30" y="72" width="10" height="18" rx="5" fill={pants} transform="rotate(-22 35 72)"/>
            <rect x="27" y="88" width="13" height="6" rx="3" fill={shoe} transform="rotate(-22 33 91)"/>
          </>
        ) : isCartwheel ? (
          <>
            <rect x="22" y="68" width="10" height="20" rx="5" fill={pants} transform="rotate(90 28 68)"/>
            <rect x="22" y="68" width="10" height="20" rx="5" fill={pants} transform="rotate(-90 28 68)"/>
          </>
        ) : isDancing ? (
          <>
            <g transform={`rotate(${Math.sin(frame * 0.15) * 20}, 28, 70)`}>
              <rect x="22" y="70" width="10" height="20" rx="5" fill={pants}/>
              <rect x="19" y="88" width="14" height="6" rx="3" fill={shoe}/>
            </g>
            <g transform={`rotate(${-Math.sin(frame * 0.15) * 20}, 28, 70)`}>
              <rect x="22" y="70" width="10" height="20" rx="5" fill={pants}/>
              <rect x="19" y="88" width="14" height="6" rx="3" fill={shoe}/>
            </g>
          </>
        ) : isPanic ? (
          <>
            <g transform={`rotate(${-legA * 1.5}, 28, 70)`}>
              <rect x="22" y="70" width="10" height="20" rx="5" fill={pants}/>
              <rect x="19" y="88" width="14" height="6" rx="3" fill={shoe}/>
            </g>
            <g transform={`rotate(${legA * 1.5}, 28, 70)`}>
              <rect x="22" y="70" width="10" height="20" rx="5" fill={pants}/>
              <rect x="19" y="88" width="14" height="6" rx="3" fill={shoe}/>
            </g>
          </>
        ) : isWobble ? (
          <>
            <g transform={`rotate(${-legA * 0.4}, 28, 70)`}>
              <rect x="22" y="70" width="10" height="20" rx="5" fill={pants}/>
              <rect x="19" y="88" width="14" height="6" rx="3" fill={shoe}/>
            </g>
            <g transform={`rotate(${legA * 0.4}, 28, 70)`}>
              <rect x="22" y="70" width="10" height="20" rx="5" fill={pants}/>
              <rect x="19" y="88" width="14" height="6" rx="3" fill={shoe}/>
            </g>
          </>
        ) : (
          <>
            <rect x="20" y="70" width="10" height="20" rx="5" fill={pants}/>
            <rect x="17" y="88" width="14" height="6" rx="3" fill={shoe}/>
            <rect x="30" y="70" width="10" height="20" rx="5" fill={pants}/>
            <rect x="27" y="88" width="14" height="6" rx="3" fill={shoe}/>
          </>
        )}

        {/* Body/torso — y=46 to y=70 */}
        <rect x="16" y="46" width="24" height="24" rx="7" fill={color}/>
        <rect x="22" y="46" width="12" height="6" rx="3" fill={skinTone} opacity="0.55"/>

        {/* Arms — attached at y=50 */}
        {isFighting ? (
          <>
            <g transform="rotate(-65, 16, 50)">
              <rect x="4" y="48" width="12" height="10" rx="5" fill={color}/>
              <circle cx="10" cy="46" r="6" fill={skinTone}/>
            </g>
            <g transform="rotate(35, 40, 50)">
              <rect x="40" y="48" width="12" height="10" rx="5" fill={color}/>
              <circle cx="46" cy="46" r="6" fill={skinTone}/>
            </g>
          </>
        ) : isCartwheel ? (
          <>
            <rect x="4" y="50" width="20" height="10" rx="5" fill={color} transform="rotate(-90 14 55)"/>
            <circle cx="4" cy="50" r="6" fill={skinTone}/>
            <rect x="32" y="50" width="20" height="10" rx="5" fill={color} transform="rotate(90 42 55)"/>
            <circle cx="52" cy="50" r="6" fill={skinTone}/>
          </>
        ) : isDancing ? (
          <>
            <g transform={`rotate(${-80 + danceArmWave}, 16, 50)`}>
              <rect x="8" y="48" width="10" height="20" rx="5" fill={color}/>
              <circle cx="13" cy="69" r="6" fill={skinTone}/>
            </g>
            <g transform={`rotate(${80 - danceArmWave}, 40, 50)`}>
              <rect x="38" y="48" width="10" height="20" rx="5" fill={color}/>
              <circle cx="43" cy="69" r="6" fill={skinTone}/>
            </g>
          </>
        ) : isPanic ? (
          <>
            <g transform={`rotate(${-70 + Math.sin(frame * 0.4) * 20}, 16, 50)`}>
              <rect x="8" y="48" width="10" height="20" rx="5" fill={color}/>
              <circle cx="13" cy="69" r="6" fill={skinTone}/>
            </g>
            <g transform={`rotate(${70 + Math.sin(frame * 0.4 + 1) * 20}, 40, 50)`}>
              <rect x="38" y="48" width="10" height="20" rx="5" fill={color}/>
              <circle cx="43" cy="69" r="6" fill={skinTone}/>
            </g>
          </>
        ) : !stopped ? (
          <>
            <g transform={`rotate(${-armA}, 16, 50)`}>
              <rect x="8" y="48" width="10" height="20" rx="5" fill={color}/>
              <circle cx="13" cy="69" r="6" fill={skinTone}/>
            </g>
            <g transform={`rotate(${armA}, 40, 50)`}>
              <rect x="38" y="48" width="10" height="20" rx="5" fill={color}/>
              <circle cx="43" cy="69" r="6" fill={skinTone}/>
            </g>
          </>
        ) : (
          <>
            <rect x="8" y="48" width="10" height="18" rx="5" fill={color} transform="rotate(-40 13 50)"/>
            <circle cx="4" cy="43" r="6" fill={skinTone}/>
            <rect x="38" y="48" width="10" height="18" rx="5" fill={color} transform="rotate(40 43 50)"/>
            <circle cx="52" cy="43" r="6" fill={skinTone}/>
          </>
        )}

        {/* Neck — y=42 to y=48 */}
        <rect x="23" y="42" width="10" height="6" rx="4" fill={skinTone}/>

        {/* Head — unified, no separate transform group */}
        {/* Skin-tone base ellipse (shows through gradient edges) */}
        <ellipse cx={headCX} cy={headCY + hbob} rx={headRX} ry={headRY} fill={skinTone}
          transform={`rotate(${htilt}, ${headCX}, ${headCY + hbob})`}/>
        {/* Face image with radial gradient mask for transparent edges */}
        <image href={faceUrl} x={8} y={hbob} width={40} height={44}
          mask={`url(#face-mask-${character.id})`}
          style={{ filter: "contrast(1.1) saturate(1.05)" }}
          preserveAspectRatio="xMidYMid slice"
          transform={`rotate(${htilt}, ${headCX}, ${headCY + hbob})`}/>
        {/* Head outline */}
        <ellipse cx={headCX} cy={headCY + hbob} rx={headRX} ry={headRY} fill="none" stroke="rgba(0,0,0,0.1)" strokeWidth="1"
          transform={`rotate(${htilt}, ${headCX}, ${headCY + hbob})`}/>

        {/* Rain umbrella removed from SVG — rendered as HTML element above */}

        {/* State FX */}
        {isTripping && <><text x="42" y="8" fontSize="13">😵</text><text x="48" y="18" fontSize="9">⭐</text></>}
        {isFighting && <text x="42" y="6" fontSize="15">👊</text>}
        {isFlying && <text x="42" y="6" fontSize="12">✨</text>}
        {isCarried && <text x="42" y="6" fontSize="12">😱</text>}
        {isChasing && <text x="42" y="6" fontSize="12">😤</text>}
        {isCartwheel && <text x="42" y="6" fontSize="12">🌀</text>}
        {isGettingUp && <text x="40" y="6" fontSize="12">💪</text>}
        {isWobble && <text x="40" y="6" fontSize="12">💪</text>}
        {isDancing && <text x="42" y="6" fontSize="12">💃</text>}
        {isNapping && <text x="42" y="6" fontSize="12">💤</text>}
        {isMeeting && <text x="42" y="6" fontSize="12">📋</text>}
        {isPanic && <text x="42" y="6" fontSize="14">😱</text>}

        {/* Melting FX */}
        {isMelting && (
          <>
            <text x="16" y="6" fontSize="16">😵</text>
            {/* Puddle underneath — grows as character melts */}
            <ellipse cx="28" cy={94} rx={10 + meltProgress * 18} ry={2 + meltProgress * 5}
              fill={color} opacity={0.3 + meltProgress * 0.5}/>
            <ellipse cx="28" cy={94} rx={6 + meltProgress * 12} ry={1.5 + meltProgress * 3}
              fill={character.skinTone} opacity={0.4 + meltProgress * 0.4}/>
            {/* Drip blobs falling from body */}
            {[0,1,2,3].map(i => {
              const dripX = 16 + i * 8 + Math.sin(frame * 0.03 + i * 2) * 3;
              const dripCycle = ((frame * 0.8 + i * 25) % 60) / 60;
              const dripY = 50 + dripCycle * 44;
              const dripOpacity = meltProgress * (1 - dripCycle) * 0.8;
              return <ellipse key={i} cx={dripX} cy={dripY} rx={2.5} ry={3.5}
                fill={i % 2 === 0 ? color : character.skinTone} opacity={dripOpacity}/>;
            })}
            {/* Steam/heat waves rising */}
            {[0,1,2].map(i => {
              const steamCycle = ((frame * 0.4 + i * 40) % 80) / 80;
              const steamY = 90 - steamCycle * 70;
              const steamX = 12 + i * 16 + Math.sin(frame * 0.04 + i) * 6;
              const steamOp = meltProgress * Math.sin(steamCycle * Math.PI) * 0.7;
              return <text key={i} x={steamX} y={steamY} fontSize="12" opacity={steamOp}
                fill="#ff6633">~</text>;
            })}
          </>
        )}

        {/* Knocked out: skull + spinning stars + KO text */}
        {isKnockedOut && (
          <>
            <text x="22" y="8" fontSize="14">💀</text>
            {[0,1,2].map(i => {
              const starAngle = ((frame * 0.05) + (i / 3) * Math.PI * 2) % (Math.PI * 2);
              const starR = 18;
              const sx = headCX + Math.cos(starAngle) * starR;
              const sy = (headCY - 8) + Math.sin(starAngle) * 8;
              return <text key={i} x={sx - 5} y={sy} fontSize="10">⭐</text>;
            })}
            <text x="10" y={-8} fontSize="16" fontWeight="bold" fill="#ff2222" stroke="#000" strokeWidth="0.5">KO!</text>
          </>
        )}

        {/* Promote: trophy + confetti */}
        {isPromote && (
          <>
            <text x="18" y={-4 - promoteProgress * 20} fontSize="18" opacity={1 - promoteProgress * 0.5}>🏆</text>
            {[0,1,2,3,4,5,6,7].map(i => {
              const angle = (i / 8) * Math.PI * 2;
              const r = promoteProgress * 28;
              const cx = headCX + Math.cos(angle) * r;
              const cy = headCY - 10 + Math.sin(angle) * r - promoteProgress * 15;
              const colors = ["#ff6b6b","#ffa502","#2ed573","#1e90ff","#a29bfe","#fd79a8","#00cec9","#fdcb6e"];
              return <circle key={i} cx={cx} cy={cy} r={3 - promoteProgress * 2} fill={colors[i]} opacity={1 - promoteProgress}/>;
            })}
          </>
        )}

        {isSelected && <ellipse cx={headCX} cy={headCY + hbob} rx={headRX + 3} ry={headRY + 3} fill="none" stroke="white" strokeWidth="2.5" strokeDasharray="5 3" opacity="0.9"
          transform={`rotate(${htilt}, ${headCX}, ${headCY + hbob})`}/>}
      </svg>

      <div className="name-tag" style={{ transform: `scaleX(${flipped ? -1 : 1})` }}>{name}</div>
    </div>
  );
}
