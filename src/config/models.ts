export interface ModelConfig {
  name: string;
  modelPath: string;
  applyColorTexture: boolean;
  scaleZ: number;
  modelRotation: [number, number, number];
}

export const models: ModelConfig[] = [
  {
    name: "Globe",
    modelPath: "/models/globe.glb",
    applyColorTexture: true,
    scaleZ: 1.0,
    modelRotation: [-0.7, 0.2, 0],
  },
];
