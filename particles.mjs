import * as THREE from 'three';

const DeathTypes = Object.freeze({
    NONE: 0,
    SHRINK: 1, EXPAND: 2
})

function ParticleSystem(geometry, material, secondsPerSpawn, lifetime, initialVelocity, acceleration, radius, deathType = DeathTypes.NONE, emitting = true) {
    let object = new THREE.Object3D();
    let curParticles = [];
    let timeSinceSystemSpawn = 0.0;

    function spawn() {
        console.log("doing")
        const particle = new THREE.Mesh(geometry, material);
        particle.position.copy(object.position);
        particle.position.add(
            new THREE.Vector3((Math.random() * 2 - 1) * radius, (Math.random() * 2 - 1) * radius, (Math.random() * 2 - 1) * radius));
        particle.userData = {
            timeSinceSpawn: 0.0, velocity: initialVelocity.clone(), onHitlist: false
        };
        object.parent.add(particle);
        curParticles.push(particle);
    }

    function emit(amount) {
        for (let i = 0; i < amount; i++) spawn();
    }

    function update(delta) {
        if (!emitting) return;

        timeSinceSystemSpawn += delta;

        if (timeSinceSystemSpawn >= secondsPerSpawn) {
            timeSinceSystemSpawn = 0;
            spawn();
        }
        
        let hitlist = [];
        const localAcceleration = acceleration.clone().multiplyScalar(delta);

        for (let i = 0; i < curParticles.length; i++) {
            const cur = curParticles[i];
            const timeSinceSpawn = cur.userData.timeSinceSpawn;
            // update visually
            cur.position.add(cur.userData.velocity);
            if (deathType == DeathTypes.SHRINK) {
                cur.scale.set(1 - timeSinceSpawn / lifetime, 1 - timeSinceSpawn / lifetime, 1 - timeSinceSpawn / lifetime);
            }
            else if (deathType == DeathTypes.EXPAND) {
                cur.scale.set(1 + timeSinceSpawn / lifetime, 1 + timeSinceSpawn / lifetime, 1 + timeSinceSpawn / lifetime);
            }

            cur.userData.timeSinceSpawn += delta;
            cur.userData.onHitlist = timeSinceSpawn + delta >= lifetime;
            cur.userData.velocity.add(localAcceleration);
            cur.position.add(cur.userData.velocity);
        }

        if (curParticles.length > 0) { // assasinate particles accordingly >:)
            let first = curParticles[0];
            while (first.userData.onHitlist) {
                first.parent.remove(first);
                curParticles.shift();

                first = curParticles[0];
            }
        }
    }

    object.update = update;
    object.emit = emit;

    return object;
}

export { DeathTypes, ParticleSystem };