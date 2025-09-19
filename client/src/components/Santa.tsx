import { useRef } from "react";
import { useFrame } from "@react-three/fiber";
import * as THREE from "three";

interface SantaProps {
  position: [number, number, number];
}

export default function Santa({ position }: SantaProps) {
  const sleighRef = useRef<THREE.Group>(null);
  const reindeerRef = useRef<THREE.Group>(null);

  useFrame((state) => {
    if (sleighRef.current) {
      // Gentle rocking motion
      sleighRef.current.rotation.z = Math.sin(state.clock.elapsedTime * 2) * 0.1;
    }
    if (reindeerRef.current) {
      // Reindeer flying animation
      reindeerRef.current.position.y = Math.sin(state.clock.elapsedTime * 4) * 0.2;
    }
  });

  return (
    <group position={position}>
      {/* Sleigh */}
      <group ref={sleighRef}>
        <mesh position={[0, 0, 0]}>
          <boxGeometry args={[2, 0.5, 1]} />
          <meshLambertMaterial color="#8B4513" />
        </mesh>
        
        {/* Sleigh runners */}
        <mesh position={[0, -0.5, 0.6]}>
          <boxGeometry args={[2.2, 0.1, 0.2]} />
          <meshLambertMaterial color="#C0C0C0" />
        </mesh>
        <mesh position={[0, -0.5, -0.6]}>
          <boxGeometry args={[2.2, 0.1, 0.2]} />
          <meshLambertMaterial color="#C0C0C0" />
        </mesh>

        {/* Santa */}
        <mesh position={[0, 0.8, 0]}>
          <boxGeometry args={[0.8, 1.2, 0.6]} />
          <meshLambertMaterial color="#c41e3a" />
        </mesh>
        
        {/* Santa's head */}
        <mesh position={[0, 1.6, 0]}>
          <sphereGeometry args={[0.4, 8, 8]} />
          <meshLambertMaterial color="#FDBCB4" />
        </mesh>

        {/* Santa's hat */}
        <mesh position={[0, 2, 0]}>
          <coneGeometry args={[0.4, 0.8, 8]} />
          <meshLambertMaterial color="#c41e3a" />
        </mesh>

        {/* Hat pompom */}
        <mesh position={[0, 2.5, 0]}>
          <sphereGeometry args={[0.15, 8, 8]} />
          <meshLambertMaterial color="white" />
        </mesh>
      </group>

      {/* Reindeer */}
      <group ref={reindeerRef} position={[2.5, 0.5, 0]}>
        {/* Reindeer body */}
        <mesh>
          <boxGeometry args={[1, 0.6, 0.4]} />
          <meshLambertMaterial color="#8B4513" />
        </mesh>
        
        {/* Reindeer head */}
        <mesh position={[0.7, 0.3, 0]}>
          <boxGeometry args={[0.6, 0.5, 0.4]} />
          <meshLambertMaterial color="#8B4513" />
        </mesh>

        {/* Antlers */}
        <mesh position={[0.9, 0.8, -0.2]}>
          <boxGeometry args={[0.05, 0.6, 0.05]} />
          <meshLambertMaterial color="#654321" />
        </mesh>
        <mesh position={[0.9, 0.8, 0.2]}>
          <boxGeometry args={[0.05, 0.6, 0.05]} />
          <meshLambertMaterial color="#654321" />
        </mesh>

        {/* Legs */}
        <mesh position={[0.3, -0.6, -0.2]}>
          <boxGeometry args={[0.1, 0.6, 0.1]} />
          <meshLambertMaterial color="#8B4513" />
        </mesh>
        <mesh position={[0.3, -0.6, 0.2]}>
          <boxGeometry args={[0.1, 0.6, 0.1]} />
          <meshLambertMaterial color="#8B4513" />
        </mesh>
        <mesh position={[-0.3, -0.6, -0.2]}>
          <boxGeometry args={[0.1, 0.6, 0.1]} />
          <meshLambertMaterial color="#8B4513" />
        </mesh>
        <mesh position={[-0.3, -0.6, 0.2]}>
          <boxGeometry args={[0.1, 0.6, 0.1]} />
          <meshLambertMaterial color="#8B4513" />
        </mesh>

        {/* Red nose */}
        <mesh position={[1.1, 0.3, 0]}>
          <sphereGeometry args={[0.1, 8, 8]} />
          <meshLambertMaterial color="red" />
        </mesh>
      </group>
    </group>
  );
}
