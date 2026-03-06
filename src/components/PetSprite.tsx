"use client";
import type { Pet } from "@/types";

interface Props { pet: Pet; frame: number; }

export default function PetSprite({ pet, frame }: Props) {
  const { x, y, direction, type, color } = pet;
  const flipped = direction === "left";
  const walk = (frame * 0.18) % (Math.PI * 2);
  const legSwing = Math.sin(walk) * 14;
  const tailWag = Math.sin(walk * 1.5) * 18;
  const bob = Math.abs(Math.sin(walk)) * 1.5;

  return (
    <div className="pet" style={{ left: x, top: y - bob, transform: `scaleX(${flipped ? -1 : 1})` }}>
      {type === "dog" ? (
        <svg width="44" height="34" viewBox="0 0 44 34" style={{ filter: "drop-shadow(1px 2px 3px rgba(0,0,0,0.3))" }}>
          {/* shadow */}
          <ellipse cx="22" cy="33" rx="14" ry="3" fill="rgba(0,0,0,0.15)"/>
          {/* body */}
          <ellipse cx="22" cy="20" rx="14" ry="9" fill={color}/>
          {/* legs */}
          <g transform={`rotate(${legSwing}, 14, 26)`}>
            <rect x="11" y="24" width="5" height="10" rx="2.5" fill={color}/>
          </g>
          <g transform={`rotate(${-legSwing}, 18, 26)`}>
            <rect x="15" y="24" width="5" height="10" rx="2.5" fill={color}/>
          </g>
          <g transform={`rotate(${-legSwing}, 24, 26)`}>
            <rect x="21" y="24" width="5" height="10" rx="2.5" fill={color}/>
          </g>
          <g transform={`rotate(${legSwing}, 30, 26)`}>
            <rect x="27" y="24" width="5" height="10" rx="2.5" fill={color}/>
          </g>
          {/* head */}
          <ellipse cx="34" cy="17" rx="9" ry="8" fill={color}/>
          {/* snout */}
          <ellipse cx="40" cy="20" rx="5" ry="4" fill={color} opacity="0.85"/>
          <ellipse cx="40" cy="19" rx="3" ry="2" fill="#222" opacity="0.3"/>
          {/* eye */}
          <circle cx="36" cy="15" r="2" fill="#1a1a1a"/>
          <circle cx="36.7" cy="14.3" r="0.7" fill="white"/>
          {/* ear */}
          <ellipse cx="30" cy="11" rx="5" ry="6" fill={color} opacity="0.8" transform="rotate(-20 30 11)"/>
          <ellipse cx="30" cy="11" rx="3" ry="4" fill="#c0907a" opacity="0.5" transform="rotate(-20 30 11)"/>
          {/* tail */}
          <path d={`M8,18 Q${2 + Math.cos(tailWag * Math.PI / 180) * 8},${10 + Math.sin(tailWag * Math.PI / 180) * 6} 4,12`}
            fill="none" stroke={color} strokeWidth="4" strokeLinecap="round"/>
        </svg>
      ) : (
        /* CAT */
        <svg width="38" height="32" viewBox="0 0 38 32" style={{ filter: "drop-shadow(1px 2px 3px rgba(0,0,0,0.3))" }}>
          <ellipse cx="19" cy="31" rx="12" ry="3" fill="rgba(0,0,0,0.12)"/>
          {/* body */}
          <ellipse cx="18" cy="20" rx="11" ry="8" fill={color}/>
          {/* legs */}
          <g transform={`rotate(${legSwing * 0.7}, 12, 25)`}>
            <rect x="9" y="24" width="4" height="8" rx="2" fill={color}/>
          </g>
          <g transform={`rotate(${-legSwing * 0.7}, 16, 25)`}>
            <rect x="13" y="24" width="4" height="8" rx="2" fill={color}/>
          </g>
          <g transform={`rotate(${-legSwing * 0.7}, 20, 25)`}>
            <rect x="17" y="24" width="4" height="8" rx="2" fill={color}/>
          </g>
          <g transform={`rotate(${legSwing * 0.7}, 24, 25)`}>
            <rect x="21" y="24" width="4" height="8" rx="2" fill={color}/>
          </g>
          {/* head */}
          <circle cx="29" cy="16" r="8" fill={color}/>
          {/* ears */}
          <polygon points="23,10 26,4 29,10" fill={color}/>
          <polygon points="24,10 26.5,5.5 28.5,10" fill="#ffb7c5" opacity="0.7"/>
          <polygon points="29,10 32,4 35,10" fill={color}/>
          <polygon points="29.5,10 32,5.5 34,10" fill="#ffb7c5" opacity="0.7"/>
          {/* eyes */}
          <ellipse cx="27" cy="16" rx="1.8" ry="2.2" fill="#1a1a1a"/>
          <circle cx="27.5" cy="15.2" r="0.7" fill="white"/>
          <ellipse cx="31" cy="16" rx="1.8" ry="2.2" fill="#1a1a1a"/>
          <circle cx="31.5" cy="15.2" r="0.7" fill="white"/>
          {/* nose + whiskers */}
          <ellipse cx="29" cy="19" rx="1.2" ry="0.9" fill="#ff9999"/>
          <line x1="21" y1="18" x2="26" y2="19" stroke="#666" strokeWidth="0.7" opacity="0.6"/>
          <line x1="21" y1="20" x2="26" y2="20" stroke="#666" strokeWidth="0.7" opacity="0.6"/>
          <line x1="32" y1="19" x2="37" y2="18" stroke="#666" strokeWidth="0.7" opacity="0.6"/>
          <line x1="32" y1="20" x2="37" y2="20" stroke="#666" strokeWidth="0.7" opacity="0.6"/>
          {/* tail */}
          <path d={`M7,18 Q${0 + Math.cos(tailWag * 0.7 * Math.PI / 180) * 8},${8 + Math.sin(tailWag * 0.7 * Math.PI / 180) * 8} 6,6`}
            fill="none" stroke={color} strokeWidth="3.5" strokeLinecap="round"/>
        </svg>
      )}
    </div>
  );
}
