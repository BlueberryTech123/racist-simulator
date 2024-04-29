import * as THREE from 'three';

const scene = new THREE.Scene();
const camera = new THREE.PerspectiveCamera(55, window.innerWidth / window.innerHeight, 0.1, 1000);

const renderer = new THREE.WebGLRenderer();
renderer.setSize(window.innerWidth, window.innerHeight);
document.body.appendChild(renderer.domElement);

const directional = new THREE.DirectionalLight(0xffffff, 3.5);
directional.position.set(-0.2, 1, -0.2);
scene.add(directional);

const ambient = new THREE.AmbientLight(0x4a4369, 1);
scene.add(ambient);

scene.add(camera);

// ==============================================================

function lerp(a, b, i) {
	return a + i * (b - a);
}
function clamp(v, a, b) {
	return Math.max(a, Math.min(v, b));
}
function loadTexture(path) {
    let texture = new THREE.TextureLoader().load(path);
    texture.wrapS = texture.wrapT = THREE.RepeatWrapping;
    texture.minFilter = texture.magFilter = THREE.NearestFilter;
    texture.colorSpace = THREE.SRGBColorSpace;
    texture.needsUpdate = true;
    return texture;
}
var pressedKeys = {};
window.onkeyup = function(event) { pressedKeys[event.key] = false; }
window.onkeydown = function(event) { pressedKeys[event.key] = true; }

// ==============================================================

const cameraVector = new THREE.Vector3(1, -1, 1).normalize();
camera.lookAt(cameraVector);
const cameraDistance = 15;
const player = new THREE.Mesh(new THREE.BoxGeometry(1, 1, 2), new THREE.MeshNormalMaterial());
player.position.y = 0.5;
let speed = 0;
let acceleration = 5;
let maxSpeed = 14;
const turnSpeed = 2 * Math.PI / 3
scene.add(player);

const clock = new THREE.Clock();
const axesHelper = new THREE.AxesHelper( 2.5 );
scene.add( axesHelper );

const track = new THREE.Mesh(new THREE.PlaneGeometry(128, 128), new THREE.MeshBasicMaterial({ map: loadTexture("testtrack.jpg") }));
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
	speed = clamp(speed, -maxSpeed, maxSpeed);
	player.rotation.y += rotationMultiplier * turnSpeed * delta * clamp(speed, -1, 1);
	const playerForward = new THREE.Vector3();
	player.getWorldDirection(playerForward);
	playerForward.multiplyScalar(speed * delta);
	player.position.add(playerForward);

	// update camera
	const vector = new THREE.Vector3();
	camera.getWorldDirection(vector);
	vector.multiplyScalar(-cameraDistance);

	camera.position.copy(player.position);
	camera.position.add(vector);

	renderer.render(scene, camera);
}

update();