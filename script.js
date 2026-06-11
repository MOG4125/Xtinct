import * as THREE from 'three';
import { OrbitControls } from 'three/addons/controls/OrbitControls.js';
import { GLTFLoader } from 'three/addons/loaders/GLTFLoader.js';

// --- Scene Setup ---
const scene = new THREE.Scene();
scene.background = new THREE.Color(0x020202);

const camera = new THREE.PerspectiveCamera(45, window.innerWidth / window.innerHeight, 0.1, 1000);
camera.position.set(0, 10, 20);

const renderer = new THREE.WebGLRenderer({ antialias: true });
renderer.setSize(window.innerWidth, window.innerHeight);
renderer.setPixelRatio(window.devicePixelRatio);
renderer.toneMapping = THREE.ACESFilmicToneMapping;
renderer.outputColorSpace = THREE.SRGBColorSpace;
document.body.appendChild(renderer.domElement);

const controls = new OrbitControls(camera, renderer.domElement);
controls.enableDamping = true;

// --- Lighting ---
scene.add(new THREE.AmbientLight(0xffffff, 1.2));
const light = new THREE.DirectionalLight(0xffffff, 2);
light.position.set(5, 15, 10);
scene.add(light);

// --- Loader ---
const loader = new GLTFLoader();
const wheels = [];

// Matches your exact filename
loader.load('pioneer_DJ_console.glb', 
    (gltf) => {
        const model = gltf.scene;
        scene.add(model);
        
        // Hide the loading text
        if (document.getElementById('loading')) {
            document.getElementById('loading').style.display = 'none';
        }

        model.traverse((node) => {
            if (node.isMesh) {
                const name = node.name.toLowerCase();

                // 1. Setup Jog Wheels & Add "X"
                if (name.includes('jog') || name.includes('wheel') || name.includes('platter')) {
                    wheels.push(node);
                    
                    const xGroup = new THREE.Group();
                    const xMat = new THREE.MeshBasicMaterial({ color: 0xff0000 });
                    const b1 = new THREE.Mesh(new THREE.BoxGeometry(0.8, 0.1, 0.1), xMat);
                    const b2 = new THREE.Mesh(new THREE.BoxGeometry(0.8, 0.1, 0.1), xMat);
                    b1.rotation.y = Math.PI / 4;
                    b2.rotation.y = -Math.PI / 4;
                    xGroup.add(b1, b2);
                    
                    // Slightly above surface
                    xGroup.position.y = 0.08; 
                    xGroup.rotation.x = Math.PI / 2;
                    node.add(xGroup);
                }

                // 2. Setup LEDs
                if (name.includes('play')) {
                    node.material = new THREE.MeshStandardMaterial({ color: 0x111111, emissive: 0x00ff00, emissiveIntensity: 10 });
                }
                if (name.includes('cue')) {
                    node.material = new THREE.MeshStandardMaterial({ color: 0x111111, emissive: 0xffaa00, emissiveIntensity: 10 });
                }
            }
        });
    },
    undefined,
    (error) => {
        const loadingDiv = document.getElementById('loading');
        if (loadingDiv) {
            loadingDiv.innerHTML = "ERROR: 'pioneer_DJ_console.glb' NOT FOUND.<br>Check your spelling and GitHub upload.";
        }
        console.error(error);
    }
);

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
