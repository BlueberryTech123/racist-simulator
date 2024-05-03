import * as THREE from 'three';

const materials = {
    zombieBody: new THREE.MeshToonMaterial({ color: 0x666699 }),
    zombieHead: new THREE.MeshToonMaterial({ color: 0x999966 })
}

function Zombie(target, enemies, speed = 2.75) {
    let object = new THREE.Object3D();
    const body = new THREE.Mesh(new THREE.CapsuleGeometry(0.15, 0.2, 8), materials.zombieBody);
    body.position.set(0, 0.1 + 0.3 / 2, 0);
    const head = new THREE.Mesh(new THREE.SphereGeometry(0.125, 8, 4), materials.zombieHead);
    head.position.set(0, 0.1 + 0.3 + 0.15, 0);
    object.add(body);
    object.add(head);

    let timeElapsed = Math.random() * 5;
    
    function collision() {
        for (let i = 0; i < enemies.length; i++) {
            const cur = enemies[i];
            if (cur == object) continue;
            if (object.position.distanceTo(cur.position) <= 0.4) {
                return true;
            }
        }
        return false;
    }

    function update(delta) {
        timeElapsed += delta;

        object.position.y = Math.abs(Math.sin(timeElapsed * 10)) * 0.1;    
        const movementVector = target.position.clone().sub(object.position);
        movementVector.y = 0;
        movementVector.normalize().multiplyScalar(delta * speed);

        object.position.x += movementVector.x;
        if (collision()) {
            object.position.x -= movementVector.x;
        }
        object.position.z += movementVector.z;
        if (collision()) {
            object.position.z -= movementVector.z;
        }
    }

    object.update = update;

    return object;
}

export { Zombie };