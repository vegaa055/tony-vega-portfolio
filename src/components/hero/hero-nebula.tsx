"use client";

import { useEffect, useRef, useState } from "react";

import styles from "./hero-nebula.module.css";
import type { Nebula, NebulaStatus } from "./nebula/scene";
import { nebulaMode } from "./nebula/support";

type Status = "waiting" | "loading" | NebulaStatus;

// Visitors who don't touch anything still get the nebula once the page has
// settled.
const START_AFTER_MS = 3000;
const START_EVENTS = [
  "pointermove",
  "pointerdown",
  "keydown",
  "wheel",
  "touchstart",
  "scroll",
] as const;

/**
 * The home page hero's backdrop: a nebula that parts and swirls as the cursor
 * moves through it. A CSS version shows first and stays wherever the real one
 * can't run. Three.js loads after the page is up, on the first interaction or
 * a few seconds after loading, so it never holds the page back. Decorative,
 * so hidden from assistive technology.
 */
export function HeroNebula() {
  const stageRef = useRef<HTMLDivElement>(null);
  const [status, setStatus] = useState<Status>("waiting");

  useEffect(() => {
    const stage = stageRef.current;
    if (!stage) return;

    const reducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)");
    const saveData =
      (navigator as { connection?: { saveData?: boolean } }).connection
        ?.saveData === true;
    if (
      nebulaMode({ reducedMotion: reducedMotion.matches, saveData }) === "off"
    ) {
      return;
    }

    let disposed = false;
    let started = false;
    let nebula: Nebula | undefined;
    let timer = 0;

    const onLoad = () => {
      timer = window.setTimeout(start, START_AFTER_MS);
    };

    const removeTriggers = () => {
      window.clearTimeout(timer);
      window.removeEventListener("load", onLoad);
      for (const type of START_EVENTS) window.removeEventListener(type, start);
    };

    const start = async () => {
      if (started) return;
      started = true;
      removeTriggers();
      setStatus("loading");
      try {
        const { createNebula } = await import("./nebula/scene");
        if (disposed) return;
        nebula = createNebula({
          host: stage,
          canvasClassName: styles.canvas,
          animate: !reducedMotion.matches,
          onStatus: (next) => {
            if (!disposed) setStatus(next);
          },
        });
      } catch {
        if (!disposed) setStatus("error");
      }
    };

    for (const type of START_EVENTS) {
      window.addEventListener(type, start, { passive: true });
    }
    if (document.readyState === "complete") onLoad();
    else window.addEventListener("load", onLoad);

    const onMotionChange = () => nebula?.setAnimate(!reducedMotion.matches);
    reducedMotion.addEventListener("change", onMotionChange);

    return () => {
      disposed = true;
      removeTriggers();
      reducedMotion.removeEventListener("change", onMotionChange);
      nebula?.dispose();
      // Next.js can hide this page and show it again later; start over then.
      setStatus("waiting");
    };
  }, []);

  return (
    <div aria-hidden="true" data-nebula={status} className={styles.nebula}>
      <div className={styles.standIn} />
      <div ref={stageRef} className={styles.stage} />
      <div className={styles.shade} />
    </div>
  );
}
