import { Suspense, useMemo, useRef } from "react";
import { Canvas, useFrame } from "@react-three/fiber";
import {
  ContactShadows,
  Float,
  Html,
  Line,
  RoundedBox,
  Sparkles,
} from "@react-three/drei";
import * as THREE from "three";

const BELT_RADIUS = 1.7;
const BELT_HEIGHT = 0.95;

const HeartShape = ({ scale = 1 }: { scale?: number }) => {
  const geometry = useMemo(() => {
    const shape = new THREE.Shape();
    const x = 0;
    const y = 0;
    shape.moveTo(x, y);
    shape.bezierCurveTo(x, y - 0.3, x - 0.6, y - 0.3, x - 0.6, y + 0.2);
    shape.bezierCurveTo(x - 0.6, y + 0.55, x - 0.3, y + 0.75, x, y + 1.05);
    shape.bezierCurveTo(x + 0.3, y + 0.75, x + 0.6, y + 0.55, x + 0.6, y + 0.2);
    shape.bezierCurveTo(x + 0.6, y - 0.3, x, y - 0.3, x, y);
    const geo = new THREE.ExtrudeGeometry(shape, {
      depth: 0.18,
      bevelEnabled: true,
      bevelSegments: 4,
      bevelSize: 0.05,
      bevelThickness: 0.05,
      curveSegments: 24,
    });
    geo.center();
    geo.rotateZ(Math.PI);
    return geo;
  }, []);

  const ref = useRef<THREE.Mesh>(null);
  useFrame((state) => {
    if (!ref.current) return;
    const t = state.clock.elapsedTime;
    const pulse = 1 + Math.sin(t * 2.4) * 0.1;
    ref.current.scale.setScalar(scale * pulse);
    const mat = ref.current.material as THREE.MeshStandardMaterial;
    mat.emissiveIntensity = 1.8 + Math.sin(t * 2.4) * 0.7;
  });

  return (
    <mesh ref={ref} geometry={geometry}>
      <meshStandardMaterial
        color="#ff6fa3"
        emissive="#ff4d8d"
        emissiveIntensity={2}
        roughness={0.25}
        metalness={0.2}
      />
    </mesh>
  );
};

type LabelProps = {
  text: string;
  position: [number, number, number];
  color: string;
  anchorPosition: [number, number, number];
};

const FloatingLabel = ({ text, position, color, anchorPosition }: LabelProps) => {
  const linePoints = useMemo(
    () => [
      new THREE.Vector3(...anchorPosition),
      new THREE.Vector3(...position),
    ],
    [position, anchorPosition],
  );

  return (
    <group>
      <Line
        points={linePoints}
        color={color}
        lineWidth={1.2}
        transparent
        opacity={0.6}
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
            style={{
              pointerEvents: "none",
              userSelect: "none",
              whiteSpace: "nowrap",
            }}
          >
            <div
              style={{
                display: "flex",
                alignItems: "center",
                gap: 6,
                padding: "5px 10px",
                borderRadius: 999,
                background: "rgba(11, 18, 39, 0.72)",
                border: `1px solid ${color}66`,
                color: "#fff",
                fontFamily:
                  "ui-sans-serif, system-ui, -apple-system, Segoe UI, Roboto",
                fontSize: 12,
                fontWeight: 600,
                letterSpacing: 1,
                boxShadow: `0 0 14px ${color}55`,
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
              {text}
            </div>
          </Html>
        </group>
      </Float>
    </group>
  );
};

const SensorPod = () => {
  const ledRef = useRef<THREE.Group>(null);

  useFrame((state) => {
    if (!ledRef.current) return;
    const t = state.clock.elapsedTime;
    ledRef.current.children.forEach((child, i) => {
      const mesh = child as THREE.Mesh;
      const mat = mesh.material as THREE.MeshStandardMaterial;
      mat.emissiveIntensity = 1.6 + Math.sin(t * 3 + i * 0.8) * 1.5;
    });
  });

  return (
    <group position={[0, 0, BELT_RADIUS - 0.05]}>
      {/* Pod outer body - cyan glossy */}
      <RoundedBox args={[1.15, 0.85, 0.34]} radius={0.17} smoothness={6}>
        <meshPhysicalMaterial
          color="#0e7490"
          roughness={0.15}
          metalness={0.7}
          clearcoat={1}
          clearcoatRoughness={0.05}
          emissive="#0891b2"
          emissiveIntensity={0.35}
          envMapIntensity={1.2}
        />
      </RoundedBox>

      {/* Bezel ring around dome */}
      <mesh position={[0, 0, 0.18]}>
        <torusGeometry args={[0.36, 0.022, 16, 64]} />
        <meshStandardMaterial color="#cbd5e1" metalness={0.95} roughness={0.15} />
      </mesh>

      {/* Translucent glass dome */}
      <mesh position={[0, 0, 0.19]}>
        <sphereGeometry args={[0.34, 48, 48, 0, Math.PI * 2, 0, Math.PI / 2]} />
        <meshPhysicalMaterial
          color="#a5f3fc"
          transparent
          opacity={0.35}
          transmission={0.9}
          roughness={0}
          thickness={0.3}
          clearcoat={1}
          ior={1.4}
        />
      </mesh>

      {/* Inner glow disc behind heart */}
      <mesh position={[0, 0, 0.1]}>
        <circleGeometry args={[0.3, 48]} />
        <meshBasicMaterial color="#67e8f9" transparent opacity={0.55} />
      </mesh>

      {/* Heart core */}
      <group position={[0, 0, 0.22]} scale={0.34}>
        <HeartShape />
      </group>

      {/* Status LEDs row */}
      <group ref={ledRef} position={[0, -0.32, 0.18]}>
        {[-0.24, 0, 0.24].map((x, i) => (
          <mesh key={i} position={[x, 0, 0]}>
            <sphereGeometry args={[0.04, 16, 16]} />
            <meshStandardMaterial
              color={i === 0 ? "#7DCBF4" : i === 1 ? "#F7C0D8" : "#a7f3d0"}
              emissive={i === 0 ? "#7DCBF4" : i === 1 ? "#F7C0D8" : "#a7f3d0"}
              emissiveIntensity={2.5}
            />
          </mesh>
        ))}
      </group>

      {/* Top brand bar */}
      <mesh position={[0, 0.34, 0.18]}>
        <boxGeometry args={[0.5, 0.03, 0.001]} />
        <meshStandardMaterial color="#67e8f9" emissive="#67e8f9" emissiveIntensity={1.2} />
      </mesh>
    </group>
  );
};

const Belt = () => {
  const beltRef = useRef<THREE.Group>(null);

  useFrame((state) => {
    if (!beltRef.current) return;
    const t = state.clock.elapsedTime;
    const breathe = 1 + Math.sin(t * 1.2) * 0.012;
    beltRef.current.scale.set(breathe, breathe, breathe);
  });

  return (
    <group ref={beltRef}>
      {/* Outer fabric band - soft blue / silver lavender */}
      <mesh>
        <cylinderGeometry
          args={[BELT_RADIUS, BELT_RADIUS, BELT_HEIGHT, 96, 1, true]}
        />
        <meshPhysicalMaterial
          color="#c7d2fe"
          roughness={0.65}
          metalness={0.25}
          sheen={1}
          sheenColor={new THREE.Color("#a5b4fc")}
          sheenRoughness={0.5}
          side={THREE.DoubleSide}
          clearcoat={0.4}
          clearcoatRoughness={0.3}
        />
      </mesh>

      {/* Inner padded layer (lavender) */}
      <mesh>
        <cylinderGeometry
          args={[BELT_RADIUS - 0.08, BELT_RADIUS - 0.08, BELT_HEIGHT - 0.05, 96, 1, true]}
        />
        <meshStandardMaterial
          color="#818cf8"
          roughness={1}
          metalness={0}
          side={THREE.DoubleSide}
          emissive="#6366f1"
          emissiveIntensity={0.1}
        />
      </mesh>

      {/* Top stitching */}
      <mesh position={[0, BELT_HEIGHT / 2 - 0.05, 0]} rotation={[Math.PI / 2, 0, 0]}>
        <torusGeometry args={[BELT_RADIUS + 0.005, 0.012, 8, 128]} />
        <meshStandardMaterial color="#475569" roughness={0.4} />
      </mesh>

      {/* Bottom stitching */}
      <mesh position={[0, -BELT_HEIGHT / 2 + 0.05, 0]} rotation={[Math.PI / 2, 0, 0]}>
        <torusGeometry args={[BELT_RADIUS + 0.005, 0.012, 8, 128]} />
        <meshStandardMaterial color="#475569" roughness={0.4} />
      </mesh>

      {/* Top trim accent (cyan) */}
      <mesh position={[0, BELT_HEIGHT / 2 - 0.005, 0]} rotation={[Math.PI / 2, 0, 0]}>
        <torusGeometry args={[BELT_RADIUS + 0.012, 0.022, 12, 128]} />
        <meshStandardMaterial
          color="#67e8f9"
          emissive="#67e8f9"
          emissiveIntensity={0.7}
          roughness={0.4}
        />
      </mesh>

      {/* Bottom trim accent (pink) */}
      <mesh position={[0, -BELT_HEIGHT / 2 + 0.005, 0]} rotation={[Math.PI / 2, 0, 0]}>
        <torusGeometry args={[BELT_RADIUS + 0.012, 0.022, 12, 128]} />
        <meshStandardMaterial
          color="#F7C0D8"
          emissive="#F7C0D8"
          emissiveIntensity={0.7}
          roughness={0.4}
        />
      </mesh>

      {/* Vertical seam decoration on sides */}
      {[Math.PI * 0.32, -Math.PI * 0.32].map((angle, i) => (
        <mesh
          key={i}
          position={[
            Math.sin(angle) * (BELT_RADIUS + 0.012),
            0,
            Math.cos(angle) * (BELT_RADIUS + 0.012),
          ]}
          rotation={[0, angle, 0]}
        >
          <boxGeometry args={[0.018, BELT_HEIGHT - 0.1, 0.025]} />
          <meshStandardMaterial color="#475569" roughness={0.5} />
        </mesh>
      ))}

      {/* Front sensor pod */}
      <SensorPod />
    </group>
  );
};

const Scene = () => {
  const groupRef = useRef<THREE.Group>(null);

  useFrame((state) => {
    if (!groupRef.current) return;
    const t = state.clock.elapsedTime;
    const mx = state.mouse.x;
    const my = state.mouse.y;

    // 3/4 perspective base + slow continuous rotation + parallax
    const baseY = -0.45;
    const baseX = -0.12;
    const slowRotate = t * 0.12; // continuous slow rotation
    const swayX = Math.sin(t * 0.7) * 0.03;

    groupRef.current.rotation.y = THREE.MathUtils.lerp(
      groupRef.current.rotation.y,
      baseY + slowRotate * 0.3 + Math.sin(t * 0.5) * 0.08 + mx * 0.18,
      0.05,
    );
    groupRef.current.rotation.x = THREE.MathUtils.lerp(
      groupRef.current.rotation.x,
      baseX + swayX - my * 0.08,
      0.05,
    );
    // Slow float up/down
    groupRef.current.position.y = Math.sin(t * 0.8) * 0.08;
  });

  return (
    <group ref={groupRef} scale={1.6}>
      <Belt />

      {/* Floating labels with anchor lines into belt */}
      <FloatingLabel
        text="ECG"
        position={[2.6, 1.0, 0.5]}
        anchorPosition={[1.2, 0.3, 0.8]}
        color="#ff6fa3"
      />
      <FloatingLabel
        text="SpO₂"
        position={[-2.7, 0.85, 0.4]}
        anchorPosition={[-1.2, 0.3, 0.8]}
        color="#7DCBF4"
      />
      <FloatingLabel
        text="TEMP"
        position={[2.5, -0.95, 0.6]}
        anchorPosition={[1.2, -0.3, 0.8]}
        color="#F7C0D8"
      />
      <FloatingLabel
        text="AI SYNC"
        position={[-2.6, -0.95, 0.5]}
        anchorPosition={[-1.2, -0.3, 0.8]}
        color="#a7f3d0"
      />

      <Sparkles
        count={70}
        scale={[6, 4, 6]}
        size={2.4}
        color="#B8A2F4"
        speed={0.35}
        opacity={0.7}
      />
    </group>
  );
};

const PulseRings = () => {
  const refs = [useRef<THREE.Mesh>(null), useRef<THREE.Mesh>(null), useRef<THREE.Mesh>(null)];

  useFrame((state) => {
    const t = state.clock.elapsedTime;
    refs.forEach((r, i) => {
      if (!r.current) return;
      const phase = (t + i * 1.0) % 3;
      const s = 1 + (phase / 3) * 1.8;
      const o = 1 - phase / 3;
      r.current.scale.set(s, 1, s);
      const mat = r.current.material as THREE.MeshBasicMaterial;
      mat.opacity = o * 0.4;
    });
  });

  return (
    <group position={[0, -1.5, 0]}>
      {refs.map((r, i) => (
        <mesh key={i} ref={r} rotation={[Math.PI / 2, 0, 0]}>
          <ringGeometry args={[BELT_RADIUS + 0.05, BELT_RADIUS + 0.12, 80]} />
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
      style={{ height: "min(80vh, 600px)" }}
    >
      {/* Faint gradient halo backdrop for visibility */}
      <div
        className="pointer-events-none absolute inset-0 -z-10"
        style={{
          background:
            "radial-gradient(circle at 50% 55%, rgba(167,139,250,0.28) 0%, rgba(125,203,244,0.18) 30%, rgba(247,192,216,0.12) 55%, rgba(255,255,255,0) 75%)",
          filter: "blur(8px)",
        }}
      />

      <Canvas
        style={{ width: "100%", height: "100%" }}
        camera={{ position: [0, 0, 6], fov: 45 }}
        dpr={[1, 1.8]}
        gl={{ antialias: true, alpha: true }}
      >
        <Suspense fallback={null}>
          <ambientLight intensity={1.4} />
          <directionalLight position={[5, 5, 5]} intensity={2} color="#ffffff" />
          <pointLight position={[-5, 3, 5]} intensity={1.5} color="#a5f3fc" />
          <hemisphereLight intensity={1} groundColor="#1e293b" color="#ffffff" />
          <spotLight position={[0, 4, 4]} intensity={0.9} angle={0.7} penumbra={0.5} color="#7DCBF4" />
          <Scene />
          <PulseRings />
          <ContactShadows
            position={[0, -1.7, 0]}
            opacity={0.55}
            scale={9}
            blur={2.5}
            far={4}
            color="#1e1b4b"
          />
        </Suspense>
      </Canvas>
    </div>
  );
};

export default SmartBelt3D;
