"use client";

import { useEffect, useMemo, useRef } from "react";
import { Canvas, useFrame } from "@react-three/fiber";
import { Environment, Float, Lightformer, RoundedBox } from "@react-three/drei";
import * as THREE from "three";

/** Points of the two logo chevrons on the 1800-unit grid of the logo artwork. */
const DARK_V: [number, number][] = [[135, 690], [350, 690], [560, 1085], [770, 690], [975, 690], [560, 1530]];
const LIME_V: [number, number][] = [[665, 690], [885, 690], [1090, 1085], [1290, 290], [1405, 115], [1520, 270], [1090, 1530]];
const SCALE = 1 / 620;

function chevron(points: [number, number][]) {
  const shape = new THREE.Shape();
  points.forEach(([x, y], i) => {
    const px = (x - 900) * SCALE;
    const py = -(y - 820) * SCALE;
    if (i === 0) shape.moveTo(px, py);
    else shape.lineTo(px, py);
  });
  shape.closePath();
  return new THREE.ExtrudeGeometry(shape, { depth: 0.2, bevelEnabled: true, bevelThickness: 0.035, bevelSize: 0.035, bevelSegments: 4, steps: 1 });
}

function leafGeometry() {
  const s = new THREE.Shape();
  s.moveTo(0, -0.5);
  s.bezierCurveTo(0.5, -0.25, 0.5, 0.25, 0, 0.55);
  s.bezierCurveTo(-0.5, 0.25, -0.5, -0.25, 0, -0.5);
  return new THREE.ExtrudeGeometry(s, { depth: 0.07, bevelEnabled: true, bevelThickness: 0.02, bevelSize: 0.02, bevelSegments: 3 });
}

const easeOutBack = (t: number) => {
  const c1 = 1.70158;
  const c3 = c1 + 1;
  return 1 + c3 * Math.pow(t - 1, 3) + c1 * Math.pow(t - 1, 2);
};

function Mark({ pointer }: { pointer: React.RefObject<{ x: number; y: number; moved: boolean }> }) {
  const group = useRef<THREE.Group>(null);
  const dark = useMemo(() => chevron(DARK_V), []);
  const lime = useMemo(() => chevron(LIME_V), []);
  useEffect(
    () => () => {
      dark.dispose();
      lime.dispose();
    },
    [dark, lime],
  );

  useFrame((state) => {
    const g = group.current;
    if (!g) return;
    const t = state.clock.elapsedTime;
    // Intro: rise and settle once (about 2.4 s).
    const p = Math.min(t / 2.4, 1);
    const e = easeOutBack(p);
    g.position.y = -1.7 * (1 - e) + Math.sin(t * 0.9) * 0.04 * p;
    g.scale.setScalar(0.65 + 0.35 * Math.min(e, 1.04));

    const ptr = pointer.current;
    const sway = ptr.moved ? 0 : Math.sin(t * 0.55) * 0.32;
    const targetY = (ptr.moved ? ptr.x * 0.45 : sway) + 0.2;
    const targetX = ptr.moved ? -ptr.y * 0.25 : Math.cos(t * 0.45) * 0.06;
    g.rotation.y += (targetY - g.rotation.y) * 0.06;
    g.rotation.x += (targetX - g.rotation.x) * 0.06;
  });

  return (
    <group ref={group}>
      <mesh geometry={dark} position={[0, 0, -0.12]}>
        <meshPhysicalMaterial color="#14705a" roughness={0.3} metalness={0.12} clearcoat={1} clearcoatRoughness={0.18} />
      </mesh>
      <mesh geometry={lime} position={[0, 0, 0.08]}>
        <meshPhysicalMaterial color="#b6f23a" roughness={0.28} metalness={0.05} clearcoat={1} clearcoatRoughness={0.12} emissive="#4c7d00" emissiveIntensity={0.25} />
      </mesh>
    </group>
  );
}

function Orbiter({ radius, speed, phase, y, children }: { radius: number; speed: number; phase: number; y: number; children: React.ReactNode }) {
  const ref = useRef<THREE.Group>(null);
  useFrame((state) => {
    const a = state.clock.elapsedTime * speed + phase;
    if (!ref.current) return;
    ref.current.position.set(Math.cos(a) * radius, y + Math.sin(a * 1.3) * 0.15, Math.sin(a) * radius * 0.55 - 0.2);
    ref.current.rotation.y = -a * 0.5;
  });
  return <group ref={ref}>{children}</group>;
}

function Leaf() {
  const geo = useMemo(() => leafGeometry(), []);
  useEffect(() => () => geo.dispose(), [geo]);
  return (
    <mesh geometry={geo} rotation={[0, 0, -0.5]} scale={0.7}>
      <meshPhysicalMaterial color="#b6f23a" roughness={0.3} clearcoat={1} emissive="#3f6a00" emissiveIntensity={0.2} />
    </mesh>
  );
}

function Arrow() {
  return (
    <group rotation={[0, 0, -0.7]} scale={0.8}>
      <mesh position={[0, -0.15, 0]}>
        <cylinderGeometry args={[0.07, 0.07, 0.7, 20]} />
        <meshPhysicalMaterial color="#b6f23a" roughness={0.3} clearcoat={1} />
      </mesh>
      <mesh position={[0, 0.34, 0]}>
        <coneGeometry args={[0.2, 0.38, 24]} />
        <meshPhysicalMaterial color="#b6f23a" roughness={0.3} clearcoat={1} />
      </mesh>
    </group>
  );
}

function BrowserWindow() {
  return (
    <group scale={0.85}>
      <RoundedBox args={[1.5, 1, 0.09]} radius={0.07} smoothness={3}>
        <meshPhysicalMaterial color="#19352c" roughness={0.35} metalness={0.1} clearcoat={0.8} />
      </RoundedBox>
      <mesh position={[0, 0.36, 0.05]}>
        <boxGeometry args={[1.4, 0.16, 0.02]} />
        <meshStandardMaterial color="#0f1412" />
      </mesh>
      {[-0.6, -0.5, -0.4].map((x, i) => (
        <mesh key={x} position={[x, 0.36, 0.07]}>
          <sphereGeometry args={[0.035, 12, 12]} />
          <meshStandardMaterial color={i === 2 ? "#b6f23a" : "#9fb0a7"} />
        </mesh>
      ))}
      <mesh position={[-0.28, 0.05, 0.05]}>
        <boxGeometry args={[0.8, 0.12, 0.02]} />
        <meshStandardMaterial color="#b6f23a" />
      </mesh>
      <mesh position={[-0.38, -0.15, 0.05]}>
        <boxGeometry args={[0.6, 0.07, 0.02]} />
        <meshStandardMaterial color="#9fb0a7" />
      </mesh>
      <mesh position={[0.4, -0.18, 0.05]}>
        <boxGeometry args={[0.4, 0.38, 0.02]} />
        <meshStandardMaterial color="#14705a" />
      </mesh>
    </group>
  );
}

function Phone() {
  return (
    <group scale={0.85} rotation={[0, 0, 0.15]}>
      <RoundedBox args={[0.58, 1.1, 0.09]} radius={0.08} smoothness={3}>
        <meshPhysicalMaterial color="#0f1412" roughness={0.25} metalness={0.3} clearcoat={1} />
      </RoundedBox>
      <mesh position={[0, 0, 0.05]}>
        <boxGeometry args={[0.5, 1.0, 0.01]} />
        <meshStandardMaterial color="#14705a" />
      </mesh>
      <mesh position={[0, 0.2, 0.06]}>
        <boxGeometry args={[0.36, 0.3, 0.01]} />
        <meshStandardMaterial color="#b6f23a" />
      </mesh>
      <mesh position={[0, -0.18, 0.06]}>
        <boxGeometry args={[0.36, 0.08, 0.01]} />
        <meshStandardMaterial color="#9fb0a7" />
      </mesh>
    </group>
  );
}

export interface HeroSceneProps {
  quality: "low" | "high";
  active: boolean;
  onReady: () => void;
}

export default function HeroScene({ quality, active, onReady }: HeroSceneProps) {
  const pointer = useRef({ x: 0, y: 0, moved: false });

  // Track the pointer across the whole window so the mark follows the cursor anywhere in the hero.
  useEffect(() => {
    const onMove = (e: PointerEvent) => {
      if (e.pointerType !== "mouse") return;
      pointer.current.x = (e.clientX / window.innerWidth) * 2 - 1;
      pointer.current.y = (e.clientY / window.innerHeight) * 2 - 1;
      pointer.current.moved = true;
    };
    window.addEventListener("pointermove", onMove, { passive: true });
    return () => window.removeEventListener("pointermove", onMove);
  }, []);

  const high = quality === "high";
  return (
    <Canvas
      frameloop={active ? "always" : "never"}
      dpr={high ? [1, 1.75] : 1}
      camera={{ position: [0, 0.1, 7.6], fov: 38 }}
      gl={{ antialias: high, alpha: true, powerPreference: "high-performance" }}
      onCreated={({ gl }) => {
        gl.setClearColor(0x000000, 0);
        gl.toneMapping = THREE.ACESFilmicToneMapping;
        gl.toneMappingExposure = 1.05;
        onReady();
      }}
      aria-hidden="true"
    >
      <ambientLight intensity={0.35} />
      <directionalLight position={[3, 4, 5]} intensity={2.4} color="#f4ffd9" />
      <directionalLight position={[-4, -1, 3]} intensity={0.9} color="#14705a" />
      <Environment resolution={128} frames={1}>
        <Lightformer form="rect" intensity={4} position={[0, 5, -4]} scale={[10, 4, 1]} />
        <Lightformer form="rect" intensity={2.2} position={[-5, 1, 2]} rotation-y={Math.PI / 2} scale={[8, 3, 1]} color="#b6f23a" />
        <Lightformer form="ring" intensity={3} position={[4, 2, 3]} scale={4} color="#6ee7b7" />
      </Environment>

      <Mark pointer={pointer} />

      {high && (
        <>
          <Orbiter radius={2.35} speed={0.32} phase={0} y={1.15}>
            <Float speed={2} rotationIntensity={0.6} floatIntensity={0.5}>
              <BrowserWindow />
            </Float>
          </Orbiter>
          <Orbiter radius={2.4} speed={0.32} phase={Math.PI / 2} y={-1.0}>
            <Float speed={2.4} rotationIntensity={0.8} floatIntensity={0.5}>
              <Phone />
            </Float>
          </Orbiter>
          <Orbiter radius={2.3} speed={0.32} phase={Math.PI} y={1.3}>
            <Float speed={1.8} rotationIntensity={0.9} floatIntensity={0.6}>
              <Leaf />
            </Float>
          </Orbiter>
          <Orbiter radius={2.35} speed={0.32} phase={(3 * Math.PI) / 2} y={-1.3}>
            <Float speed={2.2} rotationIntensity={0.9} floatIntensity={0.6}>
              <Arrow />
            </Float>
          </Orbiter>
        </>
      )}
    </Canvas>
  );
}
