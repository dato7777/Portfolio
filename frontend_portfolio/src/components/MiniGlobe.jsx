// src/components/MiniGlobe.jsx
import * as THREE from "three";
import React, { useEffect, useMemo, useRef, useState, Suspense } from "react";
import { Canvas, useFrame, useLoader, useThree } from "@react-three/fiber";
import { OrbitControls } from "@react-three/drei";

/**********************  PRELOAD TEXTURES  *************************/
useLoader.preload(THREE.TextureLoader, "/textures/earth_day.jpg");
useLoader.preload(THREE.TextureLoader, "/textures/earth_bump.jpg");

/**********************  HELPERS  *************************/
// ✅ Your original mapping – this already puts cities in the right position
function latLonToVec3(lat, lon, radius = 1) {
  const phi = (90 - lat) * (Math.PI / 180);
  const theta = (lon + 180) * (Math.PI / 180);

  return new THREE.Vector3(
    -radius * Math.sin(phi) * Math.cos(theta),
    radius * Math.cos(phi),
    radius * Math.sin(phi) * Math.sin(theta)
  );
}

function useCountryBorders(url, radius = 1.002) {
  const [lines, setLines] = useState([]);

  useEffect(() => {
    let mounted = true;
    (async () => {
      try {
        const res = await fetch(url, { cache: "force-cache" });
        const gj = await res.json();
        const objs = [];

        const pushLine = (coords) => {
          const pts = new Float32Array(coords.length * 3);

          coords.forEach(([lon, lat], i) => {
            const v = latLonToVec3(lat, lon, radius);
            pts.set([v.x, v.y, v.z], i * 3);
          });

          const g = new THREE.BufferGeometry();
          g.setAttribute("position", new THREE.BufferAttribute(pts, 3));

          const mat = new THREE.LineBasicMaterial({
            color: 0x00e5ff,
            transparent: true,
            opacity: 0.5,
          });

          objs.push(new THREE.Line(g, mat));
        };

        gj.features?.forEach((f) => {
          if (!f.geometry) return;

          if (f.geometry.type === "Polygon") {
            f.geometry.coordinates.forEach(pushLine);
          }
          if (f.geometry.type === "MultiPolygon") {
            f.geometry.coordinates.forEach((poly) => poly.forEach(pushLine));
          }
        });

        if (mounted) setLines(objs);
      } catch {
        if (mounted) setLines([]);
      }
    })();

    return () => (mounted = false);
  }, [url, radius]);

  return lines;
}

/********************** LABEL LINE *************************/
function LabelLine({ start, end }) {
  const positions = useMemo(
    () => new Float32Array([start.x, start.y, start.z, end.x, end.y, end.z]),
    [start, end]
  );

  return (
    <line>
      <bufferGeometry>
        <bufferAttribute
          attach="attributes-position"
          array={positions}
          count={2}
          itemSize={3}
        />
      </bufferGeometry>
      <lineBasicMaterial color="#00e5ff" opacity={0.55} transparent />
    </line>
  );
}

/**********************  TEXT SPRITE (SMALL + SIDE-OFFSET) *************************/
function TextSprite({ text = "", position, scale = 0.35 }) {
  const spriteRef = useRef();

  const texture = useMemo(() => {
    const cvs = document.createElement("canvas");
    cvs.width = 512;
    cvs.height = 220;

    const ctx = cvs.getContext("2d");

    ctx.fillStyle = "rgba(0,0,0,0.5)";
    ctx.strokeStyle = "rgba(0,255,255,0.4)";
    ctx.lineWidth = 3;

    const w = 360,
      h = 80,
      x = 76,
      y = 70,
      r = 26;

    ctx.beginPath();
    ctx.moveTo(x + r, y);
    ctx.arcTo(x + w, y, x + w, y + h, r);
    ctx.arcTo(x + w, y + h, x, y + h, r);
    ctx.arcTo(x, y + h, x, y, r);
    ctx.arcTo(x, y, x + w, y, r);
    ctx.closePath();
    ctx.fill();
    ctx.stroke();

    ctx.fillStyle = "white";
    ctx.font = "bold 36px Inter";
    ctx.textAlign = "center";
    ctx.textBaseline = "middle";
    ctx.fillText(text, cvs.width / 2, cvs.height / 2);

    return new THREE.CanvasTexture(cvs);
  }, [text]);

  useEffect(() => {
    if (!spriteRef.current) return;
    const offset = position.clone();
    offset.x += 0.28; // side offset
    offset.y += 0.15; // slight upward shift
    spriteRef.current.position.copy(offset);
    spriteRef.current.scale.set(scale, scale, 1);
  }, [position, scale]);

  return (
    <sprite ref={spriteRef}>
      <spriteMaterial map={texture} transparent depthWrite={false} />
    </sprite>
  );
}

/**********************  CITY MARKER (BIGGER HEARTBEAT) *************************/
function CityMarker({ lat, lon }) {
  const group = useRef();
  const pos = useMemo(() => latLonToVec3(lat, lon, 1.002), [lat, lon]);

  useFrame(({ clock }) => {
    const t = clock.getElapsedTime();
    const s = 1 + 0.25 * Math.sin(t * 4);
    if (group.current) group.current.scale.setScalar(s);
  });

  return (
    <group ref={group} position={pos}>
      <mesh>
        <sphereGeometry args={[0.035, 32, 32]} />
        <meshBasicMaterial color="#ffe066" />
      </mesh>
      <mesh>
        <ringGeometry args={[0.045, 0.075, 48]} />
        <meshBasicMaterial
          color="#ffe066"
          transparent
          opacity={0.55}
          side={THREE.DoubleSide}
        />
      </mesh>
    </group>
  );
}

/**********************  EARTH & ATMOSPHERE  *************************/
function Atmosphere() {
  return (
    <mesh>
      <sphereGeometry args={[1.03, 48, 48]} />
      <meshBasicMaterial color={0x4cb8ff} transparent opacity={0.08} />
    </mesh>
  );
}

function Earth() {
  const day = useLoader(THREE.TextureLoader, "/textures/earth_day.jpg");
  const bump = useLoader(THREE.TextureLoader, "/textures/earth_bump.jpg");

  return (
    <mesh>
      <sphereGeometry args={[1, 64, 64]} />
      <meshPhongMaterial
        map={day}
        bumpMap={bump}
        bumpScale={0.035}
        specular={new THREE.Color(0x222222)}
        shininess={7}
      />
    </mesh>
  );
}

/**********************  MAIN SCENE *************************/
/**
 * Key change vs your old version:
 * - We do NOT rotate the globe to the city anymore.
 * - We move the CAMERA around the globe to look at the city.
 * - camera.up = (0, 1, 0) => north is always visually "up".
 */
function GlobeScene({ lat, lon, label }) {
  const group = useRef();
  const borders = useCountryBorders("/geo/countries.geojson");
  const { camera } = useThree();

  const hasCity = Number.isFinite(lat) && Number.isFinite(lon);
  const targetCamPos = useRef(new THREE.Vector3(0, 0, 2.5));

  const markerPos = useMemo(
    () => (hasCity ? latLonToVec3(lat, lon, 1.002) : new THREE.Vector3(0, 0, 1.002)),
    [lat, lon, hasCity]
  );

  const labelPos = useMemo(() => {
    const p = markerPos.clone();
    p.x += 0.28;
    p.y += 0.15;
    return p;
  }, [markerPos]);

  // Keep camera's up axis stable: Y = up
  useEffect(() => {
    camera.up.set(0, 1, 0);
    camera.lookAt(0, 0, 0);
  }, [camera]);

  // When city changes, move target camera position over that city
  useEffect(() => {
    if (!hasCity) {
      // default idle position
      targetCamPos.current.set(0, 0, 2.5);
      return;
    }

    const cityDir = latLonToVec3(lat, lon, 1).normalize();
    // camera sits "above" the city, a bit away from the globe
    const desired = cityDir.clone().multiplyScalar(2.3);
    targetCamPos.current.copy(desired);
  }, [hasCity, lat, lon]);

  useFrame((_, delta) => {
    // Smoothly move camera toward targetCamPos
    const t = 1 - Math.exp(-delta * 3); // damping
    camera.position.lerp(targetCamPos.current, t);
    camera.lookAt(0, 0, 0);
    camera.up.set(0, 1, 0);

    // Idle rotation only when no city is selected
    if (!hasCity && group.current) {
      group.current.rotation.y += delta * 0.02;
    }
  });

  return (
    <>
      <ambientLight intensity={0.65} />
      <directionalLight position={[5, 3, 5]} intensity={0.9} />

      <group ref={group}>
        <Earth />
        <Atmosphere />

        {borders.map((line, i) => (
          <primitive key={i} object={line} />
        ))}

        {hasCity && (
          <>
            <CityMarker lat={lat} lon={lon} />
            <TextSprite text={label} position={markerPos} />
            <LabelLine start={markerPos} end={labelPos} />
          </>
        )}
      </group>

      <OrbitControls
        enablePan={false}
        enableZoom
        zoomSpeed={0.45}
        minDistance={1.7}
        maxDistance={3.0}
        enableRotate
      />
    </>
  );
}

/**********************  ERROR BOUNDARY *************************/
class GlobeErrorBoundary extends React.Component {
  state = { failed: false };

  static getDerivedStateFromError() {
    return { failed: true };
  }

  render() {
    if (this.state.failed) {
      return (
        <div
          style={{ height: this.props.height }}
          className="flex items-center justify-center text-xs opacity-70"
        >
          Globe failed to render.
        </div>
      );
    }
    return this.props.children;
  }
}

/**********************  PUBLIC WRAPPER *************************/
export default function MiniGlobe({ lat, lon, label, height = 300 }) {
  return (
    <div style={{ height }}>
      <GlobeErrorBoundary height={height}>
        <Suspense fallback={<div className="text-xs opacity-70">Loading globe…</div>}>
          <Canvas camera={{ position: [0, 0, 2.5], fov: 45 }}>
            <GlobeScene lat={Number(lat)} lon={Number(lon)} label={label} />
          </Canvas>
        </Suspense>
      </GlobeErrorBoundary>
    </div>
  );
}