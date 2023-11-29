import { useKeyboardControls } from "@react-three/drei"
import { useFrame, useThree } from "@react-three/fiber"
import { Bloom, EffectComposer } from "@react-three/postprocessing"
import { useEffect, useRef, useState } from "react"
import Playground from "./Playground"
import { Pokeball, PokeballType, adaptScale, sphereGeometry, typeToMaterial } from "./Pokeball"
import useGame from "./stores/useGame"
import Particles from "./Particles"

const horizontalBorder = 1.6
const verticalBorder = 0.8

export default function Experience() {

    const pokeballToPlace = useRef()
    const reticule = useRef()

    const [sub, get] = useKeyboardControls()

    const [pokeballs, setPokeballs] = useState([])

    const particles = useGame(state => state.particles)

    const [dropPressed, setDropPressed] = useState()

    const [rotateLeftPressed, setRotateLeftPressed] = useState(false)
    const [rotateRightPressed, setRotateRightPressed] = useState(false)

    const [pokeballType, setPokeballType] = useState(PokeballType.POKEBALL)

    const [material, setMaterial] = useState(typeToMaterial(pokeballType))

    const [rotation, setRotation] = useState(0)

    const { camera } = useThree()

    const pokeballsOutOfBounds = useGame(state => state.pokeballsOutOfBounds);

    useEffect(() => {
        camera.position.set(0, 4, 5)
        camera.lookAt(0, 2, 0)
    }, [])

    useEffect(() => {
        camera.position.x = 5 * Math.sin(rotation * (Math.PI / 180))
        camera.position.z = 5 * Math.cos(rotation * (Math.PI / 180))

        camera.lookAt(0, 2, 0)
    }, [rotation])

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

            const newParticles = {
                position: averagePosition,
                type: newType,
                key: Math.random()
            }

            useGame.getState().addParticle(newParticles);

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
        // CONTROLS

        if (useGame.getState().phase === 'playing') {

            if (get().rotateRight && !rotateRightPressed) {
                setRotation(rotateRight(rotation))
                setRotateRightPressed(true)
            }

            if (!get().rotateRight && rotateRightPressed) {
                setRotateRightPressed(false)
            }

            if (get().rotateLeft && !rotateLeftPressed) {
                setRotateLeftPressed(true)
                setRotation(rotateLeft(rotation))
            }

            if (!get().rotateLeft && rotateLeftPressed) {
                setRotateLeftPressed(false)
            }


            if (get().left && !get().right) {
                if (rotation === 0 && pokeballToPlace.current.position.x > -horizontalBorder) {
                    pokeballToPlace.current.position.x -= 4 * delta
                    reticule.current.position.x = pokeballToPlace.current.position.x
                } else if (rotation === 90 && pokeballToPlace.current.position.z < verticalBorder) {
                    pokeballToPlace.current.position.z += 4 * delta
                    reticule.current.position.z = pokeballToPlace.current.position.z
                } else if (rotation === 180 && pokeballToPlace.current.position.x < horizontalBorder) {
                    pokeballToPlace.current.position.x += 4 * delta
                    reticule.current.position.x = pokeballToPlace.current.position.x
                } else if (rotation === 270 && pokeballToPlace.current.position.z > -verticalBorder) {
                    pokeballToPlace.current.position.z -= 4 * delta
                    reticule.current.position.z = pokeballToPlace.current.position.z
                }
            }

            if (get().right && !get().left) {

                if (rotation === 0 && pokeballToPlace.current.position.x < horizontalBorder) {
                    pokeballToPlace.current.position.x += 4 * delta
                    reticule.current.position.x = pokeballToPlace.current.position.x
                } else if (rotation === 90 && pokeballToPlace.current.position.z > -verticalBorder) {
                    pokeballToPlace.current.position.z -= 4 * delta
                    reticule.current.position.z = pokeballToPlace.current.position.z
                }
                else if (rotation === 180 && pokeballToPlace.current.position.x > -horizontalBorder) {
                    pokeballToPlace.current.position.x -= 4 * delta
                    reticule.current.position.x = pokeballToPlace.current.position.x
                } else if (rotation === 270 && pokeballToPlace.current.position.z < verticalBorder) {
                    pokeballToPlace.current.position.z += 4 * delta
                    reticule.current.position.z = pokeballToPlace.current.position.z
                }
            }

            if (get().up && !get().down) {
                if (rotation === 0 && pokeballToPlace.current.position.z > -verticalBorder) {
                    pokeballToPlace.current.position.z -= 4 * delta
                    reticule.current.position.z = pokeballToPlace.current.position.z
                } else if (rotation === 90 && pokeballToPlace.current.position.x > -horizontalBorder) {
                    pokeballToPlace.current.position.x -= 4 * delta
                    reticule.current.position.x = pokeballToPlace.current.position.x
                } else if (rotation === 180 && pokeballToPlace.current.position.z < verticalBorder) {
                    pokeballToPlace.current.position.z += 4 * delta
                    reticule.current.position.z = pokeballToPlace.current.position.z
                } else if (rotation === 270 && pokeballToPlace.current.position.x < horizontalBorder) {
                    pokeballToPlace.current.position.x += 4 * delta
                    reticule.current.position.x = pokeballToPlace.current.position.x
                }

            }

            if (get().down && !get().up) {
                if (rotation === 0 && pokeballToPlace.current.position.z < verticalBorder) {
                    pokeballToPlace.current.position.z += 4 * delta
                    reticule.current.position.z = pokeballToPlace.current.position.z
                } else if (rotation === 90 && pokeballToPlace.current.position.x < horizontalBorder) {
                    pokeballToPlace.current.position.x += 4 * delta
                    reticule.current.position.x = pokeballToPlace.current.position.x
                } else if (rotation === 180 && pokeballToPlace.current.position.z > -verticalBorder) {
                    pokeballToPlace.current.position.z -= 4 * delta
                    reticule.current.position.z = pokeballToPlace.current.position.z
                } else if (rotation === 270 && pokeballToPlace.current.position.x > -horizontalBorder) {
                    pokeballToPlace.current.position.x -= 4 * delta
                    reticule.current.position.x = pokeballToPlace.current.position.x
                }

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
            <color attach="background" args={['#000000']} />
            <ambientLight />
            <EffectComposer>
                <Bloom
                    intensity={1} // The bloom intensity.
                    luminanceThreshold={0.99} // luminance threshold. Raise this value to mask out darker elements in the scene.
                />
            </EffectComposer>
            <mesh
                ref={pokeballToPlace}
                position={[0, 4.5, 0]}
                geometry={sphereGeometry}
                material={material}
                scale={adaptScale(pokeballType)}
            />
            <mesh ref={reticule} position={[0, 2.25, 0]}>
                <cylinderGeometry args={[0.01, 0.01, 4.5, 32]} />
                <meshBasicMaterial color={'#ffffff'} />
            </mesh>

            {
                particles.map((particle) => {
                    return <Particles key={particle.key} position={particle.position} id={particle.key} type={particle.type} />
                })
            }

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


const rotateLeft = (position) => {
    switch (position) {
        case 90:
            return 180
        case 180:
            return 270
        case 270:
            return 0
        case 0:
            return 90
    }
}

const rotateRight = (position) => {
    switch (position) {
        case 90:
            return 0
        case 180:
            return 90
        case 270:
            return 180
        case 0:
            return 270
    }
}