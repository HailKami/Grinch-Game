import { useRef } from "react";
import { useFrame } from "@react-three/fiber";
import * as THREE from "three";

interface GrinchProps {
  position: [number, number, number];
}

export default function Grinch({ position }: GrinchProps) {
  const meshRef = useRef<THREE.Mesh>(null);

  useFrame((state) => {
    if (meshRef.current) {
      // Slight bobbing animation
      meshRef.current.position.y = position[1] + Math.sin(state.clock.elapsedTime * 3) * 0.1;
    }
  });

  return (
    <group position={position}>
      {/* Grinch body */}
      <mesh ref={meshRef}>
        <boxGeometry args={[1, 1.5, 0.8]} />
        <meshLambertMaterial color="#4a7c59" />
      </mesh>
      
      {/* Grinch head */}
      <mesh position={[0, 1, 0]}>
        <boxGeometry args={[0.8, 0.8, 0.8]} />
        <meshLambertMaterial color="#4a7c59" />
      </mesh>

      {/* Hat */}
      <mesh position={[0, 1.6, 0]}>
        <coneGeometry args={[0.5, 1, 8]} />
        <meshLambertMaterial color="#c41e3a" />
      </mesh>

      {/* Hat pompom */}
      <mesh position={[0, 2.2, 0]}>
        <sphereGeometry args={[0.2, 8, 8]} />
        <meshLambertMaterial color="white" />
      </mesh>

      {/* Arms */}
      <mesh position={[-0.8, 0.5, 0]}>
        <boxGeometry args={[0.3, 1, 0.3]} />
        <meshLambertMaterial color="#4a7c59" />
      </mesh>
      <mesh position={[0.8, 0.5, 0]}>
        <boxGeometry args={[0.3, 1, 0.3]} />
        <meshLambertMaterial color="#4a7c59" />
      </mesh>

      {/* Eyes */}
      <mesh position={[-0.2, 1.2, 0.4]}>
        <sphereGeometry args={[0.1, 8, 8]} />
        <meshLambertMaterial color="red" />
      </mesh>
      <mesh position={[0.2, 1.2, 0.4]}>
        <sphereGeometry args={[0.1, 8, 8]} />
        <meshLambertMaterial color="red" />
      </mesh>
    </group>
  );
}
