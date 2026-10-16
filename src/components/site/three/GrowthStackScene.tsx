"use client";

import { useRef } from "react";
import { Canvas, useFrame } from "@react-three/fiber";
import { Edges, Environment, Lightformer } from "@react-three/drei";
import * as THREE from "three";
import { SERVICE_GROUPS } from "@/content/services";

const BLOCKS = SERVICE_GROUPS.map((g, i) => ({ id: g.id, color: g.color, x: (i - 2.5) * 0.92, height: 0.9 + i * 0.46 }));

function Block({ index, selected, startedRef, onSelect }: { index: number; selected: boolean; startedRef: React.RefObject<number | null>; onSelect: (i: number) => void }) {
  const b = BLOCKS[index];
  const mesh = useRef<THREE.Mesh>(null);
  const mat = useRef<THREE.MeshPhysicalMaterial>(null);

  useFrame((state) => {
    const m = mesh.current;
    const started = startedRef.current;
    if (!m || started === null) return;
    // Blocks rise one after another (140 ms apart), then ease toward their final height.
    const local = Math.min(Math.max((state.clock.elapsedTime - started - index * 0.14) / 0.9, 0), 1);
    const e = 1 - Math.pow(1 - local, 3);
    const lift = selected ? 0.16 : 0;
    m.scale.y += (Math.max(e, 0.001) - m.scale.y) * 0.25;
    m.position.y += ((b.height * m.scale.y) / 2 + lift * e - m.position.y) * 0.2;
    if (mat.current) mat.current.emissiveIntensity += ((selected ? 0.7 : 0.08) - mat.current.emissiveIntensity) * 0.15;
  });

  return (
    <mesh
      ref={mesh}
      position={[b.x, 0, 0]}
      scale={[1, 0.001, 1]}
      onPointerOver={(e) => {
        e.stopPropagation();
        onSelect(index);
        document.body.style.cursor = "pointer";
      }}
      onPointerOut={() => (document.body.style.cursor = "")}
      onClick={(e) => {
        e.stopPropagation();
        onSelect(index);
      }}
    >
      <boxGeometry args={[0.76, b.height, 0.76]} />
      <meshPhysicalMaterial ref={mat} color={b.color} transparent opacity={0.94} roughness={0.16} metalness={0.05} clearcoat={1} clearcoatRoughness={0.1} emissive={b.color} emissiveIntensity={0.08} />
      <Edges color="#ffffff" threshold={20} />
    </mesh>
  );
}

function Stage({ selected, onSelect }: { selected: number; onSelect: (i: number) => void }) {
  const group = useRef<THREE.Group>(null);
  const started = useRef<number | null>(null);

  useFrame((state) => {
    if (started.current === null) started.current = state.clock.elapsedTime;
    const g = group.current;
    if (!g) return;
    const t = state.clock.elapsedTime;
    // Slow sway; the pointer position steers it a little on desktops.
    const target = Math.sin(t * 0.35) * 0.22 - 0.35 + state.pointer.x * 0.25;
    g.rotation.y += (target - g.rotation.y) * 0.05;
  });

  return (
    <group ref={group} position={[0, -1.7, 0]}>
      {BLOCKS.map((b, i) => (
        <Block key={b.id} index={i} selected={selected === i} startedRef={started} onSelect={onSelect} />
      ))}
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, -0.01, 0]}>
        <circleGeometry args={[4.2, 64]} />
        <meshBasicMaterial color="#b6f23a" transparent opacity={0.05} />
      </mesh>
    </group>
  );
}

export default function GrowthStackScene({ selected, onSelect, active, quality, onReady }: { selected: number; onSelect: (i: number) => void; active: boolean; quality: "low" | "high"; onReady: () => void }) {
  return (
    <Canvas
      frameloop={active ? "always" : "never"}
      dpr={quality === "high" ? [1, 1.6] : 1}
      camera={{ position: [0, 1.7, 10.4], fov: 34 }}
      gl={{ antialias: quality === "high", alpha: true }}
      onCreated={({ gl, camera }) => {
        gl.setClearColor(0x000000, 0);
        gl.toneMapping = THREE.ACESFilmicToneMapping;
        camera.lookAt(0, 0.3, 0);
        onReady();
      }}
      aria-hidden="true"
    >
      <ambientLight intensity={0.5} />
      <directionalLight position={[4, 6, 5]} intensity={2.2} color="#f4ffd9" />
      <Environment resolution={128} frames={1}>
        <Lightformer form="rect" intensity={3.5} position={[0, 5, -3]} scale={[10, 4, 1]} />
        <Lightformer form="rect" intensity={2} position={[-5, 1, 3]} rotation-y={Math.PI / 2} scale={[8, 3, 1]} color="#b6f23a" />
      </Environment>
      <Stage selected={selected} onSelect={onSelect} />
    </Canvas>
  );
}
