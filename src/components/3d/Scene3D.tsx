import { Canvas } from "@react-three/fiber";
import { OrbitControls, Environment } from "@react-three/drei";
import { Suspense } from "react";

interface Scene3DProps {
  children: React.ReactNode;
  className?: string;
  enableControls?: boolean;
  autoRotate?: boolean;
}

export const Scene3D = ({ 
  children, 
  className = "w-full h-full", 
  enableControls = false,
  autoRotate = true 
}: Scene3DProps) => {
  return (
    <div className={className}>
      <Canvas
        camera={{ position: [0, 0, 5], fov: 50 }}
        style={{ background: 'transparent' }}
      >
        <Suspense fallback={null}>
          {/* Lighting */}
          <ambientLight intensity={0.6} />
          <pointLight position={[10, 10, 10]} intensity={1} />
          <pointLight position={[-10, -10, -10]} intensity={0.5} />
          
          {/* Environment for better lighting */}
          <Environment preset="studio" />
          
          {/* Controls */}
          {enableControls && (
            <OrbitControls 
              enableZoom={false} 
              autoRotate={autoRotate}
              autoRotateSpeed={2}
            />
          )}
          
          {children}
        </Suspense>
      </Canvas>
    </div>
  );
};