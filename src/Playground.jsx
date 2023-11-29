import { CuboidCollider } from "@react-three/rapier";
import { useControls } from "leva";

export default function Playground() {

    return <>
        <CuboidCollider args={[10, 0.2, 10]} position={[0, -0.1, 0]} />
        <CuboidCollider args={[0.2, 2, 1]} position={[-2, 2, 0]} />
        <CuboidCollider args={[0.2, 2, 1]} position={[2, 2, 0]} />
        <CuboidCollider args={[2, 2, 0.2]} position={[0, 2, -1.2]} />
        <CuboidCollider args={[2, 2, 0.2]} position={[0, 2, 1.2]} />

        {/* ground */}
        <mesh position={[0,-0.1,0]}>
            <boxGeometry args={[100, 0.2, 100]} />
            <meshStandardMaterial color={'#212121'} />
        </mesh>

        {/* polls */}
        <mesh position={[-1.8, 2, 1]}>
            <boxGeometry args={[0.05, 4, 0.05]} />
            <meshStandardMaterial color={[0.2,0.2,40.8]} toneMapped={false}/>
        </mesh>
        <mesh position={[1.8, 2, 1]}>
            <boxGeometry args={[0.05, 4, 0.05]} />
            <meshStandardMaterial color={[0.2,0.2,40.8]} toneMapped={false}/>
        </mesh>
        <mesh position={[1.8, 2, -1]}>
            <boxGeometry args={[0.05, 4, 0.05]} />
            <meshStandardMaterial color={[0.2,0.2,40.8]} toneMapped={false}/>
        </mesh>
        <mesh position={[-1.8, 2, -1]}>
            <boxGeometry args={[0.05, 4, 0.05]} />
            <meshStandardMaterial color={[0.2,0.2,40.8]} toneMapped={false}/>
        </mesh>

        {/* walls */}

        <mesh position={[0, 4, -1]}>
            <boxGeometry args={[3.65, 0.05, 0.05]} />
            <meshStandardMaterial color={[0.2,0.2,40.8]} toneMapped={false}/>
        </mesh>
        <mesh position={[0, 4, 1]}>
            <boxGeometry args={[3.65, 0.05, 0.05]} />
            <meshStandardMaterial color={[0.2,0.2,40.8]} toneMapped={false}/>
        </mesh>
        <mesh position={[-1.8, 4, 0]}>
            <boxGeometry args={[0.05, 0.05, 2]} />
            <meshStandardMaterial color={[0.2,0.2,40.8]} toneMapped={false}/>
        </mesh>
        <mesh position={[1.8, 4, 0]}>
            <boxGeometry args={[0.05, 0.05, 2]} />
            <meshStandardMaterial color={[0.2,0.2,40.8]} toneMapped={false}/>
        </mesh>

        <mesh position={[0, 0, -1]}>
            <boxGeometry args={[3.65, 0.05, 0.05]} />
            <meshStandardMaterial color={[0.2,0.2,40.8]} toneMapped={false}/>
        </mesh>
        <mesh position={[0, 0, 1]}>
            <boxGeometry args={[3.65, 0.05, 0.05]} />
            <meshStandardMaterial color={[0.2,0.2,40.8]} toneMapped={false}/>
        </mesh>
        <mesh position={[-1.8, 0, 0]}>
            <boxGeometry args={[0.05, 0.05, 2]} />
            <meshStandardMaterial color={[0.2,0.2,40.8]} toneMapped={false}/>
        </mesh>
        <mesh position={[1.8, 0, 0]}>
            <boxGeometry args={[0.05, 0.05, 2]} />
            <meshStandardMaterial color={[0.2,0.2,40.8]} toneMapped={false}/>
        </mesh>
    </>
}