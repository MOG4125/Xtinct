import * as THREE from 'three';
import { OrbitControls } from 'three/addons/controls/OrbitControls.js';
import { GLTFLoader } from 'three/addons/loaders/GLTFLoader.js';

const SOCIALS = {
    'insta': 'https://instagram.com/xtinct',
    'yt': 'https://youtube.com/xtinct',
    'tiktok': 'https://tiktok.com/@xtinct',
    'sc': 'https://soundcloud.com/xtinct'
};

const scene = new THREE.Scene();
scene.background = new THREE.Color(0x020202);

const camera = new THREE.PerspectiveCamera(45, window.innerWidth / window.innerHeight, 0.1, 1000);
// Adjust camera for mobile (portrait vs landscape)
const isMobile = window.innerWidth < 600;
camera.position.set(0, isMobile ? 18 : 12, isMobile ? 25 : 18);

const renderer = new THREE.WebGLRenderer({ antialias: true });
renderer.setSize(window.innerWidth, window.innerHeight);
renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2)); // Cap for mobile performance
document.body.appendChild(renderer.domElement);

const controls = new OrbitControls(camera, renderer.domElement);
controls.enableDamping = true;
controls.rotateSpeed = 0.5; // Smoother for touch

scene.add(new THREE.AmbientLight(0xffffff, 1.5));
const sun = new THREE.DirectionalLight(0xffffff, 2);
sun.position.set(5, 15, 10);
scene.add(sun);

const raycaster = new THREE.Raycaster();
const mouse = new THREE.Vector2();
let activeObject = null;
let isDragging = false;
const wheels = [];
const interactivePads = [];

const loader = new GLTFLoader();
loader.load('pioneer_DJ_console.glb', (gltf) => {
    scene.add(gltf.scene);
    document.getElementById('loading').style.display = 'none';

    gltf.scene.traverse((node) => {
        if (node.isMesh) {
            const name = node.name.toLowerCase();

            // Jog Wheels
            if (name.includes('jog') || name.includes('wheel')) {
                wheels.push(node);
                const xMat = new THREE.MeshBasicMaterial({ color: 0xff0000 });
                const xGroup = new THREE.Group();
                const b1 = new THREE.Mesh(new THREE.BoxGeometry(0.8, 0.1, 0.1), xMat);
                const b2 = new THREE.Mesh(new THREE.BoxGeometry(0.8, 0.1, 0.1), xMat);
                b1.rotation.y = Math.PI / 4; b2.rotation.y = -Math.PI / 4;
                xGroup.add(b1, b2);
                xGroup.position.y = 0.08; xGroup.rotation.x = Math.PI / 2;
                node.add(xGroup);
            }

            // Pads/Socials
            if (name.includes('pad') || name.includes('cube') || name.includes('button') || name.includes('cue')) {
                const keys = Object.keys(SOCIALS);
                node.userData = { isPad: true, url: SOCIALS[keys[interactivePads.length % keys.length]] };
                interactivePads.push(node);
            }

            // Moveables
            if (name.includes('knob') || name.includes('fader') || name.includes('slider') || name.includes('eq')) {
                node.userData = { 
                    isKnob: name.includes('knob') || name.includes('eq'),
                    isFader: name.includes('fader') || name.includes('slider')
                };
            }
        }
    });
});

// Unified Pointer Events (Handles Mouse & Touch)
const onPointerDown = (e) => {
    const x = e.touches ? e.touches[0].clientX : e.clientX;
    const y = e.touches ? e.touches[0].clientY : e.clientY;
    
    mouse.x = (x / window.innerWidth) * 2 - 1;
    mouse.y = -(y / window.innerHeight) * 2 + 1;
    
    raycaster.setFromCamera(mouse, camera);
    const hits = raycaster.intersectObjects(scene.children, true);
    
    if (hits.length > 0) {
        const obj = hits[0].object;
        if (obj.userData.isPad) {
            window.open(obj.userData.url, '_blank');
        } else if (obj.userData.isKnob || obj.userData.isFader) {
            activeObject = obj;
            isDragging = true;
            controls.enabled = false;
        }
    }
};

const onPointerMove = (e) => {
    if (!isDragging || !activeObject) return;
    
    // Movement detection for both touch and mouse
    const moveX = e.movementX || 0;
    const moveY = e.movementY || 0;

    if (activeObject.userData.isKnob) {
        activeObject.rotation.y += (moveX || moveY) * 0.05; 
    } else if (activeObject.userData.isFader) {
        activeObject.position.z += moveY * 0.01;
        activeObject.position.z = THREE.MathUtils.clamp(activeObject.position.z, -1, 1);
    }
};

const onPointerUp = () => {
    isDragging = false;
    activeObject = null;
    controls.enabled = true;
};

// Listeners for all devices
window.addEventListener('pointerdown', onPointerDown);
window.addEventListener('pointermove', onPointerMove);
window.addEventListener('pointerup', onPointerUp);

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
