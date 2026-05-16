import * as Tone from 'tone'

// Tone.js audio engine. Les synthés sont créés à l'unlock pour éviter de
// consommer un AudioContext avant la première interaction utilisateur.

// ---- Niveaux 0-5, persistés en localStorage ----

const STORAGE_KEY_MUSIC = 'sound.musicLevel'
const STORAGE_KEY_SFX = 'sound.sfxLevel'
const DEFAULT_LEVEL = 3

function clampLevel(n) {
    return Math.max(0, Math.min(5, n | 0))
}

function loadLevel(key) {
    const raw = typeof localStorage !== 'undefined' ? localStorage.getItem(key) : null
    const v = parseInt(raw ?? '', 10)
    return Number.isNaN(v) ? DEFAULT_LEVEL : clampLevel(v)
}

let musicLevel = loadLevel(STORAGE_KEY_MUSIC)
let sfxLevel = loadLevel(STORAGE_KEY_SFX)

export const getMusicLevel = () => musicLevel
export const getSfxLevel = () => sfxLevel

// niveau 0-5 → volume final
const musicLevelToVolume = (lvl) => (lvl / 5) * 0.5  // max 0.5 (sinon trop fort)
const sfxLevelToGain = (lvl) => lvl / 5              // 0 → mute, 5 → 1.0

// ---- Synthés SFX ----

let initialized = false
let sfxOutput = null
let dropSynth = null
let mergeSynth = null
let gameOverSynth = null
let startSynth = null

const VOL = {
    drop: -16,
    merge: -10,
    gameOver: -10,
    start: -8,
}

function buildSynths() {
    sfxOutput = new Tone.Gain(sfxLevelToGain(sfxLevel)).toDestination()

    dropSynth = new Tone.MembraneSynth({
        pitchDecay: 0.02,
        octaves: 3,
        envelope: { attack: 0.002, decay: 0.12, sustain: 0, release: 0.05 },
        volume: VOL.drop,
    }).connect(sfxOutput)

    mergeSynth = new Tone.PolySynth(Tone.FMSynth, {
        harmonicity: 2.5,
        modulationIndex: 8,
        oscillator: { type: 'sine' },
        envelope: { attack: 0.003, decay: 0.25, sustain: 0, release: 0.4 },
        modulation: { type: 'triangle' },
        modulationEnvelope: { attack: 0.005, decay: 0.1, sustain: 0, release: 0.1 },
        volume: VOL.merge,
    }).connect(sfxOutput)

    gameOverSynth = new Tone.PolySynth(Tone.Synth, {
        oscillator: { type: 'triangle' },
        envelope: { attack: 0.02, decay: 0.6, sustain: 0.15, release: 0.8 },
        volume: VOL.gameOver,
    }).connect(sfxOutput)

    startSynth = new Tone.PolySynth(Tone.Synth, {
        oscillator: { type: 'triangle' },
        envelope: { attack: 0.005, decay: 0.25, sustain: 0.1, release: 0.5 },
        volume: VOL.start,
    }).connect(sfxOutput)
}

export async function unlockAudio() {
    if (initialized) return
    await Tone.start()
    buildSynths()
    initialized = true
}

const mergeNotes = ['C4', 'D4', 'E4', 'G4', 'A4', 'C5', 'D5', 'E5', 'G5', 'A5', 'C6']

export function playDrop() {
    if (!initialized) return
    dropSynth.triggerAttackRelease('C2', '16n')
}

export function playMerge(type) {
    if (!initialized) return
    const root = mergeNotes[Math.min(type, mergeNotes.length - 1)] || 'C4'
    const fifth = Tone.Frequency(root).transpose(7).toNote()
    mergeSynth.triggerAttackRelease([root, fifth], '8n')
}

export function playGameOver() {
    if (!initialized) return
    const seq = ['G3', 'E3', 'C3']
    const now = Tone.now()
    seq.forEach((note, i) => {
        gameOverSynth.triggerAttackRelease(note, '4n', now + i * 0.2)
    })
}

export function playStart() {
    if (!initialized) return
    startSynth.triggerAttackRelease(['C4', 'E4', 'G4'], '8n')
}

// ---- Musique d'ambiance ----

let musicElement = null

export function setMusic(url) {
    if (musicElement) {
        musicElement.pause()
        musicElement = null
    }
    if (url) {
        musicElement = new Audio(url)
        musicElement.loop = true
        musicElement.volume = musicLevelToVolume(musicLevel)
    }
}

export function startMusic() {
    if (!musicElement || musicLevel === 0) return
    musicElement.play().catch(() => {})
}

export function stopMusic() {
    if (musicElement) musicElement.pause()
}

// ---- Setters niveau ----

export function setMusicLevel(level) {
    musicLevel = clampLevel(level)
    try { localStorage.setItem(STORAGE_KEY_MUSIC, String(musicLevel)) } catch (e) { /* ignore */ }
    if (musicElement) {
        musicElement.volume = musicLevelToVolume(musicLevel)
        if (musicLevel === 0) {
            musicElement.pause()
        } else if (musicElement.paused) {
            musicElement.play().catch(() => { /* autoplay refusé tant qu'il n'y a pas eu d'interaction */ })
        }
    }
}

export function setSfxLevel(level) {
    sfxLevel = clampLevel(level)
    try { localStorage.setItem(STORAGE_KEY_SFX, String(sfxLevel)) } catch (e) { /* ignore */ }
    if (sfxOutput) sfxOutput.gain.value = sfxLevelToGain(sfxLevel)
}

// Préchargement du fichier d'ambiance. La lecture ne démarre qu'à startMusic()
// (appelée à la transition vers la phase 'playing').
setMusic('./hot_spring_town.mp3')
