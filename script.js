import * as THREE from 'three';
import { OrbitControls } from 'three/addons/controls/OrbitControls.js';

// --- Scene & Camera ---
const scene = new THREE.Scene();
scene.background = new THREE.Color(0x050505); // Slightly off-black to see depth
const camera = new THREE.PerspectiveCamera(50, window.innerWidth / window.innerHeight, 0.1, 1000);
camera.position.set(0, 10, 15);

const renderer = new THREE.WebGLRenderer({ antialias: true });
renderer.setSize(window.innerWidth, window.innerHeight);
renderer.setPixelRatio(window.devicePixelRatio);
renderer.toneMapping = THREE.ReinhardToneMapping;
document.body.appendChild(renderer.domElement);

const controls = new OrbitControls(camera, renderer.domElement);
controls.enableDamping = true;

// --- Brighter Lighting ---
const ambient = new THREE.AmbientLight(0xffffff, 0.8); // Higher intensity to see gear
scene.add(ambient);

const redLight = new THREE.PointLight(0xff0000, 50, 20);
redLight.position.set(-10, 5, 5);
scene.add(redLight);

const blueLight = new THREE.PointLight(0x00f2ea, 50, 20);
blueLight.position.set(10, 5, 5);
scene.add(blueLight);

// --- Materials ---
const deckMat = new THREE.MeshStandardMaterial({ color: 0x1a1a1a, roughness: 0.3, metalness: 0.6 });
const platterMat = new THREE.MeshStandardMaterial({ color: 0x050505, roughness: 0.2, metalness: 0.9 });

// --- Decks ---
const wheels = [];
const createDeck = (x) => {
    const group = new THREE.Group();
    group.position.x = x;
    
    // Main Chassis
    const body = new THREE.Mesh(new THREE.BoxGeometry(6, 0.6, 8), deckMat);
    group.add(body);

    // Spinning Wheel
    const platter = new THREE.Mesh(new THREE.CylinderGeometry(2.4, 2.4, 0.2, 64), platterMat);
    platter.position.y = 0.4;
    group.add(platter);

    // Center Glow
    const glow = new THREE.Mesh(
        new THREE.CylinderGeometry(0.6, 0.6, 0.22, 32), 
        new THREE.MeshBasicMaterial({ color: 0xff0000 })
    );
    glow.position.y = 0.4;
    group.add(glow);

    scene.add(group);
    wheels.push(platter);
};

createDeck(-3.5);
createDeck(3.5);

// --- Glowing Pads (Interactive) ---
const pads = [];
const padData = [
    { name: 'INSTA', color: 0xff00ff, url: 'https://instagram.com/xtinct' },
    { name: 'YT', color: 0xff0000, url: 'https://youtube.com/xtinct' },
    { name: 'TIKTOK', color: 0x00f2ea, url: 'https://tiktok.com/@xtinct' },
    { name: 'SC', color: 0xff8800, url: 'https://soundcloud.com/xtinct' }
];

padData.forEach((data, i) => {
    const pad = new THREE.Mesh(
        new THREE.BoxGeometry(1.2, 0.2, 0.8),
        new THREE.MeshStandardMaterial({ 
            color: 0x222222, 
            emissive: data.color, 
            emissiveIntensity: 2 
        })
    );
    pad.position.set((i - 1.5) * 1.5, 0.2, 5.5);
    pad.userData = { url: data.url };
    scene.add(pad);
    pads.push(pad);
});

// --- Click Interaction ---
const raycaster = new THREE.Raycaster();
const mouse = new THREE.Vector2();

window.addEventListener('click', (e) => {
    mouse.x = (e.clientX / window.innerWidth) * 2 - 1;
    mouse.y = -(e.clientY / window.innerHeight) * 2 + 1;
    raycaster.setFromCamera(mouse, camera);
    const intersects = raycaster.intersectObjects(pads);
    if (intersects.length > 0) {
        window.open(intersects[0].object.userData.url, '_blank');
    }
});

// --- Animation Loop ---
function animate() {
    requestAnimationFrame(animate);
    
    // Perpetual Motion
    wheels.forEach(w => w.rotation.y += 0.04);
    
    // Subtle pad pulse
    pads.forEach(p => {
        p.material.emissiveIntensity = 1 + Math.sin(Date.now() * 0.005) * 0.5;
    });

    controls.update();
    renderer.render(scene, camera);
}

window.addEventListener('resize', () => {
    camera.aspect = window.innerWidth / window.innerHeight;
    camera.updateProjectionMatrix();
    renderer.setSize(window.innerWidth, window.innerHeight);
});

animate();
