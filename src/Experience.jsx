import { Billboard, ContactShadows, Environment, Html, OrbitControls, useKeyboardControls } from "@react-three/drei"
import { useFrame, useThree } from "@react-three/fiber"
import { Bloom, EffectComposer, Vignette } from "@react-three/postprocessing"
import { Fragment, useEffect, useRef, useState } from "react"
import * as THREE from "three"
import Playground from "./Playground"
import { Pokeball, PokeballType, adaptScale, sphereGeometry, typeToGlowColor, typeToMaterial, typeToScore } from "./Pokeball"
import useGame from "./stores/useGame"
import Particles from "./Particles"
import { playDrop, playGameOver, playMerge, playStart, startMusic, stopMusic, unlockAudio } from "./audio"

const horizontalBorder = 1.3
const verticalBorder = 0.7
const moveSpeed = 4
const SPAWN_DURATION_MS = 280
const DROP_COOLDOWN_MS = 500

const IDLE_BOB_AMP = 0.06        // m, amplitude verticale
const IDLE_BOB_FREQ_HZ = 1.0     // Hz
const IDLE_ROT_SPEED = 0.6       // rad/s, rotation Y
const BASE_Y = 5.0

// easeOutBack — léger overshoot avant settling, donne du peps au spawn
function easeOutBack(t) {
    const c1 = 1.0
    const c3 = c1 + 1
    return 1 + c3 * Math.pow(t - 1, 3) + c1 * Math.pow(t - 1, 2)
}

const MERGE_RING_MS = 380
const MERGE_RING_GROWTH = 3.2

function MergeRing({ position, color }) {
    const meshRef = useRef()
    const matRef = useRef()
    const start = useRef(performance.now())

    useFrame(() => {
        const elapsed = performance.now() - start.current
        const t = Math.min(elapsed / MERGE_RING_MS, 1)
        const eased = 1 - Math.pow(1 - t, 3)
        if (meshRef.current) meshRef.current.scale.setScalar(0.2 + MERGE_RING_GROWTH * eased)
        if (matRef.current) matRef.current.opacity = (1 - t) * 0.6
    })

    return (
        <Billboard position={position}>
            <mesh ref={meshRef} renderOrder={2}>
                <ringGeometry args={[0.32, 0.40, 48]} />
                <meshBasicMaterial
                    ref={matRef}
                    color={color}
                    transparent
                    opacity={0.6}
                    toneMapped={false}
                    side={THREE.DoubleSide}
                    depthWrite={false}
                />
            </mesh>
        </Billboard>
    )
}

const VANISH_POOF_MS = 420

function VanishPoof({ position }) {
    const meshRef = useRef()
    const matRef = useRef()
    const start = useRef(performance.now())

    useFrame(() => {
        const elapsed = performance.now() - start.current
        const t = Math.min(elapsed / VANISH_POOF_MS, 1)
        const eased = 1 - Math.pow(1 - t, 3)
        if (meshRef.current) meshRef.current.scale.setScalar(0.3 + 1.6 * eased)
        if (matRef.current) matRef.current.opacity = (1 - t) * 0.55
    })

    return (
        <mesh ref={meshRef} position={position} rotation={[-Math.PI / 2, 0, 0]} renderOrder={2}>
            <ringGeometry args={[0.22, 0.30, 36]} />
            <meshBasicMaterial
                ref={matRef}
                color="#ece9f5"
                transparent
                opacity={0.55}
                toneMapped={false}
                side={THREE.DoubleSide}
                depthWrite={false}
            />
        </mesh>
    )
}

const SCORE_POPUP_MS = 850

function ScorePopup({ position, score, color }) {
    const divRef = useRef()
    const start = useRef(performance.now())

    useFrame(() => {
        if (divRef.current) {
            const elapsed = performance.now() - start.current
            const t = Math.min(elapsed / SCORE_POPUP_MS, 1)
            const eased = 1 - Math.pow(1 - t, 2)
            divRef.current.style.opacity = String(1 - eased)
            divRef.current.style.top = `${-eased * 90}px`
            divRef.current.style.transform = `translate(-50%, -50%) scale(${1 + t * 0.25})`
        }
    })

    return (
        <Html position={position} center style={{ pointerEvents: 'none' }}>
            <div ref={divRef} style={{
                position: 'relative',
                top: 0,
                color,
                fontSize: '2rem',
                fontWeight: 600,
                fontFamily: 'Fredoka, sans-serif',
                textShadow: '0 0 14px rgba(255, 196, 142, 0.9), 0 2px 6px rgba(0,0,0,0.7)',
                userSelect: 'none',
                whiteSpace: 'nowrap',
                transform: 'translate(-50%, -50%)',
                letterSpacing: '0.05em',
            }}>
                +{score}
            </div>
        </Html>
    )
}

const _forward = new THREE.Vector3()
const _right = new THREE.Vector3()
const _worldUp = new THREE.Vector3(0, 1, 0)
const _move = new THREE.Vector3()

export default function Experience() {

    const pokeballToPlace = useRef()
    const reticule = useRef()
    const spawnTime = useRef(performance.now())
    const lastDropTime = useRef(0)

    const [sub, get] = useKeyboardControls()

    const [pokeballs, setPokeballs] = useState([])
    const [mergeEffects, setMergeEffects] = useState([])
    const [vanishEffects, setVanishEffects] = useState([])
    const particles = useGame(state => state.particles)
    const phase = useGame(state => state.phase)

    const [dropPressed, setDropPressed] = useState()

    const [pokeballType, setPokeballType] = useState(PokeballType.POKEBALL)

    const [material, setMaterial] = useState(typeToMaterial(pokeballType))

    const { camera } = useThree()

    const pokeballsOutOfBounds = useGame(state => state.pokeballsOutOfBounds);

    useEffect(() => {
        camera.position.set(0, 5.5, 8)
    }, [])

    useEffect(() => {
        setMaterial(typeToMaterial(pokeballType))
        spawnTime.current = performance.now()
        if (pokeballToPlace.current) {
            pokeballToPlace.current.scale.setScalar(0)
        }
    }, [pokeballType])

    // quand on entre en phase 'playing' depuis le menu, redéclencher le spawn
    // pop pour que la première Pokéball apparaisse proprement
    useEffect(() => {
        if (phase === 'playing') {
            spawnTime.current = performance.now()
            if (pokeballToPlace.current) {
                pokeballToPlace.current.scale.setScalar(0)
            }
            startMusic()
        }
        if (phase === 'ended') {
            stopMusic()
            playGameOver()
        }
    }, [phase])

    const onPokeballCollide = (manifold, target, other) => {

        const collisionPosition = manifold.solverContactPoint(0)
        if (other.rigidBodyObject && other.rigidBodyObject.name === target.rigidBodyObject.name) {

            // Rapier fire onCollisionEnter sur LES DEUX balls qui collisionnent.
            // On ne traite la fusion qu'une fois par paire — celle dont l'id est le plus petit.
            if (target.rigidBodyObject.pokeballId > other.rigidBodyObject.pokeballId) {
                return
            }

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

            // juice : ring néon + score flottant + burst de particules
            const effectId = Math.random()
            const glow = typeToGlowColor(newType)
            setMergeEffects(prev => [...prev, {
                id: effectId,
                position: averagePosition,
                color: glow,
                score: typeToScore(newType),
            }])
            setTimeout(() => {
                setMergeEffects(prev => prev.filter(e => e.id !== effectId))
            }, 900)

            useGame.getState().addParticle({
                position: averagePosition,
                type: newType,
                key: Math.random(),
            })

            playMerge(newType)
        }
    }


    useFrame(({ camera }, delta) => {

        // animation de spawn (scale 0 → target avec overshoot) + idle (bob + rotation Y)
        if (pokeballToPlace.current) {
            const now = performance.now()

            const elapsed = now - spawnTime.current
            const t = Math.min(elapsed / SPAWN_DURATION_MS, 1)
            const eased = easeOutBack(t)
            pokeballToPlace.current.scale.setScalar(adaptScale(pokeballType) * eased)

            pokeballToPlace.current.position.y = BASE_Y + Math.sin(now * 0.001 * 2 * Math.PI * IDLE_BOB_FREQ_HZ) * IDLE_BOB_AMP
            pokeballToPlace.current.rotation.y += IDLE_ROT_SPEED * delta
        }

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

            const cooldownReady = performance.now() - lastDropTime.current >= DROP_COOLDOWN_MS

            if (get().drop && !dropPressed && pokeballsOutOfBounds.length === 0 && cooldownReady) {
                const positionToDrop = addRandomToPosition(pokeballToPlace.current.position);
                setDropPressed(true)
                lastDropTime.current = performance.now()
                setPokeballs([...pokeballs, {
                    position: [positionToDrop.x, positionToDrop.y, positionToDrop.z],
                    type: pokeballType,
                    key: Math.random()
                }])

                setPokeballType(randomInteger(0, 4))
                playDrop()

            } else if (!get().drop && dropPressed) {
                setDropPressed(false)
            }
        } else if (useGame.getState().phase === 'ended') {

            if (get().restart) {
                setPokeballs([])
                useGame.getState().start()
            }
        } else if (useGame.getState().phase === 'menu') {

            // Espace lance la partie depuis le menu (l'AudioContext est débloqué
            // côté Ui via le listener "first interaction" du menu)
            if (get().drop && !dropPressed) {
                setDropPressed(true)
                unlockAudio().then(() => {
                    playStart()
                    useGame.getState().start()
                })
            } else if (!get().drop && dropPressed) {
                setDropPressed(false)
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
                position={[0, BASE_Y, 0]}
                geometry={sphereGeometry}
                material={material}
                castShadow
                visible={phase === 'playing'}
            />
            <group ref={reticule} visible={phase === 'playing'}>
                <mesh position={[0, BASE_Y / 2, 0]}>
                    <cylinderGeometry args={[0.012, 0.012, BASE_Y, 16]} />
                    <meshBasicMaterial color={'#ffffff'} transparent opacity={0.45} />
                </mesh>
                <mesh position={[0, 0.13, 0]} rotation={[-Math.PI / 2, 0, 0]}>
                    <ringGeometry args={[0.18, 0.24, 48]} />
                    <meshBasicMaterial color={'#ffffff'} transparent opacity={0.85} toneMapped={false} />
                </mesh>
            </group>

            {mergeEffects.map(e => (
                <Fragment key={e.id}>
                    <MergeRing position={e.position} color={e.color} />
                    <ScorePopup position={e.position} score={e.score} color={e.color} />
                </Fragment>
            ))}

            {particles.map((particle) => (
                <Particles key={particle.key} position={particle.position} id={particle.key} type={particle.type} />
            ))}

            {vanishEffects.map(e => (
                <VanishPoof key={e.id} position={[e.position.x, e.position.y, e.position.z]} />
            ))}

            {pokeballs.map((pokeball) => {
                return <Pokeball
                    key={pokeball.key}
                    pokeballId={pokeball.key}
                    type={pokeball.type}
                    position={pokeball.position}
                    onCollisionEnter={(manifold, target, other) => {
                        onPokeballCollide(manifold, target, other)
                    }}
                    onEscape={(pos) => {
                        const id = Math.random()
                        setVanishEffects(prev => [...prev, { id, position: pos }])
                        setTimeout(() => {
                            setVanishEffects(prev => prev.filter(e => e.id !== id))
                        }, VANISH_POOF_MS + 100)
                    }}
                    onVanish={(id) => {
                        setPokeballs(prev => prev.filter(p => p.key !== id))
                    }}
                />
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
