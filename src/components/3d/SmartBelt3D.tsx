import { Suspense, useMemo, useRef } from "react";
import { Canvas, useFrame } from "@react-three/fiber";
import {
  Environment,
  Float,
  Line,
  RoundedBox,
  Sparkles,
  Text,
} from "@react-three/drei";
import * as THREE from "three";

const BELT_RADIUS = 1.7;
const BELT_HEIGHT = 0.85;

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
    const pulse = 1 + Math.sin(t * 2.4) * 0.08;
    ref.current.scale.setScalar(scale * pulse);
    const mat = ref.current.material as THREE.MeshStandardMaterial;
    mat.emissiveIntensity = 1.6 + Math.sin(t * 2.4) * 0.6;
  });

  return (
    <mesh ref={ref} geometry={geometry}>
      <meshStandardMaterial
        color="#ff6fa3"
        emissive="#ff4d8d"
        emissiveIntensity={1.8}
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
};

const FloatingLabel = ({ text, position, color }: LabelProps) => {
  const linePoints = useMemo(() => {
    return [
      new THREE.Vector3(position[0] * 0.55, position[1] * 0.55, position[2] * 0.55),
      new THREE.Vector3(position[0], position[1], position[2]),
    ];
  }, [position]);

  return (
    <Float speed={1.4} rotationIntensity={0} floatIntensity={0.35}>
      <group position={position}>
        {/* Pill background */}
        <mesh>
          <planeGeometry args={[0.95, 0.34]} />
          <meshBasicMaterial color="#0b1227" transparent opacity={0.55} />
        </mesh>
        <mesh position={[0, 0, 0.001]}>
          <ringGeometry args={[0.16, 0.18, 32]} />
          <meshBasicMaterial color={color} transparent opacity={0.9} />
        </mesh>
        {/* LED dot */}
        <mesh position={[-0.36, 0, 0.01]}>
          <sphereGeometry args={[0.05, 16, 16]} />
          <meshStandardMaterial color={color} emissive={color} emissiveIntensity={2.5} />
        </mesh>
        {/* Text */}
        <Text
          position={[0.05, 0, 0.01]}
          fontSize={0.18}
          color="#ffffff"
          anchorX="center"
          anchorY="middle"
          font="https://fonts.gstatic.com/s/inter/v12/UcC73FwrK3iLTeHuS_fvQtMwCp50KnMa1ZL7.woff"
        >
          {text}
        </Text>
      </group>
      {/* Connecting line */}
      <Line
        points={linePoints}
        color={color}
        lineWidth={1}
        transparent
        opacity={0.55}
        dashed
        dashScale={20}
        dashSize={0.05}
        gapSize={0.05}
      />
    </Float>
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
      mat.emissiveIntensity = 1.5 + Math.sin(t * 3 + i * 0.8) * 1.5;
    });
  });

  return (
    <group position={[0, 0, BELT_RADIUS - 0.05]}>
      {/* Pod body */}
      <RoundedBox args={[1.05, 0.78, 0.32]} radius={0.16} smoothness={6}>
        <meshPhysicalMaterial
          color="#f8fafc"
          roughness={0.2}
          metalness={0.55}
          clearcoat={1}
          clearcoatRoughness={0.05}
          envMapIntensity={1}
        />
      </RoundedBox>

      {/* Pod inner bezel ring */}
      <mesh position={[0, 0, 0.165]}>
        <torusGeometry args={[0.32, 0.018, 16, 64]} />
        <meshStandardMaterial color="#9ca3af" metalness={0.9} roughness={0.2} />
      </mesh>

      {/* Translucent glass dome */}
      <mesh position={[0, 0, 0.18]}>
        <sphereGeometry args={[0.3, 48, 48, 0, Math.PI * 2, 0, Math.PI / 2]} />
        <meshPhysicalMaterial
          color="#ffffff"
          transparent
          opacity={0.25}
          transmission={1}
          roughness={0}
          thickness={0.3}
          clearcoat={1}
          ior={1.4}
        />
      </mesh>

      {/* Heart core */}
      <group position={[0, 0, 0.2]} scale={0.32}>
        <HeartShape />
      </group>

      {/* Status LEDs row */}
      <group ref={ledRef} position={[0, -0.28, 0.165]}>
        {[-0.22, 0, 0.22].map((x, i) => (
          <mesh key={i} position={[x, 0, 0]}>
            <sphereGeometry args={[0.035, 16, 16]} />
            <meshStandardMaterial
              color={i === 0 ? "#7DCBF4" : i === 1 ? "#F7C0D8" : "#a7f3d0"}
              emissive={i === 0 ? "#7DCBF4" : i === 1 ? "#F7C0D8" : "#a7f3d0"}
              emissiveIntensity={2.5}
            />
          </mesh>
        ))}
      </group>

      {/* Brand text on pod */}
      <Text
        position={[0, 0.28, 0.165]}
        fontSize={0.07}
        color="#475569"
        anchorX="center"
        anchorY="middle"
        letterSpacing={0.1}
      >
        MATERNAL · CARE
      </Text>
    </group>
  );
};

const Belt = () => {
  const beltRef = useRef<THREE.Group>(null);

  useFrame((state) => {
    if (!beltRef.current) return;
    const t = state.clock.elapsedTime;
    // Subtle breathing
    const breathe = 1 + Math.sin(t * 1.2) * 0.012;
    beltRef.current.scale.set(breathe, breathe, breathe);
  });

  return (
    <group ref={beltRef}>
      {/* Outer fabric band */}
      <mesh>
        <cylinderGeometry
          args={[BELT_RADIUS, BELT_RADIUS, BELT_HEIGHT, 96, 1, true]}
        />
        <meshPhysicalMaterial
          color="#f4f6fb"
          roughness={0.85}
          metalness={0.05}
          sheen={1}
          sheenColor={new THREE.Color("#cbd5e1")}
          sheenRoughness={0.6}
          side={THREE.DoubleSide}
          clearcoat={0.2}
        />
      </mesh>

      {/* Inner padded layer */}
      <mesh>
        <cylinderGeometry
          args={[BELT_RADIUS - 0.08, BELT_RADIUS - 0.08, BELT_HEIGHT - 0.05, 96, 1, true]}
        />
        <meshStandardMaterial
          color="#dbe5f1"
          roughness={1}
          metalness={0}
          side={THREE.DoubleSide}
        />
      </mesh>

      {/* Top stitching */}
      <mesh position={[0, BELT_HEIGHT / 2 - 0.04, 0]} rotation={[Math.PI / 2, 0, 0]}>
        <torusGeometry args={[BELT_RADIUS + 0.005, 0.01, 8, 128]} />
        <meshStandardMaterial color="#94a3b8" roughness={0.4} />
      </mesh>

      {/* Bottom stitching */}
      <mesh position={[0, -BELT_HEIGHT / 2 + 0.04, 0]} rotation={[Math.PI / 2, 0, 0]}>
        <torusGeometry args={[BELT_RADIUS + 0.005, 0.01, 8, 128]} />
        <meshStandardMaterial color="#94a3b8" roughness={0.4} />
      </mesh>

      {/* Top trim accent (soft blue) */}
      <mesh position={[0, BELT_HEIGHT / 2 - 0.005, 0]} rotation={[Math.PI / 2, 0, 0]}>
        <torusGeometry args={[BELT_RADIUS + 0.012, 0.018, 12, 128]} />
        <meshStandardMaterial
          color="#7DCBF4"
          emissive="#7DCBF4"
          emissiveIntensity={0.45}
          roughness={0.4}
        />
      </mesh>

      {/* Bottom trim accent (soft pink) */}
      <mesh position={[0, -BELT_HEIGHT / 2 + 0.005, 0]} rotation={[Math.PI / 2, 0, 0]}>
        <torusGeometry args={[BELT_RADIUS + 0.012, 0.018, 12, 128]} />
        <meshStandardMaterial
          color="#F7C0D8"
          emissive="#F7C0D8"
          emissiveIntensity={0.45}
          roughness={0.4}
        />
      </mesh>

      {/* Vertical seam decoration on side */}
      {[Math.PI * 0.3, -Math.PI * 0.3].map((angle, i) => (
        <mesh
          key={i}
          position={[
            Math.sin(angle) * (BELT_RADIUS + 0.01),
            0,
            Math.cos(angle) * (BELT_RADIUS + 0.01),
          ]}
          rotation={[0, angle, 0]}
        >
          <boxGeometry args={[0.015, BELT_HEIGHT - 0.08, 0.02]} />
          <meshStandardMaterial color="#94a3b8" roughness={0.5} />
        </mesh>
      ))}

      {/* Front sensor pod */}
      <SensorPod />

      {/* Glow ring under belt */}
      <mesh position={[0, -BELT_HEIGHT / 2 - 0.15, 0]} rotation={[Math.PI / 2, 0, 0]}>
        <ringGeometry args={[BELT_RADIUS - 0.1, BELT_RADIUS + 0.4, 64]} />
        <meshBasicMaterial color="#B8A2F4" transparent opacity={0.18} side={THREE.DoubleSide} />
      </mesh>
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

    // Base 3/4 perspective + tiny rotation oscillation + parallax
    const baseY = -0.35;
    const baseX = -0.18;
    const swayY = Math.sin(t * 0.5) * 0.08; // ±5° sway
    const swayX = Math.sin(t * 0.7) * 0.04;

    groupRef.current.rotation.y = THREE.MathUtils.lerp(
      groupRef.current.rotation.y,
      baseY + swayY + mx * 0.18,
      0.05,
    );
    groupRef.current.rotation.x = THREE.MathUtils.lerp(
      groupRef.current.rotation.x,
      baseX + swayX - my * 0.1,
      0.05,
    );
    // Slow float up/down
    groupRef.current.position.y = Math.sin(t * 0.8) * 0.08;
  });

  return (
    <group ref={groupRef}>
      <Belt />

      {/* Floating data labels with lines */}
      <FloatingLabel text="ECG" position={[2.6, 1.1, 0.6]} color="#ff6fa3" />
      <FloatingLabel text="SpO₂" position={[-2.7, 0.9, 0.4]} color="#7DCBF4" />
      <FloatingLabel text="TEMP" position={[2.4, -0.9, 0.7]} color="#F7C0D8" />
      <FloatingLabel text="AI SYNC" position={[-2.5, -1.0, 0.5]} color="#a7f3d0" />

      <Sparkles count={60} scale={[6, 4, 6]} size={2.2} color="#B8A2F4" speed={0.35} opacity={0.7} />
    </group>
  );
};

const PulseRings = () => {
  const ring1 = useRef<THREE.Mesh>(null);
  const ring2 = useRef<THREE.Mesh>(null);
  const ring3 = useRef<THREE.Mesh>(null);

  useFrame((state) => {
    const t = state.clock.elapsedTime;
    [ring1, ring2, ring3].forEach((r, i) => {
      if (!r.current) return;
      const phase = (t + i * 1.0) % 3;
      const s = 1 + (phase / 3) * 1.8;
      const o = 1 - phase / 3;
      r.current.scale.set(s, 1, s);
      const mat = r.current.material as THREE.MeshBasicMaterial;
      mat.opacity = o * 0.35;
    });
  });

  return (
    <group position={[0, -BELT_HEIGHT / 2 - 0.25, 0]}>
      {[ring1, ring2, ring3].map((r, i) => (
        <mesh key={i} ref={r} rotation={[Math.PI / 2, 0, 0]}>
          <ringGeometry args={[BELT_RADIUS + 0.05, BELT_RADIUS + 0.1, 80]} />
          <meshBasicMaterial
            color="#B8A2F4"
            transparent
            opacity={0.35}
            side={THREE.DoubleSide}
          />
        </mesh>
      ))}
    </group>
  );
};

export const SmartBelt3D = () => {
  return (
    <div className="relative mx-auto aspect-square w-full max-w-[560px]">
      {/* Background glow */}
      <div className="pointer-events-none absolute inset-0 rounded-full bg-gradient-to-br from-primary/30 via-accent/30 to-secondary/30 blur-3xl" />

      <Canvas
        camera={{ position: [0.6, 1.4, 5.5], fov: 38 }}
        dpr={[1, 1.8]}
        gl={{ antialias: true, alpha: true }}
        shadows
      >
        <Suspense fallback={null}>
          <ambientLight intensity={0.55} />
          <directionalLight
            position={[5, 6, 5]}
            intensity={1.6}
            color="#ffffff"
            castShadow
          />
          <directionalLight position={[-4, -2, -3]} intensity={0.7} color="#B8A2F4" />
          <pointLight position={[0, 0.6, 3.5]} intensity={1.3} color="#F7C0D8" />
          <spotLight position={[0, 4, 4]} intensity={0.8} angle={0.7} penumbra={0.5} color="#7DCBF4" />
          <Environment preset="studio" />
          <Scene />
          <PulseRings />
        </Suspense>
      </Canvas>
    </div>
  );
};

export default SmartBelt3D;
