import { useEffect, useMemo, useRef, useState } from "react";
import { useThree, useFrame } from "@react-three/fiber";
import { useFBO } from "@react-three/drei";
import * as THREE from "three";
import { OffscreenRenderer } from "./OffscreenRenderer";
import { ShaderPlane } from "./ShaderPlane";
import { useModelLoader } from "../../hooks/useModelLoader";
import { createAsciiFragmentShader } from "../../shaders/asciiFragment.glsl";
import {
  CAMERA_SIZE,
  BACKGROUND_COLOR_GLSL,
  PATTERN_STRIP_WIDTH_GLSL,
  PATTERN_ATLAS_WIDTH_GLSL,
  ANIMATION_SPEED,
  ANIMATION_AMPLITUDE,
} from "../../config/constants";

type AsciiModelSceneProps = {
  modelPath?: string;
  applyColorTexture?: boolean;
  patternTexture?: string;
  animate?: boolean;
};

const DEFAULT_MOUSE_SENSITIVITY = 0.3;

/**
 * Main ASCII model scene component
 * Handles model loading, rendering, and animation/mouse rotation
 */
export function AsciiModelScene({
  modelPath,
  applyColorTexture = false,
  patternTexture = "/patterns/pat-strip-green.png",
  animate = false,
}: AsciiModelSceneProps) {
  const { size, gl } = useThree();
  const modelGroupRef = useRef<THREE.Group>(null);
  const mouseRotationTarget = useRef({ x: 0, y: 0 });
  const mouseRotationCurrent = useRef({ x: 0, y: 0 });

  const [pattern, setPattern] = useState<THREE.Texture | null>(null);

  // Use custom hook for model loading
  const { model } = useModelLoader(modelPath, applyColorTexture);

  // Create framebuffer object with reduced resolution for performance
  const fboScale = 0.5;
  const fbo = useFBO(size.width * fboScale, size.height * fboScale, {
    type: THREE.HalfFloatType,
  });

  // Create orthographic camera
  const camera = useMemo(() => {
    const cam = new THREE.OrthographicCamera(
      -CAMERA_SIZE,
      CAMERA_SIZE,
      CAMERA_SIZE,
      -CAMERA_SIZE,
      0.1,
      20
    );
    cam.position.set(0, 2, 1.5);
    cam.lookAt(0, 0, 0);
    return cam;
  }, []);

  // Create fragment shader
  const fragmentShader = useMemo(
    () =>
      createAsciiFragmentShader(
        BACKGROUND_COLOR_GLSL,
        PATTERN_STRIP_WIDTH_GLSL,
        PATTERN_ATLAS_WIDTH_GLSL
      ),
    []
  );

  // Create custom uniforms with dynamic cell size
  const customUniforms = useMemo(() => {
    if (!pattern) return undefined;

    const targetCellsHorizontal = 150;
    return {
      uMap: new THREE.Uniform(fbo.texture),
      uPattern: new THREE.Uniform(pattern),
      uCellSize: new THREE.Uniform(size.width / targetCellsHorizontal),
    };
  }, [pattern, fbo.texture, size.width]);

  // Load pattern texture
  useEffect(() => {
    const loader = new THREE.TextureLoader();
    const patternTex = loader.load(patternTexture);
    patternTex.wrapS = THREE.RepeatWrapping;
    patternTex.wrapT = THREE.RepeatWrapping;
    patternTex.minFilter = THREE.NearestFilter;
    patternTex.magFilter = THREE.NearestFilter;
    setPattern(patternTex);

    return () => {
      patternTex.dispose();
    };
  }, [patternTexture]);

  // Track mouse movement over the canvas (no React re-renders)
  useEffect(() => {
    const canvas = gl.domElement;
    if (!canvas) return;

    const handleMouseMove = (event: MouseEvent) => {
      const rect = canvas.getBoundingClientRect();
      const normalizedX = ((event.clientX - rect.left) / rect.width) * 2 - 1;
      const normalizedY = ((event.clientY - rect.top) / rect.height) * 2 - 1;

      const maxRotation = Math.PI / 4; // 45 degrees
      mouseRotationTarget.current = {
        x: -normalizedY * maxRotation * DEFAULT_MOUSE_SENSITIVITY,
        y: normalizedX * maxRotation * DEFAULT_MOUSE_SENSITIVITY,
      };
    };

    const handleMouseLeave = () => {
      mouseRotationTarget.current = { x: 0, y: 0 };
    };

    canvas.addEventListener("mousemove", handleMouseMove);
    canvas.addEventListener("mouseleave", handleMouseLeave);

    return () => {
      canvas.removeEventListener("mousemove", handleMouseMove);
      canvas.removeEventListener("mouseleave", handleMouseLeave);
    };
  }, [gl]);

  // Animation and mouse rotation
  useFrame((state) => {
    if (!modelGroupRef.current) return;

    if (animate) {
      const time = state.clock.getElapsedTime();
      modelGroupRef.current.position.y =
        Math.sin(time * ANIMATION_SPEED.VERTICAL_BOB) *
        ANIMATION_AMPLITUDE.VERTICAL;
      modelGroupRef.current.rotation.y =
        Math.sin(time * ANIMATION_SPEED.ROTATION_SWAY) *
        ANIMATION_AMPLITUDE.ROTATION;
      modelGroupRef.current.rotation.z =
        Math.sin(time * ANIMATION_SPEED.TILT) * ANIMATION_AMPLITUDE.TILT;
    }

    const lerpFactor = 0.1;
    mouseRotationCurrent.current.x = THREE.MathUtils.lerp(
      mouseRotationCurrent.current.x,
      mouseRotationTarget.current.x,
      lerpFactor
    );
    mouseRotationCurrent.current.y = THREE.MathUtils.lerp(
      mouseRotationCurrent.current.y,
      mouseRotationTarget.current.y,
      lerpFactor
    );

    // Mouse rotation always controls X/Y.
    modelGroupRef.current.rotation.x = -mouseRotationCurrent.current.x;
    modelGroupRef.current.rotation.y = mouseRotationCurrent.current.y;
  });

  return (
    <>
      <ShaderPlane
        fragmentShader={fragmentShader}
        customUniforms={customUniforms}
      />
      <OffscreenRenderer
        fbo={fbo}
        camera={camera}
      >
        <ambientLight intensity={100} />
        {model && (
          <group ref={modelGroupRef}>
            <group>
              <primitive object={model} />
            </group>
          </group>
        )}
      </OffscreenRenderer>
    </>
  );
}
