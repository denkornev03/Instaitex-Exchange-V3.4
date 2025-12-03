
import React, { useEffect, useRef } from 'react';
import * as THREE from 'three';
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls';

const CONFIG = {
    colors: {
        bg: 0x1a1a1a,    // Dark gray background
        teal: 0x00B2B2,  // Brand Teal
        white: 0xFFFFFF  // White
    },
    voxelSize: 0.55,
    gridGap: 0.05,
    ringRadius: 35,
    ringLayers: 8,
    extrusion: 1.0
};

const GafferScene = () => {
    const containerRef = useRef<HTMLDivElement>(null);
    const rendererRef = useRef<THREE.WebGLRenderer | null>(null);
    const requestRef = useRef<number | null>(null);

    useEffect(() => {
        if (!containerRef.current) return;
        const container = containerRef.current;
        const width = container.clientWidth;
        const height = container.clientHeight;

        const scene = new THREE.Scene();
        scene.background = new THREE.Color(CONFIG.colors.bg);
        scene.fog = new THREE.FogExp2(CONFIG.colors.bg, 0.002);

        const camera = new THREE.PerspectiveCamera(45, width / height, 0.1, 1000);
        camera.position.set(0, 30, 140);

        const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: false });
        renderer.setSize(width, height);
        renderer.shadowMap.enabled = true;
        renderer.shadowMap.type = THREE.PCFSoftShadowMap;
        renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
        container.appendChild(renderer.domElement);
        rendererRef.current = renderer;

        const controls = new OrbitControls(camera, renderer.domElement);
        controls.enableDamping = true;
        controls.dampingFactor = 0.05;
        controls.autoRotate = false; // Disabled for free control
        controls.enableZoom = true;
        controls.enablePan = true;
        controls.minDistance = 1;
        controls.maxDistance = 2000;
        controls.maxPolarAngle = Math.PI; // Full rotation allowed

        // Materials
        const matTeal = new THREE.MeshStandardMaterial({
            color: CONFIG.colors.teal,
            roughness: 0.2,
            metalness: 0.3,
            emissive: CONFIG.colors.teal,
            emissiveIntensity: 1.2
        });

        const matWhite = new THREE.MeshStandardMaterial({
            color: CONFIG.colors.white,
            roughness: 0.2,
            metalness: 0.3,
            emissive: 0xffffff,
            emissiveIntensity: 1.5
        });

        const boxGeo = new THREE.BoxGeometry(CONFIG.voxelSize, CONFIG.voxelSize, CONFIG.voxelSize);
        const voxels: THREE.Mesh[] = [];

        // --- GENERATORS ---
        const createTextVoxels = (text: string, yPos: number, material: THREE.Material, scaleX = 1, zOffset = 0) => {
            const canvas = document.createElement('canvas');
            const ctx = canvas.getContext('2d');
            if (!ctx) return;

            canvas.width = 200;
            canvas.height = 50;

            ctx.fillStyle = 'black';
            ctx.fillRect(0, 0, canvas.width, canvas.height);

            ctx.textAlign = 'center';
            ctx.textBaseline = 'middle';
            ctx.font = 'bold 36px Arial, sans-serif';
            ctx.fillStyle = 'white';
            ctx.fillText(text, canvas.width / 2, canvas.height / 2);

            const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
            const data = imageData.data;

            const group = new THREE.Group();

            for (let y = 0; y < canvas.height; y += 1) {
                for (let x = 0; x < canvas.width; x += 1) {
                    const alpha = data[(y * canvas.width + x) * 4];

                    if (alpha > 128) {
                        const mesh = new THREE.Mesh(boxGeo, material);

                        const posX = (x - canvas.width / 2) * (CONFIG.voxelSize + CONFIG.gridGap) * scaleX;
                        const posY = (canvas.height - y) * (CONFIG.voxelSize + CONFIG.gridGap) + yPos;
                        const posZ = zOffset;

                        mesh.position.set(posX, posY, posZ);
                        mesh.castShadow = true;
                        mesh.receiveShadow = true;

                        mesh.userData = {
                            orgX: posX,
                            orgY: posY,
                            orgZ: posZ,
                            phase: Math.random() * Math.PI * 2
                        };

                        group.add(mesh);
                        voxels.push(mesh);
                    }
                }
            }
            scene.add(group);
        };

        const createRingVoxels = () => {
            const group = new THREE.Group();
            const layers = CONFIG.ringLayers;
            const thicknessStep = CONFIG.voxelSize + CONFIG.gridGap;
            const startRadius = CONFIG.ringRadius - (layers - 1) * thicknessStep * 0.5;

            for (let l = 0; l < layers; l++) {
                const r = startRadius + l * thicknessStep;
                const circumference = 2 * Math.PI * r;
                const count = Math.floor(circumference / (CONFIG.voxelSize + CONFIG.gridGap));

                for (let i = 0; i < count; i++) {
                    const angle = (i / count) * Math.PI * 2;
                    const mesh = new THREE.Mesh(boxGeo, matTeal);

                    const x = Math.cos(angle) * r;
                    const y = Math.sin(angle) * r;

                    mesh.position.set(x, y, 0);
                    mesh.castShadow = true;
                    mesh.receiveShadow = true;

                    mesh.userData = {
                        orgX: x,
                        orgY: y,
                        orgZ: 0,
                        phase: angle * 6
                    };

                    group.add(mesh);
                    voxels.push(mesh);
                }
            }
            scene.add(group);
        };

        // --- BUILD SCENE ---
        createTextVoxels("GAFFER", -6, matTeal, 0.9, 0);
        createTextVoxels("STUDIO", -24, matWhite, 0.9, 0);
        createRingVoxels();

        const circleGeo = new THREE.CircleGeometry(33, 64);
        const circleMat = new THREE.MeshBasicMaterial({ color: 0x000000 });
        const blackCircle = new THREE.Mesh(circleGeo, circleMat);
        blackCircle.position.set(0, 0, -2);
        scene.add(blackCircle);

        // --- LIGHTING ---
        const ambientLight = new THREE.AmbientLight(0xffffff, 0.4);
        scene.add(ambientLight);

        const spotLight = new THREE.SpotLight(0xffffff, 2500);
        spotLight.position.set(50, 100, 50);
        spotLight.angle = Math.PI / 5;
        spotLight.penumbra = 0.5;
        spotLight.castShadow = true;
        spotLight.shadow.mapSize.width = 2048;
        spotLight.shadow.mapSize.height = 2048;
        scene.add(spotLight);

        const rimLight = new THREE.PointLight(CONFIG.colors.teal, 1000, 100);
        rimLight.position.set(-40, 40, -40);
        scene.add(rimLight);

        const fillLight = new THREE.PointLight(0xffaa00, 400, 100);
        fillLight.position.set(40, -20, 40);
        scene.add(fillLight);

        // --- INTERACTION ---
        const raycaster = new THREE.Raycaster();
        const mouse = new THREE.Vector2();
        let startPos = { x: 0, y: 0 };

        const onPointerDown = (e: PointerEvent) => {
            startPos = { x: e.clientX, y: e.clientY };
        };

        const onPointerUp = (e: PointerEvent) => {
            // Check if it was a drag or a click
            const diffX = Math.abs(e.clientX - startPos.x);
            const diffY = Math.abs(e.clientY - startPos.y);
            const distance = Math.sqrt(diffX * diffX + diffY * diffY);

            if (distance < 5) { // Threshold for click
                const rect = renderer.domElement.getBoundingClientRect();
                mouse.x = ((e.clientX - rect.left) / rect.width) * 2 - 1;
                mouse.y = -((e.clientY - rect.top) / rect.height) * 2 + 1;

                raycaster.setFromCamera(mouse, camera);
                // Check intersection with all voxels and the background circle
                const intersects = raycaster.intersectObjects([...voxels, blackCircle]);

                if (intersects.length > 0) {
                    window.open('https://gaffer-studio.ru', '_blank');
                }
            }
        };

        const onPointerMove = (e: PointerEvent) => {
             const rect = renderer.domElement.getBoundingClientRect();
             mouse.x = ((e.clientX - rect.left) / rect.width) * 2 - 1;
             mouse.y = -((e.clientY - rect.top) / rect.height) * 2 + 1;
             
             raycaster.setFromCamera(mouse, camera);
             const intersects = raycaster.intersectObjects([...voxels, blackCircle]);
             
             if (intersects.length > 0) {
                 container.style.cursor = 'pointer';
             } else {
                 container.style.cursor = 'default';
             }
        };

        renderer.domElement.addEventListener('pointerdown', onPointerDown);
        renderer.domElement.addEventListener('pointerup', onPointerUp);
        renderer.domElement.addEventListener('pointermove', onPointerMove);

        // --- ANIMATION ---
        const clock = new THREE.Clock();

        const animate = () => {
            requestRef.current = requestAnimationFrame(animate);
            const time = clock.getElapsedTime();

            voxels.forEach(mesh => {
                const offset = Math.sin(time * 2 + mesh.userData.phase) * 0.5;
                mesh.position.z = mesh.userData.orgZ + offset;
                const scale = 1 + Math.sin(time * 3 + mesh.userData.phase) * 0.15;
                mesh.scale.setScalar(scale);
            });

            controls.update();
            renderer.render(scene, camera);
        };

        animate();

        const handleResize = () => {
            if (!containerRef.current) return;
            const newWidth = containerRef.current.clientWidth;
            const newHeight = containerRef.current.clientHeight;
            camera.aspect = newWidth / newHeight;
            camera.updateProjectionMatrix();
            renderer.setSize(newWidth, newHeight);
        };
        window.addEventListener('resize', handleResize);

        return () => {
            window.removeEventListener('resize', handleResize);
            if (renderer.domElement) {
                renderer.domElement.removeEventListener('pointerdown', onPointerDown);
                renderer.domElement.removeEventListener('pointerup', onPointerUp);
                renderer.domElement.removeEventListener('pointermove', onPointerMove);
            }
            if (requestRef.current) cancelAnimationFrame(requestRef.current);
            if (rendererRef.current) rendererRef.current.dispose();
            if (containerRef.current && rendererRef.current) containerRef.current.removeChild(rendererRef.current.domElement);
        };
    }, []);

    return <div ref={containerRef} className="absolute inset-0 z-0 bg-[#1a1a1a]" />;
};

export default GafferScene;
