import * as THREE from 'three';

const materials = {
    zombieBody: new THREE.MeshToonMaterial({ color: 0x6b6256 }),
    zombieHead: new THREE.MeshToonMaterial({ color: 0x999966 })
}

const enemyRadius = 0.2;

function Zombie(target, enemies, speed = 2.75) {
    let object = new THREE.Object3D();
    const body = new THREE.Mesh(new THREE.CapsuleGeometry(0.13, 0.2, 8), materials.zombieBody);
    body.position.set(0, 0.1 + 0.3 / 2, 0);
    const head = new THREE.Mesh(new THREE.SphereGeometry(0.13, 8, 4), materials.zombieHead);
    head.position.set(0, 0.1 + 0.3 + 0.125, 0);
    object.add(body);
    object.add(head);

    let timeElapsed = Math.random() * 5;
    
    function collision() {
        if (object.position.distanceTo(target.position) <= enemyRadius + 0.75) {
            return true;
        }

        for (const cur of enemies.keys()) {
            if (cur == object) continue;
            if (object.position.distanceTo(cur.position) <= enemyRadius * 2) {
                return true;
            }
        }
        return false;
    }

    function update(delta) {
        timeElapsed += delta;

        const movementVector = target.position.clone().sub(object.position);
        movementVector.y = 0;
        movementVector.normalize().multiplyScalar(delta * speed);

        let collisions = 0;
        object.position.x += movementVector.x;
        if (collision()) {
            collisions++;
            object.position.x -= movementVector.x;
        }
        object.position.z += movementVector.z;
        if (collision()) {
            collisions++;
            object.position.z -= movementVector.z;
        }
        object.position.y = Math.abs(Math.sin(timeElapsed * 10)) * 0.1;
    }

    object.update = update;

    return object;
}

export { enemyRadius, Zombie };