'use client';

import React, { useEffect, useRef } from 'react';
import * as THREE from 'three';
import Link from 'next/link';
import { ArrowRight } from 'lucide-react';
import { useBannerStore } from '@/stores/useBannerStore';

interface NutParticle {
  mesh: THREE.Mesh;
  insidePos: THREE.Vector3;
  lipPosLocal: THREE.Vector3;
  dirLocal: THREE.Vector3;
  rollAxis: THREE.Vector3;
  totalRollRadians: number;
  initialQuat: THREE.Quaternion;
  finalQuat: THREE.Quaternion;
  delay: number;
  /** Thứ hạng chạm đất 0..1: 0 = rơi gần hero, 1 = rơi tận footer */
  landT: number;
  /** Độ lệch (px cuộn) để các hạt cuối không chạm đất cùng một lúc */
  landJitter: number;
  /** Vị trí chạm đất theo chiều dọc viewport (0..1) */
  landF: number;
  /** Vị trí chạm đất theo chiều ngang (0..1 chiều rộng trang) */
  targetXFrac: number;
  targetZ: number;
  /** true = đợt 1: đổ sang trái quanh banner; false = đợt 2: lăn xuống dần tới footer */
  pour: boolean;
}


export default function FooterSpillingBowl3D() {
  const containerRef = useRef<HTMLDivElement>(null);
  const canvasHolderRef = useRef<HTMLDivElement>(null);
  const { bannerConfig, fetchBannerConfig } = useBannerStore();

  useEffect(() => {
    fetchBannerConfig();
  }, [fetchBannerConfig]);

  useEffect(() => {
    const holder = canvasHolderRef.current;
    if (!holder) return;

    // ========================================================
    // 1. SCENE, MACRO CAMERA & HIGH-PRECISION WEBGL RENDERER
    // ========================================================
    const scene = new THREE.Scene();
    
    // CAMERA NHÌN THẲNG (không nghiêng) để toạ độ 3D ánh xạ tuyến tính 1:1 với toạ độ pixel của trang.
    // Canvas được cố định phủ toàn bộ viewport (position: fixed) → hạt có thể lăn xuống tận footer theo thanh cuộn.
    const CAM_FOV = 45;
    const BOWL_Z = 1.0; // Tô đặt gần tường hứng bóng (bóng sát chân tô) nhưng thành sau của tô vẫn không xuyên qua tường
    const WALL_Z = -0.35; // Tường ảo phía sau hạt dùng để hứng bóng đổ (drop shadow) toàn trang
    const camera = new THREE.PerspectiveCamera(
      CAM_FOV,
      holder.clientWidth / holder.clientHeight,
      0.45,
      100
    );
    camera.position.set(0, 0, 9);
    camera.lookAt(0, 0, 0);

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
    renderer.shadowMap.enabled = false; // Bóng dùng blob mềm ngay dưới vật thể (ánh sáng từ trên xuống) thay cho shadow-map
    renderer.shadowMap.type = THREE.PCFShadowMap; // PCF hỗ trợ shadow.radius để làm mờ mép bóng
    holder.appendChild(renderer.domElement);

    // ========================================================
    // 2. STUDIO CULINARY LIGHTING (High Contrast, Warm Shadows)
    // ========================================================
    const ambientLight = new THREE.AmbientLight(0xffecd2, 0.55); // Gentle ambient to preserve deep roasted shadows
    scene.add(ambientLight);

    // Warm Sun Key Light
    const keyLight = new THREE.DirectionalLight(0xfff3db, 1.8);
    const keyLightDir = new THREE.Vector3(-0.25, 1.0, 0.85).normalize(); // Ánh sáng chính chiếu từ TRÊN XUỐNG (hơi chếch trước-trái)
    keyLight.position.copy(keyLightDir).multiplyScalar(18);
    keyLight.castShadow = false;
    keyLight.shadow.mapSize.width = 2048;
    keyLight.shadow.mapSize.height = 2048;
    keyLight.shadow.camera.near = 0.5;
    keyLight.shadow.camera.far = 40;
    keyLight.shadow.camera.left = -9.0;
    keyLight.shadow.camera.right = 9.0;
    keyLight.shadow.camera.top = 9.0;
    keyLight.shadow.camera.bottom = -9.0;
    keyLight.shadow.bias = -0.0006;
    keyLight.shadow.radius = 5; // Mép bóng mềm, tự nhiên
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

    // Tường ảo hứng bóng: nằm ngay sau mặt phẳng hạt, cố định theo viewport → mọi hạt (đang rơi hay đã nằm yên)
    // đều có bóng đổ mềm lệch xuống phía dưới-phải, ở bất kỳ vị trí nào trên trang.
    const floorGeo = new THREE.PlaneGeometry(90, 70);
    const floorMat = new THREE.ShadowMaterial({ opacity: 0.2 });
    const floorMesh = new THREE.Mesh(floorGeo, floorMat);
    floorMesh.position.set(0, 0, WALL_Z);
    floorMesh.receiveShadow = true;
    // (không thêm tường hứng bóng vào scene nữa: bóng được vẽ bằng blob mềm ngay dưới vật thể)

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
    bowlMesh.castShadow = true; // Đổ bóng chân thực chuẩn 3D của thành tô
    bowlMesh.receiveShadow = true;

    const bowlGroup = new THREE.Group();
    bowlGroup.add(bowlMesh);
    scene.add(bowlGroup);

    const bowlScale = 0.50; // Thu nhỏ tô xinh xắn, vừa vặn, chuẩn kích thước tô ăn nhẹ
    bowlGroup.scale.setScalar(bowlScale);

    // ========================================================
    // 4.1 HỆ TOẠ ĐỘ PIXEL TRANG ↔ KHÔNG GIAN 3D
    // Canvas cố định phủ viewport; vị trí mỗi vật thể được tính từ toạ độ "trang" (pageY) trừ đi scrollY,
    // nên hạt đã rơi xuống sẽ nằm yên trên trang và cuộn cùng nội dung, kể cả khi ở tận footer.
    // ========================================================
    const halfFovTan = Math.tan((CAM_FOV * Math.PI) / 360);
    let viewW = holder.clientWidth;
    let viewH = holder.clientHeight;
    let camDist = 9;
    let wpp = 0.0073; // số đơn vị 3D trên mỗi pixel tại mặt phẳng z = 0

    const getBowlPx = (w: number) => Math.min(Math.max(w * 0.27, 210), 380);

    const toWorld = (px: number, py: number, z: number, out: THREE.Vector3) => {
      const k = (camDist - z) / camDist;
      return out.set((px - viewW / 2) * wpp * k, (viewH / 2 - py) * wpp * k, z);
    };

    const updateProjection = () => {
      viewW = holder.clientWidth;
      viewH = holder.clientHeight;
      const bowlPx = getBowlPx(viewW);
      // Khoảng cách camera → tô sao cho tô rộng đúng bowlPx pixel trên màn hình
      const dBowl = (2.48 * viewH) / (2 * halfFovTan * bowlPx);
      camDist = dBowl + BOWL_Z;
      wpp = (2 * camDist * halfFovTan) / viewH;

      camera.aspect = viewW / viewH;
      camera.position.set(0, 0, camDist);
      camera.lookAt(0, 0, 0);
      camera.updateProjectionMatrix();

      // Khung bóng đổ phủ trọn viewport
      const R = Math.sqrt(viewW * viewW + viewH * viewH) * wpp * 0.5 + 3;
      keyLight.shadow.camera.left = -R;
      keyLight.shadow.camera.right = R;
      keyLight.shadow.camera.top = R;
      keyLight.shadow.camera.bottom = -R;
      keyLight.shadow.camera.updateProjectionMatrix();
    };
    updateProjection();

    // Vị trí tô (toạ độ trang) & quãng cuộn để tô đổ hết hạt
    let bowlPageX = 0;
    let bowlPageY = 0;
    let spillDist = 420;
    const measureLayout = () => {
      const sec = containerRef.current;
      if (!sec) return;
      const r = sec.getBoundingClientRect();
      const top = r.top + window.scrollY;
      const bowlPx = getBowlPx(viewW);
      const cw = Math.min(viewW, 1400);
      const pad = viewW < 640 ? 16 : viewW < 1024 ? 24 : 32;
      if (viewW < 768) {
        bowlPageX = viewW - pad - bowlPx * 0.5;
        bowlPageY = top + r.height - bowlPx * 0.42;
      } else {
        // Căn vào cột phải của container max-w-[1400px], ngang tầm khối chữ banner
        bowlPageX = viewW / 2 + cw / 2 - pad - bowlPx * 0.5 - 10;
        bowlPageY = top + r.height * 0.5 + 6;
      }
      spillDist = Math.max(r.height * 0.48, 230);
    };
    measureLayout();

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
      { count: 5, y: -0.38 * bowlScale, r: 0.60 * bowlScale }, // Nâng cao tầng đáy an toàn, cách xa đáy tô
      { count: 7, y: -0.08 * bowlScale, r: 1.00 * bowlScale },
      { count: 9, y: 0.22 * bowlScale,  r: 1.40 * bowlScale },
      { count: 10, y: 0.52 * bowlScale, r: 1.70 * bowlScale },
      { count: 7,  y: 0.80 * bowlScale, r: 1.25 * bowlScale },
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

        // 1. CHỐNG LỌT QUA ĐÁY TÔ: Giữ đáy hạt luôn cao hơn mặt sàn trong của tô, tuyệt đối không lọt qua đáy
        const minFloorY = -0.78 * bowlScale + nutRadii[i] + 0.04;
        if (insidePositions[i].y < minFloorY) {
          insidePositions[i].y = minFloorY;
        }

        // 2. Giữ các hạt nằm gọn trong thành tô gỗ kraft
        const bowlMaxR = (2.12 * bowlScale) * Math.sqrt(Math.max(0.05, (insidePositions[i].y + 0.78 * bowlScale) / (1.80 * bowlScale)));
        const currentR = Math.sqrt(insidePositions[i].x * insidePositions[i].x + insidePositions[i].z * insidePositions[i].z);
        if (currentR > bowlMaxR - nutRadii[i] * 0.75) {
          const factor = (bowlMaxR - nutRadii[i] * 0.75) / (currentR || 1);
          insidePositions[i].x *= factor;
          insidePositions[i].z *= factor;
        }
      }
    }

    // Đảm bảo tuyệt đối 100% không hạt nào bị lọt đáy hay xuyên thành tô
    for (let i = 0; i < totalNuts; i++) {
      const minFloorY = -0.78 * bowlScale + nutRadii[i] + 0.04;
      if (insidePositions[i].y < minFloorY) {
        insidePositions[i].y = minFloorY;
      }
      const bowlMaxR = (2.12 * bowlScale) * Math.sqrt(Math.max(0.05, (insidePositions[i].y + 0.78 * bowlScale) / (1.80 * bowlScale)));
      const currentR = Math.sqrt(insidePositions[i].x * insidePositions[i].x + insidePositions[i].z * insidePositions[i].z);
      if (currentR > bowlMaxR - nutRadii[i] * 0.75) {
        const factor = (bowlMaxR - nutRadii[i] * 0.75) / (currentR || 1);
        insidePositions[i].x *= factor;
        insidePositions[i].z *= factor;
      }
    }

    // 6.2 KẾ HOẠCH RƠI: mỗi hạt có một "thứ hạng chạm đất" riêng trải đều từ ngay dưới hero đến tận footer.
    // Khi người dùng cuộn tới đâu, các hạt tương ứng sẽ lăn xuống và nằm yên tại vị trí đó trên trang.
    const isMobile = viewW < 768;

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

      // Khởi tạo góc nghiêng tự nhiên trong tô
      const initialEuler = new THREE.Euler(
        Math.random() * Math.PI * 2,
        Math.random() * Math.PI * 2,
        Math.random() * Math.PI * 2
      );
      const initialQuat = new THREE.Quaternion().setFromEuler(initialEuler);

      // Góc nằm yên tự nhiên khi kết thúc lăn
      const finalEuler = new THREE.Euler(
        (Math.random() - 0.5) * 0.30,
        Math.random() * Math.PI * 2,
        (Math.random() - 0.5) * 0.30
      );
      const finalQuat = new THREE.Quaternion().setFromEuler(finalEuler);

      // Trục lăn ngẫu nhiên: hạt vừa lăn vừa xoay khi rơi xuống
      const rollAxis = new THREE.Vector3(
        Math.random() - 0.5,
        Math.random() - 0.5,
        Math.random() * 0.8 + 0.2
      ).normalize();

      // Thông số rơi (thứ hạng, làn, độ cao chạm đất...) được gán ở bước phân đợt phía sau
      const landT = 0;
      const totalRollRadians = Math.PI * 2 * 2;
      const targetXFrac = 0.5;
      const landF = 0.5;
      const landJitter = Math.random() * 70;
      const targetZ = Math.random() * 0.5;

      // Delay đổ theo tầng: hạt ở trên miệng tô đổ ra trước, hạt dưới đáy đổ ra sau mượt mà
      const heightFrac = Math.max(0, Math.min(1, (insidePos.y + 0.70) / 1.35));
      const layerDelay = (1 - heightFrac) * 0.12 + (i % 6) * 0.005;

      // Điểm tràn riêng dọc theo cung vành miệng tô (Pouring Lip Arc) phía trước-trái:
      const rCrest = 2.40 * bowlScale;
      const yCrest = 1.08 * bowlScale;
      // Tâm cung rót ~2.15 rad (~123°), trải đều góc ±0.36 rad (~±20°)
      const lipSpread = (((i * 1.6180339887) % 1) - 0.5) * 0.72;
      const lipAngle = 2.15 + lipSpread;
      const lipPosLocal = new THREE.Vector3(
        rCrest * Math.cos(lipAngle),
        yCrest,
        rCrest * Math.sin(lipAngle)
      );
      const dirLocal = lipPosLocal.clone().sub(insidePos).normalize();

      mesh.position.copy(insidePos).add(bowlGroup.position);
      mesh.quaternion.copy(initialQuat);

      nutParticles.push({
        mesh,
        insidePos,
        lipPosLocal,
        dirLocal,
        rollAxis,
        totalRollRadians,
        initialQuat,
        finalQuat,
        delay: layerDelay,
        landT,
        landJitter,
        landF,
        targetXFrac,
        targetZ,
        pour: false,
      });

      nutParent.add(mesh);
    }

    // ========================================================
    // 6.3b PHÂN ĐỢT RƠI
    // Đợt 1 (POUR_COUNT hạt ở tầng trên): đổ sang TRÁI như lúc đầu, rải quanh banner và mép card bên dưới.
    // Đợt 2 (các hạt còn lại ở tầng dưới): lăn xuống dần theo thanh cuộn, trải đến tận footer.
    // ========================================================
    const POUR_COUNT = 22;
    const byDelay = nutParticles.map((_, i) => i).sort((a, b) => nutParticles[a].delay - nutParticles[b].delay);
    const shuffleIdx = (arr: number[]) => {
      for (let i = arr.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [arr[i], arr[j]] = [arr[j], arr[i]];
      }
      return arr;
    };
    const pourIdx = shuffleIdx(byDelay.slice(0, POUR_COUNT));
    const rollIdx = shuffleIdx(byDelay.slice(POUR_COUNT));

    pourIdx.forEach((ni, rank) => {
      const it = nutParticles[ni];
      it.pour = true;
      it.landT = rank / Math.max(pourIdx.length - 1, 1);
      it.targetXFrac = isMobile ? 0.06 + Math.random() * 0.7 : 0.07 + Math.random() * 0.58; // Phía TRÁI tô
      it.landF = 0.22 + Math.random() * 0.32;
      it.totalRollRadians = Math.PI * 2 * (1.2 + Math.random() * 1.0);
    });

    rollIdx.forEach((ni, rank) => {
      const it = nutParticles[ni];
      it.pour = false;
      it.landT = rank / Math.max(rollIdx.length - 1, 1);
      if (isMobile) {
        it.targetXFrac = 0.06 + Math.random() * 0.88;
      } else {
        // Ưu tiên hai bên lề để không che nội dung chính
        const lane = Math.random();
        if (lane < 0.36) it.targetXFrac = 0.02 + Math.random() * 0.17;
        else if (lane < 0.72) it.targetXFrac = 0.81 + Math.random() * 0.17;
        else it.targetXFrac = 0.20 + Math.random() * 0.60;
      }
      it.landF = it.landT > 0.7 ? 0.62 + Math.random() * 0.33 : 0.40 + Math.random() * 0.50;
      it.totalRollRadians = Math.PI * 2 * (1.5 + Math.random() * 1.3 + it.landT * 3.0);
    });

    // ========================================================
    // 6.4 BÓNG MỀM (BLOB SHADOW) - ÁNH SÁNG TỪ TRÊN XUỐNG
    // Bóng nằm ngay phía dưới mỗi hạt và dưới tô, luôn đúng hướng dù hạt ở đâu trên trang.
    // ========================================================
    const blobCanvas = document.createElement('canvas');
    blobCanvas.width = 128;
    blobCanvas.height = 128;
    const bCtx = blobCanvas.getContext('2d')!;
    const bGrad = bCtx.createRadialGradient(64, 64, 0, 64, 64, 64);
    bGrad.addColorStop(0, 'rgba(38, 24, 12, 0.60)');
    bGrad.addColorStop(0.45, 'rgba(38, 24, 12, 0.30)');
    bGrad.addColorStop(0.8, 'rgba(38, 24, 12, 0.06)');
    bGrad.addColorStop(1, 'rgba(38, 24, 12, 0)');
    bCtx.fillStyle = bGrad;
    bCtx.fillRect(0, 0, 128, 128);
    const blobTex = new THREE.CanvasTexture(blobCanvas);
    const blobGeo = new THREE.PlaneGeometry(1, 1);
    const blobMats: THREE.MeshBasicMaterial[] = [];
    const makeBlob = () => {
      const mat = new THREE.MeshBasicMaterial({ map: blobTex, transparent: true, depthWrite: false, opacity: 0 });
      blobMats.push(mat);
      const m = new THREE.Mesh(blobGeo, mat);
      m.visible = false;
      scene.add(m);
      return m;
    };

    // Bóng đổ studio chuyên dụng cho tô (Chân thực, có chiều sâu, ánh sáng từ trên xuống)
    const bowlShadowCanvas = document.createElement('canvas');
    bowlShadowCanvas.width = 256;
    bowlShadowCanvas.height = 256;
    const bsCtx = bowlShadowCanvas.getContext('2d')!;
    const bsGrad = bsCtx.createRadialGradient(128, 128, 0, 128, 128, 128);
    // Vùng tiếp xúc chân tô (Core Ambient Occlusion): đậm, sắc nét, có chiều sâu chân thực
    bsGrad.addColorStop(0, 'rgba(20, 13, 7, 0.88)');
    bsGrad.addColorStop(0.20, 'rgba(24, 15, 8, 0.82)');
    bsGrad.addColorStop(0.40, 'rgba(36, 22, 12, 0.58)');
    bsGrad.addColorStop(0.68, 'rgba(48, 30, 18, 0.22)');
    bsGrad.addColorStop(0.88, 'rgba(60, 38, 22, 0.05)');
    bsGrad.addColorStop(1, 'rgba(60, 38, 22, 0)');
    bsCtx.fillStyle = bsGrad;
    bsCtx.fillRect(0, 0, 256, 256);
    const bowlBlobTex = new THREE.CanvasTexture(bowlShadowCanvas);

    const bowlBlobMat = new THREE.MeshBasicMaterial({
      map: bowlBlobTex,
      transparent: true,
      depthWrite: false,
      opacity: 0,
    });
    const bowlBlob = new THREE.Mesh(blobGeo, bowlBlobMat);
    bowlBlob.visible = false;
    scene.add(bowlBlob);

    const nutBlobs: THREE.Mesh[] = nutParticles.map(() => makeBlob());

    // ========================================================
    // 7. TRẠNG THÁI CUỘN TRANG & ĐO ĐẠC BỐ CỤC
    // ========================================================
    let smoothScroll = window.scrollY;
    let maxScroll = 2000;
    const refreshPageMetrics = () => {
      maxScroll = Math.max(document.documentElement.scrollHeight - viewH, spillDist + 600);
    };

    const onResize = () => {
      updateProjection();
      renderer.setSize(viewW, viewH);
      measureLayout();
      refreshPageMetrics();
    };
    window.addEventListener('resize', onResize);
    onResize();

    // Chiều cao trang thay đổi (ảnh/section tải xong) → cập nhật lại quãng cuộn để hạt vẫn tới đúng footer
    const resizeObserver = new ResizeObserver(() => {
      measureLayout();
      refreshPageMetrics();
    });
    resizeObserver.observe(document.body);
    const metricsTimer = window.setInterval(() => {
      measureLayout();
      refreshPageMetrics();
    }, 1000);

    // ========================================================
    // 8. ANIMATION LOOP (TÔ NGHIÊNG + HẠT LĂN XUỐNG TỚI FOOTER THEO CUỘN)
    // ========================================================
    let animationId: number;
    const clock = new THREE.Clock();

    const slerpQuat = new THREE.Quaternion();
    const rollQuat = new THREE.Quaternion();
    const startWorld = new THREE.Vector3();
    const targetWorld = new THREE.Vector3();
    const localSlidePos = new THREE.Vector3();
    const lipWorld = new THREE.Vector3();
    const vExit = new THREE.Vector3();
    const ctrlWorld = new THREE.Vector3();
    const EXIT_LEN = 75; // Quãng cuộn (px) để hạt trượt từ lòng tô ra đến vành miệng

    // Easing mềm: smootherstep (đạo hàm bậc 1, 2 bằng 0 ở hai đầu → không giật lúc bắt đầu/kết thúc)
    const smoother = (t: number) => t * t * t * (t * (t * 6 - 15) + 10);
    const smooth = (t: number) => t * t * (3 - 2 * t);
    let lastTime = performance.now();

    const animate = () => {
      animationId = requestAnimationFrame(animate);
      const now = performance.now();
      const dt = Math.min((now - lastTime) / 1000, 0.05);
      lastTime = now;
      const elapsed = clock.getElapsedTime();

      // scrollY thực: dùng để neo vị trí vật thể vào trang (hạt đã nằm yên cuộn đúng cùng nội dung, không trễ)
      const raw = window.scrollY;
      // scroll làm mượt: phản hồi nhanh tức thì khi vừa cuộn, giữ quán tính mượt mà
      // Làm mượt theo thời gian thực (độc lập FPS): màn 60Hz hay 120Hz đều mượt như nhau
      smoothScroll += (raw - smoothScroll) * (1 - Math.exp(-dt * 9.5));
      if (Math.abs(raw - smoothScroll) < 0.05) smoothScroll = raw;
      const pLin = Math.min(Math.max(smoothScroll / spillDist, 0), 1);
      // Tô nghiêng phản hồi sớm ngay từ những pixel cuộn đầu tiên, nghiêng mượt và dứt khoát
      const p = 0.28 * pLin + 0.72 * smooth(pLin);

      // BOWL: nằm trên mặt bàn ảo ngang tầm chữ banner; khi cuộn thì nghiêng đổ sang trái
      // Góc nghiêng rót vật lý chân thực:
      // - Z nghiêng vừa đủ (~0.95 rad ≈ 54.4°) để các loại hạt tuôn trào mượt mà mà vẫn thấy trọn lòng tô
      // - X và Y giữ miệng tô mở hướng về phía camera để người xem nhìn rõ dòng hạt đổ ra
      const rotZ = 0.95 * p;
      bowlGroup.rotation.z = rotZ;
      bowlGroup.rotation.x = 0.60 + 0.10 * p;
      bowlGroup.rotation.y = 0.08 * p;

      // Cơ chế trụ điểm (Base Pivoting):
      // Khi tô nghiêng sang trái, mép đáy bên trái làm điểm tựa tiếp xúc mặt bàn
      // Nâng tâm tô nhẹ (+0.16 * p) để mép vành rót hạ thấp vừa vặn tự nhiên, không bị sụp xuống dưới
      const pivotLiftY = 0.16 * p;
      const pivotShiftX = -0.04 * p;
      toWorld(bowlPageX, bowlPageY - raw, BOWL_Z, startWorld);
      bowlGroup.position.set(
        startWorld.x + pivotShiftX,
        startWorld.y + pivotLiftY + Math.sin(elapsed * 1.5) * 0.012 * (1 - p),
        startWorld.z
      );
      const bowlScreenY = bowlPageY - raw;
      const bowlPx = getBowlPx(viewW);
      bowlGroup.visible = bowlScreenY > -bowlPx * 1.5 && bowlScreenY < viewH + bowlPx * 1.5;

      // Bóng dưới tô (ánh sáng studio chiếu từ trên xuống):
      // Đặt ngay tại mặt phẳng sát sau chân tô (Z = BOWL_Z - 0.08), đồng bộ toạ độ tiếp xúc
      const shadowZ = BOWL_Z - 0.08;
      const kShadow = (camDist - shadowZ) / camDist;
      // Khi tô nghiêng, bóng bám theo điểm tựa tiếp xúc bên trái
      const shadowPageX = bowlPageX - bowlPx * 0.08 * p;
      const shadowPageY = bowlScreenY + bowlPx * (0.34 + 0.02 * p);
      toWorld(shadowPageX, shadowPageY, shadowZ, startWorld);
      bowlBlob.position.copy(startWorld);
      // Kích thước elip bóng ôm sát chân tô, dãn nhẹ theo góc nghiêng
      const shadowW = bowlPx * (0.82 + 0.12 * p) * wpp * kShadow;
      const shadowH = bowlPx * (0.28 - 0.04 * p) * wpp * kShadow;
      bowlBlob.scale.set(shadowW, shadowH, 1);
      // Độ đậm rõ nét, chân thực (không bị mờ nhờn), chỉ giảm dần khi tô cuộn khuất khỏi viewport
      const shadowFade = Math.max(0, 1 - 0.40 * p) * (bowlGroup.visible ? 1 : 0);
      bowlBlobMat.opacity = 0.82 * shadowFade;
      bowlBlob.visible = bowlGroup.visible && shadowFade > 0.01;

      // NUTS: mỗi hạt rời tô rồi lăn xuống vị trí riêng, trải dài đến tận footer
      nutParticles.forEach((item, idx) => {
        // Đợt 1 đổ sớm sang trái (khi tô vừa nghiêng); đợt 2 đổ sau khi tô đã nghiêng thêm rồi lăn dần xuống footer
        const sStart = item.pour
          ? spillDist * (0.01 + item.delay * 0.45)
          : spillDist * (0.16 + item.delay * 0.65);
        const sLandRaw = item.pour
          ? spillDist * (0.75 + 0.45 * item.landT)
          : item.landT > 0.7
            ? maxScroll - item.landJitter
            : spillDist + 120 + (maxScroll - spillDist - 120) * item.landT;
        const sLand = Math.max(Math.min(sLandRaw, maxScroll), sStart + EXIT_LEN + (item.pour ? 110 : 200));
        const uLin = Math.min(Math.max((smoothScroll - sStart) / (sLand - sStart), 0), 1);
        const u = uLin;

        if (u <= 0.0005) {
          // Còn nằm trong tô: vị trí và góc xoay nghiêng tự nhiên theo lòng tô
          item.mesh.position.copy(item.insidePos);
          item.mesh.position.applyEuler(bowlGroup.rotation);
          item.mesh.position.add(bowlGroup.position);
          item.mesh.quaternion.copy(bowlGroup.quaternion).multiply(item.initialQuat);
          item.mesh.visible = bowlGroup.visible;
          nutBlobs[idx].visible = false;
          return;
        }

        // Điểm đáp: toạ độ TRANG cố định (sLand + landF * viewH) → cuộn cùng nội dung sau khi nằm yên
        const targetPageY = sLand + item.landF * viewH;
        toWorld(item.targetXFrac * viewW, targetPageY - raw, item.targetZ, targetWorld);

        // Quãng cuộn trượt thoát tô: exitU từ 0 -> 1
        const exitU = Math.min(Math.max((smoothScroll - sStart) / EXIT_LEN, 0), 1);

        if (exitU < 1) {
          // GIAI ĐOẠN 1: TRƯỢT MEN THEO LÒNG TÔ RA VÀNH MIỆNG (INSIDE-BOWL SLIDE)
          // Hạt trượt trong hệ toạ độ cục bộ của tô, men theo mặt cong lòng tô ra điểm lipPosLocal riêng
          const a = smooth(exitU);
          // Uốn cong nhẹ lên trên theo mặt cong lòng tô để hạt lướt êm ái, chống xuyên đáy/thành tô
          const lift = 0.04 * Math.sin(a * Math.PI);
          localSlidePos.set(
            (1 - a) * item.insidePos.x + a * item.lipPosLocal.x,
            (1 - a) * item.insidePos.y + a * item.lipPosLocal.y + lift,
            (1 - a) * item.insidePos.z + a * item.lipPosLocal.z
          );
          item.mesh.position.copy(localSlidePos).applyEuler(bowlGroup.rotation).add(bowlGroup.position);

          // Hạt vừa nghiêng theo tô vừa lăn nhẹ dọc theo hướng trượt
          slerpQuat.copy(bowlGroup.quaternion).multiply(item.initialQuat);
          rollQuat.setFromAxisAngle(item.rollAxis, a * Math.PI * 1.2);
          item.mesh.quaternion.copy(slerpQuat.multiply(rollQuat));
        } else {
          // GIAI ĐOẠN 2: RƠI TỰ DO DẠNG PARABOL TRỌNG LỰC (GRAVITY CASCADE)
          // Toạ độ điểm vượt vành miệng tô trong không gian thế giới
          lipWorld.copy(item.lipPosLocal).applyEuler(bowlGroup.rotation).add(bowlGroup.position);
          // Hướng quán tính văng ra ngoài miệng tô
          vExit.copy(item.dirLocal).applyEuler(bowlGroup.rotation);

          const uB = Math.min(Math.max((smoothScroll - sStart - EXIT_LEN) / Math.max(sLand - sStart - EXIT_LEN, 1), 0), 1);
          // Vận tốc tăng dần do trọng lực rồi giảm tốc êm khi tiếp đất
          const eB = 0.40 * smooth(uB) + 0.60 * (1 - (1 - uB) * (1 - uB));
          const q = 1 - eB;

          // Điểm điều khiển quán tính văng tự nhiên ra khỏi mép vành tô
          ctrlWorld.copy(lipWorld).addScaledVector(vExit, 0.75);

          // Nảy nhẹ khi tiếp đất
          const settle = Math.min(Math.max((uB - 0.84) / 0.16, 0), 1);
          const bounce = Math.sin(settle * Math.PI) * 0.05 * (1 - settle);

          item.mesh.position.set(
            q * q * lipWorld.x + 2 * q * eB * ctrlWorld.x + eB * eB * targetWorld.x,
            q * q * lipWorld.y + 2 * q * eB * ctrlWorld.y + eB * eB * targetWorld.y + bounce,
            q * q * lipWorld.z + 2 * q * eB * ctrlWorld.z + eB * eB * targetWorld.z
          );

          // Xoay nhào lộn tự do trên không và dừng êm tại finalQuat khi tiếp đất
          slerpQuat.slerpQuaternions(item.initialQuat, item.finalQuat, eB);
          rollQuat.setFromAxisAngle(item.rollAxis, Math.PI * 1.2 + eB * item.totalRollRadians);
          item.mesh.quaternion.copy(slerpQuat.multiply(rollQuat));
        }

        // Ẩn hạt nằm ngoài viewport để tiết kiệm GPU
        const k = (camDist - item.mesh.position.z) / camDist;
        const halfH = viewH * 0.5 * wpp * k + 0.8;
        item.mesh.visible = Math.abs(item.mesh.position.y) < halfH;

        // Bóng mềm ngay dưới hạt (ánh sáng từ trên xuống), hiện dần khi hạt vượt qua miệng tô
        const r = nutRadii[idx];
        const nz = item.mesh.position.z;
        const bz = nz - 0.25;
        const ratio = (camDist - bz) / (camDist - nz);
        const blob = nutBlobs[idx];
        blob.position.set(
          item.mesh.position.x * ratio + r * 0.12,
          item.mesh.position.y * ratio - r * 1.05,
          bz
        );
        blob.scale.set(r * 2.7 * ratio, r * 1.7 * ratio, 1);
        const shadowOpacity = exitU < 0.6 ? 0 : smooth(Math.min((exitU - 0.6) / 0.4, 1)) * 0.48;
        (blob.material as THREE.MeshBasicMaterial).opacity = shadowOpacity;
        blob.visible = item.mesh.visible && shadowOpacity > 0.01;
      });

      renderer.render(scene, camera);
    };

    animate();

    // ========================================================
    // 9. CLEANUP MEMORY & TEXTURES
    // ========================================================
    return () => {
      cancelAnimationFrame(animationId);
      window.removeEventListener('resize', onResize);
      resizeObserver.disconnect();
      window.clearInterval(metricsTimer);

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
      blobGeo.dispose();
      blobTex.dispose();
      bowlBlobTex.dispose();
      bowlBlobMat.dispose();
      blobMats.forEach((m) => m.dispose());

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
      className="relative w-full min-h-screen min-h-[100dvh] pt-20 pb-12 lg:pb-16 bg-slate-50 dark:bg-[#060911] border-b border-slate-200/30 dark:border-slate-800/30 overflow-hidden select-none flex items-center z-20"
      style={{
        backgroundColor: bannerConfig.backgroundColor || undefined,
        minHeight: '100vh',
      }}
    >
      {/* 0. Dynamic Background Image Layer (from Admin Banner Config) */}
      {bannerConfig.backgroundImageUrl ? (
        <div className="absolute inset-0 overflow-hidden pointer-events-none z-0">
          <img
            src={bannerConfig.backgroundImageUrl}
            alt="Banner Background"
            className="w-full h-full object-cover object-center"
          />
          {/* Contrast Overlay Gradient: ensures text on left is 100% crisp and readable while 3D bowl blends harmoniously */}
          <div
            className={`absolute inset-0 ${
              bannerConfig.backgroundOverlay === 'dark'
                ? 'bg-black/60'
                : bannerConfig.backgroundOverlay === 'light'
                ? 'bg-white/75 dark:bg-black/75'
                : bannerConfig.backgroundOverlay === 'none'
                ? ''
                : 'bg-gradient-to-r from-white/95 via-white/85 to-white/30 dark:from-[#060911]/95 dark:via-[#060911]/85 dark:to-[#060911]/40'
            }`}
          />
        </div>
      ) : (
        /* 1. Subtle Radial Ambient Lighting when no custom background image */
        <div className="absolute inset-0 bg-radial from-amber-500/5 via-transparent to-transparent pointer-events-none z-0" />
      )}

      {/* 2. Text Content (Brand Story & Call to Action) - z-10 */}
      <div className="max-w-[1400px] w-full mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
        <div className="max-w-md lg:max-w-xl space-y-4">
          {/* Tagline / Huy hiệu (chỉ hiện khi có nội dung và không phải khoảng trắng) */}
          {Boolean(bannerConfig.tagline && bannerConfig.tagline.trim().length > 0) && (
            <span className="text-xs sm:text-sm font-black text-emerald-300 uppercase tracking-widest inline-block drop-shadow-[0_2px_8px_rgba(0,0,0,0.9)]">
              {bannerConfig.tagline}
            </span>
          )}

          {/* Dòng chữ Tiêu đề chính: Độ dày đậm nét & Màu xanh ngọc rực rỡ */}
          {(bannerConfig.title || 'Trọn Vẹn Vị Ngọt Tự Nhiên') && (
            <h2 className="text-4xl sm:text-5xl lg:text-6xl font-black text-emerald-400 leading-[1.12] tracking-tight drop-shadow-[0_3px_14px_rgba(0,0,0,0.95)]">
              {bannerConfig.title || 'Trọn Vẹn Vị Ngọt Tự Nhiên'}
            </h2>
          )}

          {/* Mô tả chi tiết (chỉ hiện khi người dùng nhập nội dung, để trống sẽ tự động ẩn) */}
          {Boolean(bannerConfig.description && bannerConfig.description.trim().length > 0) && (
            <p className="text-sm sm:text-base text-emerald-100 font-semibold leading-relaxed max-w-lg drop-shadow-[0_2px_8px_rgba(0,0,0,0.9)]">
              {bannerConfig.description}
            </p>
          )}

          {/* Cụm Nút bấm CTA & Dòng cam kết nổi bật (chỉ hiện khi có ít nhất một trong hai) */}
          {Boolean(
            (bannerConfig.buttonText && bannerConfig.buttonText.trim().length > 0) ||
            (bannerConfig.highlightText && bannerConfig.highlightText.trim().length > 0)
          ) && (
            <div className="pt-2 flex flex-wrap items-center gap-4 relative z-30 pointer-events-auto">
              {Boolean(bannerConfig.buttonText && bannerConfig.buttonText.trim().length > 0) && (
                <Link
                  href={bannerConfig.buttonLink || '/products'}
                  className="inline-flex items-center gap-2 px-7 py-3.5 rounded-full bg-emerald-500 hover:bg-emerald-400 text-slate-950 text-xs font-black transition-all shadow-xl shadow-black/50 cursor-pointer hover:scale-105 active:scale-95"
                >
                  <span>{bannerConfig.buttonText}</span>
                  <ArrowRight className="w-4 h-4 stroke-[2.5]" />
                </Link>
              )}
              {Boolean(bannerConfig.highlightText && bannerConfig.highlightText.trim().length > 0) && (
                <span className="text-xs text-emerald-300 font-bold drop-shadow-[0_2px_6px_rgba(0,0,0,0.9)]">
                  {bannerConfig.highlightText}
                </span>
              )}
            </div>
          )}
        </div>
      </div>

      {/* 3. Interactive 3D Nut Bowl Canvas - TRÀN SÂU XUỐNG SECTION DƯỚI & PHỦ LÊN CARD (z-30) */}
      <div
        ref={canvasHolderRef}
        className="fixed inset-0 w-screen h-screen z-30 pointer-events-none overflow-hidden"
        title="Cuộn trang để thấy tô hạt nghiêng và các hạt lăn xuống tận footer"
      />

      {/* Hint Tag */}
      <div className="absolute bottom-3 right-6 z-30 text-[11px] font-medium text-slate-400 dark:text-slate-500 bg-white/70 dark:bg-slate-900/70 backdrop-blur-xs px-3 py-1 rounded-full border border-slate-200/50 dark:border-slate-800/50 pointer-events-none">
        Tô hạt tương tác 3D theo thao tác cuộn
      </div>
    </section>
  );
}
