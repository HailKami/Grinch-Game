import { useRef } from "react";
import { useFrame } from "@react-three/fiber";
import * as THREE from "three";

interface GiftProps {
  position: [number, number, number];
}

export default function Gift({ position }: GiftProps) {
  const meshRef = useRef<THREE.Mesh>(null);

  useFrame((state) => {
    if (meshRef.current) {
      // Gentle spinning animation
      meshRef.current.rotation.y = state.clock.elapsedTime * 2;
      meshRef.current.rotation.x = state.clock.elapsedTime * 1.5;
    }
  });

  return (
    <group position={position}>
      {/* Gift box */}
      <mesh ref={meshRef}>
        <boxGeometry args={[0.6, 0.6, 0.6]} />
        <meshLambertMaterial color="#c41e3a" />
      </mesh>
      
      {/* Ribbon horizontal */}
      <mesh position={[0, 0, 0.31]}>
        <boxGeometry args={[0.7, 0.1, 0.02]} />
        <meshLambertMaterial color="#FFD700" />
      </mesh>
      
      {/* Ribbon vertical */}
      <mesh position={[0, 0, 0.31]}>
        <boxGeometry args={[0.1, 0.7, 0.02]} />
        <meshLambertMaterial color="#FFD700" />
      </mesh>

      {/* Bow */}
      <mesh position={[0, 0.35, 0.35]}>
        <sphereGeometry args={[0.15, 8, 6]} />
        <meshLambertMaterial color="#FFD700" />
      </mesh>
    </group>
  );
}
