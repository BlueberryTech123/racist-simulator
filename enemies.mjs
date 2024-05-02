import * as THREE from 'three';

function Zombie() {
    let object = new THREE.Object3D();
    const body = new THREE.Mesh(new THREE.CapsuleGeometry(0.15, 0.2, 8), new THREE.MeshNormalMaterial);
    body.position.set(0, 0.1 + 0.3 / 2, 0);
    const head = new THREE.Mesh(new THREE.SphereGeometry(0.125, 8, 4), new THREE.MeshNormalMaterial);
    head.position.set(0, 0.1 + 0.3 + 0.15, 0);
    object.add(body);
    object.add(head);

    return object;
}

export { Zombie };