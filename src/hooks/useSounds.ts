"use client";
import { useRef, useEffect } from "react";
import type { Character, CharacterState } from "@/types";
import {
  setMuted, playWhoosh, playWahoo, playGasp,
  startSnore, stopSnore, startCucaracha, stopCucaracha,
} from "@/lib/sounds";

export function useSounds(characters: Character[], muted: boolean) {
  const prevStatesRef = useRef<Map<string, CharacterState>>(new Map());

  useEffect(() => { setMuted(muted); }, [muted]);

  useEffect(() => {
    const prev = prevStatesRef.current;

    // Detect state transitions — trigger one-shot sounds
    for (const c of characters) {
      const prevState = prev.get(c.id);
      if (prevState === c.state) continue;

      if (c.state === "flying") playWhoosh();
      if (c.state === "cartwheel") playWahoo();
      if (c.state === "panic") playGasp();
    }

    // Manage continuous loops based on current states
    const anyDancing = characters.some(c => c.state === "dancing");
    if (anyDancing) startCucaracha();
    else stopCucaracha();

    const anyNapping = characters.some(c => c.state === "napping");
    if (anyNapping) startSnore();
    else stopSnore();

    // Update prev states map
    const next = new Map<string, CharacterState>();
    for (const c of characters) next.set(c.id, c.state);
    prevStatesRef.current = next;
  });

  // Cleanup on unmount
  useEffect(() => {
    return () => { stopCucaracha(); stopSnore(); };
  }, []);
}
