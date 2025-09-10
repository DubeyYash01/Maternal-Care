import { useRef } from "react";
import { useFrame } from "@react-three/fiber";
import { Sphere, Cylinder } from "@react-three/drei";
import * as THREE from "three";

interface Family3DProps {
  position?: [number, number, number];
  scale?: number;
}

export const Family3D = ({ position = [0, 0, 0], scale = 1 }: Family3DProps) => {
  const familyRef = useRef<THREE.Group>(null);
  const auraRef = useRef<THREE.Mesh>(null);
  
  useFrame(({ clock }) => {
    if (familyRef.current) {
      familyRef.current.rotation.y = Math.sin(clock.elapsedTime * 0.3) * 0.1;
    }
    if (auraRef.current) {
      auraRef.current.rotation.z = clock.elapsedTime * 0.2;
      const glow = Math.sin(clock.elapsedTime * 2) * 0.2 + 0.8;
      auraRef.current.scale.setScalar(glow);
    }
  });

  return (
    <group position={position} scale={scale}>
      {/* Protective aura */}
      <Sphere ref={auraRef} args={[2, 32, 32]}>
        <meshLambertMaterial 
          color="#2BB3A8" 
          transparent 
          opacity={0.1}
          emissive="#6FC3E8"
          emissiveIntensity={0.05}
        />
      </Sphere>
      
      <group ref={familyRef}>
        {/* Mother figure */}
        <group position={[-0.8, 0, 0]}>
          {/* Head */}
          <Sphere args={[0.25, 16, 16]} position={[0, 0.8, 0]}>
            <meshLambertMaterial color="#FFC0CB" />
          </Sphere>
          {/* Body */}
          <Cylinder args={[0.2, 0.15, 0.8, 8]} position={[0, 0.2, 0]}>
            <meshLambertMaterial color="#2BB3A8" />
          </Cylinder>
          {/* Pregnant belly */}
          <Sphere args={[0.18, 16, 16]} position={[0, 0.1, 0.15]}>
            <meshLambertMaterial color="#FFC0CB" />
          </Sphere>
        </group>
        
        {/* Father figure */}
        <group position={[0.8, 0, 0]}>
          {/* Head */}
          <Sphere args={[0.25, 16, 16]} position={[0, 0.9, 0]}>
            <meshLambertMaterial color="#FFC0CB" />
          </Sphere>
          {/* Body */}
          <Cylinder args={[0.22, 0.18, 0.9, 8]} position={[0, 0.25, 0]}>
            <meshLambertMaterial color="#6FC3E8" />
          </Cylinder>
        </group>
        
        {/* Child figure */}
        <group position={[0, 0, 0.8]}>
          {/* Head */}
          <Sphere args={[0.18, 16, 16]} position={[0, 0.5, 0]}>
            <meshLambertMaterial color="#FFC0CB" />
          </Sphere>
          {/* Body */}
          <Cylinder args={[0.12, 0.1, 0.5, 8]} position={[0, 0.1, 0]}>
            <meshLambertMaterial color="#FFA726" />
          </Cylinder>
        </group>
        
        {/* Love hearts floating around */}
        <Sphere args={[0.08, 12, 12]} position={[0, 1.5, 0]}>
          <meshLambertMaterial 
            color="#E53935" 
            emissive="#E53935"
            emissiveIntensity={0.3}
          />
        </Sphere>
        
        <Sphere args={[0.06, 12, 12]} position={[-1.2, 1.2, 0.5]}>
          <meshLambertMaterial 
            color="#FFC0CB" 
            emissive="#FFC0CB"
            emissiveIntensity={0.4}
          />
        </Sphere>
        
        <Sphere args={[0.05, 12, 12]} position={[1.1, 1.3, -0.3]}>
          <meshLambertMaterial 
            color="#28A745" 
            emissive="#28A745"
            emissiveIntensity={0.3}
          />
        </Sphere>
      </group>
    </group>
  );
};