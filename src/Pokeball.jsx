import { RigidBody } from "@react-three/rapier";
import { useEffect, useRef, useState } from "react";
import * as THREE from "three";
import useGame from "./stores/useGame";
import { Html } from "@react-three/drei";
import * as Texture from "./materials";
import { useFrame } from "@react-three/fiber";


const SPAWN_POP_MS = 220
const SPAWN_GRACE_MS = 1500  // après ce délai, toute ball au-dessus du plafond active le compteur
const OOB_GRACE_MS = 3000
const VANISH_DURATION_MS = 320
// plafond OOB volontairement au-dessus du toit (y=4) : zone tampon de ~5cm où
// une ball peut dépasser visuellement sans déclencher le compteur immédiatement
const OOB_CEILING = 4.05
const _worldPos = new THREE.Vector3()

export function Pokeball({ type, position, onCollisionEnter, onEscape, onVanish, pokeballId }) {

    const [material, setMaterial] = useState(typeToMaterial(type))
    const [showOOB, setShowOOB] = useState(false)
    const ball = useRef()
    const labelGroup = useRef()
    const labelDiv = useRef()
    const spawnStart = useRef(performance.now())
    // timestamp où la ball est sortie après être entrée, sinon null
    const oobSince = useRef(null)
    // timestamp où la ball a commencé à vanish (escape), sinon null
    const escapeStart = useRef(null)
    const vanished = useRef(false)
    const addScore = useGame(state => state.addScore)

    // rayon monde de la ball (la geom est radius 0.2, scaled par adaptScale)
    const radius = 0.2 * adaptScale(type)

    useFrame(() => {
        if (!ball.current) return

        const pos = ball.current.parent.position
        const insideXZ = pos.x > -1.5 && pos.x < 1.5 && pos.z > -0.9 && pos.z < 0.9
        const belowCeiling = pos.y + radius < OOB_CEILING

        // === ESCAPE : ball hors empreinte XZ, vanish dès qu'elle touche le sol ===
        if (!insideXZ) {
            // si OOB countdown était actif, on le clear (cette ball ne va pas
            // déclencher Game Over, elle disparait dans le vide)
            if (oobSince.current !== null) {
                oobSince.current = null
                useGame.getState().removePokeball(pokeballId)
                setShowOOB(false)
            }
            if (escapeStart.current === null && pos.y < 0.6) {
                escapeStart.current = performance.now()
                onEscape && onEscape({ x: pos.x, y: pos.y + 0.05, z: pos.z })
            }
        } else if (belowCeiling) {
            if (oobSince.current !== null) {
                oobSince.current = null
                useGame.getState().removePokeball(pokeballId)
                setShowOOB(false)
            }
        } else if (performance.now() - spawnStart.current >= SPAWN_GRACE_MS) {
            // dans la cage XZ mais au-dessus du plafond, et grâce post-spawn écoulée
            // → OOB countdown (que la ball soit entrée dans la cage ou non — sinon
            // une grosse ball spawned sur une pile trop haute échapperait au timer)
            if (oobSince.current === null) {
                oobSince.current = performance.now()
                useGame.getState().pushPokeball(pokeballId)
                setShowOOB(true)
            }
            if (performance.now() - oobSince.current >= OOB_GRACE_MS) {
                useGame.getState().end()
            }
        }

        // === Vanish animation (escape) — prend la priorité sur le spawn pop ===
        if (escapeStart.current !== null) {
            const t = Math.min((performance.now() - escapeStart.current) / VANISH_DURATION_MS, 1)
            const eased = 1 - t * t * t  // ease-in cubic : accélère vers 0
            ball.current.scale.setScalar(Math.max(eased, 0))
            if (t >= 1 && !vanished.current) {
                vanished.current = true
                onVanish && onVanish(pokeballId)
            }
            return
        }

        // mise à jour du chiffre flottant : position monde au-dessus de la ball
        // + écriture directe du texte dans le DOM (pas de re-render)
        if (oobSince.current !== null && labelGroup.current) {
            ball.current.parent.getWorldPosition(_worldPos)
            const offset = 0.4 + 0.2 * adaptScale(type)
            labelGroup.current.position.set(_worldPos.x, _worldPos.y + offset, _worldPos.z)
            if (labelDiv.current) {
                const remaining = Math.max(0, OOB_GRACE_MS - (performance.now() - oobSince.current))
                labelDiv.current.textContent = (remaining / 1000).toFixed(1)
            }
        }

        // spawn pop : le mesh interne grandit de 0 à 1 avec un léger overshoot,
        // physique inchangée (collider sur le RigidBody, à pleine taille dès le spawn)
        const elapsed = performance.now() - spawnStart.current
        if (elapsed < SPAWN_POP_MS) {
            const t = elapsed / SPAWN_POP_MS
            const c1 = 1.2
            const c3 = c1 + 1
            const eased = 1 + c3 * Math.pow(t - 1, 3) + c1 * Math.pow(t - 1, 2)
            ball.current.scale.setScalar(eased)
        } else if (ball.current.scale.x !== 1) {
            ball.current.scale.setScalar(1)
        }
    })


    useEffect(() => {

        addScore(typeToScore(type))

        return () => {
            if (useGame.getState().pokeballsOutOfBounds.some(p => p.id === pokeballId)) {
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
            friction={0.7}
            restitution={0.05}
            linearDamping={0.25}
            angularDamping={0.6}
            ccd
        >
            <mesh geometry={sphereGeometry} material={material} ref={ball} castShadow receiveShadow>
            </mesh>
        </RigidBody>
        {showOOB && (
            <group ref={labelGroup}>
                <Html center pointerEvents="none">
                    <div ref={labelDiv} className="oob-floating">3.0</div>
                </Html>
            </group>
        )}
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

export const typeToScore = (type) => {
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

// palette pour les effets de fusion (ring néon, burst de particules)
const GLOW_PALETTE = [
    '#ff4d6d', // Pokéball — rouge corail
    '#5fb4ff', // Superball — bleu ciel
    '#ffe066', // Hyperball — jaune
    '#ffea4d', // Rapidball — jaune éclair
    '#7fdc63', // Safariball — vert lime
    '#ffb3cd', // Soinball — rose
    '#ffd966', // Honorball — or
    '#ffd966', // Luxeball — or
    '#e066ff', // Sombreball — magenta
    '#66e6c6', // Étrangeball — turquoise
    '#cc99ff', // Masterball — violet pâle
]

export const typeToGlowColor = (type) => GLOW_PALETTE[type] || '#ffffff'

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