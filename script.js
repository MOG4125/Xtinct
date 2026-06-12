import * as THREE from 'three';
import { OrbitControls } from 'three/addons/controls/OrbitControls.js';
import { GLTFLoader } from 'three/addons/loaders/GLTFLoader.js';

// --- Scene Setup ---
const scene = new THREE.Scene();
scene.background = new THREE.Color(0x020202);

const camera = new THREE.PerspectiveCamera(40, window.innerWidth / window.innerHeight, 0.1, 1000);
camera.position.set(0, 12, 18);

const renderer = new THREE.WebGLRenderer({ antialias: true });
renderer.setSize(window.innerWidth, window.innerHeight);
renderer.setPixelRatio(window.devicePixelRatio);
renderer.toneMapping = THREE.ACESFilmicToneMapping;
document.body.appendChild(renderer.domElement);

const controls = new OrbitControls(camera, renderer.domElement);
controls.enableDamping = true;

// --- Lighting ---
scene.add(new THREE.AmbientLight(0xffffff, 1.2));
const sun = new THREE.DirectionalLight(0xffffff, 2);
sun.position.set(5, 15, 10);
scene.add(sun);

// --- Social Links Mapping ---
const socialLinks = {
    'insta': 'https://instagram.com/xtinct',
    'yt': 'https://youtube.com/xtinct',
    'tiktok': 'https://tiktok.com/@xtinct',
    'sc': 'https://soundcloud.com/xtinct'
};

// --- Loader & Model Interaction ---
const loader = new GLTFLoader();
const wheels = [];
const clickablePads = [];
const raycaster = new THREE.Raycaster();
const mouse = new THREE.Vector2();

loader.load('pioneer_DJ_console.glb', (gltf) => {
    const model = gltf.scene;
    scene.add(model);
    document.getElementById('loading').style.display = 'none';

    model.traverse((node) => {
        if (node.isMesh) {
            const name = node.name.toLowerCase();

            // 1. Spinning Wheels + Red X
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

            // 2. Play/Cue LED Glow
            if (name.includes('play')) {
                node.material = new THREE.MeshStandardMaterial({ color: 0x000000, emissive: 0x00ff00, emissiveIntensity: 10 });
            }
            if (name.includes('cue')) {
                node.material = new THREE.MeshStandardMaterial({ color: 0x000000, emissive: 0xffaa00, emissiveIntensity: 10 });
            }

            // 3. Performance Pads (Clickable)
            if (name.includes('pad')) {
                clickablePads.push(node);
                // Assign links based on which pad it is (looping through socials)
                const keys = Object.keys(socialLinks);
                const index = clickablePads.length % keys.length;
                node.userData.url = socialLinks[keys[index]];
            }
        }
    });
});

// --- Click Interaction Logic ---
window.addEventListener('click', (event) => {
    mouse.x = (event.clientX / window.innerWidth) * 2 - 1;
    mouse.y = -(event.clientY / window.innerHeight) * 2 + 1;
    raycaster.setFromCamera(mouse, camera);
    const intersects = raycaster.intersectObjects(clickablePads);
    if (intersects.length > 0) {
        window.open(intersects[0].object.userData.url, '_blank');
    }
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
