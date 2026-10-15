'use client';

import React, { useEffect, useRef } from 'react';
import * as THREE from 'three';

export default function ScrollNut3D() {
  // Tạm ẩn hiệu ứng ScrollNut3D theo yêu cầu
  return null;

  /*
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    // 1. Scene & Camera Setup
    const scene = new THREE.Scene();
    const camera = new THREE.PerspectiveCamera(
      45,
      window.innerWidth / window.innerHeight,
      0.1,
      100
    );
    camera.position.set(0, 0, 7.5);

    // 2. High-performance WebGL Renderer
    const renderer = new THREE.WebGLRenderer({
      alpha: true,
      antialias: true,
      powerPreference: 'high-performance',
    });
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    renderer.setSize(window.innerWidth, window.innerHeight);
    renderer.outputColorSpace = THREE.SRGBColorSpace;
    renderer.toneMapping = THREE.ACESFilmicToneMapping;
    renderer.toneMappingExposure = 1.05;
    container.appendChild(renderer.domElement);

    // 3. Soft Studio Lighting
    const ambientLight = new THREE.AmbientLight(0xffffff, 1.3);
    scene.add(ambientLight);

    const keyLight = new THREE.DirectionalLight(0xfff8ee, 2.8);
    keyLight.position.set(6, 6, 5);
    scene.add(keyLight);

    const softFill = new THREE.DirectionalLight(0xffeedd, 1.4);
    softFill.position.set(-6, -2, 4);
    scene.add(softFill);

    // 4. Procedural Organic Almond Texture
    const canvas = document.createElement('canvas');
    canvas.width = 512;
    canvas.height = 512;
    const ctx = canvas.getContext('2d')!;

    // Clean roasted almond natural gradient
    const grad = ctx.createLinearGradient(0, 0, 512, 512);
    grad.addColorStop(0, '#B86F28');
    grad.addColorStop(0.4, '#C98235');
    grad.addColorStop(0.8, '#A85E1E');
    grad.addColorStop(1, '#914E15');
    ctx.fillStyle = grad;
    ctx.fillRect(0, 0, 512, 512);

    // Fine organic striations (thớ hạt tự nhiên)
    ctx.fillStyle = 'rgba(70, 30, 8, 0.16)';
    for (let i = 0; i < 70; i++) {
      const x = Math.random() * 512;
      const w = 1.2 + Math.random() * 2.8;
      ctx.fillRect(x, 0, w, 512);
    }

    const nutTexture = new THREE.CanvasTexture(canvas);
    nutTexture.wrapS = THREE.RepeatWrapping;
    nutTexture.wrapT = THREE.RepeatWrapping;

    // 5. Realistic 3D Almond Nut Geometry
    const baseGeo = new THREE.SphereGeometry(1, 64, 64);
    const pos = baseGeo.attributes.position;
    const p = new THREE.Vector3();

    for (let i = 0; i < pos.count; i++) {
      p.fromBufferAttribute(pos, i);
      const yNorm = p.y;

      let radiusScale = 1.0;
      if (yNorm > 0) {
        // Pointed tip
        radiusScale = Math.pow(1.0 - yNorm * 0.75, 0.7);
      } else {
        // Plump rounded bottom
        radiusScale = Math.pow(1.0 + yNorm * 0.25, 0.5);
      }

      p.x *= radiusScale * 1.15;
      p.z *= radiusScale * 0.62;
      p.y *= 1.55;

      // Natural spine bend
      const spineBend = Math.sin((p.y + 1.5) * 1.2) * 0.15;
      p.x += spineBend;

      pos.setXYZ(i, p.x, p.y, p.z);
    }
    baseGeo.computeVertexNormals();

    const nutMaterial = new THREE.MeshStandardMaterial({
      map: nutTexture,
      bumpMap: nutTexture,
      bumpScale: 0.025,
      roughness: 0.45,
      metalness: 0.03,
      color: 0xffffff,
    });

    const nutMesh = new THREE.Mesh(baseGeo, nutMaterial);
    const nutMasterGroup = new THREE.Group();
    nutMasterGroup.add(nutMesh);
    scene.add(nutMasterGroup);

    // Refined subtle scale - NOT giant, elegant side accent
    nutMasterGroup.scale.setScalar(0.38);

    // 6. Trajectory confined to Right Edge / Margins to NEVER obstruct text
    // Keeps the nut along the outer margin of the viewport
    const curvePoints = [
      new THREE.Vector3(3.1, 1.4, 0.1),    // Top right outer margin (Hero)
      new THREE.Vector3(2.8, 0.3, 0.2),    // Mid right margin (Philosophy)
      new THREE.Vector3(3.0, -0.7, 0.2),   // Lower right margin (Farm story)
      new THREE.Vector3(2.7, -1.7, 0.1),   // Bottom right margin (Footer)
    ];
    const trajectoryCurve = new THREE.CatmullRomCurve3(curvePoints);

    let targetPos = new THREE.Vector3();
    let currentPos = curvePoints[0].clone();
    nutMasterGroup.position.copy(currentPos);

    let scrollFraction = 0;
    const onScroll = () => {
      const scrollY = window.scrollY || window.pageYOffset;
      const maxScroll = Math.max(
        document.documentElement.scrollHeight - window.innerHeight,
        1
      );
      scrollFraction = Math.min(Math.max(scrollY / maxScroll, 0), 1);
    };

    window.addEventListener('scroll', onScroll, { passive: true });
    onScroll();

    // 7. Responsive Sizing & Resize
    const onResize = () => {
      if (!container) return;
      const width = window.innerWidth;
      const height = window.innerHeight;
      camera.aspect = width / height;
      camera.updateProjectionMatrix();
      renderer.setSize(width, height);

      // On mobile screens, hide or scale down to edge
      if (width < 768) {
        nutMasterGroup.scale.setScalar(0.24);
      } else {
        nutMasterGroup.scale.setScalar(0.36);
      }
    };
    window.addEventListener('resize', onResize);
    onResize();

    // 8. Animation Loop
    let animationFrameId: number;
    const clock = new THREE.Clock();

    const animate = () => {
      animationFrameId = requestAnimationFrame(animate);
      const elapsedTime = clock.getElapsedTime();

      // Sample trajectory
      trajectoryCurve.getPointAt(scrollFraction, targetPos);

      // Responsive X positioning based on screen aspect ratio
      const isMobile = window.innerWidth < 768;
      if (isMobile) {
        targetPos.x = 1.4; // Tuck to far right edge on mobile
      }

      // Smooth lerp
      currentPos.lerp(targetPos, 0.08);
      nutMasterGroup.position.copy(currentPos);

      // Gentle subtle breathing hover
      nutMasterGroup.position.y += Math.sin(elapsedTime * 1.8) * 0.04;

      // Elegant slow rotation
      nutMasterGroup.rotation.y = scrollFraction * Math.PI * 3 + elapsedTime * 0.35;
      nutMasterGroup.rotation.x = 0.2 + Math.sin(scrollFraction * Math.PI) * 0.3 + elapsedTime * 0.15;
      nutMasterGroup.rotation.z = Math.cos(elapsedTime * 1.0) * 0.1;

      renderer.render(scene, camera);
    };

    animate();

    // 9. Cleanup & VRAM Disposal
    return () => {
      cancelAnimationFrame(animationFrameId);
      window.removeEventListener('scroll', onScroll);
      window.removeEventListener('resize', onResize);

      if (container && renderer.domElement) {
        container.removeChild(renderer.domElement);
      }

      baseGeo.dispose();
      nutMaterial.dispose();
      nutTexture.dispose();
      renderer.dispose();
    };
  }, []);

  return (
    <div
      ref={containerRef}
      className="fixed inset-0 pointer-events-none z-20 overflow-hidden"
      aria-hidden="true"
    />
  );
  */
}
