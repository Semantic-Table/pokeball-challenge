import * as THREE from 'three';

const loadBallTexture = (path) => {
    const tex = new THREE.TextureLoader().load(path);
    tex.colorSpace = THREE.SRGBColorSpace;
    tex.anisotropy = 8;
    return tex;
};

const pokeballTexture = loadBallTexture('./pokeball.png');
const honorballTexture = loadBallTexture('./honorball.png');
const hyperballTexture = loadBallTexture('./hyperball.png');
const luxeballTexture = loadBallTexture('./luxeball.png');
const masterballTexture = loadBallTexture('./masterball.png');
const rapideballTexture = loadBallTexture('./rapideball.png');
const safariballTexture = loadBallTexture('./safariball.png');
const soinballTexture = loadBallTexture('./soinball.png');
const sombreballTexture = loadBallTexture('./sombreball.png');
const superballTexture = loadBallTexture('./superball.png');
const etrangeballTexture = loadBallTexture('./etrangeball.png');


const makeBallMaterial = (map, opts = {}) => new THREE.MeshStandardMaterial({
    map,
    metalness: 0.25,
    roughness: 0.4,
    envMapIntensity: 1.1,
    ...opts,
});

export const pokeballMaterial = makeBallMaterial(pokeballTexture);
export const honorballMaterial = makeBallMaterial(honorballTexture);
export const hyperballMaterial = makeBallMaterial(hyperballTexture);
export const luxeballMaterial = makeBallMaterial(luxeballTexture);
export const masterballMaterial = makeBallMaterial(masterballTexture, {
    metalness: 0.55,
    roughness: 0.25,
    emissive: new THREE.Color('#7a3df0'),
    emissiveIntensity: 0.35,
});
export const rapideballMaterial = makeBallMaterial(rapideballTexture);
export const safariballMaterial = makeBallMaterial(safariballTexture);
export const soinballMaterial = makeBallMaterial(soinballTexture);
export const sombreballMaterial = makeBallMaterial(sombreballTexture);
export const superballMaterial = makeBallMaterial(superballTexture);
export const etrangeballMaterial = makeBallMaterial(etrangeballTexture);

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
