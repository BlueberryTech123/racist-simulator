import * as THREE from 'three';
import { GLTFLoader } from 'three/addons/loaders/GLTFLoader.js';
import { ParticleSystem, DeathTypes } from './particles.mjs';

const loader = new GLTFLoader();
const scene = new THREE.Scene();
const camera = new THREE.PerspectiveCamera(45, window.innerWidth / window.innerHeight, 0.1, 1000);

const renderer = new THREE.WebGLRenderer();
renderer.setSize(window.innerWidth, window.innerHeight);
renderer.setPixelRatio(1.5);
document.body.appendChild(renderer.domElement);

const directional = new THREE.DirectionalLight(0xffffff, 3.5);
directional.position.set(-1, 5, -1);
scene.add(directional);

const ambient = new THREE.AmbientLight(0x4a4369, 4);
scene.add(ambient);

scene.add(camera);

// ==============================================================

function lerp(a, b, i) {
	return a + i * (b - a);
}
function clamp(v, a, b) {
	return Math.max(a, Math.min(v, b));
}
function loadTexture(path, flipped = false) {
    let texture = new THREE.TextureLoader().load(path);
    texture.wrapS = texture.wrapT = THREE.RepeatWrapping;
    texture.minFilter = texture.magFilter = THREE.NearestFilter;
    texture.colorSpace = THREE.SRGBColorSpace;
	if (flipped) {
		texture.flipY = true;
	}
	texture.needsUpdate = true;
    return texture;
}
var pressedKeys = {};
window.onkeyup = function(event) { pressedKeys[event.key] = false; }
window.onkeydown = function(event) { pressedKeys[event.key] = true; }

// ==============================================================

const cameraVector = new THREE.Vector3(1, -1.25, 1).normalize();
camera.lookAt(cameraVector);
const cameraDistance = 15;
const player = new THREE.Object3D();
const frontWheels = [];
const backWheels = [];
let speed = 0;
let acceleration = 5;
let maxSpeed = 14;
const turnSpeed = 2 * Math.PI / 3
scene.add(player);

const vehicleMaterials = {
	red: new THREE.MeshToonMaterial({ map: loadTexture("textures/vehicles/blue.png", true) })
}

// load vehicle
loader.load("sedan.gltf", (gltf) => {
	gltf.scene.traverse((object) => {
		if (object.isMesh) {
			object.material = vehicleMaterials.red;
			if (object.name.includes("Front")) {
				frontWheels.push(object);
			}
			else if (object.name.includes("Back")) {
				const tireSmoke = new ParticleSystem(
					new THREE.SphereGeometry(0.2, 4, 8), new THREE.MeshToonMaterial(), 0.035, 0.75, new THREE.Vector3(0, 0, 0),
					new THREE.Vector3(0, 0.007, 0), 0.01, DeathTypes.SHRINK, false
				);
				backWheels.push({ object: object, particles: tireSmoke });
				scene.add(tireSmoke);
			}
		}
	});
	gltf.scene.scale.set(2, 2, 2);
	player.add(gltf.scene);
});

const clock = new THREE.Clock();
const axesHelper = new THREE.AxesHelper( 2.5 );
scene.add( axesHelper );

const track = new THREE.Mesh(new THREE.PlaneGeometry(128, 128), new THREE.MeshToonMaterial({ color: 0xa5b85e }));
track.rotation.x = -Math.PI / 2;
scene.add(track);


// update() runs every frame
function update() {
	requestAnimationFrame(update);
	const delta = clock.getDelta();

	// update player
	let rotationMultiplier = 0;
	let accelerationMultiplier = 0;

	if (pressedKeys.a || pressedKeys.A) rotationMultiplier++;
	if (pressedKeys.d || pressedKeys.D) rotationMultiplier--;
	if (pressedKeys.w || pressedKeys.W) accelerationMultiplier++;
	if (pressedKeys.s || pressedKeys.S) accelerationMultiplier--;

	if (accelerationMultiplier == 0) {
		// slow down
		if (speed < 0) {
			speed = clamp(speed + 3.5 * delta, -maxSpeed, 0);
		}
		else if (speed > 0) {
			speed = clamp(speed - 3.5 * delta, 0, maxSpeed);
		}
	}
	else {
		// speed up
		speed += acceleration * accelerationMultiplier * delta;
	}
	let negativeWork = accelerationMultiplier != 0 && speed && Math.sign(speed) != Math.sign(accelerationMultiplier);
	speed = clamp(speed, -maxSpeed, maxSpeed);
	player.rotation.y += rotationMultiplier * turnSpeed * delta * clamp(speed / 5, -1, 1);
	const playerForward = new THREE.Vector3();
	player.getWorldDirection(playerForward);
	playerForward.multiplyScalar(speed * delta);
	player.position.add(playerForward);

	for (let i = 0; i < frontWheels.length; i++) {
		const cur = frontWheels[i];
		cur.rotation.y = lerp(cur.rotation.y, rotationMultiplier * Math.PI / 6, 0.3);
	}
	for (let i = 0; i < backWheels.length; i++) {
		const cur = backWheels[i];
		cur.object.getWorldPosition(cur.particles.position);
		cur.particles.position.y = 0;
		cur.particles.update(delta);
	}

	// update camera
	const vector = new THREE.Vector3();
	camera.getWorldDirection(vector);
	vector.multiplyScalar(-cameraDistance);

	camera.position.copy(player.position);
	camera.position.add(vector);

	renderer.render(scene, camera);
}

update();