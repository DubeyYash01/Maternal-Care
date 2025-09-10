import { Scene3D } from "./3d/Scene3D";
import { Baby3D } from "./3d/Baby3D";

export const Hero3D = () => {
  return (
    <div className="relative flex items-center justify-center h-96 w-96 mx-auto">
      {/* 3D Baby Scene */}
      <div className="w-80 h-80">
        <Scene3D className="w-full h-full" enableControls={false} autoRotate={true}>
          <Baby3D position={[0, 0, 0]} scale={1.2} />
        </Scene3D>
      </div>
      
      {/* Heartbeat indicator */}
      <div className="absolute bottom-4 left-1/2 transform -translate-x-1/2">
        <div className="flex items-center gap-2 bg-white/80 backdrop-blur-sm px-4 py-2 rounded-full shadow-soft animate-fade-in">
          <div className="w-2 h-2 bg-success rounded-full animate-pulse" />
          <span className="text-sm font-medium text-muted-foreground">Heartbeat: 140 BPM</span>
        </div>
      </div>
    </div>
  );
};