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
    // Subtle global smoothing to make it less distracting
    // Increase vibrancy and remove blur so visuals pop through overlays
    renderer.domElement.style.filter = "saturate(1.05)";
    container.appendChild(renderer.domElement);

    // Store refs
    sceneRef.current = scene;
    rendererRef.current = renderer;
    cameraRef.current = camera;

    // Camera position (keep stable; slight parallax only)
    camera.position.set(0, 0.2, 18);
    camera.lookAt(0, 0, 0);

    // Create nodes
    const nodeCount = 44;
    const nodes: Node[] = [];
    
    // Node geometry and materials (more subtle/professional)
    const nodeGeometry = new THREE.SphereGeometry(0.09, 16, 16);
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

    // Create nodes in a halo pattern with a central exclusion zone for better legibility
    for (let i = 0; i < nodeCount; i++) {
      const angle = (i / nodeCount) * Math.PI * 2;
      const radius = 5 + Math.random() * 3; // 5 - 8
      const height = (Math.random() - 0.5) * 2.4; // -1.2 to 1.2
      
      const position = new THREE.Vector3(
        Math.cos(angle) * radius + (Math.random() - 0.5) * 1.2,
        height,
        Math.sin(angle) * radius + (Math.random() - 0.5) * 1.2
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

    // Create connections between nearby nodes (more subtle lines)
    const connections: Connection[] = [];
    const lineMaterial = new THREE.LineBasicMaterial({ 
      color: 0x6366f1,
      transparent: true,
      opacity: 0.22,
      blending: THREE.AdditiveBlending,
      depthWrite: false,
    });

    for (let i = 0; i < nodes.length; i++) {
      for (let j = i + 1; j < nodes.length; j++) {
        const distance = nodes[i].position.distanceTo(nodes[j].position);
        if (distance < 5 && Math.random() > 0.65) {
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

    // Subtle parallax based on cursor (non-intrusive)
    let pointerX = 0;
    let pointerY = 0;
    const onPointerMove = (e: MouseEvent) => {
      const nx = (e.clientX / window.innerWidth) * 2 - 1;
      const ny = (e.clientY / window.innerHeight) * 2 - 1;
      pointerX = nx;
      pointerY = ny;
    };
    window.addEventListener("mousemove", onPointerMove);

    // Animation loop
    let time = 0;
    const animate = () => {
      if (!reduceMotion) {
        time += 0.01;

        // Animate nodes (gentle)
        nodes.forEach((node) => {
          node.pulsePhase += 0.02;
          const pulseScale = 1 + Math.sin(node.pulsePhase) * 0.08;
          node.mesh.scale.setScalar(pulseScale);

          // Subtle position drift with soft bounds
          node.position.add(node.velocity);
          if (node.position.length() < 3.5) {
            node.position.multiplyScalar(1.01);
          }
          if (node.position.length() > 9) {
            node.position.multiplyScalar(0.99);
          }
          node.mesh.position.copy(node.position);

          // Gentle rotation
          node.mesh.rotation.y += 0.003;
          node.mesh.rotation.x += 0.002;
        });

        // Update connections
        connections.forEach((connection) => {
          const points = [connection.from.position, connection.to.position];
          connection.line.geometry.setFromPoints(points);

          // Subtle pulsing opacity for flow effect
          const pulse = Math.sin(time * 1.6 + connection.pulseOffset) * 0.5 + 0.5;
          (connection.line.material as THREE.LineBasicMaterial).opacity = 0.22 + pulse * 0.25;
        });

        // Subtle parallax only (no orbiting)
        const parallaxX = pointerX * 0.35;
        const parallaxY = pointerY * 0.18;
        camera.position.x += (parallaxX - camera.position.x * 0.05) * 0.05;
        camera.position.y += (parallaxY - camera.position.y * 0.05) * 0.05;
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
      window.removeEventListener("mousemove", onPointerMove);
      
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
      className={`absolute inset-0 -z-10 transition-opacity duration-1000 ${
        isLoaded ? 'opacity-100' : 'opacity-0'
      }`}
      style={{ 
        pointerEvents: 'none',
        background: 'transparent'
      }}
    />
  );
}