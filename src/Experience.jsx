import { ContactShadows, Environment, OrbitControls, useKeyboardControls } from "@react-three/drei"
import { useFrame, useThree } from "@react-three/fiber"
import { Bloom, EffectComposer, Vignette } from "@react-three/postprocessing"
import { useEffect, useRef, useState } from "react"
import * as THREE from "three"
import Playground from "./Playground"
import { Pokeball, PokeballType, adaptScale, sphereGeometry, typeToMaterial } from "./Pokeball"
import useGame from "./stores/useGame"

const horizontalBorder = 1.6
const verticalBorder = 0.8
const moveSpeed = 4

const _forward = new THREE.Vector3()
const _right = new THREE.Vector3()
const _worldUp = new THREE.Vector3(0, 1, 0)
const _move = new THREE.Vector3()

export default function Experience() {

    const pokeballToPlace = useRef()
    const reticule = useRef()

    const [sub, get] = useKeyboardControls()

    const [pokeballs, setPokeballs] = useState([])

    const [dropPressed, setDropPressed] = useState()

    const [pokeballType, setPokeballType] = useState(PokeballType.POKEBALL)

    const [material, setMaterial] = useState(typeToMaterial(pokeballType))

    const { camera } = useThree()

    const pokeballsOutOfBounds = useGame(state => state.pokeballsOutOfBounds);

    useEffect(() => {
        camera.position.set(0, 5, 8)
    }, [])

    useEffect(() => {
        setMaterial(typeToMaterial(pokeballType))
    }, [pokeballType])

    const onPokeballCollide = (manifold, target, other) => {

        const collisionPosition = manifold.solverContactPoint(0)
        if (other.rigidBodyObject && other.rigidBodyObject.name === target.rigidBodyObject.name) {

            const averagePosition = [
                (collisionPosition.x + other.rigidBodyObject.position.x) / 2,
                (collisionPosition.y + other.rigidBodyObject.position.y) / 2,
                (collisionPosition.z + other.rigidBodyObject.position.z) / 2
            ]
            const newType = target.rigidBodyObject.name === 10 ? 0 : target.rigidBodyObject.name + 1

            const newPokeballs = pokeballs.filter((pokeball) => {
                return pokeball.key !== other.rigidBodyObject.pokeballId && pokeball.key !== target.rigidBodyObject.pokeballId
            })

            const newPokeball = {
                position: averagePosition,
                type: newType,
                key: Math.random()
            }

            setPokeballs([...newPokeballs, newPokeball])
        }
    }


    useFrame(({ camera }, delta) => {

        if (useGame.getState().phase === 'playing') {

            camera.getWorldDirection(_forward)
            _forward.y = 0
            if (_forward.lengthSq() > 0) _forward.normalize()
            _right.copy(_forward).cross(_worldUp)

            let inputX = 0
            let inputZ = 0
            if (get().left)  inputX -= 1
            if (get().right) inputX += 1
            if (get().up)    inputZ += 1
            if (get().down)  inputZ -= 1

            if (inputX !== 0 || inputZ !== 0) {
                _move.set(0, 0, 0)
                    .addScaledVector(_right, inputX)
                    .addScaledVector(_forward, inputZ)
                    .normalize()
                    .multiplyScalar(moveSpeed * delta)

                const next = pokeballToPlace.current.position
                next.x = THREE.MathUtils.clamp(next.x + _move.x, -horizontalBorder, horizontalBorder)
                next.z = THREE.MathUtils.clamp(next.z + _move.z, -verticalBorder, verticalBorder)
                reticule.current.position.x = next.x
                reticule.current.position.z = next.z
            }

            if (get().drop && !dropPressed && pokeballsOutOfBounds.length === 0) {
                const positionToDrop = addRandomToPosition(pokeballToPlace.current.position);
                setDropPressed(true)
                setPokeballs([...pokeballs, {
                    position: [positionToDrop.x, positionToDrop.y, positionToDrop.z],
                    type: pokeballType,
                    key: Math.random()
                }])

                setPokeballType(randomInteger(0, 4))

            } else if (!get().drop && dropPressed) {
                setDropPressed(false)
            }
        } else if (useGame.getState().phase === 'ended') {

            if (get().restart) {
                setPokeballs([])
                useGame.getState().start()
            }
        }

    })


    return (
        <>
            <Environment files="./pokemon_center.hdr" background blur={0.15} />

            <ambientLight intensity={0.18} />
            <directionalLight
                position={[6, 9, 5]}
                intensity={0.55}
                color={'#ffe8c7'}
                castShadow
                shadow-mapSize={[1024, 1024]}
                shadow-camera-left={-6}
                shadow-camera-right={6}
                shadow-camera-top={6}
                shadow-camera-bottom={-6}
                shadow-bias={-0.0005}
            />

            <OrbitControls
                target={[0, 2, 0]}
                enableZoom={false}
                enablePan={false}
                enableDamping
                minPolarAngle={0.4}
                maxPolarAngle={Math.PI / 2 - 0.05}
                rotateSpeed={0.7}
            />

            <ContactShadows
                position={[0, 0.08, 0]}
                opacity={0.55}
                scale={9}
                blur={2.4}
                far={5}
                resolution={512}
            />

            <EffectComposer multisampling={4}>
                <Bloom
                    intensity={0.8}
                    luminanceThreshold={0.55}
                    luminanceSmoothing={0.25}
                    mipmapBlur
                />
                <Vignette eskil={false} offset={0.2} darkness={0.7} />
            </EffectComposer>
            <mesh
                ref={pokeballToPlace}
                position={[0, 4.5, 0]}
                geometry={sphereGeometry}
                material={material}
                scale={adaptScale(pokeballType)}
                castShadow
            />
            <group ref={reticule}>
                <mesh position={[0, 2.25, 0]}>
                    <cylinderGeometry args={[0.012, 0.012, 4.5, 16]} />
                    <meshBasicMaterial color={'#ffffff'} transparent opacity={0.45} />
                </mesh>
                <mesh position={[0, 0.13, 0]} rotation={[-Math.PI / 2, 0, 0]}>
                    <ringGeometry args={[0.18, 0.24, 48]} />
                    <meshBasicMaterial color={'#ffffff'} transparent opacity={0.85} toneMapped={false} />
                </mesh>
            </group>

            {pokeballs.map((pokeball) => {
                return <Pokeball key={pokeball.key} pokeballId={pokeball.key} type={pokeball.type} position={pokeball.position} onCollisionEnter={(manifold, target, other) => {
                    onPokeballCollide(manifold, target, other)
                }} />
            })}

            <Playground />
        </>
    )
}


const addRandomToPosition = (position) => {
    return {
        x: position.x + (Math.random() * 0.1 - 0.05),
        y: position.y + (Math.random() * 0.1 - 0.05),
        z: position.z + (Math.random() * 0.1 - 0.05)
    }
}


const randomInteger = (min, max) => {
    return Math.floor(Math.random() * (max - min + 1)) + min;
}
