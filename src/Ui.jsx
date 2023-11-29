import { useEffect } from "react"
import useGame from "./stores/useGame"
import { addEffect } from "@react-three/fiber"

export default function Ui() {

    const score = useGame(state => state.score)
    const phase = useGame(state => state.phase)

    useEffect(() => {
        const unsubscribe = addEffect(() => {
            if (phase === 'ended') {

            }
        })
        return () => unsubscribe()
    }, [])


    return <div className="ui">
        <div className="score">
            <div className="title">Score</div>
            <div className="value">{score}</div>
        </div>

        {phase === 'ended' ? <div className="game-over">
            <div className="title">Game Over</div>
            <div className="highscore">High Score : {localStorage.getItem('highscore') ? localStorage.getItem('highscore') : 0}</div>
            <div className="subtitle">Press R to restart</div>
            
        </div> : null}
    </div>
}