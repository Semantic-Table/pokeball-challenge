import { useEffect, useState } from "react";
import useGame from "./stores/useGame";

import { useFrame } from "@react-three/fiber";
import { particleMaterial } from "./materials";



export default function Particles({ position, id, type }) {

    const [particlesPositions, setParticlesPositions] = useState(null);
    const [particlesVelocities, setParticlesVelocities] = useState(null);
    const [myParticlesMaterial, setMyParticlesMaterial] = useState(particleMaterial.clone());

    const particlesCount = 100;

    useEffect(() => {

        const randomParticlesPositions = new Float32Array(particlesCount * 3);
        const randomParticlesVelocities = new Float32Array(particlesCount);

        for (let i = 0; i < particlesCount; i++) {
            const i3 = i * 3;

            randomParticlesPositions[i3] = (Math.random() - 0.5) * 0.01 * (type + 1) ;
            randomParticlesPositions[i3 + 1] = (Math.random() - 0.5) * 0.01 * (type + 1);
            randomParticlesPositions[i3 + 2] = (Math.random() - 0.5) * 0.01 * (type + 1);

            randomParticlesVelocities[i] = Math.random();
        }

        setParticlesPositions(randomParticlesPositions)
        setParticlesVelocities(randomParticlesVelocities)
        setTimeout(() => {
            useGame.getState().removeParticle(id)
        }, 200);
    }, [])

    useFrame((state, delta) => {
        if (myParticlesMaterial) {

            myParticlesMaterial.uniforms.uTime.value += delta;
        }
    })
    return (<>
        {
            particlesPositions && myParticlesMaterial && particlesVelocities ?
            <points position={position} material={myParticlesMaterial}>
                < bufferGeometry >
                    <bufferAttribute
                        attach='attributes-position'
                        count={particlesCount}
                        itemSize={3}
                        array={particlesPositions}
                    />
                    <bufferAttribute
                        attach='attributes-aVelocity'
                        count={particlesCount}
                        itemSize={1}
                        array={particlesVelocities}
                    />
                </bufferGeometry >
            </points> : null}
    </>
    );
};