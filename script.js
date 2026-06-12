import * as THREE from 'three';
import { OrbitControls } from 'three/addons/controls/OrbitControls.js';
import { GLTFLoader } from 'three/addons/loaders/GLTFLoader.js';

// --- Configuration ---
const SOCIALS = {
    'insta': 'https://instagram.com/xtinct',
    'yt': 'https://youtube.com/xtinct',
    'tiktok': 'https://tiktok.com/@xtinct',
    'sc': 'https://soundcloud.com/xtinct'
};

const scene = new THREE.Scene();
scene.background = new THREE.Color(0x020202);

const camera = new THREE.PerspectiveCamera(40, window.innerWidth / window.innerHeight, 0.1, 1000);
camera.position.set(0, 10, 20);

const renderer = new THREE.WebGLRenderer({ antialias: true });
renderer.setSize(window.innerWidth, window.innerHeight);
renderer.setPixelRatio(window.devicePixelRatio);
document.body.appendChild(renderer.domElement);

const controls = new OrbitControls(camera, renderer.domElement);
controls.enableDamping = true;

// Lighting
scene.add(new THREE.AmbientLight(0xffffff, 1.5));
const sun = new THREE.DirectionalLight(0xffffff, 2);
sun.position.set(5, 15, 10);
scene.add(sun);

// --- Interaction State ---
const raycaster = new THREE.Raycaster();
const mouse = new THREE.Vector2();
let activeObject = null;
let isDragging = false;

const wheels = [];
const interactivePads = [];
const moveables = []; // Knobs and Faders

// --- Model Loader ---
const loader = new GLTFLoader();
loader.load('pioneer_DJ_console.glb', (gltf) => {
    const model = gltf.scene;
    scene.add(model);
    document.getElementById('loading').style.display = 'none';

    model.traverse((node) => {
        if (node.isMesh) {
            const name = node.name.toLowerCase();

            // 1. Spinning Jog Wheels + X
            if (name.includes('jog') || name.includes('wheel')) {
                wheels.push(node);
                const xGroup = new THREE.Group();
                const xMat = new THREE.MeshBasicMaterial({ color: 0xff0000 });
                const b1 = new THREE.Mesh(new THREE.BoxGeometry(0.8, 0.1, 0.1), xMat);
                const b2 = new THREE.Mesh(new THREE.BoxGeometry(0.8, 0.1, 0.1), xMat);
                b1.rotation.y = Math.PI / 4; b2.rotation.y = -Math.PI / 4;
                xGroup.add(b1, b2);
                xGroup.position.y = 0.08; xGroup.rotation.x = Math.PI / 2;
                node.add(xGroup);
            }

            // 2. Interactive Pads (Aggressive Naming Match)
            if (name.includes('pad') || name.includes('cube') || name.includes('button') || name.includes('cue')) {
                const keys = Object.keys(SOCIALS);
                const link = SOCIALS[keys[interactivePads.length % keys.length]];
                node.userData = { isPad: true, url: link };
                interactivePads.push(node);
            }

            // 3. Knobs & Faders
            if (name.includes('knob') || name.includes('fader') || name.includes('slider') || name.includes('eq')) {
                node.userData = { 
                    isKnob: name.includes('knob') || name.includes('eq'),
                    isFader: name.includes('fader') || name.includes('slider'),
                    initialY: node.position.y,
                    initialRot: node.rotation.y
                };
                moveables.push(node);
            }
        }
    });
});

// --- Mouse / Touch Logic ---
window.addEventListener('mousedown', (e) => {
    mouse.x = (e.clientX / window.innerWidth) * 2 - 1;
    mouse.y = -(e.clientY / window.innerHeight) * 2 + 1;
    raycaster.setFromCamera(mouse, camera);

    const hits = raycaster.intersectObjects(scene.children, true);
    if (hits.length > 0) {
        const obj = hits[0].object;
        
        // Handle Pad Click
        if (obj.userData.isPad) {
            window.open(obj.userData.url, '_blank');
            return;
        }

        // Handle Knob/Fader Start
        if (obj.userData.isKnob || obj.userData.isFader) {
            activeObject = obj;
            isDragging = true;
            controls.enabled = false; // Stop camera moving while turning knobs
        }
    }
});

window.addEventListener('mousemove', (e) => {
    if (!isDragging || !activeObject) return;

    const deltaY = e.movementY * 0.01;
    const deltaX = e.movementX * 0.01;

    if (activeObject.userData.isKnob) {
        activeObject.rotation.y += deltaX * 5; // Rotate knob
    } else if (activeObject.userData.isFader) {
        activeObject.position.z += deltaY; // Slide fader back/forth
        // Limit movement so it doesn't fly off the console
        activeObject.position.z = THREE.MathUtils.clamp(activeObject.position.z, -1, 1);
    }
});

window.addEventListener('mouseup', () => {
    isDragging = false;
    activeObject = null;
    controls.enabled = true; // Re-enable camera
});

// --- Animation Loop ---
function animate() {
    requestAnimationFrame(animate);
    wheels.forEach(w => w.rotation.y += 0.04);
    controls.update();
    renderer.render(scene, camera);
}

window.addEventListener('resize', () => {
    camera.aspect = window.innerWidth / window.innerHeight;
    camera.updateProjectionMatrix();
    renderer.setSize(window.innerWidth, window.innerHeight);
});

animate();
