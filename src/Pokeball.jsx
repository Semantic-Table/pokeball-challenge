import { RigidBody } from "@react-three/rapier";
import { useEffect, useRef, useState } from "react";
import * as THREE from "three";
import useGame from "./stores/useGame";
import { useTexture } from "@react-three/drei";
import * as Texture from "./materials";
import { useFrame } from "@react-three/fiber";


export function Pokeball({ type, position, onCollisionEnter, pokeballId }) {

    const [material, setMaterial] = useState(typeToMaterial(type))
    const ball = useRef()
    const addScore = useGame(state => state.addScore)

    const [timeToActive, setTimeToActive] = useState(0);

    const isInBounds = (parentPosition) => {
        return parentPosition.y < 4 && parentPosition.x > -2 && parentPosition.x < 2 && parentPosition.z > -1.2 && parentPosition.z < 1.2
    }

    useFrame((state, delta) => {
        if (timeToActive < 2000) {
            setTimeToActive(timeToActive + delta * 1000)
        }
        if (ball.current && !isInBounds(ball.current.parent.position) && timeToActive >= 2000) {
            useGame.getState().end()
        }
        if (ball.current && !isInBounds(ball.current.parent.position)) {
            if (!useGame.getState().pokeballsOutOfBounds.includes(pokeballId)) {
                useGame.getState().pushPokeball(pokeballId)
            }
        } else {
            if (useGame.getState().pokeballsOutOfBounds.includes(pokeballId)) {
                useGame.getState().removePokeball(pokeballId)
            }
        }
    })


    useEffect(() => {

        addScore(typeToScore(type))

        return () => {
            if (useGame.getState().pokeballsOutOfBounds.includes(pokeballId)) {
                useGame.getState().removePokeball(pokeballId)
            }
        }
    }, [])

    return <>
        <RigidBody
            name={type}

            pokeballId={pokeballId}
            onCollisionEnter={({ manifold, target, other }) => {
                onCollisionEnter(manifold, target, other)
            }}
            position={position}
            colliders={'ball'}
            scale={adaptScale(type)}
        >
            <mesh geometry={sphereGeometry} material={material} ref={ball}>
            </mesh>
        </RigidBody>
    </>
}




export const PokeballType = {
    POKEBALL: 0,
    SUPERBALL: 1,
    HYPERBALL: 2,
    RAPIDEBALL: 3,
    SAFARIBALL: 4,
    SOINBALL: 5,
    HONORBALL: 6,
    LUXEBALL: 7,
    SOMBREBALL: 8,
    ETRANGEBALL: 9,
    MASTERBALL: 10,
}

const typeToScore = (type) => {
    switch (type) {
        case PokeballType.POKEBALL:
            return 1
        case PokeballType.SUPERBALL:
            return 2
        case PokeballType.HYPERBALL:
            return 4
        case PokeballType.RAPIDEBALL:
            return 6
        case PokeballType.SAFARIBALL:
            return 12
        case PokeballType.SOINBALL:
            return 20
        case PokeballType.HONORBALL:
            return 28
        case PokeballType.LUXEBALL:
            return 36
        case PokeballType.SOMBREBALL:
            return 44
        case PokeballType.ETRANGEBALL:
            return 52
        case PokeballType.MASTERBALL:
            return 110
        default:
            return 1
    }
}

export const sphereGeometry = new THREE.SphereGeometry(0.2, 16, 16)
export const basicMaterial = new THREE.MeshBasicMaterial({
    toneMapped: false,
})




export const adaptScale = (type) => {
    return (type + 5) * 0.3
}

export const typeToColor = (type) => {
    switch (type) {
        case PokeballType.POKEBALL:
            return 0xff0000
        case PokeballType.SUPERBALL:
            return 0x00ff00
        case PokeballType.HYPERBALL:
            return 0x0000ff
        case PokeballType.RAPIDEBALL:
            return 0xffff00
        case PokeballType.SAFARIBALL:
            return 0xff00ff
        case PokeballType.SOINBALL:
            return 0x00ffff
        case PokeballType.HONORBALL:
            return 0x000000
        case PokeballType.LUXEBALL:
            return 0x808080
        case PokeballType.SOMBREBALL:
            return 0x800000
        case PokeballType.ETRANGEBALL:
            return 0x008000
        case PokeballType.MASTERBALL:
            return 0x000080
        default:
            return 0xff0000
    }
}

export const typeToMaterial = (type) => {
    switch (type) {
        case PokeballType.POKEBALL:
            return Texture.pokeballMaterial
        case PokeballType.SUPERBALL:
            return Texture.superballMaterial
        case PokeballType.HYPERBALL:
            return Texture.hyperballMaterial
        case PokeballType.RAPIDEBALL:
            return Texture.rapideballMaterial
        case PokeballType.SAFARIBALL:
            return Texture.safariballMaterial
        case PokeballType.SOINBALL:
            return Texture.soinballMaterial
        case PokeballType.HONORBALL:
            return Texture.honorballMaterial
        case PokeballType.LUXEBALL:
            return Texture.luxeballMaterial
        case PokeballType.SOMBREBALL:
            return Texture.sombreballMaterial
        case PokeballType.ETRANGEBALL:
            return Texture.etrangeballMaterial
        case PokeballType.MASTERBALL:
            return Texture.masterballMaterial
        default:
            return Texture.pokeballMaterial

    }
}