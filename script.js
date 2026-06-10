import * as THREE from 'three';
import { OrbitControls } from 'three/addons/controls/OrbitControls.js';

const scene = new THREE.Scene();
const camera = new THREE.PerspectiveCamera(50, window.innerWidth / window.innerHeight, 0.1, 1000);
camera.position.set(0, 7, 10);

const renderer = new THREE.WebGLRenderer({ antialias: true });
renderer.setSize(window.innerWidth, window.innerHeight);
renderer.setPixelRatio(window.devicePixelRatio);
document.body.appendChild(renderer.domElement);

const controls = new OrbitControls(camera, renderer.domElement);
controls.enableDamping = true;

// Lighting
const ambient = new THREE.AmbientLight(0xffffff, 0.1);
scene.add(ambient);

const light = new THREE.SpotLight(0xff0000, 100);
light.position.set(0, 10, 0);
scene.add(light);

// Deck Model
const decks = [];
const createDeck = (x) => {
    const group = new THREE.Group();
    group.position.x = x;
    
    const body = new THREE.Mesh(new THREE.BoxGeometry(4, 0.5, 6), new THREE.MeshStandardMaterial({color: 0x111111}));
    const platter = new THREE.Mesh(new THREE.CylinderGeometry(1.6, 1.6, 0.2, 32), new THREE.MeshStandardMaterial({color: 0x050505}));
    platter.position.y = 0.3;
    
    group.add(body);
    group.add(platter);
    scene.add(group);
    decks.push(platter);
};

createDeck(-2.5);
createDeck(2.5);

function animate() {
    requestAnimationFrame(animate);
    decks.forEach(d => d.rotation.y += 0.05); // Perpetual movement
    controls.update();
    renderer.render(scene, camera);
}

window.addEventListener('resize', () => {
    camera.aspect = window.innerWidth / window.innerHeight;
    camera.updateProjectionMatrix();
    renderer.setSize(window.innerWidth, window.innerHeight);
});

animate();
