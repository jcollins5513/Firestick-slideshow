import React, { useRef, useEffect } from "react";
import { Canvas, useThree } from "@react-three/fiber";
import { OrbitControls } from "@react-three/drei";
import { GLTFLoader } from "three/examples/jsm/loaders/GLTFLoader";
import { TextureLoader, VideoTexture } from "three";

function Billboard({ media }) {
  const meshRef = useRef();
  const { scene } = useThree();
  const [texture, setTexture] = React.useState(null);
  const [videoEl, setVideoEl] = React.useState(null);

  useEffect(() => {
    if (!media) return;
    if (media.type && media.type.startsWith("image/")) {
      const url = media.url || URL.createObjectURL(media);
      const tex = new TextureLoader().load(url, () => {
        if (!media.url) URL.revokeObjectURL(url);
      });
      setTexture(tex);
      setVideoEl(null);
    } else if (media.type && media.type.startsWith("video/")) {
      const video = document.createElement("video");
      video.src = media.url || URL.createObjectURL(media);
      video.crossOrigin = "anonymous";
      video.loop = true;
      video.muted = true;
      video.autoplay = true;
      video.playsInline = true;
      video.play();
      const tex = new VideoTexture(video);
      setTexture(tex);
      setVideoEl(video);
    } else {
      setTexture(null);
      setVideoEl(null);
    }
    // Clean up video element on unmount or media change
    return () => {
      if (videoEl) {
        videoEl.pause();
        if (!media.url) URL.revokeObjectURL(videoEl.src);
      }
    };
    // eslint-disable-next-line
  }, [media]);

  return (
    <mesh ref={meshRef} position={[0, 1.5, -2]}>
      <planeGeometry args={[5, 5.25]} />
      {texture && <meshBasicMaterial attach="material" map={texture} toneMapped={false} />}
      {!texture && (
        <meshBasicMaterial attach="material" color="#222" />
      )}
    </mesh>
  );
}

export default function BillboardScene({ media }) {
  const [gltf, setGltf] = React.useState(null);
  useEffect(() => {
    const loader = new GLTFLoader();
    loader.load(
      "/dealership.glb",
      (loaded) => setGltf(loaded),
      undefined,
      (err) => {
        console.warn("dealership.glb not found", err);
        setGltf(null);
      }
    );
  }, []);
  return (
    <Canvas camera={{ position: [0, 2, 7], fov: 50 }} style={{ width: "900%", height: "90vh", background: "#222" }}>
      <ambientLight intensity={0.9} />
      <directionalLight position={[5, 10, 7]} intensity={1} />
      {/* Ground */}
      <mesh position={[0, 0, 1]} receiveShadow>
        <boxGeometry args={[20, 0.1, 20]} />
        <meshStandardMaterial color="#444" />
      </mesh>
      {/* 3D dealership model */}
      {gltf && <primitive object={gltf.scene} position={[0, 0, 0]} scale={1} />}
      {/* Billboard plane positioned roughly where the screen is */}
      <Billboard media={media} />
      <OrbitControls />
    </Canvas>
  );
}
