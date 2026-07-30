import { useEffect, useRef } from "react";

/**
 * Subtle cursor-follower glow with delay/inertia.
 * Renders a fixed orange radial gradient that trails the cursor.
 */
export default function CursorGlow() {
  const dotRef = useRef(null);
  const glowRef = useRef(null);
  const pos = useRef({ x: -200, y: -200 });
  const target = useRef({ x: -200, y: -200 });

  useEffect(() => {
    const onMove = (e) => {
      target.current.x = e.clientX;
      target.current.y = e.clientY;
      if (dotRef.current) {
        dotRef.current.style.transform = `translate(${e.clientX - 4}px, ${e.clientY - 4}px)`;
      }
    };
    window.addEventListener("mousemove", onMove);
    let raf;
    const loop = () => {
      pos.current.x += (target.current.x - pos.current.x) * 0.12;
      pos.current.y += (target.current.y - pos.current.y) * 0.12;
      if (glowRef.current) {
        glowRef.current.style.transform = `translate(${pos.current.x - 200}px, ${pos.current.y - 200}px)`;
      }
      raf = requestAnimationFrame(loop);
    };
    loop();
    return () => { window.removeEventListener("mousemove", onMove); cancelAnimationFrame(raf); };
  }, []);

  return (
    <>
      <div ref={glowRef}
        className="pointer-events-none fixed top-0 left-0 z-0 w-[400px] h-[400px]"
        style={{ background: "radial-gradient(circle at center, hsla(15,100%,50%,0.18), transparent 60%)" }}
      />
      <div ref={dotRef}
        className="pointer-events-none fixed top-0 left-0 z-[100] w-2 h-2 bg-primary mix-blend-difference hidden md:block"
      />
    </>
  );
}
