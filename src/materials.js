import * as THREE from 'three';

const pokeballTexture = new THREE.TextureLoader().load('./pokeball.png');
const honorballTexture = new THREE.TextureLoader().load('./honorball.png');
const hyperballTexture = new THREE.TextureLoader().load('./hyperball.png');
const luxeballTexture = new THREE.TextureLoader().load('./luxeball.png');
const masterballTexture = new THREE.TextureLoader().load('./masterball.png');
const rapideballTexture = new THREE.TextureLoader().load('./rapideball.png');
const safariballTexture = new THREE.TextureLoader().load('./safariball.png');
const soinballTexture = new THREE.TextureLoader().load('./soinball.png');
const sombreballTexture = new THREE.TextureLoader().load('./sombreball.png');
const superballTexture = new THREE.TextureLoader().load('./superball.png');
const etrangeballTexture = new THREE.TextureLoader().load('./etrangeball.png');


// create basic material with texture

export const pokeballMaterial = new THREE.MeshBasicMaterial({ map: pokeballTexture });
export const honorballMaterial = new THREE.MeshBasicMaterial({ map: honorballTexture });
export const hyperballMaterial = new THREE.MeshBasicMaterial({ map: hyperballTexture });
export const luxeballMaterial = new THREE.MeshBasicMaterial({ map: luxeballTexture });
export const masterballMaterial = new THREE.MeshBasicMaterial({ map: masterballTexture });
export const rapideballMaterial = new THREE.MeshBasicMaterial({ map: rapideballTexture });
export const safariballMaterial = new THREE.MeshBasicMaterial({ map: safariballTexture });
export const soinballMaterial = new THREE.MeshBasicMaterial({ map: soinballTexture });
export const sombreballMaterial = new THREE.MeshBasicMaterial({ map: sombreballTexture });
export const superballMaterial = new THREE.MeshBasicMaterial({ map: superballTexture });
export const etrangeballMaterial = new THREE.MeshBasicMaterial({ map: etrangeballTexture });

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



