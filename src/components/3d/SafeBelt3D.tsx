import { Component, lazy, Suspense, useEffect, useState, type ReactNode } from "react";

const SmartBelt3D = lazy(() => import("./SmartBelt3D"));

class ErrorBoundary extends Component<
  { fallback: ReactNode; children: ReactNode },
  { failed: boolean }
> {
  state = { failed: false };

  static getDerivedStateFromError() {
    return { failed: true };
  }

  componentDidCatch(error: unknown) {
    if (typeof window !== "undefined") {
      console.warn("SmartBelt3D failed, falling back:", error);
    }
  }

  render() {
    if (this.state.failed) return this.props.fallback;
    return this.props.children;
  }
}

const detectWebGL = (): boolean => {
  if (typeof window === "undefined") return false;
  try {
    const canvas = document.createElement("canvas");
    const gl =
      canvas.getContext("webgl2") ||
      canvas.getContext("webgl") ||
      canvas.getContext("experimental-webgl");
    return !!gl;
  } catch {
    return false;
  }
};

type SafeBelt3DProps = {
  fallback: ReactNode;
};

export const SafeBelt3D = ({ fallback }: SafeBelt3DProps) => {
  const [hasWebGL, setHasWebGL] = useState<boolean | null>(null);

  useEffect(() => {
    setHasWebGL(detectWebGL());
  }, []);

  if (hasWebGL === null) return <>{fallback}</>;
  if (!hasWebGL) return <>{fallback}</>;

  return (
    <ErrorBoundary fallback={fallback}>
      <Suspense fallback={fallback}>
        <SmartBelt3D />
      </Suspense>
    </ErrorBoundary>
  );
};

export default SafeBelt3D;
