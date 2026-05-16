import { MeshReflectorMaterial } from "@react-three/drei";
import { CuboidCollider } from "@react-three/rapier";
import { useFrame } from "@react-three/fiber";
import { forwardRef, useRef } from "react";

const xE = 1.5;
const zE = 0.9;
const yT = 4;
const t = 0.04;

const NEON_TOP = '#ff7ad6';
const NEON_BOT = '#7ad9ff';
const NEON_I = 2.2;

const NeonBar = forwardRef(({ position, args, color }, ref) => (
    <mesh position={position}>
        <boxGeometry args={args} />
        <meshStandardMaterial
            ref={ref}
            color={color}
            emissive={color}
            emissiveIntensity={NEON_I}
            toneMapped={false}
        />
    </mesh>
));

export default function Playground() {

    const topMats = useRef([])
    const botMats = useRef([])
    const daisMat = useRef()

    useFrame(({ clock }) => {
        const t = clock.elapsedTime
        // les néons respirent à deux fréquences légèrement différentes pour ne pas
        // pulser en sync (plus organique)
        const topI = 2.2 + Math.sin(t * 1.2) * 0.45
        const botI = 2.0 + Math.sin(t * 1.0 + Math.PI / 3) * 0.35
        const daisI = 2.4 + Math.sin(t * 0.7 + Math.PI / 5) * 0.25
        for (let i = 0; i < topMats.current.length; i++) {
            if (topMats.current[i]) topMats.current[i].emissiveIntensity = topI
        }
        for (let i = 0; i < botMats.current.length; i++) {
            if (botMats.current[i]) botMats.current[i].emissiveIntensity = botI
        }
        if (daisMat.current) daisMat.current.emissiveIntensity = daisI
    })

    return <>
        {/* physique : sol + 4 murs invisibles, alignés sur le contour visible de la cage.
            Murs épaissis à 0.4 (half-extent) + recouvrement aux coins pour éviter les
            squeeze-through quand une pile met de la pression. */}
        <CuboidCollider args={[10, 0.2, 10]} position={[0, -0.1, 0]} />
        <CuboidCollider args={[0.4, 2, 1.1]} position={[-1.9, 2, 0]} />
        <CuboidCollider args={[0.4, 2, 1.1]} position={[1.9, 2, 0]} />
        <CuboidCollider args={[1.9, 2, 0.4]} position={[0, 2, -1.3]} />
        <CuboidCollider args={[1.9, 2, 0.4]} position={[0, 2, 1.3]} />

        {/* dais flottant — corps blanc cassé */}
        <mesh position={[0, -0.18, 0]} receiveShadow>
            <cylinderGeometry args={[5, 5.4, 0.36, 64]} />
            <meshStandardMaterial color="#ece6d8" metalness={0.15} roughness={0.45} />
        </mesh>

        {/* dais — surface réfléchissante (disque clair) */}
        <mesh position={[0, 0.001, 0]} rotation={[-Math.PI / 2, 0, 0]} receiveShadow>
            <circleGeometry args={[5, 64]} />
            <MeshReflectorMaterial
                blur={[400, 120]}
                resolution={512}
                mixBlur={1.2}
                mixStrength={0.55}
                roughness={0.55}
                depthScale={1}
                minDepthThreshold={0.4}
                maxDepthThreshold={1.4}
                color="#f0eadc"
                metalness={0.2}
                mirror={0}
            />
        </mesh>

        {/* liseré néon autour du dais */}
        <mesh position={[0, 0.005, 0]} rotation={[-Math.PI / 2, 0, 0]}>
            <ringGeometry args={[4.96, 5.04, 96]} />
            <meshStandardMaterial
                ref={daisMat}
                color="#7ad9ff"
                emissive="#7ad9ff"
                emissiveIntensity={2.4}
                toneMapped={false}
            />
        </mesh>

        {/* socle indigo métallique sous la cage, posé sur le dais */}
        <mesh position={[0, 0.04, 0]} receiveShadow>
            <cylinderGeometry args={[2.4, 2.6, 0.06, 64]} />
            <meshStandardMaterial color="#1c1733" metalness={0.6} roughness={0.35} />
        </mesh>
        <mesh position={[0, 0.085, 0]}>
            <cylinderGeometry args={[2.35, 2.4, 0.04, 64]} />
            <meshStandardMaterial
                color="#3a2a78"
                emissive="#3a2a78"
                emissiveIntensity={0.6}
                toneMapped={false}
            />
        </mesh>

        {/* 4 poteaux verticaux chromés (les coins de la cage) */}
        {[[-xE, -zE], [xE, -zE], [xE, zE], [-xE, zE]].map(([x, z], i) => (
            <mesh key={`pole-${i}`} position={[x, yT / 2, z]} castShadow>
                <boxGeometry args={[t, yT, t]} />
                <meshStandardMaterial color="#cdd1de" metalness={1} roughness={0.18} />
            </mesh>
        ))}

        {/* 4 arêtes du haut — néon rose */}
        <NeonBar ref={el => topMats.current[0] = el} position={[0, yT, -zE]} args={[xE * 2 + t, t, t]} color={NEON_TOP} />
        <NeonBar ref={el => topMats.current[1] = el} position={[0, yT, zE]}  args={[xE * 2 + t, t, t]} color={NEON_TOP} />
        <NeonBar ref={el => topMats.current[2] = el} position={[-xE, yT, 0]} args={[t, t, zE * 2]} color={NEON_TOP} />
        <NeonBar ref={el => topMats.current[3] = el} position={[xE, yT, 0]}  args={[t, t, zE * 2]} color={NEON_TOP} />

        {/* 4 arêtes du bas — néon cyan */}
        <NeonBar ref={el => botMats.current[0] = el} position={[0, 0.12, -zE]} args={[xE * 2 + t, t, t]} color={NEON_BOT} />
        <NeonBar ref={el => botMats.current[1] = el} position={[0, 0.12, zE]}  args={[xE * 2 + t, t, t]} color={NEON_BOT} />
        <NeonBar ref={el => botMats.current[2] = el} position={[-xE, 0.12, 0]} args={[t, t, zE * 2]} color={NEON_BOT} />
        <NeonBar ref={el => botMats.current[3] = el} position={[xE, 0.12, 0]}  args={[t, t, zE * 2]} color={NEON_BOT} />
    </>
}
