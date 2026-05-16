import * as THREE from 'three';
import { ballAssets } from './textureFactory';

const makeBallMaterial = (key, opts = {}) => new THREE.MeshStandardMaterial({
    map: ballAssets[key].texture,
    metalness: 0.25,
    roughness: 0.4,
    envMapIntensity: 1.1,
    ...opts,
});

export const pokeballMaterial = makeBallMaterial('pokeball');
export const honorballMaterial = makeBallMaterial('honorball');
export const hyperballMaterial = makeBallMaterial('hyperball');
export const luxeballMaterial = makeBallMaterial('luxeball');
export const rapideballMaterial = makeBallMaterial('rapideball');
export const safariballMaterial = makeBallMaterial('safariball');
export const soinballMaterial = makeBallMaterial('soinball');
export const sombreballMaterial = makeBallMaterial('sombreball');
export const superballMaterial = makeBallMaterial('superball');
export const etrangeballMaterial = makeBallMaterial('etrangeball');
export const masterballMaterial = makeBallMaterial('masterball', {
    metalness: 0.55,
    roughness: 0.25,
    emissive: new THREE.Color('#7a3df0'),
    emissiveIntensity: 0.35,
});

export const particleMaterial = new THREE.ShaderMaterial({
    depthWrite: false,
    blending: THREE.AdditiveBlending,
    vertexShader: `
        uniform float uSize;
        varying vec3 vColor;
        uniform vec3 uColor;
        uniform float uTime;

        attribute float aVelocity;
        void main() {
            vColor = uColor;
            vec3 positionOverTime = position * (uTime * 100.0 * aVelocity);
            vec4 mvPosition = modelViewMatrix * vec4(positionOverTime, 1.0);
            gl_PointSize = uSize * (1.0 / - mvPosition.z);
            gl_Position = projectionMatrix * mvPosition;
        }
    `,
    fragmentShader: `
        varying vec3 vColor;
        void main() {
            gl_FragColor = vec4(vColor, 1.0);
            gl_FragColor = gl_FragColor;
        }
    `,

    uniforms: {
        uColor: { value: new THREE.Vector3(5,5,5) },
        uSize: { value: 40 },
        uTime: { value: 0 },
    }
});
