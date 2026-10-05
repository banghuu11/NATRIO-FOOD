'use client';

import React, { useEffect, useRef, useState } from 'react';
import * as THREE from 'three';
import { Sparkles, RefreshCw, Layers, Zap, Info } from 'lucide-react';

interface NutInfo {
  id: string;
  name: string;
  scientificName: string;
  nutrients: string;
  benefits: string;
  color: string;
  icon: string;
  screenPos: { x: number; y: number; visible: boolean };
}

export default function Nut3DCanvas() {
  const mountRef = useRef<HTMLDivElement>(null);
  const [isExploded, setIsExploded] = useState(true);
  const [selectedNut, setSelectedNut] = useState<string | null>(null);
  const [nutList, setNutList] = useState<NutInfo[]>([
    {
      id: 'macca',
      name: 'Hạt Macca Đắk Lắk',
      scientificName: 'Macadamia Integrifolia',
      nutrients: 'Omega-7 • Axit Oleic • B1',
      benefits: 'Bảo vệ tim mạch & hạ cholesterol xấu',
      color: '#F59E0B',
      icon: '🌰',
      screenPos: { x: 0, y: 0, visible: false },
    },
    {
      id: 'almond',
      name: 'Hạnh Nhân California',
      scientificName: 'Prunus Dulcis',
      nutrients: 'Vitamin E • 6.2g Protein • Riboflavin',
      benefits: 'Chống lão hóa da & săn chắc cơ bắp',
      color: '#10B981',
      icon: '🌿',
      screenPos: { x: 0, y: 0, visible: false },
    },
    {
      id: 'walnut',
      name: 'Quả Óc Chó Vàng',
      scientificName: 'Juglans Regia',
      nutrients: 'Omega-3 ALA • Polyphenol • Đồng',
      benefits: 'Tăng tuần hoàn não & cải thiện trí nhớ',
      color: '#3B82F6',
      icon: '🧠',
      screenPos: { x: 0, y: 0, visible: false },
    },
    {
      id: 'cashew',
      name: 'Hạt Điều Bình Phước',
      scientificName: 'Anacardium Occidentale',
      nutrients: 'Magie • Kẽm • Sắt hữu cơ',
      benefits: 'Bổ sung năng lượng & chắc khỏe xương',
      color: '#EC4899',
      icon: '⚡',
      screenPos: { x: 0, y: 0, visible: false },
    },
    {
      id: 'chia',
      name: 'Hạt Bí & Chia Organic',
      scientificName: 'Salvia Hispanica',
      nutrients: 'Chất xơ Beta-Glucan • Tryptophan',
      benefits: 'Tốt cho tiêu hóa & hỗ trợ giấc ngủ sâu',
      color: '#8B5CF6',
      icon: '🌾',
      screenPos: { x: 0, y: 0, visible: false },
    },
  ]);

  // Ref to trigger explosion from external buttons
  const toggleExplosionRef = useRef<() => void>(() => {});

  useEffect(() => {
    const container = mountRef.current;
    if (!container) return;

    // 1. Scene & Camera Setup
    const scene = new THREE.Scene();
    const camera = new THREE.PerspectiveCamera(
      45,
      container.clientWidth / container.clientHeight,
      0.1,
      1000
    );
    camera.position.set(0, 0.5, 7.8);

    // 2. High-Performance WebGL Renderer
    const renderer = new THREE.WebGLRenderer({
      alpha: true,
      antialias: true,
      powerPreference: 'high-performance',
    });
    renderer.setSize(container.clientWidth, container.clientHeight);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    renderer.toneMapping = THREE.ACESFilmicToneMapping;
    renderer.toneMappingExposure = 1.35;
    container.appendChild(renderer.domElement);

    // 3. Studio Lighting
    const ambientLight = new THREE.AmbientLight(0xffffff, 1.8);
    scene.add(ambientLight);

    const goldKeyLight = new THREE.DirectionalLight(0xfef08a, 3.2);
    goldKeyLight.position.set(6, 8, 6);
    scene.add(goldKeyLight);

    const emeraldRimLight = new THREE.PointLight(0x34d399, 4.5, 25);
    emeraldRimLight.position.set(-7, -3, 5);
    scene.add(emeraldRimLight);

    const warmFillLight = new THREE.PointLight(0xf59e0b, 3.8, 25);
    warmFillLight.position.set(7, -4, 5);
    scene.add(warmFillLight);

    // 4. Master 3D Group
    const masterGroup = new THREE.Group();
    scene.add(masterGroup);

    // --- 5. Beautiful Ceramic & Wood Healthy Bowl / Cup ---
    const bowlGroup = new THREE.Group();
    masterGroup.add(bowlGroup);

    // Bowl Body Geometry (Smooth curved cup)
    const bowlGeo = new THREE.CylinderGeometry(1.65, 0.95, 1.3, 48, 8, true);
    const bowlMat = new THREE.MeshStandardMaterial({
      color: 0x3d5a45, // Forest Sage Green ceramic
      roughness: 0.25,
      metalness: 0.15,
      side: THREE.DoubleSide,
    });
    const bowlMesh = new THREE.Mesh(bowlGeo, bowlMat);
    bowlMesh.position.y = -0.65;
    bowlGroup.add(bowlMesh);

    // Bowl Base
    const baseGeo = new THREE.CylinderGeometry(0.95, 0.95, 0.15, 48);
    const baseMat = new THREE.MeshStandardMaterial({
      color: 0xc5853b, // Golden caramel wood rim
      roughness: 0.4,
      metalness: 0.2,
    });
    const baseMesh = new THREE.Mesh(baseGeo, baseMat);
    baseMesh.position.y = -1.3;
    bowlGroup.add(baseMesh);

    // Bowl Gold Rim Ring
    const rimGeo = new THREE.TorusGeometry(1.66, 0.045, 16, 64);
    const rimMat = new THREE.MeshStandardMaterial({
      color: 0xfbbf24,
      metalness: 0.85,
      roughness: 0.15,
    });
    const rimMesh = new THREE.Mesh(rimGeo, rimMat);
    rimMesh.rotation.x = Math.PI / 2;
    rimMesh.position.y = 0.0;
    bowlGroup.add(rimMesh);

    // Holographic Energy Core inside cup
    const coreGeo = new THREE.SphereGeometry(0.85, 32, 32);
    const coreMat = new THREE.MeshBasicMaterial({
      color: 0xf59e0b,
      transparent: true,
      opacity: 0.25,
      blending: THREE.AdditiveBlending,
    });
    const coreMesh = new THREE.Mesh(coreGeo, coreMat);
    coreMesh.position.y = -0.4;
    bowlGroup.add(coreMesh);

    // --- 6. The 5 Nutritional Nuts with Burst Positions ---
    const nutsData = [
      {
        id: 'macca',
        insidePos: new THREE.Vector3(0, -0.3, 0.2),
        burstPos: new THREE.Vector3(-2.8, 1.4, 0.5),
        color: 0xead9b6,
        size: 0.65,
        mesh: null as any,
      },
      {
        id: 'almond',
        insidePos: new THREE.Vector3(-0.4, -0.2, -0.2),
        burstPos: new THREE.Vector3(2.8, 1.3, 0.4),
        color: 0xbd7c45,
        size: 0.58,
        mesh: null as any,
      },
      {
        id: 'walnut',
        insidePos: new THREE.Vector3(0.4, -0.25, 0.1),
        burstPos: new THREE.Vector3(-2.7, -1.2, 0.6),
        color: 0xd79a5b,
        size: 0.68,
        mesh: null as any,
      },
      {
        id: 'cashew',
        insidePos: new THREE.Vector3(-0.2, -0.35, 0.3),
        burstPos: new THREE.Vector3(2.7, -1.1, 0.5),
        color: 0xf6e5c5,
        size: 0.55,
        mesh: null as any,
      },
      {
        id: 'chia',
        insidePos: new THREE.Vector3(0.2, -0.15, -0.3),
        burstPos: new THREE.Vector3(0, 2.3, 0.2),
        color: 0x557a5e,
        size: 0.52,
        mesh: null as any,
      },
    ];

    nutsData.forEach((nut) => {
      // Create detailed organic 3D nut geometry
      let geo: THREE.BufferGeometry;
      if (nut.id === 'macca') {
        geo = new THREE.SphereGeometry(nut.size, 32, 32);
      } else if (nut.id === 'almond') {
        geo = new THREE.ConeGeometry(nut.size * 0.9, nut.size * 1.8, 24);
      } else if (nut.id === 'cashew') {
        geo = new THREE.TorusGeometry(nut.size * 0.7, nut.size * 0.35, 16, 32, Math.PI * 1.2);
      } else if (nut.id === 'walnut') {
        geo = new THREE.DodecahedronGeometry(nut.size, 2);
      } else {
        geo = new THREE.OctahedronGeometry(nut.size, 2);
      }

      const mat = new THREE.MeshStandardMaterial({
        color: nut.color,
        roughness: 0.4,
        metalness: 0.1,
      });

      const mesh = new THREE.Mesh(geo, mat);
      mesh.position.copy(nut.insidePos);
      masterGroup.add(mesh);
      nut.mesh = mesh;

      // Add small glowing aura ring around each nut
      const auraGeo = new THREE.RingGeometry(nut.size * 1.15, nut.size * 1.25, 32);
      const auraMat = new THREE.MeshBasicMaterial({
        color: 0xfcd34d,
        side: THREE.DoubleSide,
        transparent: true,
        opacity: 0.6,
        blending: THREE.AdditiveBlending,
      });
      const auraMesh = new THREE.Mesh(auraGeo, auraMat);
      mesh.add(auraMesh);
    });

    // --- 7. Golden Nutrient Sparkle Particles ---
    const particleCount = 140;
    const particleGeo = new THREE.BufferGeometry();
    const particlePositions = new Float32Array(particleCount * 3);

    for (let i = 0; i < particleCount * 3; i += 3) {
      particlePositions[i] = (Math.random() - 0.5) * 12;
      particlePositions[i + 1] = (Math.random() - 0.5) * 8;
      particlePositions[i + 2] = (Math.random() - 0.5) * 6;
    }
    particleGeo.setAttribute('position', new THREE.BufferAttribute(particlePositions, 3));

    const particleMat = new THREE.PointsMaterial({
      color: 0xfcd34d,
      size: 0.075,
      transparent: true,
      opacity: 0.85,
      blending: THREE.AdditiveBlending,
    });
    const particleSystem = new THREE.Points(particleGeo, particleMat);
    masterGroup.add(particleSystem);

    // --- 8. State for Animation Lerp ---
    let explosionProgress = 0; // 0 = in cup, 1 = exploded
    let targetExplosion = 1; // Default to exploded outward on enter

    toggleExplosionRef.current = () => {
      targetExplosion = targetExplosion === 1 ? 0 : 1;
      setIsExploded(targetExplosion === 1);
    };

    // Auto-trigger explosion sequence after 0.8s on first load
    setTimeout(() => {
      targetExplosion = 1;
      setIsExploded(true);
    }, 800);

    // Mouse Tracking
    let mouseX = 0;
    let mouseY = 0;

    const handleMouseMove = (e: MouseEvent) => {
      const rect = container.getBoundingClientRect();
      const x = (e.clientX - rect.left) / rect.width - 0.5;
      const y = (e.clientY - rect.top) / rect.height - 0.5;
      mouseX = x * 1.2;
      mouseY = y * 1.2;
    };

    window.addEventListener('mousemove', handleMouseMove);

    // 9. Animation Loop
    let animId: number;
    const clock = new THREE.Clock();

    const animate = () => {
      animId = requestAnimationFrame(animate);
      const elapsed = clock.getElapsedTime();

      // Smooth interpolation for explosion physics
      explosionProgress += (targetExplosion - explosionProgress) * 0.055;

      // Group rotation with gentle mouse inertia
      masterGroup.rotation.y += (mouseX * 0.35 - masterGroup.rotation.y) * 0.05 + 0.002;
      masterGroup.rotation.x += (mouseY * 0.25 - masterGroup.rotation.x) * 0.05;

      // Cup rotation & bobbing
      bowlGroup.position.y = Math.sin(elapsed * 1.5) * 0.08;
      bowlGroup.rotation.y += 0.008;

      // Update positions for each nut & project 3D coordinates to 2D Screen
      const updatedPositions: Record<string, { x: number; y: number; visible: boolean }> = {};

      nutsData.forEach((nut, idx) => {
        if (!nut.mesh) return;

        // Position = Lerp(inside, burst) + gentle floating wave
        const floatOffset = new THREE.Vector3(
          Math.sin(elapsed * 1.8 + idx) * 0.1,
          Math.cos(elapsed * 1.6 + idx * 1.2) * 0.12,
          Math.sin(elapsed * 1.4 + idx * 0.8) * 0.08
        );

        const currentPos = new THREE.Vector3().lerpVectors(
          nut.insidePos,
          nut.burstPos,
          explosionProgress
        ).add(floatOffset);

        nut.mesh.position.copy(currentPos);

        // Rotation of each nut
        nut.mesh.rotation.x += 0.015;
        nut.mesh.rotation.y += 0.02;

        // Scale: slightly larger when exploded
        const scale = THREE.MathUtils.lerp(0.7, 1.1, explosionProgress);
        nut.mesh.scale.set(scale, scale, scale);

        // Project 3D vector to 2D screen pixels for Vitamin cards
        const screenVec = currentPos.clone().applyMatrix4(masterGroup.matrixWorld).project(camera);
        const screenX = (screenVec.x * 0.5 + 0.5) * container.clientWidth;
        const screenY = (-screenVec.y * 0.5 + 0.5) * container.clientHeight;

        updatedPositions[nut.id] = {
          x: screenX,
          y: screenY,
          visible: explosionProgress > 0.45 && screenVec.z < 1,
        };
      });

      // Update React state for Vitamin HUD Pills
      setNutList((prev) =>
        prev.map((item) => ({
          ...item,
          screenPos: updatedPositions[item.id] || item.screenPos,
        }))
      );

      // Particle sparkles rotation
      particleSystem.rotation.y += 0.002;
      goldKeyLight.intensity = 3.0 + Math.sin(elapsed * 2.5) * 0.4;

      renderer.render(scene, camera);
    };

    animate();

    // 10. Resize handler
    const handleResize = () => {
      if (!container) return;
      camera.aspect = container.clientWidth / container.clientHeight;
      camera.updateProjectionMatrix();
      renderer.setSize(container.clientWidth, container.clientHeight);
    };

    window.addEventListener('resize', handleResize);

    return () => {
      cancelAnimationFrame(animId);
      window.removeEventListener('mousemove', handleMouseMove);
      window.removeEventListener('resize', handleResize);
      if (container.contains(renderer.domElement)) {
        container.removeChild(renderer.domElement);
      }
      renderer.dispose();
    };
  }, []);

  return (
    <div className="relative w-full h-[420px] sm:h-[480px] lg:h-[540px] select-none overflow-hidden rounded-3xl bg-gradient-to-b from-[#152e22] via-[#0b1c15] to-[#06140e] border border-emerald-900/50 shadow-2xl">
      
      {/* 1. 3D WebGL Canvas Mount */}
      <div ref={mountRef} className="w-full h-full cursor-grab active:cursor-grabbing" />

      {/* 2. Top Interactive Action Control Bar */}
      <div className="absolute top-4 left-4 right-4 z-20 flex items-center justify-between pointer-events-auto">
        <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-slate-900/85 border border-emerald-500/30 text-emerald-300 text-xs font-bold backdrop-blur-md shadow-lg">
          <Sparkles className="w-3.5 h-3.5 text-amber-400 animate-pulse" />
          <span>MÔ HÌNH 3D VĂNG HẠT & PHÂN TÍCH VITAMIN</span>
        </div>

        <button
          type="button"
          onClick={() => toggleExplosionRef.current()}
          className="px-4 py-1.5 rounded-full bg-emerald-600 hover:bg-emerald-500 text-slate-950 font-black text-xs shadow-md shadow-emerald-600/30 flex items-center gap-1.5 transition-all hover:scale-105 active:scale-95 cursor-pointer"
        >
          {isExploded ? <RefreshCw className="w-3.5 h-3.5" /> : <Zap className="w-3.5 h-3.5" />}
          <span>{isExploded ? 'Thu Gom Vào Cốc' : 'Văng Hạt Phân Tích'}</span>
        </button>
      </div>

      {/* 3. Floating 3D Vitamin & Nutrient Cards HUD */}
      {nutList.map((nut) => {
        if (!nut.screenPos.visible) return null;
        const isHovered = selectedNut === nut.id;

        return (
          <div
            key={nut.id}
            style={{
              left: `${nut.screenPos.x}px`,
              top: `${nut.screenPos.y}px`,
              transform: 'translate(-50%, -50%)',
            }}
            onMouseEnter={() => setSelectedNut(nut.id)}
            onMouseLeave={() => setSelectedNut(null)}
            className="absolute z-10 pointer-events-auto transition-all duration-200 cursor-pointer"
          >
            {/* Glowing Connecting Pulse Dot */}
            <div
              className={`w-3.5 h-3.5 rounded-full border-2 border-white shadow-lg animate-ping absolute -top-1 -left-1 opacity-75`}
              style={{ backgroundColor: nut.color }}
            />

            {/* Vitamin HUD Badge */}
            <div
              className={`px-3 py-2 rounded-2xl border backdrop-blur-md transition-all shadow-xl max-w-[210px] ${
                isHovered
                  ? 'bg-slate-900/95 border-amber-400 scale-110 ring-2 ring-amber-400/40 z-30'
                  : 'bg-slate-950/80 border-white/20 hover:border-emerald-400/60'
              }`}
            >
              <div className="flex items-center gap-1.5">
                <span className="text-sm">{nut.icon}</span>
                <span className="text-xs font-black text-white truncate">{nut.name}</span>
              </div>

              <div className="text-[10px] font-bold text-amber-300 mt-0.5 leading-tight">
                {nut.nutrients}
              </div>

              {isHovered && (
                <div className="text-[9px] text-emerald-200 mt-1 border-t border-white/10 pt-1 leading-normal">
                  ✨ {nut.benefits}
                </div>
              )}
            </div>
          </div>
        );
      })}

      {/* 4. Bottom Helper Instruction */}
      <div className="absolute bottom-3 left-1/2 -translate-x-1/2 z-10 pointer-events-none">
        <div className="text-[11px] text-slate-400 bg-slate-950/70 border border-white/10 px-3 py-1 rounded-full backdrop-blur-xs flex items-center gap-1.5">
          <Info className="w-3.5 h-3.5 text-emerald-400" />
          <span>Di chuyển chuột để xoay 360° • Rê chuột vào từng hạt để xem chi tiết Vitamin</span>
        </div>
      </div>

    </div>
  );
}
