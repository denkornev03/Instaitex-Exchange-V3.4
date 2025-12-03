
import React, { useEffect, useRef, useState } from 'react';
import * as THREE from 'three';
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls';

// --------------------------------------------------------
// TYPES
// --------------------------------------------------------
interface Drone {
    mesh: THREE.Object3D;
    velocity: THREE.Vector3;
    isActive: boolean;
    respawnTimer: number;
}

interface Particle {
    mesh: THREE.Mesh;
    velocity: THREE.Vector3;
    life: number;
}

interface Bullet {
    mesh: THREE.Mesh;
    velocity: THREE.Vector3;
    life: number;
}

// --------------------------------------------------------
// AUDIO ENGINE
// --------------------------------------------------------
class CyberAudioEngine {
    ctx: AudioContext | null = null;
    masterGain: GainNode | null = null;
    reverbNode: ConvolverNode | null = null;
    trainGain: GainNode | null = null;
    isPlaying: boolean = false;
    nextNoteTime: number = 0;
    schedulerTimer: number | null = null;
    tempo: number = 100;
    lookahead: number = 25.0;
    scheduleAheadTime: number = 0.1;
    currentNote: number = 0;
    scale: number[] = [
        65.41, 77.78, 87.31, 98.00, 116.54,
        130.81, 155.56, 174.61, 196.00, 233.08,
        261.63, 311.13, 349.23, 392.00, 466.16
    ];

    async init() {
        if (this.ctx) return;
        const AudioContext = window.AudioContext || (window as any).webkitAudioContext;
        this.ctx = new AudioContext();
        this.masterGain = this.ctx.createGain();
        this.masterGain.gain.value = 0.4;
        this.masterGain.connect(this.ctx.destination);

        this.reverbNode = this.ctx.createConvolver();
        const impulse = this.impulseResponse(4, 2, false);
        if (impulse) this.reverbNode.buffer = impulse;
        this.reverbNode.connect(this.masterGain);
    }

    impulseResponse(duration: number, decay: number, reverse: boolean) {
        if (!this.ctx) return null;
        const sampleRate = this.ctx.sampleRate;
        const length = sampleRate * duration;
        const impulse = this.ctx.createBuffer(2, length, sampleRate);
        const left = impulse.getChannelData(0);
        const right = impulse.getChannelData(1);

        for (let i = 0; i < length; i++) {
            const n = reverse ? length - i : i;
            left[i] = (Math.random() * 2 - 1) * Math.pow(1 - n / length, decay);
            right[i] = (Math.random() * 2 - 1) * Math.pow(1 - n / length, decay);
        }
        return impulse;
    }

    start() {
        if (!this.ctx) this.init();
        if (this.ctx?.state === 'suspended') this.ctx.resume();
        if (this.isPlaying) return;
        this.isPlaying = true;
        this.startDrone();
        this.startRainNoise();
        this.startTrainRumble();
        if (this.ctx) this.nextNoteTime = this.ctx.currentTime;
        this.scheduler();
    }

    stop() {
        this.isPlaying = false;
        if (this.ctx) this.ctx.suspend();
        if (this.schedulerTimer) window.clearTimeout(this.schedulerTimer);
    }

    setTrainVolume(volume: number) {
        if (this.trainGain && this.ctx) {
            this.trainGain.gain.setTargetAtTime(volume * 3.0, this.ctx.currentTime, 0.1);
        }
    }

    triggerExplosion() {
        if (!this.ctx || !this.masterGain) return;
        const t = this.ctx.currentTime;
        
        // Noise
        const bufferSize = this.ctx.sampleRate * 0.5;
        const buffer = this.ctx.createBuffer(1, bufferSize, this.ctx.sampleRate);
        const data = buffer.getChannelData(0);
        for (let i = 0; i < bufferSize; i++) {
            data[i] = (Math.random() * 2 - 1) * Math.pow(1 - i / bufferSize, 4);
        }
        const noise = this.ctx.createBufferSource();
        noise.buffer = buffer;
        const noiseFilter = this.ctx.createBiquadFilter();
        noiseFilter.type = 'lowpass';
        noiseFilter.frequency.setValueAtTime(1000, t);
        noiseFilter.frequency.exponentialRampToValueAtTime(100, t + 0.3);
        const noiseGain = this.ctx.createGain();
        noiseGain.gain.setValueAtTime(0.02, t);
        noiseGain.gain.exponentialRampToValueAtTime(0.001, t + 0.3);
        noise.connect(noiseFilter);
        noiseFilter.connect(noiseGain);
        noiseGain.connect(this.masterGain);
        noise.start(t);

        // Sub
        const osc = this.ctx.createOscillator();
        osc.type = 'sawtooth';
        osc.frequency.setValueAtTime(120, t);
        osc.frequency.exponentialRampToValueAtTime(0.01, t + 0.4);
        const subGain = this.ctx.createGain();
        subGain.gain.setValueAtTime(0.05, t);
        subGain.gain.exponentialRampToValueAtTime(0.001, t + 0.4);
        const dist = this.ctx.createWaveShaper();
        dist.curve = this.makeDistortionCurve(400);
        osc.connect(subGain);
        subGain.connect(dist);
        dist.connect(this.masterGain);
        osc.start(t);
        osc.stop(t + 0.5);
    }

    makeDistortionCurve(amount: number) {
        const k = typeof amount === 'number' ? amount : 50;
        const n_samples = 44100;
        const curve = new Float32Array(n_samples);
        const deg = Math.PI / 180;
        for (let i = 0; i < n_samples; ++i) {
            const x = (i * 2) / n_samples - 1;
            curve[i] = (3 + k) * x * 20 * deg / (Math.PI + k * Math.abs(x));
        }
        return curve;
    }

    startTrainRumble() {
        if (!this.ctx || !this.masterGain) return;
        const bufferSize = this.ctx.sampleRate * 2;
        const buffer = this.ctx.createBuffer(1, bufferSize, this.ctx.sampleRate);
        const data = buffer.getChannelData(0);
        let lastOut = 0;
        for (let i = 0; i < bufferSize; i++) {
            const white = Math.random() * 2 - 1;
            data[i] = (lastOut + (0.02 * white)) / 1.02;
            lastOut = data[i];
            data[i] *= 3.5; 
        }
        const noise = this.ctx.createBufferSource();
        noise.buffer = buffer;
        noise.loop = true;
        const filter = this.ctx.createBiquadFilter();
        filter.type = 'lowpass';
        filter.frequency.value = 120;
        this.trainGain = this.ctx.createGain();
        this.trainGain.gain.value = 0;
        noise.connect(filter);
        filter.connect(this.trainGain);
        this.trainGain.connect(this.masterGain);
        noise.start();
    }

    startDrone() {
        if (!this.ctx || !this.masterGain || !this.reverbNode) return;
        const osc1 = this.ctx.createOscillator();
        const osc2 = this.ctx.createOscillator();
        const filter = this.ctx.createBiquadFilter();
        const gain = this.ctx.createGain();
        osc1.type = 'sawtooth';
        osc1.frequency.value = 65.41;
        osc2.type = 'triangle';
        osc2.frequency.value = 65.41 + 1;
        filter.type = 'lowpass';
        filter.frequency.value = 150;
        filter.Q.value = 1;
        const lfo = this.ctx.createOscillator();
        lfo.type = 'sine';
        lfo.frequency.value = 0.1;
        const lfoGain = this.ctx.createGain();
        lfoGain.gain.value = 100;
        lfo.connect(lfoGain);
        lfoGain.connect(filter.frequency);
        lfo.start();
        gain.gain.value = 0.3;
        osc1.connect(filter);
        osc2.connect(filter);
        filter.connect(gain);
        gain.connect(this.reverbNode);
        gain.connect(this.masterGain);
        osc1.start();
        osc2.start();
    }

    startRainNoise() {
        if (!this.ctx || !this.masterGain) return;
        const bufferSize = 2 * this.ctx.sampleRate;
        const noiseBuffer = this.ctx.createBuffer(1, bufferSize, this.ctx.sampleRate);
        const output = noiseBuffer.getChannelData(0);
        let lastOut = 0;
        for (let i = 0; i < bufferSize; i++) {
            const white = Math.random() * 2 - 1;
            output[i] = (lastOut + (0.02 * white)) / 1.02;
            lastOut = output[i];
            output[i] *= 3.5; 
        }
        const noise = this.ctx.createBufferSource();
        noise.buffer = noiseBuffer;
        noise.loop = true;
        const filter = this.ctx.createBiquadFilter();
        filter.type = 'lowpass';
        filter.frequency.value = 400;
        const gain = this.ctx.createGain();
        gain.gain.value = 0.05;
        noise.connect(filter);
        filter.connect(gain);
        gain.connect(this.masterGain);
        noise.start();
    }

    scheduler() {
        if (!this.isPlaying || !this.ctx) return;
        while (this.nextNoteTime < this.ctx.currentTime + this.scheduleAheadTime) {
            this.scheduleNote(this.currentNote, this.nextNoteTime);
            this.nextNote();
        }
        this.schedulerTimer = window.setTimeout(() => this.scheduler(), this.lookahead);
    }

    nextNote() {
        const secondsPerBeat = 60.0 / this.tempo;
        this.nextNoteTime += 0.25 * secondsPerBeat;
        this.currentNote++;
        if (this.currentNote === 16) this.currentNote = 0;
    }

    scheduleNote(beatNumber: number, time: number) {
        if (!this.ctx || !this.masterGain || !this.reverbNode) return;
        if (beatNumber % 2 === 0) {
            const osc = this.ctx.createOscillator();
            const gain = this.ctx.createGain();
            const filter = this.ctx.createBiquadFilter();
            osc.type = 'sawtooth';
            osc.frequency.value = beatNumber % 8 === 0 ? 32.70 : 65.41; 
            filter.type = 'lowpass';
            filter.frequency.setValueAtTime(400, time);
            filter.frequency.exponentialRampToValueAtTime(100, time + 0.1);
            gain.gain.setValueAtTime(0.3, time);
            gain.gain.exponentialRampToValueAtTime(0.001, time + 0.15);
            osc.connect(filter);
            filter.connect(gain);
            gain.connect(this.masterGain);
            osc.start(time);
            osc.stop(time + 0.2);
        }
        if (Math.random() > 0.8 && beatNumber % 2 !== 0) {
            const osc = this.ctx.createOscillator();
            const gain = this.ctx.createGain();
            osc.type = 'square';
            const noteIdx = 5 + Math.floor(Math.random() * 10);
            osc.frequency.value = this.scale[noteIdx];
            gain.gain.setValueAtTime(0.1, time);
            gain.gain.exponentialRampToValueAtTime(0.001, time + 0.3);
            const panner = this.ctx.createStereoPanner();
            panner.pan.value = (Math.random() * 2) - 1;
            osc.connect(gain);
            gain.connect(panner);
            panner.connect(this.reverbNode);
            panner.connect(this.masterGain);
            osc.start(time);
            osc.stop(time + 0.4);
        }
        if (beatNumber % 4 === 2) {
            const bufferSize = this.ctx.sampleRate * 0.05;
            const buffer = this.ctx.createBuffer(1, bufferSize, this.ctx.sampleRate);
            const data = buffer.getChannelData(0);
            for (let i = 0; i < bufferSize; i++) data[i] = Math.random() * 2 - 1;
            const noise = this.ctx.createBufferSource();
            noise.buffer = buffer;
            const gain = this.ctx.createGain();
            const filter = this.ctx.createBiquadFilter();
            filter.type = 'highpass';
            filter.frequency.value = 4000;
            gain.gain.setValueAtTime(0.1, time);
            gain.gain.exponentialRampToValueAtTime(0.001, time + 0.05);
            noise.connect(filter);
            filter.connect(gain);
            gain.connect(this.masterGain);
            noise.start(time);
        }
    }
}

// --------------------------------------------------------
// SCENE CONSTANTS
// --------------------------------------------------------
const VOXEL_SIZE = 1;
const PALETTE = {
    sky: 0x050510, white: 0xCCCCCC, grey: 0x444444, darkGrey: 0x222222,
    teal: 0x00F3FF, orange: 0xFF5722, glass: 0x001133, grass: 0x111111,
    mountain: 0x1A1A1A, snow: 0xFF0099, red: 0xFF003C, yellow: 0xF7E600,
    black: 0x000000, water: 0x0044FF, waterFoam: 0x88CCFF
};
const NEON_COLORS = [PALETTE.teal, PALETTE.orange, PALETTE.snow, PALETTE.red, PALETTE.yellow, PALETTE.water];

function getTrackOffset(x: number) {
    const curveStart = 50;
    if (x < curveStart) return 0;
    const d = x - curveStart;
    return (d * d) / 300; 
}

function getTrackAngle(x: number) {
    const curveStart = 50;
    if (x < curveStart) return 0;
    const d = x - curveStart;
    return Math.atan2(d, 150);
}

function addVoxel(data: any, x: number, y: number, z: number, colorHex: number) {
    const ix = Math.round(x);
    const iy = Math.round(y);
    const iz = Math.round(z);
    if (!data[colorHex]) data[colorHex] = [];
    data[colorHex].push(ix, iy, iz);
}

function generateSupport(data: any, x: number, trackY: number, groundY: number) {
    const color = PALETTE.darkGrey; 
    const zTrackOffset = getTrackOffset(x);
    const zGap = 6;
    const startY = groundY;

    for (let y = startY; y <= trackY; y++) {
        const isBrace = y % 6 === 0;
        addVoxel(data, x, y, zTrackOffset - zGap, color);
        addVoxel(data, x + 1, y, zTrackOffset - zGap, color);
        addVoxel(data, x - 1, y, zTrackOffset - zGap, color);
        addVoxel(data, x, y, zTrackOffset - zGap + 1, color);
        addVoxel(data, x, y, zTrackOffset - zGap - 1, color);
        if (isBrace) addVoxel(data, x, y, zTrackOffset - zGap, PALETTE.grey);

        addVoxel(data, x, y, zTrackOffset + zGap, color);
        addVoxel(data, x + 1, y, zTrackOffset + zGap, color);
        addVoxel(data, x - 1, y, zTrackOffset + zGap, color);
        addVoxel(data, x, y, zTrackOffset + zGap + 1, color);
        addVoxel(data, x, y, zTrackOffset + zGap - 1, color);
        if (isBrace) addVoxel(data, x, y, zTrackOffset + zGap, PALETTE.grey);
    }
    for (let z = -zGap; z <= zGap; z++) {
        addVoxel(data, x, trackY, zTrackOffset + z, color);
        addVoxel(data, x + 1, trackY, zTrackOffset + z, color);
        addVoxel(data, x - 1, trackY, zTrackOffset + z, color);
        addVoxel(data, x, trackY - 1, zTrackOffset + z, color);
        if (Math.abs(z) < 2) addVoxel(data, x, trackY - 2, zTrackOffset + z, PALETTE.red); 
    }
}

function generateTrack(data: any, yPos: number, length: number) {
    const startX = -(length / 2);
    const zWidth = 3;
    for (let x = 0; x < length; x++) {
        const globalX = startX + x;
        const zOffset = getTrackOffset(globalX);
        addVoxel(data, globalX, yPos, zOffset - zWidth, PALETTE.white);
        addVoxel(data, globalX, yPos, zOffset + zWidth, PALETTE.white);
        for(let z = -zWidth + 1; z < zWidth; z++) {
            if (x % 2 === 0) addVoxel(data, globalX, yPos - 1, zOffset + z, PALETTE.black);
        }
        addVoxel(data, globalX, yPos - 2, zOffset, PALETTE.black);
        if (x % 4 === 0) addVoxel(data, globalX, yPos - 1, zOffset, PALETTE.teal);
    }
}

function generateTopTrain(data: any) {
    const length = 30;
    const startX = -length / 2;
    for (let x = 0; x < length; x++) {
        const localX = startX + x;
        let width = 3; let height = 3;
        if (x < 5) { width = 1; height = 1; }
        else if (x < 8) { width = 2; height = 2; }
        else if (x > length - 5) { width = 2; height = 2; }

        for (let y = 0; y < height; y++) {
            for (let z = -width + 1; z < width; z++) {
                if (Math.abs(z) === width - 1 && y === height - 1) continue;
                let color = PALETTE.white;
                if (y === 1 && Math.abs(z) === width - 1 && x > 8 && x < length - 5) color = PALETTE.glass;
                if (x > 4 && x < 9 && y > 0 && Math.abs(z) < 2) color = PALETTE.glass;
                if (y === 0) color = PALETTE.black;
                addVoxel(data, localX, 1 + y, z, color);
            }
        }
        if (x > length - 6 && x < length - 1) {
            addVoxel(data, localX, height + 1, 0, PALETTE.teal); 
        }
    }
}

function generateGunship(data: any) {
    const length = 18; const startX = -length / 2;
    for (let x = 0; x < length; x++) {
        const localX = startX + x; const width = 2; const height = 3;
        for (let y = 0; y < height; y++) {
            for (let z = -width + 1; z < width; z++) {
                let color = PALETTE.darkGrey;
                if (x === 2 || x === length - 3) color = PALETTE.red;
                if (x > 3 && x < 8 && y === 2) color = PALETTE.black;
                addVoxel(data, localX, y, z, color);
            }
        }
    }
    for (let x = -2; x <= 2; x++) {
        for (let z = -1; z <= 1; z++) addVoxel(data, x, 3, z, PALETTE.grey);
    }
    addVoxel(data, 3, 3, -1, PALETTE.black); addVoxel(data, 3, 3, 1, PALETTE.black);
    addVoxel(data, 4, 3, -1, PALETTE.black); addVoxel(data, 4, 3, 1, PALETTE.black);
}

function generateDrone(data: any) {
    addVoxel(data, 0, 0, 0, PALETTE.black); addVoxel(data, 0, 0, 0, PALETTE.red); 
    addVoxel(data, 1, 0, 1, PALETTE.grey); addVoxel(data, 1, 0, -1, PALETTE.grey);
    addVoxel(data, -1, 0, 1, PALETTE.grey); addVoxel(data, -1, 0, -1, PALETTE.grey);
    addVoxel(data, 1, 1, 1, PALETTE.teal); addVoxel(data, 1, 1, -1, PALETTE.teal);
    addVoxel(data, -1, 1, 1, PALETTE.teal); addVoxel(data, -1, 1, -1, PALETTE.teal);
}

function generatePod(data: any) {
    const w = 3; const h = 5; const l = 8; const startY = -3 - h; 
    for (let y = 1; y <= 3; y++) addVoxel(data, 0, -y, 0, PALETTE.black);
    for (let x = 0; x < l; x++) {
        for (let y = 0; y < h; y++) {
            for (let z = -w + 1; z < w; z++) {
                const localX = -l/2 + x; const localY = startY + y;
                if (((x === 0 || x === l - 1) && (y === 0 || y === h - 1)) || (Math.abs(z) === w - 1 && (y === 0 || y === h - 1))) continue;
                let color = PALETTE.white;
                if (y === 1) color = PALETTE.orange;
                if (y === h - 2) color = PALETTE.teal;
                addVoxel(data, localX, localY, z, color);
            }
        }
    }
}

function generateBuilding(data: any, xPos: number, zPos: number, height: number, width: number, depth: number) {
    for (let y = -5; y < height; y++) {
        for (let x = 0; x < width; x++) {
            for (let z = 0; z < depth; z++) {
                if (x > 0 && x < width - 1 && z > 0 && z < depth - 1 && y < height - 1) continue;
                let col = PALETTE.mountain;
                if (y > 0 && y % 3 !== 0 && (x + z) % 3 === 0) col = Math.random() > 0.5 ? PALETTE.teal : PALETTE.snow;
                addVoxel(data, xPos + x, y, zPos + z, col);
            }
        }
    }
    addVoxel(data, xPos + 1, height, zPos + 1, PALETTE.red);
    addVoxel(data, xPos + 1, height + 1, zPos + 1, PALETTE.red);
}

function generateLandscape(data: any) {
    const riverStartX = -150; const riverEndX = -50;
    for (let x = -250; x < 250; x += 2) {
        const isRiver = x > riverStartX && x < riverEndX;
        for (let z = -60; z < 100; z += 2) {
            if (isRiver) {
                addVoxel(data, x, -20, z, PALETTE.grass);
                if (z % 4 === 0 || x % 4 === 0) addVoxel(data, x, -12, z, PALETTE.water); 
            } else {
                const isGridX = Math.abs(x) % 24 < 2; const isGridZ = Math.abs(z) % 24 < 2;
                let col = PALETTE.grass; 
                if (isGridX || isGridZ) col = PALETTE.darkGrey;
                if (Math.random() > 0.99) col = PALETTE.teal;
                addVoxel(data, x, -6, z, col);
            }
        }
    }
    generateBuilding(data, -30, 25, 40, 8, 8); 
    generateBuilding(data, 10, -35, 55, 10, 10); 
    generateBuilding(data, 60, 30, 45, 8, 12);
    for (let x = -300; x < 300; x += 12) {
        if (x > -50 && x < 100) continue;
        for (let z = -80; z > -160; z -= 12) {
            if (Math.random() > 0.6) {
                const h = 20 + Math.random() * 60;
                generateBuilding(data, x, z, h, 6, 6);
            }
        }
    }
}

function createVoxelGroup(data: any) {
    const group = new THREE.Group();
    const boxGeometry = new THREE.BoxGeometry(VOXEL_SIZE, VOXEL_SIZE, VOXEL_SIZE);
    Object.keys(data).forEach((key) => {
        const colorHex = parseInt(key);
        const positions = data[colorHex];
        const count = positions.length / 3;
        const isNeon = NEON_COLORS.includes(colorHex);
        const isWater = colorHex === PALETTE.water;
        const material = new THREE.MeshStandardMaterial({
            color: colorHex,
            roughness: isNeon ? 0.2 : (isWater ? 0.1 : 0.8),
            metalness: isNeon ? 0.1 : (isWater ? 0.9 : 0.2),
            emissive: isNeon ? colorHex : 0x000000,
            emissiveIntensity: isNeon ? 2.0 : 0.0,
            transparent: isWater,
            opacity: isWater ? 0.7 : 1.0,
        });
        const mesh = new THREE.InstancedMesh(boxGeometry, material, count);
        mesh.castShadow = !isNeon && !isWater; mesh.receiveShadow = true;
        const dummy = new THREE.Object3D();
        for (let i = 0; i < count; i++) {
            dummy.position.set(positions[i * 3], positions[i * 3 + 1], positions[i * 3 + 2]);
            dummy.updateMatrix();
            mesh.setMatrixAt(i, dummy.matrix);
        }
        mesh.instanceMatrix.needsUpdate = true;
        group.add(mesh);
    });
    return group;
}

const MetropolisScene = () => {
    const mountRef = useRef<HTMLDivElement>(null);
    const [isLoading, setIsLoading] = useState(true);
    const [audioEnabled, setAudioEnabled] = useState(false);
    const [isPaused, setIsPaused] = useState(false);
    const [cameraMode, setCameraMode] = useState<'ORBIT' | 'CHASE'>('ORBIT');
    const [displaySpeed, setDisplaySpeed] = useState(200);
    
    const isPausedRef = useRef(false);
    const cameraModeRef = useRef('ORBIT');
    const audioRef = useRef<CyberAudioEngine | null>(null);
    
    const trainRef = useRef<THREE.Group | null>(null);
    const gunshipRef = useRef<THREE.Group | null>(null);
    const podsRef = useRef<THREE.Group | null>(null);
    const dronesRef = useRef<Drone[]>([]);
    const lasersRef = useRef<THREE.LineSegments | null>(null);
    const particlesRef = useRef<Particle[]>([]);
    const rainRef = useRef<THREE.Points | null>(null);
    const cameraRef = useRef<THREE.PerspectiveCamera | null>(null);
    const controlsRef = useRef<OrbitControls | null>(null);

    useEffect(() => {
        audioRef.current = new CyberAudioEngine();
        return () => { if (audioRef.current) audioRef.current.stop(); };
    }, []);

    const toggleAudio = async () => {
        if (!audioRef.current) return;
        if (!audioEnabled) {
            await audioRef.current.init();
            audioRef.current.start();
            setAudioEnabled(true);
        } else {
            audioRef.current.stop();
            setAudioEnabled(false);
        }
    };

    const togglePause = () => {
        const nextState = !isPaused;
        setIsPaused(nextState);
        isPausedRef.current = nextState;
    };

    const toggleCamera = () => {
        const nextMode = cameraMode === 'ORBIT' ? 'CHASE' : 'ORBIT';
        setCameraMode(nextMode);
        cameraModeRef.current = nextMode;
    };

    useEffect(() => {
        const interval = setInterval(() => {
            if (!isPaused) {
                const jitter = Math.floor(Math.random() * 5) - 2;
                setDisplaySpeed(200 + jitter);
            }
        }, 150);
        return () => clearInterval(interval);
    }, [isPaused]);

    useEffect(() => {
        if (!mountRef.current) return;

        const scene = new THREE.Scene();
        scene.background = new THREE.Color(PALETTE.sky);
        scene.fog = new THREE.Fog(PALETTE.sky, 100, 1000);

        const camera = new THREE.PerspectiveCamera(45, window.innerWidth / window.innerHeight, 1, 1500);
        camera.position.set(-80, 60, 120);
        cameraRef.current = camera;

        const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: false });
        renderer.setSize(window.innerWidth, window.innerHeight);
        renderer.shadowMap.enabled = true;
        renderer.shadowMap.type = THREE.PCFSoftShadowMap;
        renderer.toneMapping = THREE.ACESFilmicToneMapping;
        renderer.toneMappingExposure = 1.2;
        renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
        mountRef.current.appendChild(renderer.domElement);

        const controls = new OrbitControls(camera, renderer.domElement);
        controls.target.set(0, 20, 0);
        controls.enableDamping = true;
        controls.enablePan = true;
        controls.enableZoom = true;
        controls.minDistance = 1;
        controls.maxDistance = 2000;
        controls.maxPolarAngle = Math.PI;
        controlsRef.current = controls;

        const hemiLight = new THREE.HemisphereLight(0x6666ff, 0x111122, 0.6);
        scene.add(hemiLight);

        const sunLight = new THREE.DirectionalLight(0xaaccff, 0.8);
        sunLight.position.set(100, 150, 50);
        sunLight.castShadow = true;
        sunLight.shadow.mapSize.width = 2048;
        sunLight.shadow.mapSize.height = 2048;
        sunLight.shadow.camera.left = -300;
        sunLight.shadow.camera.right = 300;
        sunLight.shadow.camera.top = 300;
        sunLight.shadow.camera.bottom = -300;
        scene.add(sunLight);

        const pointLight = new THREE.PointLight(PALETTE.teal, 1.2, 400);
        pointLight.position.set(0, 30, 0);
        scene.add(pointLight);
        
        const cityLight = new THREE.PointLight(PALETTE.orange, 0.5, 300);
        cityLight.position.set(50, 40, -50);
        scene.add(cityLight);

        const staticData = {};
        const trackHeight = 40;
        const trackLength = 500;

        generateTrack(staticData, trackHeight, trackLength);
        generateLandscape(staticData);
        
        [-180, -120, -60, 0, 60, 120, 180].forEach(x => {
            const isRiver = x > -150 && x < -50;
            const groundY = isRiver ? -20 : -10;
            generateSupport(staticData, x, trackHeight, groundY);
        });

        const staticGroup = createVoxelGroup(staticData);
        scene.add(staticGroup);

        const trainData = {};
        generateTopTrain(trainData);
        const trainGroup = createVoxelGroup(trainData);
        scene.add(trainGroup);
        trainRef.current = trainGroup;

        const trainSpot = new THREE.SpotLight(PALETTE.teal, 20, 250, 0.5, 0.5, 1);
        trainSpot.position.set(15, 3, 0); 
        trainSpot.target.position.set(40, 0, 0); 
        trainSpot.castShadow = true;
        trainGroup.add(trainSpot);
        trainGroup.add(trainSpot.target);

        const gunshipData = {};
        generateGunship(gunshipData);
        const gunshipGroup = createVoxelGroup(gunshipData);
        scene.add(gunshipGroup);
        gunshipRef.current = gunshipGroup;

        const gunshipSpot = new THREE.SpotLight(PALETTE.orange, 15, 150, 0.6, 0.4, 1);
        gunshipSpot.position.set(10, 2, 0);
        gunshipSpot.target.position.set(25, 0, 0);
        gunshipSpot.castShadow = true;
        gunshipGroup.add(gunshipSpot);
        gunshipGroup.add(gunshipSpot.target);

        const podsData = {};
        generatePod(podsData);
        const podsGroup = createVoxelGroup(podsData);
        scene.add(podsGroup);
        podsRef.current = podsGroup;

        const droneData = {};
        generateDrone(droneData);
        const templateDrone = createVoxelGroup(droneData);
        const droneCount = 5; 
        
        for (let i = 0; i < droneCount; i++) {
        const droneMesh = templateDrone.clone();
        scene.add(droneMesh);
        dronesRef.current.push({
            mesh: droneMesh,
            velocity: new THREE.Vector3(),
            isActive: false,
            respawnTimer: Math.random() * 100,
        });
        }

        const rainCount = 12000;
        const rainGeo = new THREE.BufferGeometry();
        const rainPos = [];
        for(let i=0; i<rainCount; i++) {
            rainPos.push(
                (Math.random() - 0.5) * 600, 
                (Math.random()) * 200,       
                (Math.random() - 0.5) * 400 
            );
        }
        rainGeo.setAttribute('position', new THREE.Float32BufferAttribute(rainPos, 3));
        const rainMat = new THREE.PointsMaterial({
            color: PALETTE.teal,
            size: 0.4,
            transparent: true,
            opacity: 0.4 
        });
        const rainSystem = new THREE.Points(rainGeo, rainMat);
        scene.add(rainSystem);
        rainRef.current = rainSystem;

        const particleGeo = new THREE.BoxGeometry(0.5, 0.5, 0.5);
        const particleMatRed = new THREE.MeshBasicMaterial({ color: PALETTE.red });
        const particleMatGrey = new THREE.MeshBasicMaterial({ color: PALETTE.grey });

        const lineMaterial = new THREE.LineBasicMaterial({ color: PALETTE.teal, transparent: true, opacity: 0.8 });
        const lineGeo = new THREE.BufferGeometry();
        const linePos = new Float32Array(droneCount * 2 * 3);
        lineGeo.setAttribute('position', new THREE.BufferAttribute(linePos, 3));
        const laserLines = new THREE.LineSegments(lineGeo, lineMaterial);
        laserLines.frustumCulled = false;
        scene.add(laserLines);
        lasersRef.current = laserLines;

        setIsLoading(false);

        let animationId: number;
        const trackStart = -200;
        const trackEnd = 200; 
        const trainSpeed = 2.0; 
        const podSpeed = 0.2; 
        const shakeIntensity = 0.2;
        let trainX = 0;
        let podX = 40;

        const animate = () => {
            animationId = requestAnimationFrame(animate);
            const shakeX = (Math.random() - 0.5) * shakeIntensity;
            const shakeY = (Math.random() - 0.5) * shakeIntensity;
            const shakeZ = (Math.random() - 0.5) * shakeIntensity;

            if (!isPausedRef.current) {
                trainX += trainSpeed;
                if (trainX > trackEnd) trainX = trackStart;
                podX += podSpeed;
                if (podX > trackEnd) podX = trackStart;
            }

            if (trainRef.current) {
                const z = getTrackOffset(trainX);
                const angle = getTrackAngle(trainX);
                trainRef.current.position.set(trainX, trackHeight, z);
                trainRef.current.rotation.y = -angle; 
            }

            if (gunshipRef.current) {
                const gunX = trainX - 28;
                let actualGunX = gunX;
                if (actualGunX < trackStart) actualGunX += (trackEnd - trackStart);
                const z = getTrackOffset(actualGunX);
                const angle = getTrackAngle(actualGunX);
                gunshipRef.current.position.set(actualGunX, trackHeight + 1, z);
                gunshipRef.current.rotation.y = -angle;
            }

            if (podsRef.current) {
                const z = getTrackOffset(podX);
                const angle = getTrackAngle(podX);
                podsRef.current.position.set(podX, trackHeight, z);
                podsRef.current.rotation.y = -angle;
            }

            if (cameraModeRef.current === 'CHASE' && trainRef.current && cameraRef.current) {
                if (controlsRef.current) controlsRef.current.enabled = false;
                const trainPos = trainRef.current.position;
                const angle = trainRef.current.rotation.y;
                const distBehind = 40;
                const distUp = 15;
                const offsetZ = Math.sin(angle) * distBehind;
                const offsetX = Math.cos(angle) * distBehind;
                const targetX = trainPos.x - offsetX;
                const targetY = trainPos.y + distUp;
                const targetZ = trainPos.z + 25 + offsetZ;

                cameraRef.current.position.lerp(new THREE.Vector3(targetX, targetY, targetZ), 0.1);
                cameraRef.current.position.x += shakeX;
                cameraRef.current.position.y += shakeY;
                cameraRef.current.position.z += shakeZ;

                const lookDist = 100;
                const lookX = trainPos.x + Math.cos(angle) * lookDist;
                const lookZ = trainPos.z - Math.sin(angle) * lookDist;
                cameraRef.current.lookAt(lookX, trainPos.y, lookZ);
            } else {
                if (controlsRef.current) {
                    controlsRef.current.enabled = true;
                    controlsRef.current.update();
                }
            }

            if (audioRef.current && trainRef.current && cameraRef.current) {
                const trainWorldPos = new THREE.Vector3();
                trainRef.current.getWorldPosition(trainWorldPos);
                const dist = cameraRef.current.position.distanceTo(trainWorldPos);
                let vol = 0;
                if (dist < 200) {
                    vol = 1 - (dist / 200);
                    vol = vol * vol * vol; 
                }
                audioRef.current.setTrainVolume(vol);
            }

            if (!isPausedRef.current) {
                if (rainRef.current) {
                    const positions = rainRef.current.geometry.attributes.position.array;
                    for(let i=1; i<positions.length; i+=3) {
                        positions[i] -= 2; 
                        if (positions[i] < -10) positions[i] = 200;
                    }
                    rainRef.current.geometry.attributes.position.needsUpdate = true;
                }

                const laserPositions: number[] = [];
                const gunshipPos = gunshipRef.current ? gunshipRef.current.position.clone().add(new THREE.Vector3(3, 3, 0)) : new THREE.Vector3();

                dronesRef.current.forEach((drone) => {
                    if (!drone.isActive) {
                        drone.respawnTimer--;
                        drone.mesh.visible = false;
                        if (drone.respawnTimer <= 0) {
                            drone.isActive = true;
                            drone.mesh.visible = true;
                            const spawnX = (Math.random() - 0.5) * trackLength;
                            const spawnZ = -50 - Math.random() * 50; 
                            drone.mesh.position.set(spawnX, -5, spawnZ);
                            drone.velocity.set(
                                (Math.random() - 0.5) * 0.1, 
                                (0.1 + Math.random() * 0.1) * 0.5,   
                                (0.2 + Math.random() * 0.2) * 0.5    
                            );
                        }
                    } else {
                        drone.mesh.position.add(drone.velocity);
                        drone.mesh.position.y += Math.sin(Date.now() * 0.005 + drone.mesh.position.x) * 0.05;

                        if (drone.mesh.position.y > 60 || drone.mesh.position.z > 20) {
                            drone.isActive = false;
                            drone.respawnTimer = 60;
                        }

                        const dist = drone.mesh.position.distanceTo(gunshipPos);
                        if (dist < 80 && Math.random() > 0.90) { 
                            laserPositions.push(gunshipPos.x, gunshipPos.y, gunshipPos.z);
                            laserPositions.push(drone.mesh.position.x, drone.mesh.position.y, drone.mesh.position.z);

                            if (Math.random() > 0.6) {
                                drone.isActive = false;
                                drone.respawnTimer = 30 + Math.random() * 50;
                                if (audioRef.current) audioRef.current.triggerExplosion();
                                
                                for (let i = 0; i < 6; i++) {
                                    const mat = Math.random() > 0.5 ? particleMatRed : particleMatGrey;
                                    const pMesh = new THREE.Mesh(particleGeo, mat);
                                    pMesh.position.copy(drone.mesh.position);
                                    pMesh.position.x += (Math.random() - 0.5) * 1;
                                    pMesh.position.y += (Math.random() - 0.5) * 1;
                                    pMesh.position.z += (Math.random() - 0.5) * 1;
                                    scene.add(pMesh);
                                    particlesRef.current.push({
                                        mesh: pMesh,
                                        velocity: new THREE.Vector3(
                                            (Math.random() - 0.5) * 0.4,
                                            (Math.random() - 0.5) * 0.4,
                                            (Math.random() - 0.5) * 0.4
                                        ),
                                        life: 60
                                    });
                                }
                            }
                        }
                    }
                });

                for (let i = particlesRef.current.length - 1; i >= 0; i--) {
                    const p = particlesRef.current[i];
                    p.life--;
                    p.velocity.y -= 0.01; 
                    p.mesh.position.add(p.velocity);
                    p.mesh.rotation.x += 0.2;
                    p.mesh.rotation.z += 0.2;
                    if (p.life <= 0 || p.mesh.position.y < -10) {
                        scene.remove(p.mesh);
                        particlesRef.current.splice(i, 1);
                    }
                }

                if (lasersRef.current) {
                    const positions = lasersRef.current.geometry.attributes.position.array;
                    for(let i=0; i<positions.length; i++) positions[i] = 0;
                    for(let i=0; i<laserPositions.length; i++) positions[i] = laserPositions[i];
                    lasersRef.current.geometry.attributes.position.needsUpdate = true;
                    lasersRef.current.geometry.setDrawRange(0, laserPositions.length / 3);
                }
            } else {
                if (lasersRef.current) {
                    const positions = lasersRef.current.geometry.attributes.position.array;
                    for(let i=0; i<positions.length; i++) positions[i] = 0;
                    lasersRef.current.geometry.attributes.position.needsUpdate = true;
                }
            }

            renderer.render(scene, camera!);
        };
        animate();

        const handleResize = () => {
            if (!mountRef.current || !cameraRef.current) return;
            cameraRef.current.aspect = window.innerWidth / window.innerHeight;
            cameraRef.current.updateProjectionMatrix();
            renderer.setSize(window.innerWidth, window.innerHeight);
        };
        window.addEventListener('resize', handleResize);

        return () => {
            cancelAnimationFrame(animationId);
            window.removeEventListener('resize', handleResize);
            if (mountRef.current && renderer.domElement) {
                mountRef.current.removeChild(renderer.domElement);
            }
            renderer.dispose();
            lineMaterial.dispose();
            particleMatRed.dispose();
            particleMatGrey.dispose();
            if (rainSystem) rainGeo.dispose();
        };
    }, []);

    return (
        <div className="w-full h-full relative bg-black overflow-hidden">
            <div ref={mountRef} className="w-full h-full block" />
            {isLoading && (
                <div className="absolute inset-0 flex flex-col items-center justify-center bg-[#050510] text-white z-50">
                <div className="text-3xl font-mono font-bold animate-pulse text-cyan-400">
                    SYSTEM BOOTING...
                </div>
                </div>
            )}

            {!isPaused && (
                <div className="absolute top-6 right-6 pointer-events-none select-none text-right">
                    <div className="text-6xl font-black italic text-transparent bg-clip-text bg-gradient-to-r from-cyan-400 to-white drop-shadow-[0_0_10px_rgba(0,243,255,0.8)]">
                        {displaySpeed}
                        <span className="text-2xl font-normal text-cyan-400 ml-2">KM/H</span>
                    </div>
                    <div className="h-1 w-full bg-gray-800 mt-2 rounded overflow-hidden">
                        <div 
                            className="h-full bg-cyan-400 shadow-[0_0_10px_#00F3FF]" 
                            style={{ width: `${(displaySpeed / 450) * 100}%` }}
                        />
                    </div>
                </div>
            )}
            
            <div className="absolute bottom-6 right-6 pointer-events-auto z-40 flex gap-4">
                <button 
                    onClick={toggleCamera}
                    className={`
                        px-6 py-2 border font-mono text-sm tracking-widest transition-all duration-300
                        ${cameraMode === 'CHASE'
                            ? 'border-red-500 text-black bg-red-500 shadow-[0_0_15px_rgba(239,68,68,0.5)]' 
                            : 'border-white/20 text-white/50 bg-black/50 hover:border-red-500/50 hover:text-red-400'}
                    `}
                >
                    [ CAM: {cameraMode} ]
                </button>

                <button 
                    onClick={togglePause}
                    className={`
                        px-6 py-2 border font-mono text-sm tracking-widest transition-all duration-300
                        ${isPaused
                            ? 'border-yellow-400 text-black bg-yellow-400 shadow-[0_0_15px_rgba(250,204,21,0.5)]' 
                            : 'border-white/20 text-white/50 bg-black/50 hover:border-yellow-400/50 hover:text-yellow-400'}
                    `}
                >
                    [ PAUSE: {isPaused ? 'ON' : 'OFF'} ]
                </button>

                <button 
                    onClick={toggleAudio}
                    className={`
                        px-6 py-2 border font-mono text-sm tracking-widest transition-all duration-300
                        ${audioEnabled 
                            ? 'border-cyan-400 text-black bg-cyan-400 shadow-[0_0_15px_rgba(0,243,255,0.5)]' 
                            : 'border-white/20 text-white/50 bg-black/50 hover:border-cyan-400/50 hover:text-cyan-400'}
                    `}
                >
                    [ AUDIO: {audioEnabled ? 'ONLINE' : 'OFFLINE'} ]
                </button>
            </div>

            <div className="absolute top-6 left-6 pointer-events-none select-none">
                <h1 className="text-4xl font-bold text-white drop-shadow-[0_0_10px_rgba(0,255,255,0.8)] tracking-tighter">
                NEO-VOXEL 2099
                </h1>
                <p className="text-cyan-400 text-sm font-mono mt-1 tracking-widest">
                SYSTEM: ONLINE // SECTOR 7
                </p>
            </div>
        </div>
    );
};

export default MetropolisScene;
