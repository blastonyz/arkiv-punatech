"use client";

import { Canvas } from "@react-three/fiber";
import ShaderPlane from "./ShaderPlane";

/**
 * Renders a full-screen Three.js canvas behind page content.
 *
 * Usage — add once to a layout or page:
 *   <ShaderBackground />
 *   <main className="relative z-10">...</main>
 */
export default function ShaderBackground() {
  return (
    <div
      style={{
        position: "fixed",
        inset: 0,
        zIndex: 0,
        pointerEvents: "none",
      }}
    >
      <Canvas
        gl={{ antialias: false, alpha: false }}
        style={{ width: "100%", height: "100%" }}
        dpr={[1, 1.5]}
        frameloop="always"
      >
        <ShaderPlane />
      </Canvas>
    </div>
  );
}
