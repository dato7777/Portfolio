// src/components/MiniGlobe.jsx
import * as THREE from "three";
import React, { useEffect, useMemo, useRef, useState, Suspense } from "react";
import { Canvas, useFrame, useLoader } from "@react-three/fiber";
import { OrbitControls } from "@react-three/drei";

// ---------- helpers ----------
function latLonToVec3(lat, lon, radius = 1) {
  const phi = (90 - lat) * (Math.PI / 180);
  const theta = (lon + 180) * (Math.PI / 180);
  const x = -radius * Math.sin(phi) * Math.cos(theta);
  const z = radius * Math.sin(phi) * Math.sin(theta);
  const y = radius * Math.cos(phi);
  return new THREE.Vector3(x, y, z);
}

function useCountryBorders(url, radius = 1.002) {
  const [lines, setLines] = useState([]);

  useEffect(() => {
    let mounted = true;
    (async () => {
      try {
        const res = await fetch(url, { cache: "force-cache" });
        const gj = await res.json();

        const newLines = [];

        const pushLine = (coords) => {
          const pts = new Float32Array(coords.length * 3);
          for (let i = 0; i < coords.length; i++) {
            const [lon, lat] = coords[i];
            const v = latLonToVec3(lat, lon, radius);
            pts[i * 3 + 0] = v.x;
            pts[i * 3 + 1] = v.y;
            pts[i * 3 + 2] = v.z;
          }
          const geo = new THREE.BufferGeometry();
          geo.setAttribute("position", new THREE.BufferAttribute(pts, 3));
          const mat = new THREE.LineBasicMaterial({
            color: 0x00e5ff,
            transparent: true,
            opacity: 0.35,
          });
          newLines.push(new THREE.Line(geo, mat));
        };

        const handlePolygon = (poly) => {
          for (const ring of poly) pushLine(ring);
        };

        for (const f of gj.features || []) {
          const g = f.geometry;
          if (!g) continue;
          if (g.type === "Polygon") handlePolygon(g.coordinates);
          if (g.type === "MultiPolygon") for (const poly of g.coordinates) handlePolygon(poly);
        }

        if (mounted) setLines(newLines);
      } catch (e) {
        console.error("Borders load error:", e);
        if (mounted) setLines([]); // fail soft
      }
    })();
    return () => { mounted = false; };
  }, [url, radius]);

  return lines;
}

function TextSprite({ text = "", position = new THREE.Vector3(), scale = 0.4 }) {
  const spriteRef = useRef();

  const map = useMemo(() => {
    const canvas = document.createElement("canvas");
    const size = 512;
    canvas.width = size;
    canvas.height = size;
    const ctx = canvas.getContext("2d");

    ctx.fillStyle = "rgba(0,0,0,0)";
    ctx.fillRect(0, 0, size, size);

    const padX = 24, padY = 14;
    const fontPx = 42;

    ctx.font = `600 ${fontPx}px Inter, system-ui, -apple-system, Segoe UI, Roboto, sans-serif`;
    const tw = ctx.measureText(text).width;
    const w = Math.min(size - 20, tw + padX * 2);
    const h = fontPx + padY * 2;
    const x = (size - w) / 2;
    const y = (size - h) / 2;
    const r = h / 2;

    ctx.fillStyle = "rgba(0, 0, 0, 0.55)";
    ctx.strokeStyle = "rgba(0, 255, 255, 0.5)";
    ctx.lineWidth = 4;

    ctx.beginPath();
    ctx.moveTo(x + r, y);
    ctx.arcTo(x + w, y, x + w, y + h, r);
    ctx.arcTo(x + w, y + h, x, y + h, r);
    ctx.arcTo(x, y + h, x, y, r);
    ctx.arcTo(x, y, x + w, y, r);
    ctx.closePath();
    ctx.fill();
    ctx.stroke();

    ctx.fillStyle = "#E6FDFF";
    ctx.textAlign = "center";
    ctx.textBaseline = "middle";
    ctx.fillText(text, size / 2, size / 2 + 2);

    const texture = new THREE.CanvasTexture(canvas);
    texture.minFilter = THREE.LinearFilter;
    texture.needsUpdate = true;
    return texture;
  }, [text]);

  useEffect(() => {
    if (spriteRef.current) {
      spriteRef.current.position.copy(position.clone().multiplyScalar(1.12));
      spriteRef.current.scale.set(scale, scale, 1);
    }
  }, [position, scale]);

  return (
    <sprite ref={spriteRef}>
      <spriteMaterial map={map} depthWrite={false} transparent />
    </sprite>
  );
}

function CityMarker({ lat, lon, radius = 1, color = "#ffe066" }) {
  const g = useRef();
  const pos = useMemo(() => latLonToVec3(lat, lon, radius * 1.002), [lat, lon, radius]);
  useFrame(({ clock }) => {
    const t = clock.getElapsedTime();
    if (g.current) g.current.scale.setScalar(1 + 0.15 * Math.sin(t * 4));
  });
  return (
    <group ref={g} position={pos}>
      <mesh>
        <sphereGeometry args={[0.011, 16, 16]} />
        <meshBasicMaterial color={color} />
      </mesh>
      <mesh>
        <ringGeometry args={[0.013, 0.022, 32]} />
        <meshBasicMaterial color={color} transparent opacity={0.6} side={THREE.DoubleSide} />
      </mesh>
    </group>
  );
}

function Atmosphere({ radius = 1 }) {
  return (
    <mesh>
      <sphereGeometry args={[radius * 1.025, 48, 48]} />
      <meshBasicMaterial color={0x47a6ff} transparent opacity={0.08} />
    </mesh>
  );
}

function Earth({ radius = 1 }) {
  const dayMap = useLoader(THREE.TextureLoader, "/textures/earth_day.jpg");
  const bumpMap = useLoader(THREE.TextureLoader, "/textures/earth_bump.jpg");

  // Speed up texture sampling a bit; avoid mipmap shimmering
  [dayMap, bumpMap].forEach((t) => {
    t.anisotropy = 4;
    t.wrapS = t.wrapT = THREE.ClampToEdgeWrapping;
  });

  return (
    <mesh>
      <sphereGeometry args={[radius, 64, 64]} />
      <meshPhongMaterial
        map={dayMap}
        bumpMap={bumpMap}
        bumpScale={0.02}
        specular={new THREE.Color(0x222222)}
        shininess={5}
        toneMapped={false}
      />
    </mesh>
  );
}

function GlobeScene({ lat, lon, label }) {
  const group = useRef();
  useFrame((_, d) => { if (group.current) group.current.rotation.y += d * 0.02; });
  // 👉 re-orient globe to face the chosen city
  useEffect(() => {
    if (!Number.isFinite(lat) || !Number.isFinite(lon) || !group.current) return;
    const target = latLonToVec3(lat, lon, 1).normalize(); // city direction
    // rotate globe so 'target' points to +Z (camera looks down +Z)
    const q = new THREE.Quaternion().setFromUnitVectors(target, new THREE.Vector3(0, 0, 1));
    group.current.quaternion.copy(q);
  }, [lat, lon]);
  const borders = useCountryBorders("/geo/countries.geojson", 1.002);

  return (
    <>
      <ambientLight intensity={0.6} />
      <directionalLight position={[5, 3, 5]} intensity={0.9} />
      <group ref={group}>
        <Earth radius={1} />
        <Atmosphere radius={1} />
        <group>
          {borders.map((line, i) => <primitive key={i} object={line} />)}
        </group>
        {Number.isFinite(lat) && Number.isFinite(lon) && (
          <>
            <CityMarker lat={lat} lon={lon} />
            <TextSprite text={label || ""} position={latLonToVec3(lat, lon, 1)} />
          </>
        )}
      </group>
      <OrbitControls enablePan={false} enableZoom zoomSpeed={0.5} />
    </>
  );
}

// ---------- Error boundary to catch Canvas crashes ----------
class GlobeErrorBoundary extends React.Component {
  constructor(props) { super(props); this.state = { hasError: false }; }
  static getDerivedStateFromError() { return { hasError: true }; }
  componentDidCatch(err) { console.error("MiniGlobe crashed:", err); }
  render() {
    if (this.state.hasError) {
      return (
        <div
          style={{ height: this.props.height || 300 }}
          className={`w-full rounded-2xl border border-cyan-400/30 bg-white/5 backdrop-blur flex items-center justify-center ${this.props.className || ""}`}
        >
          <span className="text-xs opacity-70">Globe failed to render.</span>
        </div>
      );
    }
    return this.props.children;
  }
}

// ---------- Public component ----------
export default function MiniGlobe({ lat, lon, label, height = 300, className = "" }) {
  return (
    <div style={{ height }} className={`w-full rounded-2xl overflow-hidden border border-cyan-400/30 bg-white/5 backdrop-blur ${className}`}>
      <GlobeErrorBoundary height={height} className={className}>
        <Suspense
          fallback={
            <div className="w-full h-full flex items-center justify-center text-xs opacity-70">
              Loading globe…
            </div>
          }
        >
          <Canvas
            camera={{ position: [0, 0, 2.2], fov: 45 }}
            gl={{ antialias: true, alpha: true, powerPreference: "high-performance" }}
          >
            <GlobeScene lat={Number(lat)} lon={Number(lon)} label={label} />
          </Canvas>
        </Suspense>
      </GlobeErrorBoundary>
    </div>
  );
}
