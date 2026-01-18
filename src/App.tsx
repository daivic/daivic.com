import { Canvas } from "@react-three/fiber";
import { AsciiModelScene } from "./components/three/AsciiModelScene";
import { BACKGROUND_COLOR_CSS } from "./config/constants";

const MODEL_PATH = "/models/globe.glb";
const PATTERN_TEXTURE = "/patterns/pat-strip-green.png";

function App() {
  return (
    <div
      style={{
        width: "100vw",
        height: "100vh",
        background: BACKGROUND_COLOR_CSS,
      }}
    >
      <Canvas
        camera={{ position: [0, 0, 5], fov: 20 }}
        dpr={[1, 1.5]} // Limit DPR for performance
        performance={{ min: 0.5 }} // Performance optimization
      >
        <AsciiModelScene
          modelPath={MODEL_PATH}
          applyColorTexture
          patternTexture={PATTERN_TEXTURE}
          animate
        />
      </Canvas>
    </div>
  );
}

export default App;
