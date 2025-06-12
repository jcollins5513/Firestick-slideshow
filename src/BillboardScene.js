import React, { useRef, useEffect } from "react";
import { Canvas, useFrame, useThree } from "@react-three/fiber";
import { useLoader } from "@react-three/fiber";
import { TextureLoader, VideoTexture, MeshBasicMaterial, PlaneGeometry, Mesh } from "three";

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
    <mesh ref={meshRef} position={[0, -0.5, 0]}>
      <planeGeometry args={[5, 5.25]} />
      {texture && <meshBasicMaterial attach="material" map={texture} toneMapped={false} />}
      {!texture && (
        <meshBasicMaterial attach="material" color="#222" />
      )}
    </mesh>
  );
}

export default function BillboardScene({ media }) {
  return (
    <Canvas camera={{ position: [0, 2, 7], fov: 50 }} style={{ width: "900%", height: "90vh", background: "#222" }}>
      {/* Ground */}
      <ambientLight intensity={0.9} />
      <directionalLight position={[5, 10, 7]} intensity={1} />
      <mesh position={[0, 0, 1]} receiveShadow>
        <boxGeometry args={[20, 0.1, 20]} />
        <meshStandardMaterial color="#444" />
      </mesh>
      {/* Billboard */}
      <Billboard media={media} />
    </Canvas>
  );
}
