import { useRef } from "react";
import { useFrame } from "@react-three/fiber";
import { Sphere, MeshDistortMaterial } from "@react-three/drei";
import * as THREE from "three";

interface Baby3DProps {
  position?: [number, number, number];
  scale?: number;
}

export const Baby3D = ({ position = [0, 0, 0], scale = 1 }: Baby3DProps) => {
  const babyRef = useRef<THREE.Group>(null);
  const wombRef = useRef<THREE.Mesh>(null);
  
  useFrame(({ clock }) => {
    if (babyRef.current) {
      babyRef.current.rotation.y = Math.sin(clock.elapsedTime * 0.5) * 0.3;
      babyRef.current.position.y = Math.sin(clock.elapsedTime * 0.8) * 0.1;
    }
    if (wombRef.current) {
      wombRef.current.rotation.x = clock.elapsedTime * 0.2;
      wombRef.current.rotation.z = clock.elapsedTime * 0.1;
    }
  });

  return (
    <group position={position} scale={scale}>
      {/* Protective womb-like sphere */}
      <Sphere ref={wombRef} args={[1.2, 32, 32]} position={[0, 0, 0]}>
        <MeshDistortMaterial
          color="#2BB3A8"
          transparent
          opacity={0.2}
          distort={0.3}
          speed={2}
          roughness={0}
        />
      </Sphere>
      
      {/* Inner glowing sphere */}
      <Sphere args={[0.9, 16, 16]} position={[0, 0, 0]}>
        <meshLambertMaterial color="#6FC3E8" transparent opacity={0.3} />
      </Sphere>
      
      {/* Baby body */}
      <group ref={babyRef}>
        {/* Head */}
        <Sphere args={[0.3, 16, 16]} position={[0, 0.2, 0]}>
          <meshLambertMaterial color="#FFC0CB" />
        </Sphere>
        
        {/* Body */}
        <Sphere args={[0.25, 16, 16]} position={[0, -0.1, 0]}>
          <meshLambertMaterial color="#FFC0CB" />
        </Sphere>
        
        {/* Arms */}
        <Sphere args={[0.08, 8, 8]} position={[-0.2, -0.05, 0]}>
          <meshLambertMaterial color="#FFC0CB" />
        </Sphere>
        <Sphere args={[0.08, 8, 8]} position={[0.2, -0.05, 0]}>
          <meshLambertMaterial color="#FFC0CB" />
        </Sphere>
        
        {/* Legs */}
        <Sphere args={[0.08, 8, 8]} position={[-0.1, -0.35, 0]}>
          <meshLambertMaterial color="#FFC0CB" />
        </Sphere>
        <Sphere args={[0.08, 8, 8]} position={[0.1, -0.35, 0]}>
          <meshLambertMaterial color="#FFC0CB" />
        </Sphere>
      </group>
      
      {/* Floating particles */}
      <Sphere args={[0.02, 8, 8]} position={[0.8, 0.5, 0.3]}>
        <meshLambertMaterial color="#28A745" emissive="#28A745" emissiveIntensity={0.3} />
      </Sphere>
      <Sphere args={[0.015, 8, 8]} position={[-0.7, -0.3, 0.2]}>
        <meshLambertMaterial color="#FFA726" emissive="#FFA726" emissiveIntensity={0.4} />
      </Sphere>
      <Sphere args={[0.01, 8, 8]} position={[0.3, -0.7, -0.2]}>
        <meshLambertMaterial color="#E53935" emissive="#E53935" emissiveIntensity={0.2} />
      </Sphere>
    </group>
  );
};