import { Suspense, useMemo, useRef } from "react";
import { Canvas, useFrame } from "@react-three/fiber";
import { Float, MeshDistortMaterial, Environment, Sparkles } from "@react-three/drei";
import * as THREE from "three";

const BeltMesh = () => {
  const groupRef = useRef<THREE.Group>(null);
  const ringRef = useRef<THREE.Mesh>(null);

  useFrame((state) => {
    const t = state.clock.elapsedTime;
    if (groupRef.current) {
      const mx = state.mouse.x;
      const my = state.mouse.y;
      groupRef.current.rotation.y = THREE.MathUtils.lerp(
        groupRef.current.rotation.y,
        mx * 0.4 + t * 0.15,
        0.05,
      );
      groupRef.current.rotation.x = THREE.MathUtils.lerp(
        groupRef.current.rotation.x,
        -my * 0.25,
        0.05,
      );
    }
    if (ringRef.current) {
      ringRef.current.scale.setScalar(1 + Math.sin(t * 2.2) * 0.05);
    }
  });

  return (
    <group ref={groupRef}>
      {/* Outer halo ring */}
      <mesh ref={ringRef} rotation={[Math.PI / 2, 0, 0]}>
        <torusGeometry args={[2.4, 0.045, 24, 120]} />
        <meshStandardMaterial
          color="#7DCBF4"
          emissive="#B8A2F4"
          emissiveIntensity={1.4}
          roughness={0.2}
          metalness={0.4}
        />
      </mesh>

      {/* Inner glowing ring */}
      <mesh rotation={[Math.PI / 2, 0, 0]}>
        <torusGeometry args={[2.05, 0.02, 16, 120]} />
        <meshStandardMaterial
          color="#F7C0D8"
          emissive="#F7C0D8"
          emissiveIntensity={1.6}
          transparent
          opacity={0.85}
        />
      </mesh>

      {/* Belt strap (rounded torus tube) */}
      <mesh rotation={[Math.PI / 2, 0, 0]}>
        <torusGeometry args={[1.7, 0.32, 32, 200]} />
        <meshPhysicalMaterial
          color="#ffffff"
          roughness={0.18}
          metalness={0.35}
          clearcoat={1}
          clearcoatRoughness={0.05}
          sheen={1}
          sheenColor={new THREE.Color("#B8A2F4")}
          envMapIntensity={1}
        />
      </mesh>

      {/* Stitched accent on belt */}
      <mesh rotation={[Math.PI / 2, 0, 0]}>
        <torusGeometry args={[1.7, 0.34, 32, 200]} />
        <meshStandardMaterial
          color="#B8A2F4"
          transparent
          opacity={0.18}
          wireframe
        />
      </mesh>

      {/* Central sensor module - rounded box / capsule */}
      <Float speed={2.2} rotationIntensity={0} floatIntensity={0.4}>
        <group position={[0, 0, 0]}>
          <mesh>
            <sphereGeometry args={[0.85, 64, 64]} />
            <MeshDistortMaterial
              color="#7DCBF4"
              emissive="#B8A2F4"
              emissiveIntensity={0.6}
              roughness={0.15}
              metalness={0.7}
              distort={0.18}
              speed={1.6}
            />
          </mesh>

          {/* Heart core */}
          <mesh position={[0, 0, 0.6]}>
            <sphereGeometry args={[0.42, 32, 32]} />
            <meshStandardMaterial
              color="#F7C0D8"
              emissive="#ff6fa3"
              emissiveIntensity={1.8}
              roughness={0.2}
            />
          </mesh>

          {/* Glass dome */}
          <mesh>
            <sphereGeometry args={[0.92, 64, 64]} />
            <meshPhysicalMaterial
              transparent
              opacity={0.18}
              roughness={0}
              transmission={1}
              thickness={0.4}
              clearcoat={1}
              ior={1.4}
              color="#ffffff"
            />
          </mesh>
        </group>
      </Float>

      {/* Floating data nodes */}
      {[0, 1, 2, 3, 4, 5].map((i) => {
        const angle = (i / 6) * Math.PI * 2;
        const x = Math.cos(angle) * 1.7;
        const z = Math.sin(angle) * 1.7;
        return (
          <Float key={i} speed={1.4 + i * 0.2} floatIntensity={0.6} rotationIntensity={0.3}>
            <mesh position={[x, 0, z]}>
              <sphereGeometry args={[0.12, 24, 24]} />
              <meshStandardMaterial
                color={i % 2 === 0 ? "#7DCBF4" : "#F7C0D8"}
                emissive={i % 2 === 0 ? "#7DCBF4" : "#F7C0D8"}
                emissiveIntensity={2.5}
              />
            </mesh>
          </Float>
        );
      })}

      <Sparkles count={50} scale={6} size={3} color="#B8A2F4" speed={0.4} opacity={0.8} />
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
      const s = 1 + (phase / 3) * 2.2;
      const o = 1 - phase / 3;
      r.current.scale.set(s, s, s);
      const mat = r.current.material as THREE.MeshBasicMaterial;
      mat.opacity = o * 0.45;
    });
  });

  return (
    <>
      {[ring1, ring2, ring3].map((r, i) => (
        <mesh key={i} ref={r} rotation={[Math.PI / 2, 0, 0]}>
          <ringGeometry args={[2.4, 2.45, 80]} />
          <meshBasicMaterial
            color="#B8A2F4"
            transparent
            opacity={0.4}
            side={THREE.DoubleSide}
          />
        </mesh>
      ))}
    </>
  );
};

export const SmartBelt3D = () => {
  return (
    <div className="relative mx-auto aspect-square w-full max-w-[520px]">
      {/* Background glow */}
      <div className="pointer-events-none absolute inset-0 rounded-full bg-gradient-to-br from-primary/30 via-accent/30 to-secondary/30 blur-3xl" />

      <Canvas
        camera={{ position: [0, 0.4, 6], fov: 38 }}
        dpr={[1, 1.8]}
        gl={{ antialias: true, alpha: true }}
      >
        <Suspense fallback={null}>
          <ambientLight intensity={0.6} />
          <directionalLight position={[5, 6, 5]} intensity={1.6} color="#ffffff" />
          <directionalLight position={[-4, -2, -3]} intensity={0.7} color="#B8A2F4" />
          <pointLight position={[0, 0, 4]} intensity={1.2} color="#F7C0D8" />
          <Environment preset="studio" />
          <BeltMesh />
          <PulseRings />
        </Suspense>
      </Canvas>
    </div>
  );
};

export default SmartBelt3D;
