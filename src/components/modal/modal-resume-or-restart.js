import PuzzleItem from "../puzzle-item/puzzle-item";

function ModalResumeRestart({modalState, modalHandler}) {
    const {puzzleState, showRatings, isHistory} = modalState;
    const {puzzleStateKey} = puzzleState;

    const resumeHandler = () => modalHandler({
        action: isHistory ? 'replay-solved-puzzle' : 'resume-saved-puzzle',
        puzzleStateKey
    });

    const restartHandler = () => modalHandler({
        action: 'restart-over-saved-puzzle',
        puzzleStateKey
    });

    const title = isHistory ? "Replay or start over?" : "Continue or start over?";
    const description = isHistory 
        ? "You've already solved this puzzle. You can watch a replay of your solve, or start again from the beginning."
        : "You've made a start on this puzzle already. You can either pick up where you left off, or start again from the beginning.";
    const primaryButtonLabel = isHistory ? "Replay" : "Continue";

    return (
        <div className="modal resume-restart">
            <h1>{title}</h1>
            <p>{description}</p>
            <div className="mb-8">
                <PuzzleItem
                    puzzle={puzzleState}
                    showRatings={showRatings}
                    type={isHistory ? 'history' : 'saved'}
                    onClick={resumeHandler}
                />
            </div>
            <div className="buttons">
                <button className="secondary" onClick={restartHandler}>Restart</button>
                <button className="primary" onClick={resumeHandler} autoFocus={true}>{primaryButtonLabel}</button>
            </div>
        </div>
    );
}


export default ModalResumeRestart;
