import { create } from "zustand";
import { subscribeWithSelector } from "zustand/middleware";


export default create(subscribeWithSelector((set) => ({
    score: 0,
    setScore: (score) => set({ score }),
    addScore: (score) => set(state => ({ score: state.score + score })),
    phase: 'playing',

    pokeballsOutOfBounds: [],
    removePokeball: (pokeballId) => set(state => ({ pokeballsOutOfBounds: state.pokeballsOutOfBounds.filter((id) => id !== pokeballId) })),
    pushPokeball: (pokeballId) => set(state => ({ pokeballsOutOfBounds: [...state.pokeballsOutOfBounds, pokeballId] })),

    particles: [],
    addParticle: (particle) => set(state => ({ particles: [...state.particles, particle] })),
    removeParticle: (particle) => set(state => ({ particles: state.particles.filter((p) => p.key !== particle) })),

    start: () => set((state) => {
        console.log(state.phase);
        if (state.phase === 'ended' || state.phase === 'menu') {

            return {
                score: 0,
                phase: 'playing',
            }
        } else {
            return {}
        }

    }),
    end: () => set((state) => {
        if (state.phase === 'playing') {
            localStorage.setItem('highscore', Math.max(state.score, localStorage.getItem('highscore') || 0))
            return {
                phase: 'ended',
            }

        } else {
            return {}
        }
    })
})));