import { Suspense, useMemo, useRef } from "react";
import { Canvas, useFrame } from "@react-three/fiber";
import {
  ContactShadows,
  Float,
  Html,
  Line,
  Sparkles,
} from "@react-three/drei";
import * as THREE from "three";

/* ------------------------------------------------------------------
   MOTHER SILHOUETTE — side profile, abstract & elegant
   Drawn as a 2D Shape and extruded for a sculpted 3D form.
------------------------------------------------------------------ */
const buildMotherShape = () => {
  const s = new THREE.Shape();
  // Start at top-back of head, going clockwise over the head
  s.moveTo(-0.2, 3.25);
  s.quadraticCurveTo(0.0, 3.55, 0.22, 3.2);
  // Forehead → smooth face (no features, abstract)
  s.bezierCurveTo(0.32, 2.95, 0.28, 2.82, 0.16, 2.72);
  // Neck front
  s.lineTo(0.18, 2.5);
  // Chest / breast curve forward
  s.bezierCurveTo(0.46, 2.45, 0.58, 2.25, 0.36, 2.05);
  // Belly bulge — the iconic pregnant curve
  s.bezierCurveTo(0.62, 1.95, 1.08, 1.6, 1.0, 1.15);
  s.bezierCurveTo(0.95, 0.78, 0.55, 0.68, 0.36, 0.6);
  // Hip front → thigh
  s.bezierCurveTo(0.42, 0.25, 0.34, -0.25, 0.3, -0.65);
  // Shin → foot front
  s.lineTo(0.32, -1.4);
  s.lineTo(0.46, -1.52);
  // Under foot
  s.lineTo(-0.18, -1.52);
  s.lineTo(-0.08, -1.4);
  // Calf back
  s.lineTo(-0.12, -0.6);
  // Thigh back → buttock
  s.bezierCurveTo(-0.06, -0.2, -0.04, 0.3, -0.36, 0.75);
  // Lower back curve in
  s.bezierCurveTo(-0.42, 1.05, -0.22, 1.25, -0.16, 1.55);
  // Mid back → upper back
  s.bezierCurveTo(-0.18, 1.95, -0.22, 2.4, -0.18, 2.7);
  // Back of neck
  s.lineTo(-0.08, 2.84);
  // Back of head closes the loop
  s.bezierCurveTo(-0.26, 2.92, -0.3, 3.12, -0.2, 3.25);
  return s;
};

const MotherSilhouette = () => {
  const geometry = useMemo(() => {
    const shape = buildMotherShape();
    const geo = new THREE.ExtrudeGeometry(shape, {
      depth: 0.45,
      bevelEnabled: true,
      bevelSegments: 6,
      bevelSize: 0.08,
      bevelThickness: 0.08,
      curveSegments: 48,
    });
    geo.center();
    return geo;
  }, []);

  // Subtle gradient by overlaying a soft lavender mesh on top
  const ref = useRef<THREE.Mesh>(null);

  return (
    <group>
      {/* Main sculpted body — pearlescent lavender / blue */}
      <mesh ref={ref} geometry={geometry} castShadow receiveShadow>
        <meshPhysicalMaterial
          color="#e0e7ff"
          roughness={0.35}
          metalness={0.15}
          clearcoat={1}
          clearcoatRoughness={0.15}
          sheen={1}
          sheenColor={new THREE.Color("#c7b8ff")}
          sheenRoughness={0.4}
          envMapIntensity={1.2}
          emissive="#a5b4fc"
          emissiveIntensity={0.08}
        />
      </mesh>

      {/* Soft inner glow rim — slightly smaller, behind */}
      <mesh
        geometry={geometry}
        position={[0, 0, -0.15]}
        scale={[1.04, 1.04, 0.6]}
      >
        <meshBasicMaterial
          color="#a5b4fc"
          transparent
          opacity={0.18}
        />
      </mesh>
    </group>
  );
};

/* ------------------------------------------------------------------
   BABY CURL — small abstract curled-baby silhouette inside the womb
------------------------------------------------------------------ */
const buildBabyShape = () => {
  const s = new THREE.Shape();
  // Curled baby — head bigger, body curling around
  // Start at top of head
  s.moveTo(0, 0.5);
  s.bezierCurveTo(0.4, 0.5, 0.45, 0.1, 0.25, -0.05);
  s.bezierCurveTo(0.45, -0.2, 0.4, -0.45, 0.15, -0.5);
  s.bezierCurveTo(-0.1, -0.55, -0.35, -0.4, -0.4, -0.15);
  s.bezierCurveTo(-0.45, 0.05, -0.35, 0.25, -0.2, 0.3);
  s.bezierCurveTo(-0.35, 0.4, -0.3, 0.55, 0, 0.5);
  return s;
};

const BabyInWomb = () => {
  const geometry = useMemo(() => {
    const shape = buildBabyShape();
    const geo = new THREE.ExtrudeGeometry(shape, {
      depth: 0.12,
      bevelEnabled: true,
      bevelSegments: 4,
      bevelSize: 0.04,
      bevelThickness: 0.04,
      curveSegments: 24,
    });
    geo.center();
    return geo;
  }, []);

  const groupRef = useRef<THREE.Group>(null);
  const auraRef = useRef<THREE.Mesh>(null);
  const haloRef = useRef<THREE.Mesh>(null);

  useFrame((state) => {
    const t = state.clock.elapsedTime;
    if (groupRef.current) {
      // Heartbeat pulse on baby
      const pulse = 1 + Math.sin(t * 2.6) * 0.06 + Math.sin(t * 5.2) * 0.02;
      groupRef.current.scale.setScalar(pulse * 0.55);
      const mat = (groupRef.current.children[0] as THREE.Mesh).material as THREE.MeshStandardMaterial;
      mat.emissiveIntensity = 1.2 + Math.sin(t * 2.6) * 0.6;
    }
    if (auraRef.current) {
      const s = 1 + Math.sin(t * 1.5) * 0.08;
      auraRef.current.scale.set(s, s, 1);
      const mat = auraRef.current.material as THREE.MeshBasicMaterial;
      mat.opacity = 0.3 + Math.sin(t * 1.5) * 0.1;
    }
    if (haloRef.current) {
      haloRef.current.rotation.z = t * 0.3;
    }
  });

  // Position baby inside the belly bulge area of the mother shape
  // Mother is centered, belly center roughly at original (~0.6, ~1.3) in shape coords.
  // After geo.center() the centroid shifts, so we tune visually:
  const wombPos: [number, number, number] = [0.45, 0.05, 0.3];

  return (
    <group position={wombPos}>
      {/* Soft golden glow disc behind baby */}
      <mesh position={[0, 0, -0.05]}>
        <circleGeometry args={[0.7, 48]} />
        <meshBasicMaterial color="#fde68a" transparent opacity={0.55} />
      </mesh>

      {/* Outer protection aura */}
      <mesh ref={auraRef} position={[0, 0, -0.08]}>
        <ringGeometry args={[0.7, 0.85, 64]} />
        <meshBasicMaterial color="#fbbf24" transparent opacity={0.35} side={THREE.DoubleSide} />
      </mesh>

      {/* Rotating halo of dashes */}
      <mesh ref={haloRef} position={[0, 0, -0.04]}>
        <ringGeometry args={[0.95, 1.0, 64, 1, 0, Math.PI * 1.6]} />
        <meshBasicMaterial color="#a5f3fc" transparent opacity={0.55} side={THREE.DoubleSide} />
      </mesh>

      {/* Baby curl */}
      <group ref={groupRef}>
        <mesh geometry={geometry}>
          <meshStandardMaterial
            color="#fbcfe8"
            emissive="#f472b6"
            emissiveIntensity={1.4}
            roughness={0.35}
            metalness={0.1}
          />
        </mesh>
      </group>

      {/* Heartbeat point light inside womb */}
      <pointLight
        color="#fbbf24"
        intensity={2.2}
        distance={3}
        decay={2}
      />
    </group>
  );
};

/* ------------------------------------------------------------------
   FLOATING BADGES around the model
------------------------------------------------------------------ */
type BadgeProps = {
  text: string;
  position: [number, number, number];
  anchor: [number, number, number];
  color: string;
  icon: string;
};

const Badge = ({ text, position, anchor, color, icon }: BadgeProps) => {
  const linePoints = useMemo(
    () => [new THREE.Vector3(...anchor), new THREE.Vector3(...position)],
    [position, anchor],
  );

  return (
    <group>
      <Line
        points={linePoints}
        color={color}
        lineWidth={1.2}
        transparent
        opacity={0.55}
        dashed
        dashScale={20}
        dashSize={0.06}
        gapSize={0.04}
      />
      <Float speed={1.4} rotationIntensity={0} floatIntensity={0.3}>
        <group position={position}>
          <Html
            center
            distanceFactor={6}
            style={{ pointerEvents: "none", userSelect: "none", whiteSpace: "nowrap" }}
          >
            <div
              style={{
                display: "flex",
                alignItems: "center",
                gap: 8,
                padding: "6px 12px",
                borderRadius: 999,
                background: "rgba(15, 23, 42, 0.72)",
                border: `1px solid ${color}66`,
                color: "#fff",
                fontFamily:
                  "ui-sans-serif, system-ui, -apple-system, Segoe UI, Roboto",
                fontSize: 12,
                fontWeight: 600,
                letterSpacing: 0.6,
                boxShadow: `0 0 16px ${color}55`,
                backdropFilter: "blur(6px)",
              }}
            >
              <span
                style={{
                  width: 7,
                  height: 7,
                  borderRadius: "50%",
                  background: color,
                  boxShadow: `0 0 10px ${color}`,
                }}
              />
              <span style={{ opacity: 0.9 }}>{icon}</span>
              {text}
            </div>
          </Html>
        </group>
      </Float>
    </group>
  );
};

/* ------------------------------------------------------------------
   SCENE
------------------------------------------------------------------ */
const Scene = () => {
  const groupRef = useRef<THREE.Group>(null);

  useFrame((state) => {
    if (!groupRef.current) return;
    const t = state.clock.elapsedTime;
    const mx = state.mouse.x;
    const my = state.mouse.y;

    // Gentle breathing & sway
    const breathe = 1 + Math.sin(t * 1.0) * 0.012;
    groupRef.current.scale.set(breathe * 1.15, breathe * 1.15, breathe * 1.15);

    // Mouse parallax (very subtle so it stays graceful)
    groupRef.current.rotation.y = THREE.MathUtils.lerp(
      groupRef.current.rotation.y,
      mx * 0.12 + Math.sin(t * 0.4) * 0.05,
      0.05,
    );
    groupRef.current.rotation.x = THREE.MathUtils.lerp(
      groupRef.current.rotation.x,
      -my * 0.06,
      0.05,
    );
    // Float up & down softly
    groupRef.current.position.y = Math.sin(t * 0.7) * 0.06;
  });

  return (
    <group ref={groupRef}>
      <MotherSilhouette />
      <BabyInWomb />

      {/* Floating badges */}
      <Badge
        text="LIVE MONITORING"
        position={[2.6, 2.0, 0.6]}
        anchor={[0.6, 1.6, 0.4]}
        color="#7DCBF4"
        icon="●"
      />
      <Badge
        text="AI CARE"
        position={[-2.6, 1.4, 0.4]}
        anchor={[-0.4, 1.2, 0.4]}
        color="#a78bfa"
        icon="✦"
      />
      <Badge
        text="BABY SAFE"
        position={[2.7, 0.0, 0.7]}
        anchor={[0.9, 0.1, 0.4]}
        color="#fbbf24"
        icon="♥"
      />
      <Badge
        text="SECURE HEALTH"
        position={[-2.6, -0.4, 0.5]}
        anchor={[-0.4, -0.4, 0.4]}
        color="#a7f3d0"
        icon="✓"
      />
      <Badge
        text="REAL-TIME SYNC"
        position={[2.5, -1.6, 0.6]}
        anchor={[0.4, -1.2, 0.4]}
        color="#F7C0D8"
        icon="↻"
      />

      <Sparkles
        count={90}
        scale={[8, 6, 6]}
        size={2.4}
        color="#c4b5fd"
        speed={0.3}
        opacity={0.65}
      />
    </group>
  );
};

const PulseRings = () => {
  const refs = [
    useRef<THREE.Mesh>(null),
    useRef<THREE.Mesh>(null),
    useRef<THREE.Mesh>(null),
  ];

  useFrame((state) => {
    const t = state.clock.elapsedTime;
    refs.forEach((r, i) => {
      if (!r.current) return;
      const phase = (t + i * 1.0) % 3;
      const s = 1 + (phase / 3) * 1.6;
      const o = 1 - phase / 3;
      r.current.scale.set(s, 1, s);
      const mat = r.current.material as THREE.MeshBasicMaterial;
      mat.opacity = o * 0.4;
    });
  });

  return (
    <group position={[0, -1.8, 0]}>
      {refs.map((r, i) => (
        <mesh key={i} ref={r} rotation={[Math.PI / 2, 0, 0]}>
          <ringGeometry args={[1.6, 1.7, 80]} />
          <meshBasicMaterial
            color="#a78bfa"
            transparent
            opacity={0.4}
            side={THREE.DoubleSide}
          />
        </mesh>
      ))}
    </group>
  );
};

export const SmartBelt3D = () => {
  return (
    <div
      className="relative z-10 mx-auto w-full overflow-visible"
      style={{ height: "min(80vh, 620px)" }}
    >
      {/* Faint pastel gradient halo behind sculpture */}
      <div
        className="pointer-events-none absolute inset-0 -z-10"
        style={{
          background:
            "radial-gradient(circle at 50% 55%, rgba(196,181,253,0.32) 0%, rgba(165,243,252,0.22) 30%, rgba(251,207,232,0.18) 55%, rgba(255,255,255,0) 78%)",
          filter: "blur(8px)",
        }}
      />

      <Canvas
        style={{ width: "100%", height: "100%" }}
        camera={{ position: [0, 0.4, 6.5], fov: 42 }}
        dpr={[1, 1.8]}
        gl={{ antialias: true, alpha: true }}
      >
        <Suspense fallback={null}>
          <ambientLight intensity={1.1} />
          <directionalLight position={[5, 5, 5]} intensity={1.8} color="#ffffff" />
          <pointLight position={[-5, 3, 5]} intensity={1.3} color="#a5f3fc" />
          <pointLight position={[3, -2, 4]} intensity={0.9} color="#fbcfe8" />
          <hemisphereLight intensity={0.9} groundColor="#312e81" color="#ffffff" />
          <spotLight
            position={[0, 4, 4]}
            intensity={0.9}
            angle={0.7}
            penumbra={0.5}
            color="#c4b5fd"
          />
          <Scene />
          <PulseRings />
          <ContactShadows
            position={[0, -1.95, 0]}
            opacity={0.5}
            scale={9}
            blur={2.6}
            far={4}
            color="#1e1b4b"
          />
        </Suspense>
      </Canvas>
    </div>
  );
};

export default SmartBelt3D;
