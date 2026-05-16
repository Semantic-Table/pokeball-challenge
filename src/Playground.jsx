import { MeshReflectorMaterial } from "@react-three/drei";
import { CuboidCollider } from "@react-three/rapier";

const xE = 1.5;
const zE = 0.9;
const yT = 4;
const t = 0.04;

const NEON_TOP = '#ff7ad6';
const NEON_BOT = '#7ad9ff';
const NEON_I = 2.2;

const NeonBar = ({ position, args, color }) => (
    <mesh position={position}>
        <boxGeometry args={args} />
        <meshStandardMaterial
            color={color}
            emissive={color}
            emissiveIntensity={NEON_I}
            toneMapped={false}
        />
    </mesh>
);

export default function Playground() {

    return <>
        {/* physique : sol + 4 murs invisibles, alignés sur le contour visible de la cage */}
        <CuboidCollider args={[10, 0.2, 10]} position={[0, -0.1, 0]} />
        <CuboidCollider args={[0.2, 2, 0.8]} position={[-1.7, 2, 0]} />
        <CuboidCollider args={[0.2, 2, 0.8]} position={[1.7, 2, 0]} />
        <CuboidCollider args={[1.7, 2, 0.2]} position={[0, 2, -1.1]} />
        <CuboidCollider args={[1.7, 2, 0.2]} position={[0, 2, 1.1]} />

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
        <NeonBar position={[0, yT, -zE]} args={[xE * 2 + t, t, t]} color={NEON_TOP} />
        <NeonBar position={[0, yT, zE]}  args={[xE * 2 + t, t, t]} color={NEON_TOP} />
        <NeonBar position={[-xE, yT, 0]} args={[t, t, zE * 2]} color={NEON_TOP} />
        <NeonBar position={[xE, yT, 0]}  args={[t, t, zE * 2]} color={NEON_TOP} />

        {/* 4 arêtes du bas — néon cyan */}
        <NeonBar position={[0, 0.12, -zE]} args={[xE * 2 + t, t, t]} color={NEON_BOT} />
        <NeonBar position={[0, 0.12, zE]}  args={[xE * 2 + t, t, t]} color={NEON_BOT} />
        <NeonBar position={[-xE, 0.12, 0]} args={[t, t, zE * 2]} color={NEON_BOT} />
        <NeonBar position={[xE, 0.12, 0]}  args={[t, t, zE * 2]} color={NEON_BOT} />
    </>
}
