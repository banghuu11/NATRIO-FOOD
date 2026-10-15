'use client';

import React, { useEffect, useRef, useState } from 'react';
import * as THREE from 'three';
import Link from 'next/link';
import { ArrowRight } from 'lucide-react';

interface NutParticle {
  mesh: THREE.Mesh;
  insidePos: THREE.Vector3;
  targetPos: THREE.Vector3;
  rollAxis: THREE.Vector3;
  totalRollRadians: number;
  initialQuat: THREE.Quaternion;
  finalQuat: THREE.Quaternion;
  delay: number;
}


export default function FooterSpillingBowl3D() {
  const containerRef = useRef<HTMLDivElement>(null);
  const canvasHolderRef = useRef<HTMLDivElement>(null);
  const [inView, setInView] = useState(false);

  useEffect(() => {
    const holder = canvasHolderRef.current;
    if (!holder) return;

    // ========================================================
    // 1. SCENE, MACRO CAMERA & HIGH-PRECISION WEBGL RENDERER
    // ========================================================
    const scene = new THREE.Scene();
    
    // Balanced perspective with pleasant breathing room
    const camera = new THREE.PerspectiveCamera(
      45,
      holder.clientWidth / holder.clientHeight,
      0.45,
      100
    );
    camera.position.set(0, 2.7, 6.4);
    camera.lookAt(-0.25, -0.1, 0);

    const renderer = new THREE.WebGLRenderer({
      alpha: true,
      antialias: true,
      powerPreference: 'high-performance',
    });
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    renderer.setSize(holder.clientWidth, holder.clientHeight);
    renderer.outputColorSpace = THREE.SRGBColorSpace;
    renderer.toneMapping = THREE.ACESFilmicToneMapping;
    renderer.toneMappingExposure = 1.0;
    renderer.shadowMap.enabled = true;
    renderer.shadowMap.type = THREE.PCFSoftShadowMap;
    holder.appendChild(renderer.domElement);

    // ========================================================
    // 2. STUDIO CULINARY LIGHTING (High Contrast, Warm Shadows)
    // ========================================================
    const ambientLight = new THREE.AmbientLight(0xffecd2, 0.55); // Gentle ambient to preserve deep roasted shadows
    scene.add(ambientLight);

    // Warm Sun Key Light
    const keyLight = new THREE.DirectionalLight(0xfff3db, 1.8);
    keyLight.position.set(-4.0, 5.8, 3.8);
    keyLight.castShadow = true;
    keyLight.shadow.mapSize.width = 2048;
    keyLight.shadow.mapSize.height = 2048;
    keyLight.shadow.camera.near = 0.5;
    keyLight.shadow.camera.far = 18;
    keyLight.shadow.camera.left = -8.0;
    keyLight.shadow.camera.right = 8.0;
    keyLight.shadow.camera.top = 5.0;
    keyLight.shadow.camera.bottom = -5.0;
    keyLight.shadow.bias = -0.0006;
    scene.add(keyLight);

    // Soft Fill Light
    const fillLight = new THREE.DirectionalLight(0xdde8f8, 0.7);
    fillLight.position.set(4.5, 2.8, 2.5);
    scene.add(fillLight);

    // Back / Rim Light
    const rimLight = new THREE.DirectionalLight(0xffcb97, 1.2);
    rimLight.position.set(0.5, -0.8, -4.5);
    scene.add(rimLight);

    // Front soft bounce
    const frontBounce = new THREE.DirectionalLight(0xffeacc, 0.45);
    frontBounce.position.set(-0.2, 1.0, 4.8);
    scene.add(frontBounce);

    // Soft Shadow Ground Plane - Trải rộng và nghiêng thoai thoải để nhận bóng đổ hạt xuống tận section dưới
    const floorGeo = new THREE.PlaneGeometry(54, 36);
    const floorMat = new THREE.ShadowMaterial({ opacity: 0.28 });
    const floorMesh = new THREE.Mesh(floorGeo, floorMat);
    floorMesh.rotation.x = -Math.PI / 2 + 0.08;
    floorMesh.position.y = -0.92;
    floorMesh.receiveShadow = true;
    scene.add(floorMesh);

    // ========================================================
    // 2.5 CULINARY STUDIO ENVIRONMENT MAP (Warm Bounce Reflections)
    // ========================================================
    const envCanvas = document.createElement('canvas');
    envCanvas.width = 512;
    envCanvas.height = 256;
    const envCtx = envCanvas.getContext('2d')!;
    const skyGrad = envCtx.createLinearGradient(0, 0, 0, 256);
    skyGrad.addColorStop(0, '#FFFFFF'); // Diffuse ceiling softbox
    skyGrad.addColorStop(0.3, '#E8EFF5'); // Skylight
    skyGrad.addColorStop(0.65, '#F5DFCA'); // Warm culinary ambient
    skyGrad.addColorStop(1, '#5C381E'); // Dark warm wood tabletop bounce
    envCtx.fillStyle = skyGrad;
    envCtx.fillRect(0, 0, 512, 256);

    // Overhead rectangular softbox light reflection
    envCtx.fillStyle = 'rgba(255, 255, 255, 0.85)';
    envCtx.beginPath();
    envCtx.ellipse(160, 60, 75, 30, 0, 0, Math.PI * 2);
    envCtx.fill();

    // Warm golden lateral accent softbox
    envCtx.fillStyle = 'rgba(255, 215, 155, 0.7)';
    envCtx.beginPath();
    envCtx.ellipse(370, 75, 80, 35, 0, 0, Math.PI * 2);
    envCtx.fill();

    const envTexture = new THREE.CanvasTexture(envCanvas);
    envTexture.mapping = THREE.EquirectangularReflectionMapping;
    envTexture.colorSpace = THREE.SRGBColorSpace;
    scene.environment = envTexture;

    // ========================================================
    // 3. PHOTOREALISTIC PBR TEXTURES (Loaded from High-Res Macro Photos)
    // ========================================================
    const texLoader = new THREE.TextureLoader();

    // 1. Kraft Paper Texture (Tô giấy kraft nâu mộc tự nhiên)
    const kraftBowlTex = texLoader.load('/images/textures/kraft_bowl.jpg');
    kraftBowlTex.colorSpace = THREE.SRGBColorSpace;
    kraftBowlTex.wrapS = THREE.RepeatWrapping;
    kraftBowlTex.wrapT = THREE.RepeatWrapping;
    kraftBowlTex.repeat.set(2.5, 1.2);

    // 2. Roasted Almond Texture (Hạnh nhân nâu hổ phách sấy mộc)
    const almondSkinTex = texLoader.load('/images/textures/almond_skin.jpg');
    almondSkinTex.colorSpace = THREE.SRGBColorSpace;
    almondSkinTex.wrapS = THREE.RepeatWrapping;
    almondSkinTex.wrapT = THREE.RepeatWrapping;
    almondSkinTex.repeat.set(1.0, 1.0);

    // 3. Vietnamese Roasted Cashew Texture (Hạt điều vàng bơ nướng vỏ lụa)
    const cashewSkinTex = texLoader.load('/images/textures/cashew_skin.jpg');
    cashewSkinTex.colorSpace = THREE.SRGBColorSpace;
    cashewSkinTex.wrapS = THREE.RepeatWrapping;
    cashewSkinTex.wrapT = THREE.RepeatWrapping;
    cashewSkinTex.repeat.set(1.0, 1.0);

    // 4. Macadamia Kernel Texture (Nhân hạt mắc ca kem bơ ngậy)
    const macadamiaShellTex = texLoader.load('/images/textures/macadamia_shell.jpg');
    macadamiaShellTex.colorSpace = THREE.SRGBColorSpace;
    macadamiaShellTex.wrapS = THREE.RepeatWrapping;
    macadamiaShellTex.wrapT = THREE.RepeatWrapping;
    macadamiaShellTex.repeat.set(1.0, 1.0);

    // 5. Walnut Shell Texture (Vỏ óc chó thực tế độ phân giải cao từ ảnh chụp macro)
    const walnutShellTex = texLoader.load('/images/textures/walnut_shell.jpg');
    walnutShellTex.colorSpace = THREE.SRGBColorSpace;
    walnutShellTex.wrapS = THREE.RepeatWrapping;
    walnutShellTex.wrapT = THREE.RepeatWrapping;
    walnutShellTex.repeat.set(1.0, 1.0);

    // 6. Pumpkin Seed Texture (Hạt bí xanh pepita sấy mộc)
    const pumpkinSeedTex = texLoader.load('/images/textures/pumpkin_seed.jpg');
    pumpkinSeedTex.colorSpace = THREE.SRGBColorSpace;
    pumpkinSeedTex.wrapS = THREE.RepeatWrapping;
    pumpkinSeedTex.wrapT = THREE.RepeatWrapping;
    pumpkinSeedTex.repeat.set(1.0, 1.0);


    // ========================================================
    // 4. KRAFT PAPER BOWL GEOMETRY (Plump & Rolled Lip)
    // ========================================================
    const bowlPoints: THREE.Vector2[] = [
      new THREE.Vector2(0, -0.92),
      new THREE.Vector2(1.05, -0.92), // Solid flat base
      new THREE.Vector2(1.38, -0.65), // Smooth curved base transition
      new THREE.Vector2(1.82, -0.12), // Mid bowl
      new THREE.Vector2(2.20, 0.52),  // Flaring upper wall
      new THREE.Vector2(2.44, 0.98),  // Under lip
      new THREE.Vector2(2.48, 1.05),  // Top outer rolled rim
      new THREE.Vector2(2.40, 1.08),  // Top rim crest
      new THREE.Vector2(2.34, 1.03),  // Inner rolled edge
      new THREE.Vector2(2.26, 0.95),  // Inside top wall
      new THREE.Vector2(2.04, 0.48),  // Inside wall
      new THREE.Vector2(1.68, -0.10),
      new THREE.Vector2(1.24, -0.58),
      new THREE.Vector2(0.95, -0.82),
      new THREE.Vector2(0, -0.82),    // Inner bottom floor
    ];
    const bowlGeo = new THREE.LatheGeometry(bowlPoints, 64);
    bowlGeo.computeVertexNormals();

    const bowlMat = new THREE.MeshPhysicalMaterial({
      map: kraftBowlTex,
      bumpMap: kraftBowlTex,
      bumpScale: 0.024,
      roughness: 0.82,
      metalness: 0.0,
      clearcoat: 0.02,
      clearcoatRoughness: 0.8,
      color: 0xFDFBF7,
      side: THREE.DoubleSide,
    });

    const bowlMesh = new THREE.Mesh(bowlGeo, bowlMat);
    bowlMesh.castShadow = true;
    bowlMesh.receiveShadow = true;

    const bowlGroup = new THREE.Group();
    bowlGroup.add(bowlMesh);
    scene.add(bowlGroup);

    const bowlScale = 0.50; // Thu nhỏ tô xinh xắn, vừa vặn, chuẩn kích thước tô ăn nhẹ
    const getBaseX = (w: number, h: number) => {
      const aspect = w / Math.max(h, 1);
      const camDist = w < 768 ? 7.8 : w < 1024 ? 6.8 : 6.4;
      const vHalf = camDist * Math.tan((45 * Math.PI) / 360);
      const hHalf = vHalf * aspect; // Mép viền phải tuyệt đối của khung nhìn 3D
      const bowlRadius = 2.48 * bowlScale;
      // Đặt tô sát sạt mép viền phải
      const rightPadding = w < 640 ? 0.20 : 0.35;
      return Math.max(hHalf - bowlRadius - rightPadding, 1.4);
    };
    let currentBowlBaseX = getBaseX(holder.clientWidth, holder.clientHeight);
    bowlGroup.position.set(currentBowlBaseX, 0.0, 0);
    bowlGroup.scale.setScalar(bowlScale);

    // ========================================================
    // 5. PHOTOREALISTIC 3D ANATOMICAL NUT GEOMETRIES & PBR MATERIALS
    // ========================================================

    // 1. Almond (Hạnh nhân California sấy mộc): Dáng bầu dục thon mềm mại, bo tròn tự nhiên, màu vàng nâu hổ phách sáng ấm
    const almondMat = new THREE.MeshPhysicalMaterial({
      map: almondSkinTex,
      bumpMap: almondSkinTex,
      bumpScale: 0.015,
      roughness: 0.50,
      metalness: 0.0,
      clearcoat: 0.14,
      clearcoatRoughness: 0.35,
      sheen: 0.35,
      sheenColor: new THREE.Color(0xF0B060),
      color: 0xFFF0DD, // Giữ độ sáng và màu vàng nâu hổ phách mộc tự nhiên của texture, không làm tối màu
    });

    function createAlmondGeometry() {
      // Dùng khối cầu bán kính 0.20 với lưới mịn
      const geo = new THREE.SphereGeometry(0.20, 64, 64);
      const pos = geo.attributes.position;
      for (let i = 0; i < pos.count; i++) {
        let x = pos.getX(i);
        let y = pos.getY(i);
        let z = pos.getZ(i);

        // Chuẩn hóa trục dọc từ -1 (đáy) đến +1 (đỉnh)
        const nyNorm = y / 0.20;

        // Dáng quả bầu dục thon tự nhiên:
        // Đáy nở tròn mượt mà, đỉnh thu nhẹ vừa phải NHƯNG HOÀN TOÀN BO TRÒN MỀM MẠI, không tạo chóp nhọn!
        const taper = 1.0 - nyNorm * 0.18;

        let nx = x * 1.18 * taper;
        let nz = z * 0.58 * taper; // Độ dẹt tự nhiên (~55% chiều rộng), giống viên sỏi dẹt
        let ny = y * 1.50; // Thân thon dài thanh thoát

        // Sống lưng hơi cong nhẹ tự nhiên ở một bên
        if (nx > 0) {
          nx += (1.0 - nyNorm * nyNorm) * 0.018;
        }

        pos.setXYZ(i, nx, ny, nz);
      }
      geo.computeVertexNormals();
      return geo;
    }
    const almondGeo = createAlmondGeometry();

    // 2. Vietnamese Cashew (Hạt điều Bình Phước rang vàng bơ): Thân C dày mẩy, đầu tròn mập, có rãnh chia lá mầm
    function createCashewGeometry() {
      const spine = new THREE.CatmullRomCurve3([
        new THREE.Vector3(-0.16, 0.14, 0.0), // Đầu hạt tròn to (Head bulb)
        new THREE.Vector3(-0.04, 0.21, 0.0), // Vòm vai trên
        new THREE.Vector3(0.12, 0.18, 0.0),  // Sườn lưng ngoài
        new THREE.Vector3(0.20, 0.02, 0.0),  // Đỉnh cong lưng ngoài
        new THREE.Vector3(0.15, -0.14, 0.0), // Sườn dưới
        new THREE.Vector3(0.03, -0.21, 0.0), // Khúc uốn đuôi
        new THREE.Vector3(-0.10, -0.16, 0.0), // Móc đuôi quặp vào
      ]);

      const rings = 44;
      const radialSegments = 28;
      const positions: number[] = [];
      const uvs: number[] = [];
      const indices: number[] = [];
      const B = new THREE.Vector3(0, 0, 1);

      for (let i = 0; i <= rings; i++) {
        const u = i / rings;
        const pt = spine.getPoint(u);
        const T = spine.getTangent(u).normalize();
        const N = new THREE.Vector3().crossVectors(B, T).normalize();

        // Đóng nắp kín 2 đầu mượt mà (watertight rounded caps)
        const capEnvelope = Math.sin(u * Math.PI);
        const capFactor = Math.pow(Math.max(0.0, capEnvelope), 0.42);

        // Kích thước thân hạt điều: đầu to tròn mập (u=0), vuốt thon nhẹ về đuôi (u=1)
        const baseR = 0.20 - u * 0.07;
        const curR = baseR * capFactor;

        for (let j = 0; j <= radialSegments; j++) {
          const v = j / radialSegments;
          const theta = v * Math.PI * 2;
          const cosT = Math.cos(theta);
          const sinT = Math.sin(theta);

          // Rãnh tự nhiên chia đôi 2 lá mầm ở sống lưng & bụng hạt
          const cotyledonGroove = 1.0 - 0.12 * Math.pow(Math.abs(sinT), 1.8);

          const rx = curR * cotyledonGroove;
          const rz = curR * 0.90 * cotyledonGroove;

          const px = pt.x + N.x * (rx * cosT) + B.x * (rz * sinT);
          const py = pt.y + N.y * (rx * cosT) + B.y * (rz * sinT);
          const pz = pt.z + N.z * (rx * cosT) + B.z * (rz * sinT);

          positions.push(px, py, pz);
          uvs.push(u, v);
        }
      }

      for (let i = 0; i < rings; i++) {
        for (let j = 0; j < radialSegments; j++) {
          const a = i * (radialSegments + 1) + j;
          const b = (i + 1) * (radialSegments + 1) + j;
          const c = (i + 1) * (radialSegments + 1) + (j + 1);
          const d = i * (radialSegments + 1) + (j + 1);
          indices.push(a, b, d);
          indices.push(b, c, d);
        }
      }

      const geo = new THREE.BufferGeometry();
      geo.setAttribute('position', new THREE.Float32BufferAttribute(positions, 3));
      geo.setAttribute('uv', new THREE.Float32BufferAttribute(uvs, 2));
      geo.setIndex(indices);
      geo.computeVertexNormals();
      return geo;
    }

    const cashewGeo = createCashewGeometry();

    const cashewMat = new THREE.MeshPhysicalMaterial({
      map: cashewSkinTex,
      bumpMap: cashewSkinTex,
      bumpScale: 0.020,
      roughness: 0.42, // Nướng bơ thơm óng nhẹ
      metalness: 0.0,
      clearcoat: 0.20,
      clearcoatRoughness: 0.32,
      sheen: 0.40,
      sheenColor: new THREE.Color(0xD8A850),
      color: 0xFFF9EE,
    });

    // 3. Macadamia (Nhân hạt macca Tây Nguyên): Tròn béo bơ ngậy, màu kem ngà ấm áp, có khe nứt phân đôi
    const maccaMat = new THREE.MeshPhysicalMaterial({
      map: macadamiaShellTex,
      bumpMap: macadamiaShellTex,
      bumpScale: 0.012,
      roughness: 0.36, // Kem bơ mịn màng óng ả
      metalness: 0.0,
      clearcoat: 0.18,
      clearcoatRoughness: 0.30,
      sheen: 0.45,
      sheenColor: new THREE.Color(0xF0E0B8),
      color: 0xFFFAF0,
    });

    function createMaccaGeometry() {
      const geo = new THREE.SphereGeometry(0.28, 64, 64);
      const mPos = geo.attributes.position;
      for (let i = 0; i < mPos.count; i++) {
        let x = mPos.getX(i);
        let y = mPos.getY(i);
        let z = mPos.getZ(i);

        // Rãnh tự nhiên nơi 2 nửa bán cầu nhân dính nhau
        const distEquator = Math.abs(y);
        if (distEquator < 0.05) {
          const indent = (0.05 - distEquator) * 0.14;
          x *= (1.0 - indent);
          z *= (1.0 - indent);
        }

        // Vết rốn hạt hơi lõm nhẹ ở cực đáy
        if (y < -0.18) {
          const dSouth = Math.sqrt(x * x + z * z);
          if (dSouth < 0.16) y += (0.16 - dSouth) * 0.22;
        }

        // Tỉ lệ tròn phổng phao tự nhiên
        x *= 1.05;
        z *= 1.05;
        y *= 0.96;

        mPos.setXYZ(i, x, y, z);
      }
      geo.computeVertexNormals();
      return geo;
    }
    const maccaGeo = createMaccaGeometry();

    // 4. Walnut: VỎ ÓC CHÓ GỒ GHỀ TỰ NHIÊN VỚI GỜ VIỀN NỔI GÁO SÂU (GIỮ NGUYÊN CHUẨN ĐẸP)
    const walnutMat = new THREE.MeshPhysicalMaterial({
      map: walnutShellTex,
      bumpMap: walnutShellTex,
      bumpScale: 0.045, // Rãnh gồ ghề sâu sắc nét
      roughness: 0.72,
      metalness: 0.0,
      clearcoat: 0.05,
      clearcoatRoughness: 0.55,
      sheen: 0.25,
      sheenColor: new THREE.Color(0x9E5A20),
      color: 0xFDF7EE,
    });

    const walnutGeo = new THREE.SphereGeometry(0.34, 64, 64);
    const wPos = walnutGeo.attributes.position;
    for (let i = 0; i < wPos.count; i++) {
      let x = wPos.getX(i);
      let y = wPos.getY(i);
      let z = wPos.getZ(i);

      // Gờ sống vỏ gỗ nối 2 nửa gáo óc chó
      const distFromSeam = Math.abs(x);
      const seamGroove = -Math.exp(-(distFromSeam * distFromSeam) / 0.0018) * 0.028;
      const seamRidge = Math.exp(-Math.pow((distFromSeam - 0.038) / 0.020, 2)) * 0.024;

      // Các múi thùy gồ ghề tự nhiên
      const lobe1 = Math.sin(x * 6.5 + Math.cos(y * 4.5)) * Math.cos(z * 6.0) * 0.025;
      const lobe2 = Math.sin(x * 12.0) * Math.cos(y * 10.0) * Math.sin(z * 11.0) * 0.012;
      const totalLobe = lobe1 + lobe2;

      // Dáng quả bầu dục hơi nhọn ở 2 đầu
      const taper = y > 0 ? (1.0 - y * 0.22) : (1.0 + y * 0.12);
      const radialFactor = 1.0 + seamGroove + seamRidge + totalLobe;

      let nx = x * 1.08 * taper * radialFactor;
      let ny = y * 1.25 * (1.0 + totalLobe * 0.40);
      let nz = z * 0.98 * taper * radialFactor;

      wPos.setXYZ(i, nx, ny, nz);
    }
    walnutGeo.computeVertexNormals();

    // 5. Pumpkin Seed (Hạt bí xanh pepita): Dáng hạt bầu dục dẹt, bo tròn 2 đầu mềm mại, màu xanh mộc tự nhiên
    const pumpkinMat = new THREE.MeshPhysicalMaterial({
      map: pumpkinSeedTex,
      bumpMap: pumpkinSeedTex,
      bumpScale: 0.014,
      roughness: 0.44,
      metalness: 0.0,
      clearcoat: 0.15,
      clearcoatRoughness: 0.35,
      sheen: 0.40,
      sheenColor: new THREE.Color(0x6A8D45),
      color: 0xE8F5DE,
    });

    function createPumpkinGeometry() {
      // Bán kính cơ sở 0.18 với lưới mịn
      const geo = new THREE.SphereGeometry(0.18, 48, 48);
      const pkPos = geo.attributes.position;
      for (let i = 0; i < pkPos.count; i++) {
        let x = pkPos.getX(i);
        let y = pkPos.getY(i);
        let z = pkPos.getZ(i);

        const nyNorm = y / 0.18; // -1 đến +1

        // Dáng hạt bầu dục mềm mại: đầu trên chỉ thu nhẹ hơn đầu dưới một chút (0.90 so với 1.08)
        // Hai đầu hoàn toàn bo tròn mềm mại tự nhiên, không có góc nhọn tam giác!
        const taper = 1.0 - nyNorm * 0.14;

        let nx = x * 1.12 * taper;
        let ny = y * 1.38;
        
        // Hạt bí dẹt mỏng, gờ mép mượt mà
        let nz = z * 0.25;

        // Độ cong võng nhẹ tự nhiên như chiếc lá
        nz += (1.0 - nyNorm * nyNorm) * 0.010;

        pkPos.setXYZ(i, nx, ny, nz);
      }
      geo.computeVertexNormals();
      return geo;
    }
    const pumpkinGeo = createPumpkinGeometry();

    // 6. POPULATE 38 HIGH-DETAIL NUTS WITH ANTI-COLLISION RELAXATION SOLVER
    // ========================================================
    const nutParticles: NutParticle[] = [];
    const totalNuts = 38;
    const nutParent = new THREE.Group();
    scene.add(nutParent);

    // Bán kính va chạm vật lý cho từng loại hạt (tinh chỉnh thu nhỏ vừa vặn, thanh lịch)
    const nutRadii: number[] = [];
    for (let i = 0; i < totalNuts; i++) {
      const nutType = i % 5;
      if (nutType === 3) nutRadii.push(0.18); // Óc chó
      else if (nutType === 1) nutRadii.push(0.15); // Macca
      else if (nutType === 2) nutRadii.push(0.15); // Hạt điều
      else if (nutType === 0) nutRadii.push(0.13); // Hạnh nhân
      else nutRadii.push(0.10); // Hạt bí
    }

    // 6.1 TẠO VỊ TRÍ TRONG TÔ (INSIDE BOWL) THEO CÁC TẦNG LỚP & CHỐNG CHỒNG ĐÈ (ANTI-COLLISION)
    const insidePositions: THREE.Vector3[] = [];
    const layers = [
      { count: 5, y: -0.72 * bowlScale, r: 0.70 * bowlScale },
      { count: 7, y: -0.35 * bowlScale, r: 1.15 * bowlScale },
      { count: 9, y: 0.00 * bowlScale,  r: 1.55 * bowlScale },
      { count: 10, y: 0.35 * bowlScale, r: 1.85 * bowlScale },
      { count: 7,  y: 0.70 * bowlScale, r: 1.35 * bowlScale },
    ];

    layers.forEach((l, lIdx) => {
      for (let k = 0; k < l.count; k++) {
        const angle = (k / l.count) * Math.PI * 2 + lIdx * 0.73;
        const r = l.r * (0.35 + (k % 2) * 0.58);
        insidePositions.push(new THREE.Vector3(
          Math.cos(angle) * r,
          l.y + (Math.random() - 0.5) * 0.03,
          Math.sin(angle) * r
        ));
      }
    });

    // 50 vòng lặp thư giãn lực đẩy vật lý (Relaxation Repulsion) trong lòng tô:
    for (let iter = 0; iter < 50; iter++) {
      for (let i = 0; i < totalNuts; i++) {
        for (let j = i + 1; j < totalNuts; j++) {
          const dx = insidePositions[i].x - insidePositions[j].x;
          const dy = insidePositions[i].y - insidePositions[j].y;
          const dz = insidePositions[i].z - insidePositions[j].z;
          const d = Math.sqrt(dx * dx + dy * dy + dz * dz) || 0.001;
          const minDist = nutRadii[i] + nutRadii[j] + 0.02; // Đảm bảo khe hở tối thiểu giữa 2 hạt
          if (d < minDist) {
            const overlap = (minDist - d) * 0.5;
            const nx = dx / d;
            const ny = dy / d;
            const nz = dz / d;
            insidePositions[i].x += nx * overlap;
            insidePositions[i].y += ny * overlap;
            insidePositions[i].z += nz * overlap;
            insidePositions[j].x -= nx * overlap;
            insidePositions[j].y -= ny * overlap;
            insidePositions[j].z -= nz * overlap;
          }
        }

        // Giữ các hạt nằm gọn trong thành tô gỗ kraft
        const bowlMaxR = (2.20 * bowlScale) * Math.sqrt(Math.max(0.05, (insidePositions[i].y + 0.80 * bowlScale) / (1.80 * bowlScale)));
        const currentR = Math.sqrt(insidePositions[i].x * insidePositions[i].x + insidePositions[i].z * insidePositions[i].z);
        if (currentR > bowlMaxR - nutRadii[i] * 0.5) {
          const factor = (bowlMaxR - nutRadii[i] * 0.5) / (currentR || 1);
          insidePositions[i].x *= factor;
          insidePositions[i].z *= factor;
        }
      }
    }

    // 6.2 TẠO ĐIỂM TIẾP ĐẤT TRÊN SÀN (TARGET FLOOR POSITIONS) RẢI RỘNG KHẮP BANNER & SANG KHỐI DƯỚI
    const targetPositions: THREE.Vector3[] = [];
    const isMobile = holder.clientWidth < 768;

    // Phân bổ 38 hạt trải dài theo 3 vùng không gian rộng lớn để tạo dòng hạt đổ tràn bao la:
    // Vùng 1 (13 hạt): Lăn xa tít tắp sang bên trái, bao phủ khu vực chữ và tràn xuống section dưới
    // Vùng 2 (15 hạt): Tràn giữa trung tâm, kết nối từ tô sang mép trái
    // Vùng 3 (10 hạt): Rải rác quanh miệng tô và chân đế tô
    for (let i = 0; i < totalNuts; i++) {
      let targetX: number;
      let targetZ: number;

      if (i < 13) {
        // VÙNG 1: LĂN XA TÍT TẮP SANG TRÁI & TRÀN SÂU XUỐNG SECTION DƯỚI
        const u = i / 12;
        const dist = (isMobile ? 2.6 : 4.6) + u * (isMobile ? 1.4 : 2.4);
        const angle = 0.08 + u * 0.95 + (Math.random() - 0.5) * 0.15;
        targetX = (currentBowlBaseX - 0.6) - Math.cos(angle) * dist;
        // Tràn vừa phải ra phía trước theo trục Z (không đâm quá sát vào mắt camera để tránh bị phóng đại ảo)
        targetZ = 0.5 + Math.sin(angle) * dist * 0.52 + (Math.random() - 0.5) * 0.25;
      } else if (i < 28) {
        // VÙNG 2: DÒNG CHẢY TRUNG TÂM (Rải đều ở giữa sân khấu và tràn một phần xuống dưới)
        const u = (i - 13) / 14;
        const dist = (isMobile ? 1.5 : 2.6) + u * (isMobile ? 1.2 : 2.0);
        const angle = -0.15 + u * 1.15 + (Math.random() - 0.5) * 0.2;
        targetX = (currentBowlBaseX - 0.6) - Math.cos(angle) * dist;
        targetZ = 0.4 + Math.sin(angle) * dist * 0.55 + (Math.random() - 0.5) * 0.25;
      } else {
        // VÙNG 3: VỰC MIỆNG TÔ (Gần chân tô, hạt vừa rớt khỏi miệng)
        const u = (i - 28) / 9;
        const dist = 0.8 + u * 1.6;
        const angle = -0.35 + u * 1.35 + (Math.random() - 0.5) * 0.2;
        targetX = (currentBowlBaseX - 0.5) - Math.cos(angle) * dist;
        targetZ = 0.3 + Math.sin(angle) * dist * 0.60 + (Math.random() - 0.5) * 0.2;
      }

      targetPositions.push(new THREE.Vector3(targetX, 0, targetZ));
    }

    // 45 vòng lặp thư giãn đẩy hạt tách rời tuyệt đối trên mặt phẳng (X, Z) sàn, đảm bảo không chồng lấn
    for (let iter = 0; iter < 45; iter++) {
      for (let i = 0; i < totalNuts; i++) {
        for (let j = i + 1; j < totalNuts; j++) {
          const dx = targetPositions[i].x - targetPositions[j].x;
          const dz = targetPositions[i].z - targetPositions[j].z;
          const d = Math.sqrt(dx * dx + dz * dz) || 0.001;
          const minDist = nutRadii[i] + nutRadii[j] + 0.10; // Khoảng cách thênh thang, thoáng đạt
          if (d < minDist) {
            const overlap = (minDist - d) * 0.5;
            const nx = dx / d;
            const nz = dz / d;
            targetPositions[i].x += nx * overlap;
            targetPositions[i].z += nz * overlap;
            targetPositions[j].x -= nx * overlap;
            targetPositions[j].z -= nz * overlap;
          }
        }
      }
    }

    // Tính độ cao Y tiếp sàn chuẩn xác theo độ dốc tự nhiên tràn xuống section dưới
    for (let i = 0; i < totalNuts; i++) {
      const forwardDrop = (targetPositions[i].z - 0.45) * 0.14;
      const leftDrop = Math.max(0, (currentBowlBaseX - targetPositions[i].x) * 0.022);
      targetPositions[i].y = -0.88 - forwardDrop - leftDrop + (nutRadii[i] * 0.35);
    }

    // 6.3 KHỞI TẠO TỪNG HẠT MESH & THÔNG SỐ VẬT LÝ LĂN
    for (let i = 0; i < totalNuts; i++) {
      let mesh: THREE.Mesh;
      const nutType = i % 5;

      if (nutType === 0) {
        mesh = new THREE.Mesh(almondGeo, almondMat);
      } else if (nutType === 1) {
        mesh = new THREE.Mesh(maccaGeo, maccaMat);
      } else if (nutType === 2) {
        mesh = new THREE.Mesh(cashewGeo, cashewMat);
      } else if (nutType === 3) {
        mesh = new THREE.Mesh(walnutGeo, walnutMat);
      } else {
        mesh = new THREE.Mesh(pumpkinGeo, pumpkinMat);
      }

      mesh.castShadow = true;
      mesh.receiveShadow = true;

      // Tỉ lệ kích thước thực tế thu nhỏ vừa vặn, thanh lịch chuẩn tự nhiên (~50% so với bản gốc)
      let baseScale = 0.44;
      if (nutType === 3) baseScale = 0.52; // Quả óc chó
      else if (nutType === 1) baseScale = 0.45; // Hạt macca tròn mẩy
      else if (nutType === 0) baseScale = 0.42; // Hạnh nhân thon thả
      else if (nutType === 2) baseScale = 0.44; // Hạt điều
      else baseScale = 0.30; // Hạt bí nhỏ nhắn thanh mảnh

      const scaleRandom = baseScale * (0.94 + Math.random() * 0.12);
      mesh.scale.setScalar(scaleRandom);

      const insidePos = insidePositions[i];
      const targetPos = targetPositions[i];

      // Khởi tạo góc nghiêng tự nhiên trong tô
      const initialEuler = new THREE.Euler(
        Math.random() * Math.PI * 2,
        Math.random() * Math.PI * 2,
        Math.random() * Math.PI * 2
      );
      const initialQuat = new THREE.Quaternion().setFromEuler(initialEuler);

      // Góc nằm yên phẳng tự nhiên trên mặt sàn khi kết thúc lăn
      const finalEuler = new THREE.Euler(
        (Math.random() - 0.5) * 0.30,
        Math.random() * Math.PI * 2,
        (Math.random() - 0.5) * 0.30
      );
      const finalQuat = new THREE.Quaternion().setFromEuler(finalEuler);

      // Trục lăn tiếp tuyến vuông góc với hướng dịch chuyển trên mặt phẳng XZ
      const moveDir = targetPos.clone().sub(insidePos).setY(0).normalize();
      const rollAxis = new THREE.Vector3(-moveDir.z, (Math.random() - 0.5) * 0.15, moveDir.x).normalize();

      // Số vòng lăn hữu hạn trong suốt hành trình (1.5 đến 2.8 vòng rồi dừng hẳn)
      const totalRollRadians = Math.PI * 2 * (1.5 + Math.random() * 1.3);

      // Delay đổ theo tầng: hạt ở trên miệng tô đổ ra trước, hạt dưới đáy đổ ra sau mượt mà
      const heightFrac = Math.max(0, Math.min(1, (insidePos.y + 0.70) / 1.35));
      const layerDelay = (1 - heightFrac) * 0.12 + (i % 6) * 0.005;

      mesh.position.copy(insidePos);
      mesh.quaternion.copy(initialQuat);

      nutParticles.push({
        mesh,
        insidePos,
        targetPos,
        rollAxis,
        totalRollRadians,
        initialQuat,
        finalQuat,
        delay: layerDelay,
      });

      nutParent.add(mesh);
    }

    // ========================================================
    // 7. SCROLL PROGRESSION & MOUSE PARALLAX
    // ========================================================
    let currentScrollFraction = 0;
    let targetScrollFraction = 0;

    const onScroll = () => {
      const container = containerRef.current;
      if (!container) return;

      const rect = container.getBoundingClientRect();
      const windowHeight = window.innerHeight;

      // Smart trigger: Seamlessly supports Top Hero Banner mode and mid-page mode
      let progress = 0;
      if (rect.top <= 80) {
        // Top Hero position: starts at 0 at the very top, smoothly spills as user scrolls down
        const scrollDist = Math.max(-rect.top + 20, 0);
        progress = scrollDist / Math.max(rect.height * 0.78, 320);
      } else {
        const startY = windowHeight * 0.88;
        const endY = windowHeight * 0.10;
        progress = (startY - rect.top) / (startY - endY + rect.height * 0.35);
      }

      targetScrollFraction = Math.min(Math.max(progress, 0), 1);
      setInView(rect.top < windowHeight && rect.bottom > 0);
    };

    window.addEventListener('scroll', onScroll, { passive: true });
    onScroll();

    let mouseX = 0;
    let mouseY = 0;
    const onMouseMove = (e: MouseEvent) => {
      mouseX = (e.clientX / window.innerWidth - 0.5) * 0.45;
      mouseY = (e.clientY / window.innerHeight - 0.5) * 0.22;
    };
    window.addEventListener('mousemove', onMouseMove, { passive: true });

    const onResize = () => {
      if (!holder) return;
      const width = holder.clientWidth;
      const height = holder.clientHeight;
      camera.aspect = width / height;
      camera.updateProjectionMatrix();
      renderer.setSize(width, height);

      if (width < 768) {
        camera.position.set(0, 3.1, 7.8);
      } else if (width < 1024) {
        camera.position.set(0, 2.8, 6.8);
      } else {
        camera.position.set(0, 2.7, 6.4);
      }

      currentBowlBaseX = getBaseX(width, height);
    };
    window.addEventListener('resize', onResize);
    onResize();

    // ========================================================
    // 8. ANIMATION LOOP (PHYSICS SPILL + TILT)
    // ========================================================
    let animationId: number;
    const clock = new THREE.Clock();

    const slerpQuat = new THREE.Quaternion();
    const rollQuat = new THREE.Quaternion();

    const animate = () => {
      animationId = requestAnimationFrame(animate);
      const delta = clock.getDelta();
      const elapsed = clock.getElapsedTime();

      // Smooth scroll interpolation: giảm hệ số xuống 0.052 để tạo quán tính cuộn mượt mà như bơ (buttery smooth inertia)
      currentScrollFraction += (targetScrollFraction - currentScrollFraction) * 0.052;
      const p = currentScrollFraction;

      // Camera subtle parallax: khi cuộn, camera hơi chúc nhẹ góc nhìn xuống theo dòng hạt đổ tràn sang section dưới
      camera.position.x += (mouseX - camera.position.x * 0.20) * 0.40;
      camera.lookAt(-0.30 * p, -0.12 - 0.32 * p, 0.42 * p);

      // BOWL MOTION: Tô cố định sát mép phải trong container, giữ vững không nhảy ra ngoài padding
      const bowlRestX = currentBowlBaseX - 0.06 * p;
      const bowlRestY = -0.12 - 0.22 * p;
      const bowlRestZ = -0.2 * p;

      bowlGroup.position.set(
        bowlRestX,
        bowlRestY + Math.sin(elapsed * 1.5) * 0.01 * (1 - p),
        bowlRestZ
      );

      // Tumble tilt angles (Nghiêng đổ sang TRÁI)
      const targetRotZ = 1.16 * p; // roll onto left side
      const targetRotX = 0.20 * (1 - p) + 0.60 * p; // mouth angles downward
      const targetRotY = -0.40 * p;

      bowlGroup.rotation.z = targetRotZ;
      bowlGroup.rotation.x = targetRotX;
      bowlGroup.rotation.y = targetRotY;

      // NUTS BALLISTIC SPILL MOTION:
      nutParticles.forEach((item) => {
        // Quãng đường cuộn dài và êm ái hơn (spillSpan rộng hơn để không bị trôi vèo quá nhanh)
        const spillSpan = Math.max(0.88 - item.delay, 0.45);
        const localP = Math.min(Math.max((p - item.delay) / spillSpan, 0), 1);

        if (localP <= 0.001) {
          // Fixed inside bowl: di chuyển và xoay theo lòng tô
          item.mesh.position.copy(item.insidePos);
          item.mesh.position.applyEuler(bowlGroup.rotation);
          item.mesh.position.add(bowlGroup.position);
          item.mesh.quaternion.copy(item.initialQuat);
        } else {
          // Chuyển động mượt mà tuyệt đỉnh (Quintic Smootherstep S-curve):
          // Đạo hàm bậc 1 và bậc 2 tại điểm đầu và cuối đều bằng 0, loại bỏ hoàn toàn cảm giác giật nhanh ban đầu!
          const easeOut = localP * localP * localP * (localP * (localP * 6 - 15) + 10);

          const startY = item.insidePos.y + bowlGroup.position.y;
          const endY = item.targetPos.y;
          // Độ nảy parabol êm dịu tự nhiên, không bật tung lên quá cao
          const bounceArc = Math.sin(localP * Math.PI) * 0.22 * Math.max(1 - localP, 0);

          const currentY = THREE.MathUtils.lerp(startY, endY, easeOut) + bounceArc;
          const currentX = THREE.MathUtils.lerp(
            item.insidePos.x + bowlGroup.position.x,
            item.targetPos.x,
            easeOut
          );
          const currentZ = THREE.MathUtils.lerp(
            item.insidePos.z + bowlGroup.position.z,
            item.targetPos.z,
            easeOut
          );

          item.mesh.position.set(currentX, currentY, currentZ);

          // HIỆU ỨNG LĂN HỮU HẠN RỒI ĐỨNG YÊN HOÀN TOÀN (KHÔNG XOAY VÒNG VÒNG LIÊN TỤC):
          // Góc lăn tính trực tiếp theo quãng đường lăn (easeOut). Khi dừng cuộn hoặc chạm đích thì hạt đứng yên!
          slerpQuat.slerpQuaternions(item.initialQuat, item.finalQuat, easeOut);
          rollQuat.setFromAxisAngle(item.rollAxis, easeOut * item.totalRollRadians);
          item.mesh.quaternion.copy(slerpQuat.multiply(rollQuat));
        }
      });

      renderer.render(scene, camera);
    };

    animate();

    // ========================================================
    // 9. CLEANUP MEMORY & TEXTURES
    // ========================================================
    return () => {
      cancelAnimationFrame(animationId);
      window.removeEventListener('scroll', onScroll);
      window.removeEventListener('mousemove', onMouseMove);
      window.removeEventListener('resize', onResize);

      if (holder && renderer.domElement) {
        holder.removeChild(renderer.domElement);
      }

      // Dispose geometries
      bowlGeo.dispose();
      almondGeo.dispose();
      maccaGeo.dispose();
      cashewGeo.dispose();
      walnutGeo.dispose();
      pumpkinGeo.dispose();
      floorGeo.dispose();

      // Dispose textures & materials
      envTexture.dispose();
      kraftBowlTex.dispose();
      almondSkinTex.dispose();
      cashewSkinTex.dispose();
      macadamiaShellTex.dispose();
      walnutShellTex.dispose();
      pumpkinSeedTex.dispose();

      bowlMat.dispose();
      almondMat.dispose();
      maccaMat.dispose();
      cashewMat.dispose();
      walnutMat.dispose();
      pumpkinMat.dispose();
      floorMat.dispose();
      renderer.dispose();
    };
  }, []);

  return (
    <section
      ref={containerRef}
      className="relative w-full min-h-[460px] sm:min-h-[500px] lg:min-h-[540px] py-14 lg:py-24 bg-slate-50 dark:bg-[#060911] border-b border-slate-200/30 dark:border-slate-800/30 overflow-visible select-none flex items-center z-20"
    >
      {/* 1. Subtle Radial Ambient Lighting */}
      <div className="absolute inset-0 bg-radial from-amber-500/5 via-transparent to-transparent pointer-events-none" />

      {/* 2. Text Content (Brand Story & Call to Action) - z-10 */}
      <div className="max-w-[1400px] w-full mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
        <div className="max-w-md lg:max-w-lg space-y-4">
          <span className="text-xs font-bold text-emerald-800 dark:text-emerald-400 tracking-widest uppercase">
            100% Nông Sản Mộc Tươi Mới
          </span>
          <h2 className="text-3xl sm:text-4xl lg:text-5xl font-extrabold text-slate-900 dark:text-white leading-tight tracking-tight">
            Trọn Vẹn Vị Ngọt Tự Nhiên
          </h2>
          <p className="text-sm sm:text-base text-slate-600 dark:text-slate-400 leading-relaxed max-w-md">
            Hạt điều rang củi nguyên vỏ lụa Bình Phước, macca nứt vỏ gỗ Tây Nguyên, hạnh nhân hổ phách nguyên vỏ mộc và óc chó sấy nhiệt thấp. Giữ trọn 100% hương vị và tinh dầu quý giá.
          </p>

          <div className="pt-2 flex flex-wrap items-center gap-4 relative z-30 pointer-events-auto">
            <Link
              href="/products"
              className="inline-flex items-center gap-2 px-6 py-3 rounded-full bg-slate-900 hover:bg-slate-800 dark:bg-white dark:hover:bg-slate-100 text-white dark:text-slate-900 text-xs font-bold transition-all shadow-xs"
            >
              <span>Khám Phá Bộ Sưu Tập</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </Link>
            <span className="text-xs text-slate-500 font-medium">
              Sấy mộc 60°C • Giữ nguyên lớp vỏ tự nhiên
            </span>
          </div>
        </div>
      </div>

      {/* 3. Interactive 3D Nut Bowl Canvas - TRÀN SÂU XUỐNG SECTION DƯỚI & PHỦ LÊN CARD (z-30) */}
      <div
        ref={canvasHolderRef}
        className="absolute top-0 left-0 w-full h-[calc(100%+320px)] sm:h-[calc(100%+380px)] lg:h-[calc(100%+450px)] z-30 pointer-events-none overflow-visible"
        title="Cuộn trang để thấy tô hạt nghiêng và các hạt rơi tự nhiên tràn xuống section dưới"
      />

      {/* Hint Tag */}
      <div className="absolute bottom-3 right-6 z-30 text-[11px] font-medium text-slate-400 dark:text-slate-500 bg-white/70 dark:bg-slate-900/70 backdrop-blur-xs px-3 py-1 rounded-full border border-slate-200/50 dark:border-slate-800/50 pointer-events-none">
        Tô hạt tương tác 3D theo thao tác cuộn
      </div>
    </section>
  );
}
