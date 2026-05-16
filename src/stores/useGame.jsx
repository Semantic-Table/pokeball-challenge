import { create } from "zustand";
import { subscribeWithSelector } from "zustand/middleware";


export default create(subscribeWithSelector((set) => ({
    score: 0,
    setScore: (score) => set({ score }),
    addScore: (score) => set(state => ({ score: state.score + score })),
    phase: 'menu',

    pokeballsOutOfBounds: [],  // [{ id, since: timestamp ms }]
    removePokeball: (pokeballId) => set(state => ({
        pokeballsOutOfBounds: state.pokeballsOutOfBounds.filter(p => p.id !== pokeballId)
    })),
    pushPokeball: (pokeballId) => set(state =>
        state.pokeballsOutOfBounds.some(p => p.id === pokeballId)
            ? state
            : { pokeballsOutOfBounds: [...state.pokeballsOutOfBounds, { id: pokeballId, since: performance.now() }] }
    ),

    particles: [],
    addParticle: (particle) => set(state => ({ particles: [...state.particles, particle] })),
    removeParticle: (particle) => set(state => ({ particles: state.particles.filter((p) => p.key !== particle) })),

    start: () => set((state) => {
        if (state.phase === 'ended' || state.phase === 'menu') {
            return {
                score: 0,
                phase: 'playing',
            }
        }
        return {}
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