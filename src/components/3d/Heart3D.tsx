import { useRef } from "react";
import { useFrame } from "@react-three/fiber";
import { Sphere } from "@react-three/drei";
import * as THREE from "three";

interface Heart3DProps {
  position?: [number, number, number];
  scale?: number;
}

export const Heart3D = ({ position = [0, 0, 0], scale = 1 }: Heart3DProps) => {
  const heartRef = useRef<THREE.Group>(null);
  const glowRef = useRef<THREE.Mesh>(null);
  
  useFrame(({ clock }) => {
    if (heartRef.current) {
      const beat = Math.sin(clock.elapsedTime * 4) * 0.1 + 1;
      heartRef.current.scale.setScalar(beat * scale);
    }
    if (glowRef.current) {
      glowRef.current.rotation.z = clock.elapsedTime * 0.5;
      const pulse = Math.sin(clock.elapsedTime * 3) * 0.3 + 0.7;
      glowRef.current.scale.setScalar(pulse * 1.5);
    }
  });

  // Create heart shape using two spheres
  return (
    <group position={position}>
      {/* Glowing background */}
      <Sphere ref={glowRef} args={[0.8, 16, 16]}>
        <meshLambertMaterial 
          color="#FFC0CB" 
          transparent 
          opacity={0.2}
          emissive="#FFC0CB"
          emissiveIntensity={0.1}
        />
      </Sphere>
      
      <group ref={heartRef}>
        {/* Left heart lobe */}
        <Sphere args={[0.3, 16, 16]} position={[-0.2, 0.1, 0]}>
          <meshLambertMaterial 
            color="#E53935" 
            emissive="#E53935"
            emissiveIntensity={0.2}
          />
        </Sphere>
        
        {/* Right heart lobe */}
        <Sphere args={[0.3, 16, 16]} position={[0.2, 0.1, 0]}>
          <meshLambertMaterial 
            color="#E53935"
            emissive="#E53935"
            emissiveIntensity={0.2}
          />
        </Sphere>
        
        {/* Heart bottom point */}
        <Sphere args={[0.25, 16, 16]} position={[0, -0.25, 0]}>
          <meshLambertMaterial 
            color="#E53935"
            emissive="#E53935"
            emissiveIntensity={0.2}
          />
        </Sphere>
        
        {/* Heart sparkles */}
        <Sphere args={[0.05, 8, 8]} position={[0.4, 0.4, 0.2]}>
          <meshLambertMaterial color="#FFC0CB" emissive="#FFC0CB" emissiveIntensity={0.8} />
        </Sphere>
        <Sphere args={[0.03, 8, 8]} position={[-0.4, 0.3, -0.2]}>
          <meshLambertMaterial color="#FFFFFF" emissive="#FFFFFF" emissiveIntensity={0.6} />
        </Sphere>
      </group>
    </group>
  );
};