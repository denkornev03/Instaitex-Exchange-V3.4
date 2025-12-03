
import React, { useEffect, useRef } from 'react';
import * as THREE from 'three';
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls';
import { mergeGeometries } from 'three/examples/jsm/utils/BufferGeometryUtils';

const NeoCityScene = () => {
  const mountRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!mountRef.current) return;

    // --- SETUP VARIABLES ---
    let animationId: number;
    let renderer: THREE.WebGLRenderer;
    let scene: THREE.Scene;
    let camera: THREE.PerspectiveCamera;
    let controls: OrbitControls;
    
    // Store animated objects
    const cars: { mesh: THREE.Group, speed: number }[] = [];
    let heroCar: THREE.Group;
    let cargoPod: THREE.Group;
    let pod1: THREE.Group;
    let pod2: THREE.Group;
    
    // --- SCENE INITIALIZATION ---
    const init = () => {
      scene = new THREE.Scene();
      
      // Cinematic Atmosphere: Darker, moodier sky
      const skyColor = 0x050714; 
      scene.background = new THREE.Color(skyColor);
      
      // Weak, deep fog for depth without obscuring everything
      scene.fog = new THREE.Fog(skyColor, 80, 400);

      // Initial size
      const width = mountRef.current?.clientWidth || window.innerWidth;
      const height = mountRef.current?.clientHeight || window.innerHeight;

      camera = new THREE.PerspectiveCamera(60, width / height, 0.1, 1000);
      camera.position.set(20, 25, 65); 
      camera.lookAt(0, 5, 0);

      renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
      renderer.setSize(width, height);
      renderer.shadowMap.enabled = true;
      renderer.shadowMap.type = THREE.PCFSoftShadowMap;
      
      mountRef.current?.appendChild(renderer.domElement);

      controls = new OrbitControls(camera, renderer.domElement);
      controls.enableDamping = true;
      controls.dampingFactor = 0.05;
      controls.maxPolarAngle = Math.PI; // Free rotation
      controls.minDistance = 1;
      controls.maxDistance = 500;
      controls.enablePan = true;

      // --- LIGHTING ---
      const ambientLight = new THREE.AmbientLight(0xaaccff, 0.3);
      scene.add(ambientLight);

      const sunLight = new THREE.DirectionalLight(0xaaddff, 1.2); 
      sunLight.position.set(-50, 60, 40);
      sunLight.castShadow = true;
      sunLight.shadow.mapSize.width = 2048;
      sunLight.shadow.mapSize.height = 2048;
      sunLight.shadow.bias = -0.0005;
      scene.add(sunLight);

      const rimLight = new THREE.DirectionalLight(0xff0055, 0.8);
      rimLight.position.set(50, 10, -50);
      scene.add(rimLight);
      
      const cityGlow = new THREE.DirectionalLight(0x00ffff, 0.5);
      cityGlow.position.set(0, -10, 20);
      scene.add(cityGlow);
    };

    // --- VOXEL HELPER ---
    class VoxelBuilder {
      geometries: THREE.BufferGeometry[] = [];
      boxGeo = new THREE.BoxGeometry(1, 1, 1);

      add(x: number, y: number, z: number, scaleX = 1, scaleY = 1, scaleZ = 1) {
        const geometry = this.boxGeo.clone();
        geometry.scale(scaleX, scaleY, scaleZ);
        geometry.translate(x, y, z);
        this.geometries.push(geometry);
      }

      getMesh(material: THREE.Material) {
        if (this.geometries.length === 0) return null;
        const merged = mergeGeometries(this.geometries);
        const mesh = new THREE.Mesh(merged, material);
        mesh.castShadow = true;
        mesh.receiveShadow = true;
        return mesh;
      }
    }

    // --- GENERATORS ---
    const createCity = () => {
      const matBuilding = new THREE.MeshStandardMaterial({ color: 0x1e2a38, roughness: 0.4 });
      const matWindow = new THREE.MeshStandardMaterial({ color: 0xffcc44, emissive: 0xffaa00, emissiveIntensity: 3 });

      const builderWalls = new VoxelBuilder();
      const builderWindows = new VoxelBuilder();

      for (let x = -80; x <= 80; x += 6) {
        for (let z = -60; z <= -15; z += 6) {
          if (Math.random() > 0.7) continue; 

          const height = Math.floor(Math.random() * 30) + 10;
          const width = Math.random() > 0.5 ? 3 : 4;
          
          for (let y = 0; y < height; y++) {
            builderWalls.add(x, y, z, width, 1, width);
            if (Math.random() > 0.6) {
              const side = Math.floor(Math.random() * 4);
              let wx = x, wz = z;
              if(side === 0) wz += width/2 + 0.1;
              if(side === 1) wz -= width/2 + 0.1;
              if(side === 2) wx += width/2 + 0.1;
              if(side === 3) wx -= width/2 + 0.1;
              builderWindows.add(wx, y, wz, 0.2, 0.6, 0.2);
            }
          }
          
          if (Math.random() > 0.5) {
            builderWalls.add(x, height + 1, z, 1, 4, 1);
          }
        }
      }
      
      const wallsMesh = builderWalls.getMesh(matBuilding);
      const windowsMesh = builderWindows.getMesh(matWindow);
      
      if(wallsMesh) scene.add(wallsMesh);
      if(windowsMesh) scene.add(windowsMesh);
    };

    const createRoad = () => {
      const matRoad = new THREE.MeshStandardMaterial({ color: 0x111111, roughness: 0.5 });
      const matGrass = new THREE.MeshStandardMaterial({ color: 0x0a1010, roughness: 1.0 });
      const matPod = new THREE.MeshStandardMaterial({ color: 0x888888, roughness: 0.3 }); 
      const matBarrier = new THREE.MeshStandardMaterial({ color: 0x222222, roughness: 0.4 });
      const matBarrierGlow = new THREE.MeshStandardMaterial({ color: 0xff0055, emissive: 0xff0055, emissiveIntensity: 4 });

      const road = new THREE.Mesh(new THREE.BoxGeometry(200, 1, 40), matRoad);
      road.position.set(0, -0.5, 10);
      road.receiveShadow = true;
      scene.add(road);

      const barrierLeft = new THREE.Mesh(new THREE.BoxGeometry(200, 2, 2), matBarrier);
      barrierLeft.position.set(0, 0.5, -9);
      scene.add(barrierLeft);

      const barrierLeftGlow = new THREE.Mesh(new THREE.BoxGeometry(200, 0.2, 0.5), matBarrierGlow);
      barrierLeftGlow.position.set(0, 1.5, -9);
      scene.add(barrierLeftGlow);

      const barrierRight1 = new THREE.Mesh(new THREE.BoxGeometry(90, 2, 2), matBarrier);
      barrierRight1.position.set(-55, 0.5, 29);
      scene.add(barrierRight1);

      const barrierRight2 = new THREE.Mesh(new THREE.BoxGeometry(90, 2, 2), matBarrier);
      barrierRight2.position.set(55, 0.5, 29);
      scene.add(barrierRight2);
      
      const barrierRightGlow1 = new THREE.Mesh(new THREE.BoxGeometry(90, 0.2, 0.5), matBarrierGlow);
      barrierRightGlow1.position.set(-55, 1.5, 29);
      scene.add(barrierRightGlow1);

      const barrierRightGlow2 = new THREE.Mesh(new THREE.BoxGeometry(90, 0.2, 0.5), matBarrierGlow);
      barrierRightGlow2.position.set(55, 1.5, 29);
      scene.add(barrierRightGlow2);

      const ground = new THREE.Mesh(new THREE.BoxGeometry(200, 1, 200), matGrass);
      ground.position.set(0, -1.0, -50);
      scene.add(ground);
      
      const lines = new VoxelBuilder();
      for(let x=-80; x<80; x+=6) {
           lines.add(x, 0.05, 10, 3, 0.1, 0.5);
      }
      const lineMesh = lines.getMesh(matPod);
      if(lineMesh) scene.add(lineMesh);
    };

    const createSkyway = () => {
      const matConcrete = new THREE.MeshStandardMaterial({ color: 0x333333, roughness: 0.7 });
      const matSupport = new THREE.MeshStandardMaterial({ 
          color: 0x888888, 
          roughness: 0.2,
          metalness: 0.5
      });
      const matBlueGlow = new THREE.MeshStandardMaterial({ color: 0x00ffff, emissive: 0x00ffff, emissiveIntensity: 3 });
      const matLight = new THREE.MeshStandardMaterial({ color: 0xff3333, emissive: 0xff0000, emissiveIntensity: 3 });

      const supportBuilder = new VoxelBuilder();
      const supportLocations = [-30, 20]; 

      supportLocations.forEach(xPos => {
        const height = 18;
        for(let y=0; y<height; y+=1) {
          supportBuilder.add(xPos - 1.5, y, 10 - 1.5, 0.5, 1, 0.5);
          supportBuilder.add(xPos + 1.5, y, 10 - 1.5, 0.5, 1, 0.5);
          supportBuilder.add(xPos - 1.5, y, 10 + 1.5, 0.5, 1, 0.5);
          supportBuilder.add(xPos + 1.5, y, 10 + 1.5, 0.5, 1, 0.5);
          
          if(y % 3 === 0) {
               supportBuilder.add(xPos, y, 10, 3.5, 0.2, 3.5);
          }
        }

        for(let i=0; i<8; i++) {
          const y = height + i;
          const offset = i * 1.5;
          supportBuilder.add(xPos, y, 10 - offset, 2, 1, 1);
          supportBuilder.add(xPos, y, 10 + offset, 2, 1, 1);
        }

        supportBuilder.add(xPos, height + 8, 10, 4, 1, 26);
        supportBuilder.add(xPos, height + 8, 29, 4, 1, 14); 
        
        const logo = new THREE.Mesh(new THREE.BoxGeometry(0.5, 1.5, 4), matBlueGlow);
        logo.position.set(xPos + 2.1, height + 8, 10);
        scene.add(logo);
      });
      
      supportBuilder.add(20, 0, 42, 3, 26, 3);
      supportBuilder.add(20, 26, 39, 3, 2, 6); 

      const supportMesh = supportBuilder.getMesh(matSupport);
      if(supportMesh) scene.add(supportMesh);

      const trackBuilder = new VoxelBuilder();
      const trackHeight = 24;
      
      trackBuilder.add(0, trackHeight, 2, 200, 0.2, 0.5); 
      trackBuilder.add(0, trackHeight, 18, 200, 0.2, 0.5);
      trackBuilder.add(0, trackHeight, 36, 200, 0.2, 0.5);

      const trackMesh = trackBuilder.getMesh(matConcrete);
      if(trackMesh) scene.add(trackMesh);
      
      for(let x = -40; x < 120; x+=20) {
           const light = new THREE.Mesh(new THREE.BoxGeometry(0.5, 0.5, 0.2), matLight);
           light.position.set(x, trackHeight, 36 + 2.1);
           scene.add(light);
      }
    };

    const createStation = () => {
        const matConcrete = new THREE.MeshStandardMaterial({ color: 0x222233, roughness: 0.6 });
        const matHazard = new THREE.MeshStandardMaterial({ color: 0xffcc00, emissive: 0xffaa00, emissiveIntensity: 0.2 });
        const matGlow = new THREE.MeshStandardMaterial({ color: 0x00ffaa, emissive: 0x00ffaa, emissiveIntensity: 3 });

        const stationX = 20;
        const stationZ = 36;
        
        const builder = new VoxelBuilder();
        builder.add(stationX, -0.5, stationZ, 16, 1, 12);
        for(let z=29; z<=32; z++) {
             builder.add(stationX, -0.5, z, 6, 1, 1.1);
        }
        builder.add(stationX - 7, 3, stationZ, 2, 8, 10);
        builder.add(stationX + 7, 3, stationZ, 2, 8, 10);
        builder.add(stationX, 8, stationZ, 16, 2, 2);

        const stripeBuilder = new VoxelBuilder();
        stripeBuilder.add(stationX - 5, 0.05, stationZ - 4, 1, 0.1, 8);
        stripeBuilder.add(stationX + 5, 0.05, stationZ - 4, 1, 0.1, 8);
        
        const lightGeo = new THREE.BoxGeometry(0.5, 4, 0.5);
        const light1 = new THREE.Mesh(lightGeo, matGlow);
        light1.position.set(stationX - 4, 2, 30);
        scene.add(light1);
        
        const light2 = new THREE.Mesh(lightGeo, matGlow);
        light2.position.set(stationX + 4, 2, 30);
        scene.add(light2);

        const mesh = builder.getMesh(matConcrete);
        const stripeMesh = stripeBuilder.getMesh(matHazard);
        if(mesh) scene.add(mesh);
        if(stripeMesh) scene.add(stripeMesh);
    };

    const createCargoPod = () => {
        const group = new THREE.Group();
        const matMetal = new THREE.MeshStandardMaterial({ color: 0x555566, roughness: 0.3 });
        const matDark = new THREE.MeshStandardMaterial({ color: 0x111111, roughness: 0.7 });
        const matConnector = new THREE.MeshStandardMaterial({ color: 0x888899, roughness: 0.4 });
        const matGlow = new THREE.MeshStandardMaterial({ color: 0xffaa00, emissive: 0xffaa00, emissiveIntensity: 2 });

        const roof = new THREE.Mesh(new THREE.BoxGeometry(6.5, 0.5, 4.5), matMetal);
        roof.position.y = 3.8;
        group.add(roof);

        const frameGeo = new THREE.BoxGeometry(0.5, 4, 0.5);
        const positions = [[-2.8, 1.8], [-2.8, -1.8], [2.8, 1.8], [2.8, -1.8]];
        positions.forEach(([x, z]) => {
             const f = new THREE.Mesh(frameGeo, matMetal);
             f.position.set(x, 1.8, z);
             group.add(f);
        });

        const base = new THREE.Mesh(new THREE.BoxGeometry(6, 0.2, 4), matDark);
        base.position.y = 0;
        group.add(base);

        const shoe = new THREE.Mesh(new THREE.BoxGeometry(2, 0.8, 1.5), matConnector);
        shoe.position.y = 4.4;
        group.add(shoe);
        
        const light = new THREE.Mesh(new THREE.BoxGeometry(0.2, 0.2, 0.2), matGlow);
        light.position.set(3, 3.8, 2);
        group.add(light);
        const light2 = new THREE.Mesh(new THREE.BoxGeometry(0.2, 0.2, 0.2), matGlow);
        light2.position.set(3, 3.8, -2);
        group.add(light2);

        group.position.set(20, 0.5, 36); 
        scene.add(group);
        return group;
    };

    const createHeroCar = () => {
        const group = new THREE.Group();
        const matBody = new THREE.MeshStandardMaterial({ color: 0xf2ff00, roughness: 0.2 }); 
        const matGlass = new THREE.MeshStandardMaterial({ color: 0x000000, roughness: 0.1 });
        const matLight = new THREE.MeshStandardMaterial({ color: 0x00ffff, emissive: 0x00ffff, emissiveIntensity: 5 });

        const body = new THREE.Mesh(new THREE.BoxGeometry(3, 1, 1.6), matBody);
        body.position.y = 0.5;
        group.add(body);

        const cabin = new THREE.Mesh(new THREE.BoxGeometry(1.5, 0.6, 1.4), matGlass);
        cabin.position.y = 1.3;
        group.add(cabin);
        
        const glow = new THREE.Mesh(new THREE.BoxGeometry(2.5, 0.1, 1.2), matLight);
        glow.position.y = 0.1;
        group.add(glow);

        scene.add(group);
        return group;
    };

    const createPod = (x: number, z: number, direction: number) => {
        const matConcrete = new THREE.MeshStandardMaterial({ color: 0x555555, roughness: 0.8 });
        const matPod = new THREE.MeshStandardMaterial({ color: 0xeeeeee, roughness: 0.3 });
        const matGlass = new THREE.MeshStandardMaterial({ 
            color: 0x88ccff, 
            transparent: true, 
            opacity: 0.6,
            roughness: 0.1 
        });
        const matBlueGlow = new THREE.MeshStandardMaterial({ color: 0x00ffff, emissive: 0x00ffff, emissiveIntensity: 2 });

        const group = new THREE.Group();
        const body = new THREE.Mesh(new THREE.BoxGeometry(4, 2.5, 2), matPod);
        group.add(body);
        const hull = new THREE.Mesh(new THREE.BoxGeometry(3, 0.5, 1.8), matConcrete);
        hull.position.y = -1.5;
        group.add(hull);
        const glass = new THREE.Mesh(new THREE.BoxGeometry(4.1, 1.5, 2.1), matGlass);
        glass.position.y = 0.2;
        group.add(glass);
        const arm = new THREE.Mesh(new THREE.BoxGeometry(0.5, 2, 0.5), matConcrete);
        arm.position.y = 2;
        group.add(arm);
        const light = new THREE.Mesh(new THREE.BoxGeometry(0.2, 0.2, 2.2), matBlueGlow);
        light.position.set(1.5 * direction, 1, 0);
        group.add(light);
        group.position.set(x, 22, z); 
        scene.add(group);
        return group;
    };

    const createCars = () => {
        const matCarBody = new THREE.MeshStandardMaterial({ color: 0xffffff, roughness: 0.2 });
        const matTailLight = new THREE.MeshStandardMaterial({ color: 0xff0000, emissive: 0xff0000, emissiveIntensity: 3 });
        const matCarTop = new THREE.MeshStandardMaterial({color: 0x111111});
        const matHeadLight = new THREE.MeshStandardMaterial({ color: 0xffffee, emissive: 0xffffee, emissiveIntensity: 2 });

        const createSingleCar = () => {
            const group = new THREE.Group();
            const body = new THREE.Mesh(new THREE.BoxGeometry(3, 1.2, 1.6), matCarBody);
            body.position.y = 0.6;
            group.add(body);
            const top = new THREE.Mesh(new THREE.BoxGeometry(1.5, 0.8, 1.4), matCarTop);
            top.position.y = 1.6;
            group.add(top);
            const tailLights = new THREE.Mesh(new THREE.BoxGeometry(0.1, 0.4, 1.2), matTailLight);
            tailLights.position.set(1.5, 0.8, 0);
            group.add(tailLights);
            const headLights = new THREE.Mesh(new THREE.BoxGeometry(0.1, 0.4, 1.2), matHeadLight);
            headLights.position.set(-1.5, 0.8, 0);
            group.add(headLights);
            return group;
        };

        for(let i=0; i<3; i++) {
            const car = createSingleCar();
            const x = (Math.random() * 160) - 80;
            car.position.set(x, 0, 2);
            car.rotation.y = Math.PI;
            scene.add(car);
            cars.push({ mesh: car, speed: -(20 + Math.random() * 15) });
        }
        for(let i=0; i<3; i++) {
            const car = createSingleCar();
            const x = (Math.random() * 160) - 80;
            car.position.set(x, 0, 18);
            car.rotation.y = 0;
            scene.add(car);
            cars.push({ mesh: car, speed: (20 + Math.random() * 15) });
        }
    };

    // --- EXECUTION ---
    init();
    createCity();
    createRoad();
    createSkyway();
    createCars();
    createStation();
    cargoPod = createCargoPod();
    heroCar = createHeroCar();

    pod1 = createPod(-10, 2, 1);
    pod2 = createPod(30, 18, -1);
    pod2.rotation.y = Math.PI;

    // --- ANIMATION LOOP ---
    const clock = new THREE.Clock();
    
    const animate = () => {
        animationId = requestAnimationFrame(animate);
        
        const delta = clock.getDelta();
        const elapsedTime = clock.getElapsedTime();

        // Animate Pods
        const podSpeed = 45; 
        pod1.position.x += delta * podSpeed;
        if(pod1.position.x > 100) pod1.position.x = -100;
        pod2.position.x -= delta * podSpeed;
        if(pod2.position.x < -100) pod2.position.x = 100;

        // Animate Traffic Cars
        cars.forEach(car => {
            car.mesh.position.x += car.speed * delta;
            if (car.speed > 0 && car.mesh.position.x > 100) car.mesh.position.x = -100;
            else if (car.speed < 0 && car.mesh.position.x < -100) car.mesh.position.x = 100;
        });
        
        // --- HERO CAR & CARGO LOOP LOGIC ---
        const cycleDuration = 14; 
        const t = elapsedTime % cycleDuration;
        const stationX = 20;
        const stationZ = 36;
        const roadZ = 18;
        const cargoTargetY = 19.6; 

        if (t < 4) {
            const progress = t / 4;
            const startX = -80;
            heroCar.position.set(startX + (stationX - startX) * progress, 0, roadZ);
            heroCar.rotation.y = 0;
            cargoPod.position.set(stationX, 0.5, stationZ);
        } else if (t < 5.5) {
            const p = (t - 4) / 1.5;
            const easeP = 1 - Math.pow(1 - p, 3);
            heroCar.position.x = stationX; 
            heroCar.position.z = roadZ + (stationZ - roadZ) * easeP;
            heroCar.rotation.y = -Math.PI / 2; 
        } else if (t < 7.0) {
            heroCar.position.set(stationX, 0.5, stationZ); 
            heroCar.rotation.y = -Math.PI / 2;
            cargoPod.position.set(stationX, 0.5, stationZ);
        } else if (t < 10.0) {
            const p = (t - 7.0) / 3;
            const easeP = p < 0.5 ? 2 * p * p : 1 - Math.pow(-2 * p + 2, 2) / 2; 
            const currentY = 0.5 + (cargoTargetY - 0.5) * easeP;
            cargoPod.position.y = currentY;
            heroCar.position.y = currentY; 
            heroCar.position.x = stationX;
            heroCar.position.z = stationZ;
        } else if (t < 14.0) {
            const p = (t - 10.0) / 4;
            const startX = stationX;
            const endX = 140; 
            const currentX = startX + (endX - startX) * p;
            cargoPod.position.set(currentX, cargoTargetY, stationZ);
            heroCar.position.set(currentX, cargoTargetY, stationZ);
        } else {
             heroCar.position.set(-100, 0, roadZ);
             cargoPod.position.set(stationX, 0.5, stationZ);
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
      cancelAnimationFrame(animationId);
      
      if (mountRef.current && renderer) {
        mountRef.current.removeChild(renderer.domElement);
      }
      
      // Cleanup THREE
      if (scene) {
          scene.traverse((object) => {
            if (object instanceof THREE.Mesh) {
              object.geometry.dispose();
              if (Array.isArray(object.material)) {
                object.material.forEach((m: THREE.Material) => m.dispose());
              } else {
                object.material.dispose();
              }
            }
          });
      }
      if (renderer) renderer.dispose();
      if (controls) controls.dispose();
    };
  }, []);

  return <div ref={mountRef} className="w-full h-full bg-[#050714]" />;
};

export default NeoCityScene;
