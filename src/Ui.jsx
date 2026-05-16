import { useEffect, useRef, useState } from "react"
import useGame from "./stores/useGame"
import { ballAssets } from "./textureFactory"
import {
    unlockAudio,
    playStart,
    getMusicLevel,
    getSfxLevel,
    setMusicLevel,
    setSfxLevel,
} from "./audio"

const evolutionChain = [
    { name: 'Poke Ball',    image: ballAssets.pokeball.dataURL },
    { name: 'Great Ball',   image: ballAssets.superball.dataURL },
    { name: 'Ultra Ball',   image: ballAssets.hyperball.dataURL },
    { name: 'Quick Ball',   image: ballAssets.rapideball.dataURL },
    { name: 'Safari Ball',  image: ballAssets.safariball.dataURL },
    { name: 'Heal Ball',    image: ballAssets.soinball.dataURL },
    { name: 'Premier Ball', image: ballAssets.honorball.dataURL },
    { name: 'Luxury Ball',  image: ballAssets.luxeball.dataURL },
    { name: 'Dusk Ball',    image: ballAssets.sombreball.dataURL },
    { name: 'Net Ball',     image: ballAssets.etrangeball.dataURL },
    { name: 'Master Ball',  image: ballAssets.masterball.dataURL },
]

function LevelStepper({ label, value, onChange }) {
    return (
        <div className="settings-row">
            <span className="settings-label">{label}</span>
            <div className="level-bar">
                {[0, 1, 2, 3, 4, 5].map(n => (
                    <button
                        key={n}
                        className={`level-pill ${n === value ? 'active' : ''}`}
                        onClick={() => onChange(n)}
                        aria-label={`${label} ${n}`}
                    >{n}</button>
                ))}
            </div>
        </div>
    )
}

export default function Ui() {

    const score = useGame(state => state.score)
    const phase = useGame(state => state.phase)
    const isNewRecord = useGame(state => state.isNewRecord)

    const scoreValueRef = useRef()
    const prevScore = useRef(score)
    const goScoreRef = useRef()

    // bump animation sur le score à chaque incrément
    useEffect(() => {
        if (score > prevScore.current && scoreValueRef.current) {
            scoreValueRef.current.classList.remove('bump')
            // force reflow pour relancer l'animation à chaque hit
            void scoreValueRef.current.offsetWidth
            scoreValueRef.current.classList.add('bump')
        }
        prevScore.current = score
    }, [score])

    // count-up animé du score sur le Game Over
    useEffect(() => {
        if (phase !== 'ended') return
        let raf
        const start = performance.now()
        const duration = 1200
        const animate = () => {
            const t = Math.min((performance.now() - start) / duration, 1)
            const eased = 1 - Math.pow(1 - t, 3)
            const v = Math.floor(score * eased)
            if (goScoreRef.current) goScoreRef.current.textContent = v.toString()
            if (t < 1) raf = requestAnimationFrame(animate)
        }
        const timer = setTimeout(() => { raf = requestAnimationFrame(animate) }, 900)
        return () => {
            clearTimeout(timer)
            if (raf) cancelAnimationFrame(raf)
        }
    }, [phase, score])

    const [settingsOpen, setSettingsOpen] = useState(false)
    const [musicLvl, setMusicLvl] = useState(() => getMusicLevel())
    const [sfxLvl, setSfxLvl] = useState(() => getSfxLevel())

    const changeMusic = async (n) => {
        await unlockAudio() // permet à la musique de démarrer si l'utilisateur règle le volume depuis le menu
        setMusicLvl(n)
        setMusicLevel(n)
    }
    const changeSfx = async (n) => {
        await unlockAudio()
        setSfxLvl(n)
        setSfxLevel(n)
    }


    // débloque l'AudioContext à la première interaction (click ou clavier)
    // pendant la phase menu — couvre le cas "Espace pour démarrer"
    useEffect(() => {
        if (phase !== 'menu') return
        const onFirstInteract = () => {
            unlockAudio()
            document.removeEventListener('click', onFirstInteract)
            document.removeEventListener('keydown', onFirstInteract)
        }
        document.addEventListener('click', onFirstInteract)
        document.addEventListener('keydown', onFirstInteract)
        return () => {
            document.removeEventListener('click', onFirstInteract)
            document.removeEventListener('keydown', onFirstInteract)
        }
    }, [phase])


    const highscore = parseInt(localStorage.getItem('highscore') || '0', 10)

    return <div className="ui">
        <button
            className="settings-gear"
            onClick={() => setSettingsOpen(o => !o)}
            aria-label="Settings"
        >⚙</button>

        {settingsOpen && (
            <div className="settings-panel">
                <LevelStepper label="Music" value={musicLvl} onChange={changeMusic} />
                <LevelStepper label="SFX" value={sfxLvl} onChange={changeSfx} />
            </div>
        )}

        {phase === 'playing' && <>
            <div className="score">
                <div className="title">Score</div>
                <div ref={scoreValueRef} className="value">{score}</div>
            </div>

            <div className="evolution-chain">
                <div className="evolution-title">Evolution</div>
                <div className="chain-list">
                    {evolutionChain.map((ball, i) => (
                        <div className="chain-item" key={i}>
                            <img src={ball.image} alt={ball.name} />
                            <span>{ball.name}</span>
                        </div>
                    ))}
                </div>
            </div>
        </>}

        {phase === 'menu' && <div className="start-screen">
            <div className="start-card">
                <h1 className="game-title">Pokeball<br/>Challenge</h1>
                <div className="game-subtitle">Drop · Merge · Evolve</div>
                {highscore > 0 && <div className="highscore-line">Best: {highscore}</div>}
                <button
                    className="start-button"
                    onClick={async () => {
                        await unlockAudio()
                        playStart()
                        useGame.getState().start()
                    }}
                >
                    Play
                </button>
                <div className="controls-hint">
                    <span>arrows / WASD to move</span>
                    <span>space to drop</span>
                    <span>drag to orbit camera</span>
                </div>
            </div>
        </div>}

        {phase === 'ended' && <div className="game-over">
            <div className="go-card">
                <div className="go-title">Game Over</div>
                <div className="go-score-block">
                    <span className="go-score-label">Score</span>
                    <span ref={goScoreRef} className="go-score-value">0</span>
                </div>
                {isNewRecord && <div className="go-record-badge">New Record!</div>}
                <div className="go-highscore">Best: {highscore}</div>
                <button
                    className="go-restart-btn"
                    onClick={() => useGame.getState().start()}
                >
                    Play Again
                </button>
                <div className="go-restart-hint">or press R</div>
            </div>
        </div>}
    </div>
}
