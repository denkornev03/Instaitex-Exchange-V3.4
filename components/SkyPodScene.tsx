
import React, { useEffect, useRef } from 'react';
import * as THREE from 'three';
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls';

// --- Constants & Config ---
const CONFIG = { size: 1 };

const COLORS = {
    sky: 0x4aa3df,
    white: 0xffffff,
    whiteShade: 0xe0e0e0,
    glass: 0x222244,
    rail: 0x888899,
    pylon: 0xdddddd,
    cable: 0xaaaaaa,
    water: 0x3b85d1,
    gunMetal: 0x2a2a2a,
    gold: 0xffcc00,
    wood: 0x8b4513,
    red: 0xcc0000,
};

interface SkyPodSceneProps {
    isNightVision?: boolean;
}

const SkyPodScene: React.FC<SkyPodSceneProps> = ({ isNightVision = false }) => {
    const mountRef = useRef<HTMLDivElement>(null);
    const rendererRef = useRef<THREE.WebGLRenderer | null>(null);
    const requestRef = useRef<number | null>(null);
    
    // Refs for scene objects to update them dynamically
    const sceneRef = useRef<THREE.Scene | null>(null);
    const ambientLightRef = useRef<THREE.AmbientLight | null>(null);
    const dirLightRef = useRef<THREE.DirectionalLight | null>(null);

    // Initial Setup
    useEffect(() => {
        if (!mountRef.current) return;

        // --- Scene Setup ---
        const scene = new THREE.Scene();
        scene.background = new THREE.Color(COLORS.sky);
        scene.fog = new THREE.Fog(COLORS.sky, 60, 250);
        sceneRef.current = scene;

        const width = mountRef.current.clientWidth;
        const height = mountRef.current.clientHeight;

        const camera = new THREE.PerspectiveCamera(45, width / height, 0.1, 1000);
        camera.position.set(-48, 36, 72);

        const renderer = new THREE.WebGLRenderer({ antialias: true });
        renderer.setSize(width, height);
        renderer.shadowMap.enabled = true;
        renderer.shadowMap.type = THREE.PCFSoftShadowMap;
        
        mountRef.current.appendChild(renderer.domElement);
        rendererRef.current = renderer;

        const controls = new OrbitControls(camera, renderer.domElement);
        controls.enableDamping = true;
        controls.target.set(0, 15, 0);
        controls.enablePan = true;
        controls.enableZoom = true;
        controls.minDistance = 1;
        controls.maxDistance = 2000;
        controls.maxPolarAngle = Math.PI;

        // --- Lighting ---
        const ambientLight = new THREE.AmbientLight(0xffffff, 0.6);
        scene.add(ambientLight);
        ambientLightRef.current = ambientLight;

        const dirLight = new THREE.DirectionalLight(0xfffaed, 1.2);
        dirLight.position.set(50, 80, 30);
        dirLight.castShadow = true;
        dirLight.shadow.mapSize.width = 2048;
        dirLight.shadow.mapSize.height = 2048;
        dirLight.shadow.camera.near = 0.5;
        dirLight.shadow.camera.far = 300;
        dirLight.shadow.camera.left = -150;
        dirLight.shadow.camera.right = 150;
        dirLight.shadow.camera.top = 100;
        dirLight.shadow.camera.bottom = -100;
        scene.add(dirLight);
        dirLightRef.current = dirLight;

        // --- Voxel Helpers ---
        const boxGeo = new THREE.BoxGeometry(CONFIG.size, CONFIG.size, CONFIG.size);
        boxGeo.scale(0.95, 0.95, 0.95);

        const createVoxelMaterial = (color: number) => {
            return new THREE.MeshStandardMaterial({
                color: color,
                roughness: 0.1,
                flatShading: false,
            });
        };

        const occupied = new Set<string>();
        const addVoxelGeneric = (group: THREE.Group, x: number, y: number, z: number, material: THREE.Material, checkOccupied = false) => {
            if (checkOccupied) {
                const key = `${x},${y},${z}`;
                if (occupied.has(key)) return;
                occupied.add(key);
            }
            const mesh = new THREE.Mesh(boxGeo, material);
            mesh.position.set(x * CONFIG.size, y * CONFIG.size, z * CONFIG.size);
            mesh.castShadow = true;
            mesh.receiveShadow = true;
            group.add(mesh);
        };

        // --- Object Construction ---

        // 1. The Pod
        const podGroup = new THREE.Group();
        const matBody = createVoxelMaterial(COLORS.white);
        const matBodyShade = createVoxelMaterial(COLORS.whiteShade);
        const matGlass = new THREE.MeshStandardMaterial({ color: COLORS.glass, roughness: 0.0, metalness: 0.8 });
        const matConnector = createVoxelMaterial(COLORS.rail);

        const podWidth = 6;
        const podHeight = 5;
        const podLength = 10;

        for (let x = -podLength / 2; x < podLength / 2; x++) {
            for (let y = 0; y < podHeight; y++) {
                for (let z = -podWidth / 2; z < podWidth / 2; z++) {
                    const isEdgeX = x === -podLength / 2 || x === podLength / 2 - 1;
                    const isEdgeY = y === 0 || y === podHeight - 1;
                    const isEdgeZ = z === -podWidth / 2 || z === podWidth / 2 - 1;

                    if ((isEdgeX && isEdgeY) || (isEdgeY && isEdgeZ) || (isEdgeX && isEdgeZ)) continue;

                    let mat = matBody;
                    if (z === podWidth / 2 - 1 || z === -podWidth / 2) {
                        if (x > -3 && x < 3 && y > 1 && y < 4) mat = matGlass;
                    }
                    if (x === podLength / 2 - 1 && y > 1 && y < 4 && Math.abs(z) < 2) mat = matGlass;
                    if (y === 0) mat = matBodyShade;

                    addVoxelGeneric(podGroup, x, y, z, mat);
                }
            }
        }

        // Connector
        for (let y = podHeight; y < podHeight + 3; y++) {
            addVoxelGeneric(podGroup, -2, y, 0, matConnector);
            addVoxelGeneric(podGroup, -1, y, 0, matConnector);
        }
        // Sensor
        addVoxelGeneric(podGroup, 4, 1, 0, matConnector);

        // Minigun
        const minigunGroup = new THREE.Group();
        const matGun = createVoxelMaterial(COLORS.gunMetal);
        addVoxelGeneric(minigunGroup, 0, 0, 0, matGun);
        addVoxelGeneric(minigunGroup, 1, 0, 0, matGun);
        addVoxelGeneric(minigunGroup, 1, -1, 0, matGun);
        addVoxelGeneric(minigunGroup, 2, -0.5, 0, matGun);
        minigunGroup.position.set(0, -1, 0);
        podGroup.add(minigunGroup);

        // Speedometer
        const speedCanvas = document.createElement('canvas');
        speedCanvas.width = 256;
        speedCanvas.height = 128;
        const speedCtx = speedCanvas.getContext('2d');
        const speedTexture = new THREE.CanvasTexture(speedCanvas);
        const speedMat = new THREE.MeshBasicMaterial({ map: speedTexture, transparent: true, side: THREE.DoubleSide });
        const speedometer = new THREE.Mesh(new THREE.PlaneGeometry(4, 2), speedMat);
        speedometer.position.set(0, 3, 5);
        podGroup.add(speedometer);

        podGroup.position.y = 15;
        scene.add(podGroup);

        // 2. The Environment
        const envGroup = new THREE.Group();
        const matPylon = createVoxelMaterial(COLORS.pylon);
        const matRail = createVoxelMaterial(COLORS.rail);
        const matCable = createVoxelMaterial(COLORS.cable);

        const railY = 22;
        for (let x = -120; x < 120; x++) {
            addVoxelGeneric(envGroup, x, railY, 0, matRail);
            if (x % 2 === 0) addVoxelGeneric(envGroup, x, railY + 1, 0, matRail);
        }

        const createPylon = (baseX: number) => {
            for (let h = -20; h < 35; h += 0.25) {
                const xOff = Math.sin(h * 0.05) * 5;
                const zOff = Math.cos(h * 0.05) * 2;
                for (let dx = 0; dx < 2; dx++) {
                    for (let dz = 0; dz < 2; dz++) {
                        addVoxelGeneric(envGroup, Math.round(baseX + xOff + dx), Math.round(h), Math.round(10 + zOff + dz), matPylon, true);
                    }
                }
            }
            const armStartX = baseX + Math.sin(35 * 0.05) * 5;
            const armStartY = 35;
            const armStartZ = 10 + Math.cos(35 * 0.05) * 2;
            const steps = 60;
            for (let i = 0; i <= steps; i++) {
                const t = i / steps;
                const targetX = baseX - 10;
                const cx = THREE.MathUtils.lerp(armStartX, targetX, t);
                const cy = THREE.MathUtils.lerp(armStartY, railY + 2, t);
                const cz = THREE.MathUtils.lerp(armStartZ, 0, t);
                const arcY = Math.sin(t * Math.PI) * 5;
                addVoxelGeneric(envGroup, Math.round(cx), Math.round(cy + arcY), Math.round(cz), matPylon, true);
                addVoxelGeneric(envGroup, Math.round(cx), Math.round(cy + arcY) - 1, Math.round(cz), matPylon, true);
            }
            const drawLine = (x1: number, y1: number, z1: number, x2: number, y2: number, z2: number) => {
                const dist = Math.sqrt((x2 - x1) ** 2 + (y2 - y1) ** 2 + (z2 - z1) ** 2);
                const s = Math.ceil(dist * 2);
                for (let i = 0; i <= s; i++) {
                    const t = i / s;
                    addVoxelGeneric(envGroup, Math.round(THREE.MathUtils.lerp(x1, x2, t)), Math.round(THREE.MathUtils.lerp(y1, y2, t)), Math.round(THREE.MathUtils.lerp(z1, z2, t)), matCable, true);
                }
            };
            drawLine(baseX, 30, 10, baseX + 20, -10, 15);
            drawLine(baseX, 25, 10, baseX + 15, -10, 15);
            drawLine(baseX, 32, 10, baseX - 15, railY, 0);
        };

        occupied.clear();
        createPylon(40);
        createPylon(-40);
        scene.add(envGroup);

        // 3. The River
        const matWater = createVoxelMaterial(COLORS.water);
        matWater.roughness = 0.05;
        matWater.metalness = 0.3;
        const riverXRange = 250;
        const riverZRange = 70;
        const riverYBase = -8;
        const xStart = -riverXRange, xEnd = riverXRange, zStart = -riverZRange, zEnd = riverZRange;
        const xCount = xEnd - xStart;
        const zCount = zEnd - zStart;
        const riverMesh = new THREE.InstancedMesh(boxGeo, matWater, xCount * zCount);
        riverMesh.instanceMatrix.setUsage(THREE.DynamicDrawUsage);
        riverMesh.receiveShadow = true;
        const wavePeriod = 20; 
        const dummy = new THREE.Object3D();
        let index = 0;
        for(let x = xStart; x < xEnd; x++) {
            for(let z = zStart; z < zEnd; z++) {
                const freq = (Math.PI * 2) / wavePeriod;
                const yOffset = Math.sin(x * freq) * 0.5 + Math.cos(z * 0.1) * 0.5;
                dummy.position.set(x, riverYBase + yOffset, z);
                dummy.updateMatrix();
                riverMesh.setMatrixAt(index++, dummy.matrix);
            }
        }
        scene.add(riverMesh);

        // --- Pirate Boat ---
        const boatGroup = new THREE.Group();
        const matWood = createVoxelMaterial(COLORS.wood);
        const matWhite = createVoxelMaterial(COLORS.white);
        const matRed = createVoxelMaterial(COLORS.red);
        const matBlack = createVoxelMaterial(0x111111);

        for(let x = -4; x <= 4; x++) {
            for(let z = -2; z <= 2; z++) {
                addVoxelGeneric(boatGroup, x, 0, z, matWood);
                if (x === -4 || x === 4 || z === -2 || z === 2) addVoxelGeneric(boatGroup, x, 1, z, matWood);
            }
        }
        for(let y=0; y<8; y++) addVoxelGeneric(boatGroup, 0, y, 0, matWood);
        for(let y=3; y<7; y++) {
            for(let z=-3; z<3; z++) {
                const mat = (z + y) % 2 === 0 ? matWhite : matRed;
                const xOffset = Math.sin(z * 0.5) * 0.5;
                addVoxelGeneric(boatGroup, xOffset, y, z, mat);
            }
        }
        addVoxelGeneric(boatGroup, 0, 8, 0, matBlack);
        addVoxelGeneric(boatGroup, 0, 8, 1, matBlack);
        addVoxelGeneric(boatGroup, 0, 7.5, 1.5, matBlack);
        scene.add(boatGroup);

        const boatState = { x: -150, z: 20, speed: 0.15, health: 100, isSinking: false, sinkTimer: 0 };
        const maxHealth = 100;

        // Bullets & Particles
        const matBullet = new THREE.MeshBasicMaterial({ color: COLORS.gold });
        const bulletGeo = new THREE.BoxGeometry(0.3, 0.3, 0.8);
        const bullets: {mesh: THREE.Mesh, velocity: THREE.Vector3, life: number}[] = [];
        const matSplash = new THREE.MeshBasicMaterial({ color: 0xccffff, transparent: true, opacity: 0.8 });
        const matDebris = new THREE.MeshBasicMaterial({ color: COLORS.wood });
        const splashGeo = new THREE.BoxGeometry(0.8, 0.8, 0.8);
        const particles: {mesh: THREE.Mesh, velocity: THREE.Vector3, life: number}[] = [];

        const spawnBullet = (startPos: THREE.Vector3, direction: THREE.Vector3) => {
            const mesh = new THREE.Mesh(bulletGeo, matBullet);
            mesh.position.copy(startPos);
            mesh.quaternion.setFromUnitVectors(new THREE.Vector3(0, 0, 1), direction.clone().normalize());
            scene.add(mesh);
            bullets.push({ mesh, velocity: direction.multiplyScalar(2.0), life: 60 });
        };

        const spawnParticle = (pos: THREE.Vector3, type: 'splash' | 'debris') => {
             const mat = type === 'splash' ? matSplash : matDebris;
             const mesh = new THREE.Mesh(splashGeo, mat);
             mesh.position.copy(pos);
             mesh.rotation.y = Math.random() * Math.PI;
             mesh.scale.setScalar(Math.random() * 0.5 + 0.5);
             scene.add(mesh);
             const vel = new THREE.Vector3((Math.random() - 0.5) * 0.5, Math.random() * 0.5, (Math.random() - 0.5) * 0.5);
             particles.push({ mesh, velocity: vel, life: type === 'splash' ? 15 : 30 });
        };

        // Animation
        const clock = new THREE.Clock();
        const speed = 0.5;
        const range = 100; 
        let lastFireTime = 0;

        const animate = () => {
            requestRef.current = requestAnimationFrame(animate);
            const time = clock.getElapsedTime();

            // Pod
            const currentX = Math.sin(time * speed) * range;
            const velocityX = Math.cos(time * speed); 
            podGroup.position.x = currentX;
            podGroup.position.y = railY - podHeight - 1.5 + Math.sin(time * 2) * 0.1;
            podGroup.rotation.z = -Math.cos(time * speed) * 0.05;

            // Boat
            if (!boatState.isSinking) {
                boatState.x += boatState.speed;
                if (boatState.x > 150) { boatState.x = -150; boatState.health = maxHealth; }
                boatGroup.position.set(boatState.x, riverYBase + 1, boatState.z);
                boatGroup.position.y += Math.sin(time * 3 + boatState.x * 0.1) * 0.3;
                boatGroup.rotation.z = Math.sin(time * 2) * 0.05;
                boatGroup.rotation.x = Math.sin(time * 1.5) * 0.05;
                boatGroup.rotation.y = 0;
                if (boatState.health <= 0) { boatState.isSinking = true; boatState.sinkTimer = 0; }
            } else {
                boatState.sinkTimer += 0.02;
                boatGroup.position.y -= 0.1;
                boatGroup.rotation.z += 0.02;
                boatGroup.rotation.x += 0.01;
                if (boatState.sinkTimer > 3) {
                    boatState.isSinking = false; boatState.health = maxHealth; boatState.x = -150; boatGroup.rotation.set(0,0,0);
                }
            }

            // Targeting
            let targetPos: THREE.Vector3 | null = null;
            const boatWorldPos = new THREE.Vector3();
            boatGroup.getWorldPosition(boatWorldPos);
            const dist = podGroup.position.distanceTo(boatWorldPos);
            
            if (!boatState.isSinking && dist < 100) {
                targetPos = boatWorldPos.clone();
                targetPos.y += 2; 
            }

            if (targetPos) {
                const gunWorldPos = new THREE.Vector3();
                minigunGroup.getWorldPosition(gunWorldPos);
                const dx = targetPos.x - gunWorldPos.x;
                const dz = targetPos.z - gunWorldPos.z;
                const angleFromX = Math.atan2(-dz, dx);
                minigunGroup.rotation.y = angleFromX;
            } else {
                const travelDir = velocityX > 0 ? 0 : Math.PI;
                minigunGroup.rotation.y += (travelDir - minigunGroup.rotation.y) * 0.1;
            }

            if (targetPos && time - lastFireTime > 0.08) { 
                lastFireTime = time;
                const offset = new THREE.Vector3(2.5, -0.5, 0).applyEuler(minigunGroup.rotation).add(minigunGroup.position).applyMatrix4(podGroup.matrixWorld);
                const aimDir = new THREE.Vector3().subVectors(targetPos, offset).normalize();
                aimDir.x += (Math.random() - 0.5) * 0.1;
                aimDir.y += (Math.random() - 0.5) * 0.1;
                spawnBullet(offset, aimDir);
            }

            // Physics
            for (let i = bullets.length - 1; i >= 0; i--) {
                const b = bullets[i];
                b.mesh.position.add(b.velocity);
                b.life--;
                const bPos = b.mesh.position;

                if (!boatState.isSinking) {
                    const localPos = bPos.clone().sub(boatGroup.position);
                    if (Math.abs(localPos.x) < 5 && Math.abs(localPos.z) < 3 && localPos.y > 0 && localPos.y < 8) {
                        spawnParticle(bPos, 'debris');
                        boatState.health -= 5;
                        scene.remove(b.mesh);
                        bullets.splice(i, 1);
                        continue;
                    }
                }
                if (bPos.y < riverYBase) {
                    spawnParticle(bPos, 'splash');
                    scene.remove(b.mesh);
                    bullets.splice(i, 1);
                    continue;
                }
                if (b.life <= 0) { scene.remove(b.mesh); bullets.splice(i, 1); }
            }

            for (let i = particles.length - 1; i >= 0; i--) {
                const s = particles[i];
                s.life--;
                s.mesh.position.add(s.velocity);
                s.velocity.y -= 0.02;
                s.mesh.scale.multiplyScalar(0.9);
                if (s.life <= 0) { scene.remove(s.mesh); particles.splice(i, 1); }
            }

            const flowSpeed = 5;
            const riverOffset = (time * flowSpeed) % wavePeriod;
            riverMesh.position.x = -riverOffset;

            if (speedCtx) {
                const velocity = Math.abs(range * speed * Math.cos(time * speed));
                const kmh = Math.round((velocity / 50) * 60);
                speedCtx.clearRect(0, 0, 256, 128);
                speedCtx.fillStyle = '#00ffff';
                speedCtx.font = 'bold 90px "Courier New", monospace';
                speedCtx.textAlign = 'center';
                speedCtx.textBaseline = 'middle';
                speedCtx.shadowColor = 'rgba(0, 0, 0, 0.8)';
                speedCtx.shadowBlur = 6;
                speedCtx.fillText(`${kmh}`, 128, 64);
                speedCtx.font = 'bold 20px "Courier New", monospace';
                speedCtx.fillText('km/h', 128, 100);
                speedTexture.needsUpdate = true;
            }

            controls.update();
            renderer.render(scene, camera);
        };
        animate();

        const handleResize = () => {
            if (!mountRef.current) return;
            const newWidth = mountRef.current.clientWidth;
            const newHeight = mountRef.current.clientHeight;
            camera.aspect = newWidth / newHeight;
            camera.updateProjectionMatrix();
            renderer.setSize(newWidth, newHeight);
        };
        window.addEventListener('resize', handleResize);

        return () => {
            window.removeEventListener('resize', handleResize);
            if (requestRef.current) cancelAnimationFrame(requestRef.current);
            if (rendererRef.current) rendererRef.current.dispose();
            if (mountRef.current && rendererRef.current) mountRef.current.removeChild(rendererRef.current.domElement);
            bullets.forEach(b => scene.remove(b.mesh));
            particles.forEach(s => scene.remove(s.mesh));
        };
    }, []);

    // Effect to handle Night Vision Toggling
    useEffect(() => {
        if (!sceneRef.current) return;
        
        if (isNightVision) {
            // Night Mode Settings
            sceneRef.current.background = new THREE.Color(0x051a05); // Very dark green
            sceneRef.current.fog = new THREE.Fog(0x051a05, 10, 150);
            
            if (ambientLightRef.current) {
                ambientLightRef.current.intensity = 0.2;
                ambientLightRef.current.color.setHex(0xccffcc); // Pale green tint
            }
            if (dirLightRef.current) {
                dirLightRef.current.intensity = 0.4;
                dirLightRef.current.color.setHex(0x88ff88); // Strong green moonlight
                dirLightRef.current.position.set(-20, 40, -20); // Moon position
            }
        } else {
            // Day Mode Settings (Default)
            sceneRef.current.background = new THREE.Color(COLORS.sky);
            sceneRef.current.fog = new THREE.Fog(COLORS.sky, 60, 250);
            
            if (ambientLightRef.current) {
                ambientLightRef.current.intensity = 0.6;
                ambientLightRef.current.color.setHex(0xffffff);
            }
            if (dirLightRef.current) {
                dirLightRef.current.intensity = 1.2;
                dirLightRef.current.color.setHex(0xfffaed);
                dirLightRef.current.position.set(50, 80, 30); // Sun position
            }
        }
    }, [isNightVision]);

    return (
        <div 
            ref={mountRef} 
            className="absolute inset-0 z-0 bg-[#3b75ba] transition-all duration-700"
            style={{ 
                filter: isNightVision ? 'sepia(1) hue-rotate(60deg) saturate(2.5) contrast(1.2) brightness(0.9)' : 'none' 
            }}
        >
            {isNightVision && (
                <>
                    {/* Vignette */}
                    <div className="absolute inset-0 pointer-events-none z-10" style={{
                        background: 'radial-gradient(circle, transparent 40%, rgba(0, 20, 0, 0.8) 100%)'
                    }}></div>
                    
                    {/* Scanlines */}
                    <div className="absolute inset-0 pointer-events-none z-10 opacity-30" style={{
                        backgroundImage: 'repeating-linear-gradient(0deg, transparent, transparent 2px, #000 3px)',
                        backgroundSize: '100% 4px'
                    }}></div>
                </>
            )}
        </div>
    );
};

export default SkyPodScene;
