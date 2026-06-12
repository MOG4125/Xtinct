import * as THREE from 'three';
import { OrbitControls } from 'three/addons/controls/OrbitControls.js';
import { GLTFLoader } from 'three/addons/loaders/GLTFLoader.js';

const SOCIALS = [
    'https://instagram.com/xtinct',
    'https://youtube.com/xtinct',
    'https://tiktok.com/@xtinct',
    'https://soundcloud.com/xtinct'
];

const scene = new THREE.Scene();
scene.background = new THREE.Color(0x020202);

const camera = new THREE.PerspectiveCamera(45, window.innerWidth / window.innerHeight, 0.1, 1000);
const isMobile = window.innerWidth < 600;
camera.position.set(0, isMobile ? 20 : 12, isMobile ? 25 : 18);

const renderer = new THREE.WebGLRenderer({ antialias: true });
renderer.setSize(window.innerWidth, window.innerHeight);
renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
document.body.appendChild(renderer.domElement);

const controls = new OrbitControls(camera, renderer.domElement);
controls.enableDamping = true;

scene.add(new THREE.AmbientLight(0xffffff, 1.5));
const light = new THREE.DirectionalLight(0xffffff, 2);
light.position.set(5, 15, 10);
scene.add(light);

const loader = new GLTFLoader();
const wheels = [];
const interactiveItems = [];
const raycaster = new THREE.Raycaster();
const mouse = new THREE.Vector2();

let activeObject = null;
let lastPointerPos = { x: 0, y: 0 };

loader.load('pioneer_DJ_console.glb', (gltf) => {
    scene.add(gltf.scene);
    document.getElementById('loading').style.display = 'none';

    let padIdx = 0;
    gltf.scene.traverse((node) => {
        if (node.isMesh) {
            const name = node.name.toLowerCase();
            
            // 1. Identify Wheels
            if (name.includes('jog') || name.includes('wheel') || name.includes('cylinder')) {
                if (node.scale.x > 1) { // Jog wheels are usually large
                    wheels.push(node);
                    addX(node);
                }
            }

            // 2. Identify Pads (Assign Socials to any small box-like objects)
            if (name.includes('pad') || name.includes('btn') || name.includes('box') || name.includes('cube')) {
                node.userData.isPad = true;
                node.userData.url = SOCIALS[padIdx % SOCIALS.length];
                interactiveItems.push(node);
                padIdx++;
            }

            // 3. Identify Moveables (Knobs/Faders)
            if (name.includes('knob') || name.includes('fader') || name.includes('val') || name.includes('pot')) {
                node.userData.isMoveable = true;
                node.userData.type = name.includes('fader') ? 'fader' : 'knob';
                interactiveItems.push(node);
            }
        }
    });
});

function addX(parent) {
    const mat = new THREE.MeshBasicMaterial({ color: 0xff0000 });
    const g = new THREE.Group();
    const b1 = new THREE.Mesh(new THREE.BoxGeometry(0.8, 0.1, 0.1), mat);
    const b2 = new THREE.Mesh(new THREE.BoxGeometry(0.8, 0.1, 0.1), mat);
    b1.rotation.y = Math.PI/4; b2.rotation.y = -Math.PI/4;
    g.add(b1, b2);
    g.position.y = 0.1; g.rotation.x = Math.PI/2;
    parent.add(g);
}

// --- Robust Interaction Logic ---
window.addEventListener('pointerdown', (e) => {
    mouse.x = (e.clientX / window.innerWidth) * 2 - 1;
    mouse.y = -(e.clientY / window.innerHeight) * 2 + 1;
    lastPointerPos = { x: e.clientX, y: e.clientY };

    raycaster.setFromCamera(mouse, camera);
    const hits = raycaster.intersectObjects(scene.children, true);

    if (hits.length > 0) {
        let target = hits[0].object;
        
        // Check if object or its parent is interactive
        while (target && !target.userData.isPad && !target.userData.isMoveable) {
            target = target.parent;
        }

        if (target) {
            if (target.userData.isPad) {
                window.open(target.userData.url, '_blank');
            } else if (target.userData.isMoveable) {
                activeObject = target;
                controls.enabled = false;
            }
        }
    }
});

window.addEventListener('pointermove', (e) => {
    if (!activeObject) return;

    const deltaX = e.clientX - lastPointerPos.x;
    const deltaY = e.clientY - lastPointerPos.y;
    lastPointerPos = { x: e.clientX, y: e.clientY };

    if (activeObject.userData.type === 'knob') {
        activeObject.rotation.y += deltaX * 0.02;
    } else {
        activeObject.position.z += deltaY * 0.01;
        activeObject.position.z = THREE.MathUtils.clamp(activeObject.position.z, -1, 1);
    }
});

window.addEventListener('pointerup', () => {
    activeObject = null;
    controls.enabled = true;
});

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
