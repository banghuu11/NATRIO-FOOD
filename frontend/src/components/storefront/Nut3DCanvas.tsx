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
      let mat: THREE.Material;

      if (nut.id === 'macca') {
        const maccaGeo = new THREE.SphereGeometry(nut.size * 0.95, 40, 40);
        const mPos = maccaGeo.attributes.position;
        for (let i = 0; i < mPos.count; i++) {
          let x = mPos.getX(i);
          let y = mPos.getY(i);
          let z = mPos.getZ(i);
          if (y < -0.15 * nut.size) {
            const d = Math.sqrt(x * x + z * z);
            if (d < 0.2 * nut.size) y += (0.2 * nut.size - d) * 0.22;
          }
          const distEq = Math.abs(y);
          if (distEq < 0.05 * nut.size && x > 0.04 * nut.size) {
            x -= (0.05 * nut.size - distEq) * 0.45;
          }
          mPos.setXYZ(i, x * 1.04, y * 0.96, z * 1.02);
        }
        maccaGeo.computeVertexNormals();
        geo = maccaGeo;
        mat = new THREE.MeshPhysicalMaterial({
          color: 0x422818,
          roughness: 0.38,
          metalness: 0.0,
          clearcoat: 0.25,
          sheen: 0.3,
          sheenColor: new THREE.Color(0x8D5B3A),
        });
      } else if (nut.id === 'almond') {
        const almondGeo = new THREE.SphereGeometry(nut.size * 0.9, 44, 44);
        const aPos = almondGeo.attributes.position;
        const r = nut.size * 0.9;
        for (let i = 0; i < aPos.count; i++) {
          let x = aPos.getX(i);
          let y = aPos.getY(i);
          let z = aPos.getZ(i);
          const normY = (y + r) / (2 * r);
          const taper = normY > 0.4
            ? Math.pow(Math.max(1.0 - (normY - 0.4) * 1.5, 0.08), 0.75)
            : Math.pow(Math.max(0.4 + normY * 1.5, 0.2), 0.5);
          let nx = x * 1.35 * Math.max(taper, 0.18);
          let nz = z * 0.56 * Math.max(taper, 0.18);
          let ny = y * 1.55;
          if (nx > 0) nx += Math.sin((ny + 0.4) * 3.2) * 0.045 + 0.035;
          aPos.setXYZ(i, nx, ny, nz);
        }
        almondGeo.computeVertexNormals();
        geo = almondGeo;
        mat = new THREE.MeshPhysicalMaterial({
          color: 0x934F26,
          roughness: 0.42,
          metalness: 0.0,
          clearcoat: 0.3,
          sheen: 0.45,
          sheenColor: new THREE.Color(0xD98A4E),
        });
      } else if (nut.id === 'cashew') {
        const cashewGeo = new THREE.CylinderGeometry(0.08, 0.08, nut.size * 1.7, 24, 40, false);
        const cPos = cashewGeo.attributes.position;
        const totalH = nut.size * 1.7;
        for (let i = 0; i < cPos.count; i++) {
          let x = cPos.getX(i);
          let y = cPos.getY(i);
          let z = cPos.getZ(i);
          const v = (y + totalH * 0.5) / totalH;
          const angle = Math.atan2(z, x);
          const spineAngle = Math.PI * 0.15 + v * Math.PI * 1.25;
          const spineR = nut.size * (0.55 - (v - 0.5) * (v - 0.5) * 0.25);
          const spineX = Math.cos(spineAngle) * spineR;
          const spineY = Math.sin(spineAngle) * spineR * 1.15;
          const crossR = nut.size * 0.22 * (0.65 + 0.7 * Math.sin(v * Math.PI * 0.95)) * (v > 0.72 ? 1.28 : 1.0);
          let nx = spineX + Math.cos(angle) * crossR;
          let ny = spineY + Math.sin(angle) * crossR * 0.92;
          let nz = Math.sin(angle) * crossR * 0.70;
          if (v > 0.82 && Math.abs(nz) < 0.035 * nut.size) {
            ny -= 0.03 * (1.0 - Math.abs(nz) / (0.035 * nut.size));
          }
          cPos.setXYZ(i, nx, ny, nz);
        }
        cashewGeo.computeVertexNormals();
        geo = cashewGeo;
        mat = new THREE.MeshPhysicalMaterial({
          color: 0xE8CFA3,
          roughness: 0.40,
          metalness: 0.0,
          clearcoat: 0.32,
          sheen: 0.35,
          sheenColor: new THREE.Color(0xA56545),
        });
      } else if (nut.id === 'walnut') {
        const walnutGeo = new THREE.SphereGeometry(nut.size * 0.92, 48, 48);
        const wPos = walnutGeo.attributes.position;
        for (let i = 0; i < wPos.count; i++) {
          let x = wPos.getX(i);
          let y = wPos.getY(i);
          let z = wPos.getZ(i);
          const distFromSeam = Math.abs(x);
          let seamBump = distFromSeam < 0.04 ? Math.cos((distFromSeam / 0.04) * (Math.PI / 2)) * 0.038 : 0;
          const brainWave1 = Math.sin(x * 12.0 + y * 5.0) * Math.cos(y * 11.0 + z * 6.0) * 0.042;
          const brainWave2 = Math.sin(x * 24.0 + z * 18.0) * 0.012;
          const lobeFactor = Math.min(distFromSeam * 25.0, 1.0);
          let nx = x * 1.08 + seamBump * Math.sign(x || 1) + brainWave1 * lobeFactor + brainWave2 * lobeFactor;
          let ny = y * 1.22 + brainWave1 * 0.7 * lobeFactor;
          let nz = z * 0.92 + seamBump * 0.5 + brainWave1 * lobeFactor;
          wPos.setXYZ(i, nx, ny, nz);
        }
        walnutGeo.computeVertexNormals();
        geo = walnutGeo;
        mat = new THREE.MeshPhysicalMaterial({
          color: 0xBA7B47,
          roughness: 0.48,
          metalness: 0.0,
          clearcoat: 0.22,
          sheen: 0.35,
          sheenColor: new THREE.Color(0xC48652),
        });
      } else {
        const pumpkinGeo = new THREE.SphereGeometry(nut.size * 0.75, 36, 36);
        const pkPos = pumpkinGeo.attributes.position;
        const r = nut.size * 0.75;
        for (let i = 0; i < pkPos.count; i++) {
          let x = pkPos.getX(i);
          let y = pkPos.getY(i);
          let z = pkPos.getZ(i);
          const t = (y + r) / (2 * r);
          const taper = t > 0.4 ? Math.max(1.0 - (t - 0.4) * 1.45, 0.12) : (0.55 + t * 1.1);
          let nx = x * 0.95 * taper;
          let ny = y * 1.45;
          const r2D = Math.sqrt(nx * nx + (ny * 0.6) * (ny * 0.6));
          const isRim = r2D > 0.13 * nut.size;
          let nz = z * (isRim ? 0.36 : 0.22);
          nz += Math.sin(t * Math.PI) * 0.038;
          pkPos.setXYZ(i, nx, ny, nz);
        }
        pumpkinGeo.computeVertexNormals();
        geo = pumpkinGeo;
        mat = new THREE.MeshPhysicalMaterial({
          color: 0x3E5C2A,
          roughness: 0.38,
          metalness: 0.0,
          clearcoat: 0.26,
          sheen: 0.40,
          sheenColor: new THREE.Color(0x6E8E50),
        });
      }

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
