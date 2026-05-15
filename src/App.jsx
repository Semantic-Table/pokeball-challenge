import { KeyboardControls } from '@react-three/drei'
import { Canvas } from '@react-three/fiber'
import { Physics } from '@react-three/rapier'
import { Perf } from 'r3f-perf'
import { useMemo } from 'react'
import './App.css'
import Experience from './Experience'
import Ui from './Ui'

const Controls = {
  left: 'left',
  right: 'right',
  drop: 'drop',
  up: 'up',
  down: 'down',
  restart: 'restart',
}

function App() {
  const map = useMemo(()=>[
    { name: Controls.left, keys: ['ArrowLeft', 'KeyA'] },
    { name: Controls.right, keys: ['ArrowRight', 'KeyD'] },
    { name: Controls.up, keys: ['ArrowUp', 'KeyW'] },
    { name: Controls.down, keys: ['ArrowDown', 'KeyS'] },
    { name: Controls.restart, keys: ['KeyR'] },
    { name: Controls.drop, keys: ['Space'] },
  ], [])

  return (
    <>
      <KeyboardControls map={map}>
        <Ui />
        <Canvas
          shadows
          camera={{ position: [0, 5, 8], fov: 45 }}
          gl={{ antialias: true }}
        >
          <Perf />
          <Physics debug={false}>
            <Experience />
          </Physics>
        </Canvas>
      </KeyboardControls>
    </>
  )
}

export default App
