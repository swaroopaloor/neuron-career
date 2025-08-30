import { useEffect, useRef, useState } from 'react';
import { useReducedMotion } from 'framer-motion';
import * as THREE from 'three';

interface Node {
  position: THREE.Vector3;
  velocity: THREE.Vector3;
  mesh: THREE.Mesh;
  targetPosition: THREE.Vector3;
  pulsePhase: number;
}

interface Connection {
  from: Node;
  to: Node;
  line: THREE.Line;
  strength: number;
  pulseOffset: number;
}

export default function AbstractThreeDVisual() {
  const mountRef = useRef<HTMLDivElement>(null);
  const sceneRef = useRef<THREE.Scene>();
  const rendererRef = useRef<THREE.WebGLRenderer>();
  const cameraRef = useRef<THREE.PerspectiveCamera>();
  const nodesRef = useRef<Node[]>([]);
  const connectionsRef = useRef<Connection[]>([]);
  const animationIdRef = useRef<number>();
  const [isLoaded, setIsLoaded] = useState(false);
  const reduceMotion = useReducedMotion();

  useEffect(() => {
    if (!mountRef.current) return;

    // Scene setup
    const container = mountRef.current;
    const scene = new THREE.Scene();
    const width = container.clientWidth || window.innerWidth;
    const height = container.clientHeight || window.innerHeight;
    const camera = new THREE.PerspectiveCamera(75, width / height, 0.1, 1000);
    const renderer = new THREE.WebGLRenderer({ 
      antialias: true, 
      alpha: true,
      powerPreference: "high-performance"
    });

    // Ensure canvas fills container and sits correctly in stacking context
    renderer.setSize(width, height);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    renderer.setClearColor(0x000000, 0);
    renderer.domElement.style.position = "absolute";
    renderer.domElement.style.inset = "0";
    renderer.domElement.style.width = "100%";
    renderer.domElement.style.height = "100%";
    renderer.domElement.style.pointerEvents = "none";
    container.appendChild(renderer.domElement);

    // Store refs
    sceneRef.current = scene;
    rendererRef.current = renderer;
    cameraRef.current = camera;

    // Camera position
    camera.position.set(0, 0, 15);
    camera.lookAt(0, 0, 0);

    // Create nodes
    const nodeCount = 24;
    const nodes: Node[] = [];
    
    // Node geometry and materials
    const nodeGeometry = new THREE.SphereGeometry(0.08, 16, 16);
    const primaryMaterial = new THREE.MeshBasicMaterial({ 
      color: 0x6366f1,
      transparent: true,
      opacity: 0.85,
      blending: THREE.AdditiveBlending,
      depthWrite: false,
    });
    const secondaryMaterial = new THREE.MeshBasicMaterial({ 
      color: 0xec4899,
      transparent: true,
      opacity: 0.7,
      blending: THREE.AdditiveBlending,
      depthWrite: false,
    });

    // Create nodes in a distributed pattern
    for (let i = 0; i < nodeCount; i++) {
      const angle = (i / nodeCount) * Math.PI * 2;
      const radius = 3 + Math.random() * 4;
      const height = (Math.random() - 0.5) * 6;
      
      const position = new THREE.Vector3(
        Math.cos(angle) * radius + (Math.random() - 0.5) * 2,
        height,
        Math.sin(angle) * radius + (Math.random() - 0.5) * 2
      );

      const mesh = new THREE.Mesh(
        nodeGeometry, 
        i % 3 === 0 ? secondaryMaterial : primaryMaterial
      );
      mesh.position.copy(position);
      scene.add(mesh);

      const node: Node = {
        position: position.clone(),
        velocity: new THREE.Vector3(
          (Math.random() - 0.5) * 0.02,
          (Math.random() - 0.5) * 0.02,
          (Math.random() - 0.5) * 0.02
        ),
        mesh,
        targetPosition: position.clone(),
        pulsePhase: Math.random() * Math.PI * 2
      };

      nodes.push(node);
    }

    nodesRef.current = nodes;

    // Create connections between nearby nodes
    const connections: Connection[] = [];
    const lineMaterial = new THREE.LineBasicMaterial({ 
      color: 0x6366f1,
      transparent: true,
      opacity: 0.5,
      blending: THREE.AdditiveBlending,
      depthWrite: false,
    });

    for (let i = 0; i < nodes.length; i++) {
      for (let j = i + 1; j < nodes.length; j++) {
        const distance = nodes[i].position.distanceTo(nodes[j].position);
        if (distance < 4 && Math.random() > 0.6) {
          const geometry = new THREE.BufferGeometry().setFromPoints([
            nodes[i].position,
            nodes[j].position
          ]);
          
          const line = new THREE.Line(geometry, lineMaterial);
          scene.add(line);

          connections.push({
            from: nodes[i],
            to: nodes[j],
            line,
            strength: Math.random(),
            pulseOffset: Math.random() * Math.PI * 2
          });
        }
      }
    }

    connectionsRef.current = connections;

    // Animation loop
    let time = 0;
    const animate = () => {
      if (!reduceMotion) {
        time += 0.01;

        // Animate nodes
        nodes.forEach((node, index) => {
          // Gentle floating motion
          node.pulsePhase += 0.02;
          const pulseScale = 1 + Math.sin(node.pulsePhase) * 0.1;
          node.mesh.scale.setScalar(pulseScale);

          // Subtle position drift
          node.position.add(node.velocity);
          
          // Boundary constraints
          if (Math.abs(node.position.x) > 8) node.velocity.x *= -1;
          if (Math.abs(node.position.y) > 4) node.velocity.y *= -1;
          if (Math.abs(node.position.z) > 8) node.velocity.z *= -1;

          node.mesh.position.copy(node.position);

          // Gentle rotation
          node.mesh.rotation.y += 0.005;
          node.mesh.rotation.x += 0.003;
        });

        // Update connections
        connections.forEach((connection, index) => {
          const points = [connection.from.position, connection.to.position];
          connection.line.geometry.setFromPoints(points);

          // Pulsing opacity
          const pulse = Math.sin(time * 2 + connection.pulseOffset) * 0.5 + 0.5;
          (connection.line.material as THREE.LineBasicMaterial).opacity = 0.1 + pulse * 0.3;
        });

        // Gentle camera rotation
        camera.position.x = Math.cos(time * 0.1) * 15;
        camera.position.z = Math.sin(time * 0.1) * 15;
        camera.lookAt(0, 0, 0);
      }

      renderer.render(scene, camera);
      animationIdRef.current = requestAnimationFrame(animate);
    };

    animate();
    setIsLoaded(true);

    // Handle resize
    const handleResize = () => {
      if (!camera || !renderer || !mountRef.current) return;
      const { clientWidth, clientHeight } = mountRef.current;
      camera.aspect = clientWidth / clientHeight;
      camera.updateProjectionMatrix();
      renderer.setSize(clientWidth, clientHeight);
    };

    window.addEventListener('resize', handleResize);

    // Cleanup
    return () => {
      window.removeEventListener('resize', handleResize);
      
      if (animationIdRef.current) {
        cancelAnimationFrame(animationIdRef.current);
      }
      
      if (mountRef.current && renderer.domElement) {
        mountRef.current.removeChild(renderer.domElement);
      }
      
      // Dispose of Three.js resources
      scene.traverse((object) => {
        if (object instanceof THREE.Mesh) {
          object.geometry.dispose();
          if (Array.isArray(object.material)) {
            object.material.forEach(material => material.dispose());
          } else {
            object.material.dispose();
          }
        }
      });
      
      renderer.dispose();
    };
  }, [reduceMotion]);

  if (reduceMotion) {
    return null;
  }

  return (
    <div 
      ref={mountRef} 
      className={`absolute inset-0 z-0 transition-opacity duration-1000 ${
        isLoaded ? 'opacity-100' : 'opacity-0'
      }`}
      style={{ 
        pointerEvents: 'none',
        background: 'transparent'
      }}
    />
  );
}