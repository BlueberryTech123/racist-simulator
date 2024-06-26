import * as THREE from 'three';
import { GLTFLoader } from 'three/addons/loaders/GLTFLoader.js';
import { ParticleSystem, DeathTypes } from './particles.mjs';
import { Zombie } from './enemies.mjs';
import { lerp, clamp, loadTexture } from './util.mjs';

const loader = new GLTFLoader();
const scene = new THREE.Scene();
const camera = new THREE.PerspectiveCamera(45, window.innerWidth / window.innerHeight, 0.1, 1000);

const padding = 30;

const renderer = new THREE.WebGLRenderer();
renderer.setSize(window.innerWidth - padding * 2, window.innerHeight - padding * 2);
renderer.setPixelRatio(1.5);
document.body.appendChild(renderer.domElement);

const directional = new THREE.DirectionalLight(0xffffff, 3.5);
directional.position.set(-1, 5, -1);
scene.add(directional);

const ambient = new THREE.AmbientLight(0x4a4369, 4);
scene.add(ambient);

scene.add(camera);

// ==============================================================

var pressedKeys = {};
window.onkeyup = function(event) { pressedKeys[event.key] = false; }
window.onkeydown = function(event) { pressedKeys[event.key] = true; }

// ==============================================================

const cameraVector = new THREE.Vector3(1, -1, 1).normalize();
camera.lookAt(cameraVector);
const cameraDistance = 15;
const player = new THREE.Object3D();
const frontWheels = [];
const backWheels = [];
let activeProjectiles = [];
let timeLeft = 0;
let speed = 0;
let acceleration = 5;
let maxSpeed = 10;
const turnSpeed = 2 * Math.PI / 3
scene.add(player);

const vehicleMaterials = {
	red: new THREE.MeshToonMaterial({ map: loadTexture("textures/vehicles/blue.png", true) })
}
const cargoMaterials = [
	new THREE.MeshToonMaterial({ color: 0x997272 }),
	new THREE.MeshToonMaterial({ color: 0x666699 }),
	new THREE.MeshToonMaterial({ color: 0x999966 })
]
const materials = {
	tireSmoke: new THREE.MeshToonMaterial({ color: 0xebd893 }),
	tireTrails: new THREE.MeshToonMaterial({ color: 0x333333, transparent: true, opacity: 0.1 }),
	cargoStrap: new THREE.MeshToonMaterial({ color: 0x545454 }),
	projectile: new THREE.MeshBasicMaterial({ color: 0xffffcc }),
	projectileOutline: new THREE.MeshBasicMaterial({ color: 0xff9900, side: THREE.BackSide }),
	projectileSmoke: new THREE.MeshBasicMaterial({ color: 0x333333 })
}
let enemies = new Set([]);
const spawnTick = 0.7;
let spawnTimer = 0;

function spawnEnemy() {
	const newEnemy = new Zombie(player, enemies);
	const theta = Math.random(2 * Math.PI)
	newEnemy.position.set(player.position.x + Math.sin(theta) * 30, 0, player.position.z + Math.cos(theta) * 30);
	scene.add(newEnemy);
	enemies.add(newEnemy);
}
// for (let i = 0; i < 25; i++) spawnEnemy();

function loadCargo(amount) {
	const init = 0.55;
	const boxHeight = 0.15;
	for (let i = 0; i < amount; i++) {
		const width = 0.3 + Math.random() * 0.6 / (i + 1);
		const length = 0.3 + Math.random() * 0.6 / (i + 1);
		const crateGeometry = new THREE.BoxGeometry(
			width, boxHeight, length);
		const crate = new THREE.Mesh(crateGeometry, cargoMaterials[i % cargoMaterials.length]);
		player.add(crate);
		crate.position.set(0, init + (i + 1) * boxHeight, -0.1);
		crate.rotation.y = Math.random() * 2 * Math.PI;

		const strap1 = new THREE.Mesh(new THREE.BoxGeometry(width + 0.02, boxHeight + 0.02, 0.04), materials.cargoStrap);
		const strap2 = new THREE.Mesh(new THREE.BoxGeometry(0.04, boxHeight + 0.02, length + 0.02), materials.cargoStrap);

		crate.add(strap1); strap1.position.set(0, 0, 0);
		crate.add(strap2); strap2.position.set(0, 0, 0);
	}
}

// load vehicle
loader.load("sedan.gltf", (gltf) => {
	gltf.scene.traverse((object) => {
		if (object.isMesh) {
			object.material = vehicleMaterials.red;
			if (object.name.includes("Front")) {
				const tireSmoke = new ParticleSystem(
					new THREE.SphereGeometry(0.25, 8, 4), materials.tireSmoke, 0.05, 1.25, new THREE.Vector3(0, 0, 0),
					new THREE.Vector3(0, 0, 0), 0.05, DeathTypes.SHRINK, true
				);
				const tireTrails = new ParticleSystem(
					new THREE.PlaneGeometry(0.25, 0.25), materials.tireTrails, 0.025, 7.5, new THREE.Vector3(0, 0, 0), new THREE.Vector3(0, 0, 0), 0, DeathTypes.SHRINK, true, new THREE.Euler(-Math.PI / 2, 0, 0)
				);
				frontWheels.push({ object: object, particles: tireSmoke, trails: tireTrails });
				scene.add(tireSmoke);
				scene.add(tireTrails);
			}
			else if (object.name.includes("Back")) {
				const tireSmoke = new ParticleSystem(
					new THREE.SphereGeometry(0.25, 8, 4), materials.tireSmoke, 0.05, 1.25, new THREE.Vector3(0, 0, 0),
					new THREE.Vector3(0, 0, 0), 0.05, DeathTypes.SHRINK, true
				);
				const tireTrails = new ParticleSystem(
					new THREE.PlaneGeometry(0.25, 0.25), materials.tireTrails, 0.025, 7.5, new THREE.Vector3(0, 0, 0), new THREE.Vector3(0, 0, 0), 0, DeathTypes.SHRINK, true, new THREE.Euler(-Math.PI / 2, 0, 0)
				);
				backWheels.push({ object: object, particles: tireSmoke, trails: tireTrails });
				scene.add(tireSmoke);
				scene.add(tireTrails);
			}
		}
	});
	loadCargo(5);
	gltf.scene.scale.set(2, 2, 2);
	player.add(gltf.scene);
});

const clock = new THREE.Clock();
// const axesHelper = new THREE.AxesHelper( 2.5 );
// scene.add( axesHelper );

const ground = new THREE.Mesh(new THREE.PlaneGeometry(128, 128), new THREE.MeshToonMaterial({ color: 0xdcc984 }));
// const track = new THREE.Mesh(new THREE.PlaneGeometry(128, 128), new THREE.MeshToonMaterial({ map: loadTexture("testtrack.jpg") }));
ground.rotation.x = -Math.PI / 2;
scene.add(ground);

const enemiesCount = document.querySelector("#enemies");
const projectilesCount = document.querySelector("#projectiles");

// update() runs every frame
function update() {
	requestAnimationFrame(update);
	const delta = clock.getDelta();
	renderer.setSize(window.innerWidth - padding * 2, window.innerHeight - padding * 2);

	// update enemies
	spawnTimer -= delta;
	spawnTimer = Math.max(0, spawnTimer);
	if (spawnTimer == 0) {
		spawnTimer = spawnTick;
		if (enemies.size < 45) {
			spawnEnemy();
			console.log(enemies);
		}
	}
	let hitlist = [];
	for (const cur of enemies.keys()) {
		if (cur.position.distanceTo(player.position) >= 80) {
			hitlist.push(cur);
		}
	}
	for (const cur of hitlist) {
		enemies.delete(cur);
	}

	// update projectile timer
	timeLeft = clamp(timeLeft - delta, 0, 1000);
	if (pressedKeys[" "] && timeLeft == 0) {
		const projectile = new THREE.Mesh(new THREE.SphereGeometry(0.5, 8, 4), materials.projectile);
		scene.add(projectile);
		timeLeft += 0.15;
		projectile.scale.set(0.25, 0.25, 1);
		projectile.position.copy(player.position);
		projectile.position.y = 0.15;
		projectile.rotation.copy(player.rotation);
		// const projectileOutline = new THREE.Mesh(new THREE.SphereGeometry(0.5, 8, 4), materials.projectileOutline);
		// projectile.add(projectileOutline);
		// projectileOutline.position.set(0, 0, 0);
		// projectileOutline.scale.set(1.5, 1.5, 1.5);

		projectile.userData.timeLeft = 10;
		projectile.userData.initialVelocity = speed;

		activeProjectiles.push(projectile);
	}
	for (let i = 0; i < activeProjectiles.length; i++) {
		const cur = activeProjectiles[i];
		const vector = new THREE.Vector3(0, 0, 0);
		cur.getWorldDirection(vector);
		vector.multiplyScalar(delta * (22.5 + cur.userData.initialVelocity));
		cur.position.add(vector);
		cur.userData.timeLeft -= delta;
		// alert(JSON.stringify(cur.position));
	}
	if (activeProjectiles.length > 0) {
		let firstProjectile = activeProjectiles[0];
		while (firstProjectile.userData.timeLeft <= 0) {
			activeProjectiles.shift();
			if (activeProjectiles.length > 0) {
				firstProjectile = activeProjectiles[0];
			} else break;
		}
	}

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
	player.rotation.z = lerp(player.rotation.z, -rotationMultiplier * 0.08, 0.2);

    const emitDust = Math.abs(speed) >= 1;

	for (let i = 0; i < frontWheels.length; i++) {
		const cur = frontWheels[i];
		cur.object.rotation.y = lerp(cur.object.rotation.y, rotationMultiplier * Math.PI / 6, 0.3);
		cur.object.getWorldPosition(cur.particles.position);
		cur.particles.position.y = 0;
		cur.particles.emitting = emitDust;
		cur.particles.update(delta);

		cur.object.getWorldPosition(cur.trails.position);
		cur.trails.position.y = 0.001;
		cur.trails.emitting = negativeWork;
		cur.trails.update(delta);
	}
	for (let i = 0; i < backWheels.length; i++) {
		const cur = backWheels[i];
		cur.object.getWorldPosition(cur.particles.position);
		cur.particles.position.y = 0;
		cur.particles.emitting = emitDust;
		cur.particles.update(delta);

		cur.object.getWorldPosition(cur.trails.position);
		cur.trails.position.y = 0.001;
		cur.trails.emitting = negativeWork;
		cur.trails.update(delta);
	}

	// update camera
	const vector = new THREE.Vector3();
	camera.getWorldDirection(vector);
	vector.multiplyScalar(-cameraDistance);

	camera.position.copy(player.position);
	camera.position.add(vector);

	// update ground
	ground.position.x = player.position.x;
	ground.position.z = player.position.z;

	for (const cur of enemies.keys()) {
		cur.update(delta);
	}

	enemiesCount.innerText = enemies.size;
	projectilesCount.innerText = activeProjectiles.length;

	renderer.render(scene, camera);
}

update();