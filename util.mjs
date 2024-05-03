import * as THREE from 'three';

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

export { lerp, clamp, loadTexture }