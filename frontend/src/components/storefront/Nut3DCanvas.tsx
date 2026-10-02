'use client';

import React, { useEffect, useRef } from 'react';
import * as THREE from 'three';

export default function Nut3DCanvas() {
  const mountRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const container = mountRef.current;
    if (!container) return;

    // 1. Scene & Camera Setup
    const scene = new THREE.Scene();
    const camera = new THREE.PerspectiveCamera(
      40,
      container.clientWidth / container.clientHeight,
      0.1,
      1000
    );
    camera.position.set(0, 0, 8.5);

    // 2. High-Performance WebGL Renderer with Tone Mapping
    const renderer = new THREE.WebGLRenderer({ 
      alpha: true, 
      antialias: true, 
      powerPreference: 'high-performance' 
    });
    renderer.setSize(container.clientWidth, container.clientHeight);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    renderer.toneMapping = THREE.ACESFilmicToneMapping;
    renderer.toneMappingExposure = 1.25;
    container.appendChild(renderer.domElement);

    // 3. Studio Lighting Setup
    const ambientLight = new THREE.AmbientLight(0xffffff, 1.6);
    scene.add(ambientLight);

    const goldKeyLight = new THREE.DirectionalLight(0xfef08a, 2.5);
    goldKeyLight.position.set(5, 7, 6);
    scene.add(goldKeyLight);

    const emeraldRimLight = new THREE.PointLight(0x34d399, 4, 25);
    emeraldRimLight.position.set(-8, -4, 4);
    scene.add(emeraldRimLight);

    const amberFillLight = new THREE.PointLight(0xf59e0b, 3.5, 25);
    amberFillLight.position.set(8, -5, 4);
    scene.add(amberFillLight);

    // 4. Texture Loader with Keying Shader
    const textureLoader = new THREE.TextureLoader();

    // Custom Shader Material that removes black studio background with smooth anti-aliased edge
    const createPhotorealNutMaterial = (mapTexture: THREE.Texture) => {
      return new THREE.ShaderMaterial({
        uniforms: {
          uTexture: { value: mapTexture },
          uTime: { value: 0 },
        },
        vertexShader: `
          varying vec2 vUv;
          varying vec3 vNormal;
          void main() {
            vUv = uv;
            vNormal = normalize(normalMatrix * normal);
            gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
          }
        `,
        fragmentShader: `
          uniform sampler2D uTexture;
          uniform float uTime;
          varying vec2 vUv;
          varying vec3 vNormal;

          void main() {
            vec4 texColor = texture2D(uTexture, vUv);
            
            // Calculate luminance to create transparent alpha for solid black studio background
            float maxVal = max(texColor.r, max(texColor.g, texColor.b));
            float alpha = smoothstep(0.03, 0.16, maxVal);

            if (alpha < 0.01) discard;

            // Enhance contrast and golden nut warmth
            vec3 enhancedColor = pow(texColor.rgb, vec3(0.92)) * 1.08;
            gl_FragColor = vec4(enhancedColor, alpha);
          }
        `,
        transparent: true,
        side: THREE.DoubleSide,
        depthWrite: false,
      });
    };

    // 5. Master 3D Group
    const masterGroup = new THREE.Group();
    scene.add(masterGroup);

    // --- Asset A: Central Ultra-Realistic Macadamia Nut (Studio Render) ---
    const maccaTexture = textureLoader.load('/images/nuts/macadamia_hero.jpg');
    const maccaMat = createPhotorealNutMaterial(maccaTexture);
    
    // Create curved 3D geometry for natural depth
    const maccaGeo = new THREE.PlaneGeometry(4.2, 4.2, 32, 32);
    const maccaPos = maccaGeo.attributes.position;
    for (let i = 0; i < maccaPos.count; i++) {
      const u = maccaPos.getX(i);
      const v = maccaPos.getY(i);
      const z = -((u * u) / 18 + (v * v) / 18) * 0.4;
      maccaPos.setZ(i, z);
    }
    maccaGeo.computeVertexNormals();

    const maccaMesh = new THREE.Mesh(maccaGeo, maccaMat);
    maccaMesh.position.set(0, 0, 0.4);
    masterGroup.add(maccaMesh);

    // --- Asset B: Photorealistic Mixed Nuts Cluster (Left & Right Flanks) ---
    const mixedNutsTexture = textureLoader.load('/images/nuts/mixed_nuts_hero.jpg');
    
    // Left Flank (Almonds & Walnuts)
    const leftMat = createPhotorealNutMaterial(mixedNutsTexture);
    const leftGeo = new THREE.PlaneGeometry(3.6, 3.6, 24, 24);
    const leftMesh = new THREE.Mesh(leftGeo, leftMat);
    leftMesh.position.set(-4.2, 0.4, 0.6);
    leftMesh.rotation.set(0.1, 0.25, -0.15);
    masterGroup.add(leftMesh);

    // Right Flank (Golden Cashews & Walnuts)
    const rightMat = createPhotorealNutMaterial(mixedNutsTexture);
    const rightGeo = new THREE.PlaneGeometry(3.6, 3.6, 24, 24);
    const rightMesh = new THREE.Mesh(rightGeo, rightMat);
    rightMesh.position.set(4.2, -0.3, 0.5);
    rightMesh.rotation.set(-0.1, -0.25, 0.15);
    masterGroup.add(rightMesh);

    // Foreground Satellite (Lower Left Cashew Accent)
    const sat1Mat = createPhotorealNutMaterial(mixedNutsTexture);
    const sat1Geo = new THREE.PlaneGeometry(2.4, 2.4, 16, 16);
    const sat1Mesh = new THREE.Mesh(sat1Geo, sat1Mat);
    sat1Mesh.position.set(-2.4, -2.1, 1.0);
    sat1Mesh.rotation.set(0.2, -0.1, -0.4);
    masterGroup.add(sat1Mesh);

    // Foreground Satellite (Lower Right Almond Accent)
    const sat2Mat = createPhotorealNutMaterial(mixedNutsTexture);
    const sat2Geo = new THREE.PlaneGeometry(2.2, 2.2, 16, 16);
    const sat2Mesh = new THREE.Mesh(sat2Geo, sat2Mat);
    sat2Mesh.position.set(2.4, -2.1, 0.8);
    sat2Mesh.rotation.set(-0.2, 0.1, 0.4);
    masterGroup.add(sat2Mesh);

    // 6. Holographic Quantum Energy Rings
    const ringGeo1 = new THREE.RingGeometry(2.8, 2.83, 128);
    const ringMat1 = new THREE.MeshBasicMaterial({
      color: 0x34d399,
      side: THREE.DoubleSide,
      transparent: true,
      opacity: 0.35,
    });
    const ring1 = new THREE.Mesh(ringGeo1, ringMat1);
    ring1.rotation.x = Math.PI / 2.2;
    ring1.rotation.y = Math.PI / 7;
    masterGroup.add(ring1);

    const ringGeo2 = new THREE.RingGeometry(3.8, 3.82, 128);
    const ringMat2 = new THREE.MeshBasicMaterial({
      color: 0xfbbf24,
      side: THREE.DoubleSide,
      transparent: true,
      opacity: 0.22,
    });
    const ring2 = new THREE.Mesh(ringGeo2, ringMat2);
    ring2.rotation.x = -Math.PI / 2.6;
    ring2.rotation.y = -Math.PI / 6;
    masterGroup.add(ring2);

    // 7. Golden Nutrient Energy Dust Particles
    const particleCount = 180;
    const particleGeo = new THREE.BufferGeometry();
    const particlePositions = new Float32Array(particleCount * 3);

    for (let i = 0; i < particleCount * 3; i += 3) {
      particlePositions[i] = (Math.random() - 0.5) * 20;
      particlePositions[i + 1] = (Math.random() - 0.5) * 11;
      particlePositions[i + 2] = (Math.random() - 0.5) * 8;
    }
    particleGeo.setAttribute('position', new THREE.BufferAttribute(particlePositions, 3));

    const particleMat = new THREE.PointsMaterial({
      color: 0xfcd34d,
      size: 0.08,
      transparent: true,
      opacity: 0.85,
      blending: THREE.AdditiveBlending,
    });
    const particleSystem = new THREE.Points(particleGeo, particleMat);
    masterGroup.add(particleSystem);

    // 8. Interactive Mouse Physics & Parallax
    let mouseX = 0;
    let mouseY = 0;
    let targetRotationX = 0;
    let targetRotationY = 0;

    const handleMouseMove = (e: MouseEvent) => {
      const rect = container.getBoundingClientRect();
      const x = (e.clientX - rect.left) / rect.width - 0.5;
      const y = (e.clientY - rect.top) / rect.height - 0.5;
      mouseX = x * 1.5;
      mouseY = y * 1.5;
    };

    window.addEventListener('mousemove', handleMouseMove);

    // 9. Render Loop
    let animationFrameId: number;
    const clock = new THREE.Clock();

    const animate = () => {
      animationFrameId = requestAnimationFrame(animate);
      const elapsedTime = clock.getElapsedTime();

      // Master 3D Group follows mouse smoothly with inertia
      targetRotationY = mouseX * 0.45;
      targetRotationX = mouseY * 0.3;
      masterGroup.rotation.y += (targetRotationY - masterGroup.rotation.y) * 0.045 + 0.0015;
      masterGroup.rotation.x += (targetRotationX - masterGroup.rotation.x) * 0.045;

      // Independent multi-plane floating physics
      maccaMesh.position.y = Math.sin(elapsedTime * 1.2) * 0.12;
      maccaMesh.rotation.z = Math.sin(elapsedTime * 0.6) * 0.03;

      leftMesh.position.y = 0.4 + Math.sin(elapsedTime * 1.4 + 0.8) * 0.16;
      leftMesh.rotation.z = -0.15 + Math.cos(elapsedTime * 0.8) * 0.04;

      rightMesh.position.y = -0.3 + Math.cos(elapsedTime * 1.3 + 1.2) * 0.15;
      rightMesh.rotation.z = 0.15 + Math.sin(elapsedTime * 0.7) * 0.04;

      sat1Mesh.position.y = -2.1 + Math.sin(elapsedTime * 1.5 + 2) * 0.12;
      sat2Mesh.position.y = -2.1 + Math.cos(elapsedTime * 1.6 + 2.5) * 0.12;

      ring1.rotation.z += 0.002;
      ring2.rotation.z -= 0.0018;
      particleSystem.rotation.y += 0.0006;

      goldKeyLight.intensity = 2.4 + Math.sin(elapsedTime * 2) * 0.3;

      renderer.render(scene, camera);
    };

    animate();

    // 10. Resize Handler
    const handleResize = () => {
      if (!container) return;
      camera.aspect = container.clientWidth / container.clientHeight;
      camera.updateProjectionMatrix();
      renderer.setSize(container.clientWidth, container.clientHeight);
    };

    window.addEventListener('resize', handleResize);

    // 11. Cleanup
    return () => {
      window.removeEventListener('mousemove', handleMouseMove);
      window.removeEventListener('resize', handleResize);
      cancelAnimationFrame(animationFrameId);
      renderer.dispose();
      maccaGeo.dispose();
      maccaMat.dispose();
      leftGeo.dispose();
      leftMat.dispose();
      rightGeo.dispose();
      rightMat.dispose();
      sat1Geo.dispose();
      sat1Mat.dispose();
      sat2Geo.dispose();
      sat2Mat.dispose();
      ringGeo1.dispose();
      ringMat1.dispose();
      ringGeo2.dispose();
      ringMat2.dispose();
      particleGeo.dispose();
      particleMat.dispose();
      maccaTexture.dispose();
      mixedNutsTexture.dispose();
      if (container.contains(renderer.domElement)) {
        container.removeChild(renderer.domElement);
      }
    };
  }, []);

  return (
    <div className="relative w-full h-[540px] sm:h-[620px] lg:h-[700px] flex items-center justify-center overflow-hidden">
      {/* 3D WebGL Canvas Viewport Full Width */}
      <div 
        ref={mountRef} 
        className="w-full h-full cursor-grab active:cursor-grabbing"
      />
    </div>
  );
}
