import { useEffect, useState } from "react";
import * as THREE from "three";
import { GLTFLoader } from "three/examples/jsm/loaders/GLTFLoader.js";

/**
 * Load a GLTF model and (optionally) apply a color texture to MeshStandardMaterial.
 */
export function useModelLoader(
  modelPath?: string,
  applyColorTexture?: boolean
) {
  const [model, setModel] = useState<THREE.Group | null>(null);

  // Load GLTF model
  useEffect(() => {
    if (!modelPath) return;

    const loader = new GLTFLoader();
    let cancelled = false;
    loader.load(modelPath, (gltf) => {
      if (cancelled) return;
      const loadedModel = gltf.scene;

      // Center and scale the model
      const box = new THREE.Box3().setFromObject(loadedModel);
      const center = box.getCenter(new THREE.Vector3());
      const modelSize = box.getSize(new THREE.Vector3());
      const minSize = Math.min(modelSize.x, modelSize.y, modelSize.z);
      const scale = 2 / minSize;

      loadedModel.scale.setScalar(scale);
      loadedModel.position.sub(center.multiplyScalar(scale));

      setModel(loadedModel);
    });

    return () => {
      cancelled = true;
      setModel(null);
    };
  }, [modelPath]);

  // Optionally apply a color texture
  useEffect(() => {
    if (!model || !applyColorTexture) return;

    const loader = new THREE.TextureLoader();
    const rgbTexturePath = "/textures/rgb-tex.jpg";
    loader.load(rgbTexturePath, (loadedTexture) => {
      loadedTexture.flipY = false;

    model.traverse((child) => {
      if (child instanceof THREE.Mesh && child.material) {
        const materials = Array.isArray(child.material)
          ? child.material
          : [child.material];

        materials.forEach((mat) => {
          if (mat instanceof THREE.MeshStandardMaterial) {
            mat.map = loadedTexture;
            mat.needsUpdate = true;
          }
        });
      }
    });
    });
  }, [model, applyColorTexture]);

  return { model };
}
