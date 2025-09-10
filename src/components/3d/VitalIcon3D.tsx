import { useRef } from "react";
import { useFrame } from "@react-three/fiber";
import { Sphere } from "@react-three/drei";
import * as THREE from "three";

interface VitalIcon3DProps {
  type: "heart" | "pressure" | "oxygen" | "temp";
  position?: [number, number, number];
  scale?: number;
}

export const VitalIcon3D = ({ type, position = [0, 0, 0], scale = 1 }: VitalIcon3DProps) => {
  const iconRef = useRef<THREE.Group>(null);
  
  useFrame(({ clock }) => {
    if (iconRef.current) {
      if (type === "heart") {
        const beat = Math.sin(clock.elapsedTime * 6) * 0.2 + 1;
        iconRef.current.scale.setScalar(beat * scale);
      } else {
        iconRef.current.rotation.y = Math.sin(clock.elapsedTime * 2) * 0.1;
        iconRef.current.rotation.z = Math.sin(clock.elapsedTime * 1.5) * 0.05;
      }
    }
  });

  const getColor = () => {
    switch (type) {
      case "heart": return "#E53935";
      case "pressure": return "#2BB3A8";
      case "oxygen": return "#6FC3E8";
      case "temp": return "#FFA726";
      default: return "#2BB3A8";
    }
  };

  const getShape = () => {
    switch (type) {
      case "heart":
        return (
          <group>
            <Sphere args={[0.3, 16, 16]} position={[-0.15, 0.1, 0]}>
              <meshLambertMaterial color={getColor()} emissive={getColor()} emissiveIntensity={0.3} />
            </Sphere>
            <Sphere args={[0.3, 16, 16]} position={[0.15, 0.1, 0]}>
              <meshLambertMaterial color={getColor()} emissive={getColor()} emissiveIntensity={0.3} />
            </Sphere>
            <Sphere args={[0.25, 16, 16]} position={[0, -0.2, 0]}>
              <meshLambertMaterial color={getColor()} emissive={getColor()} emissiveIntensity={0.3} />
            </Sphere>
          </group>
        );
      case "pressure":
        return (
          <Sphere args={[0.4, 16, 16]}>
            <meshLambertMaterial color={getColor()} emissive={getColor()} emissiveIntensity={0.2} />
          </Sphere>
        );
      case "oxygen":
        return (
          <group>
            <Sphere args={[0.3, 16, 16]} position={[0, 0.1, 0]}>
              <meshLambertMaterial color={getColor()} transparent opacity={0.8} />
            </Sphere>
            <Sphere args={[0.15, 8, 8]} position={[0, 0.1, 0]}>
              <meshLambertMaterial color="#FFFFFF" emissive="#FFFFFF" emissiveIntensity={0.5} />
            </Sphere>
          </group>
        );
      case "temp":
        return (
          <group>
            <Sphere args={[0.1, 8, 8]} position={[0, 0.3, 0]}>
              <meshLambertMaterial color={getColor()} />
            </Sphere>
            <Sphere args={[0.05, 8, 8]} position={[0, 0.2, 0]}>
              <meshLambertMaterial color={getColor()} />
            </Sphere>
            <Sphere args={[0.15, 8, 8]} position={[0, -0.2, 0]}>
              <meshLambertMaterial color={getColor()} emissive={getColor()} emissiveIntensity={0.3} />
            </Sphere>
          </group>
        );
    }
  };

  return (
    <group ref={iconRef} position={position} scale={scale}>
      {getShape()}
    </group>
  );
};