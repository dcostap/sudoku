import { compressPuzzleDigits } from '../../lib/string-utils';

import SavedPuzzleGrid from "../saved-puzzle/saved-puzzle-grid";
import SavedPuzzleMetadata from "../saved-puzzle/saved-puzzle-metadata";


function puzzleLink(puzzleState, shortenLinks) {
    const {initialDigits, difficultyLevel} = puzzleState;
    const puzzleString = shortenLinks ? compressPuzzleDigits(initialDigits) : initialDigits;
    const diffParam = difficultyLevel ? `&d=${difficultyLevel}` : '';
    return `./?s=${puzzleString}${diffParam}&r=1`;
}


function SavedPuzzle({puzzleState, showRatings, shortenLinks, discardHandler, isLast}) {
    const {
        puzzleStateKey, difficultyLevel,
        startTime, elapsedTime, lastUpdatedTime
    } = puzzleState;
    const puzzleButtons = discardHandler
        ? (
            <div className="puzzle-buttons">
                <a className="btn primary" href={puzzleLink(puzzleState, shortenLinks)}>Select</a>
                <button
                    onClick={discardHandler}
                    data-puzzle-state-key={puzzleStateKey}
                    title="Discard this saved puzzle"
                >Discard</button>
            </div>
        )
        : null;
    return <div className={`saved-puzzle ${isLast ? 'last' : ''}`}>
        <a className="puzzle-selector" href={puzzleLink(puzzleState, shortenLinks)}>
            <SavedPuzzleGrid
                puzzleState={puzzleState}
                showRatings={showRatings}
            />
        </a>
        <SavedPuzzleMetadata
            difficultyLevel={difficultyLevel}
            startTime={startTime}
            lastUpdatedTime={lastUpdatedTime}
            elapsedTime={elapsedTime}
        />
        {puzzleButtons}
    </div>;
}


function OneSavedPuzzle({puzzleState, showRatings, shortenLinks, discardHandler, cancelHandler}) {
    return <>
        <h1>Continue or discard?</h1>
        <p>You have a saved game for this puzzle. Pick up where you left off or discard it.</p>
        <div className="mb-6">
            <SavedPuzzle
                puzzleState={puzzleState}
                showRatings={showRatings}
                shortenLinks={shortenLinks}
                isLast={true}
            />
        </div>
        <div className="buttons">
            <button className="secondary" onClick={cancelHandler}>Cancel</button>
            <button className="danger" onClick={discardHandler}
                data-puzzle-state-key={puzzleState.puzzleStateKey}>Discard</button>
            <a className="button primary" href={puzzleLink(puzzleState, shortenLinks)}>Continue</a>
        </div>
    </>;
}


function SavedPuzzleList({savedPuzzles=[], showRatings, shortenLinks, discardHandler, cancelHandler}) {
    const puzzles = savedPuzzles.map((puzzleState, i) => {
        return <SavedPuzzle
            key={puzzleState.puzzleStateKey}
            puzzleState={puzzleState}
            showRatings={showRatings}
            shortenLinks={shortenLinks}
            discardHandler={discardHandler}
            isLast={i === savedPuzzles.length - 1}
        />
    });
    return <>
        <h1>In-progress Puzzles</h1>
        <p>Select a puzzle to resume or discard it to clear space.</p>
        <div className="space-y-4">
            {puzzles}
        </div>
        <div className="buttons">
            <button className="secondary" onClick={cancelHandler}>Back</button>
        </div>
    </>;
}


function ModalSavedPuzzles({modalState, modalHandler}) {
    const {savedPuzzles, showRatings, shortenLinks} = modalState;
    const cancelHandler = () => modalHandler('show-welcome-modal');
    const discardHandler = (e) => {
        const puzzleStateKey = e.target.dataset.puzzleStateKey;
        modalHandler({
            action: 'discard-saved-puzzle',
            puzzleStateKey,
        });
    };
    const modalContent = (savedPuzzles || []).length === 1
        ? (
            <OneSavedPuzzle
                puzzleState={savedPuzzles[0]}
                showRatings={showRatings}
                shortenLinks={shortenLinks}
                discardHandler={discardHandler}
                cancelHandler={cancelHandler}
            />
          )
        : (
             <SavedPuzzleList
                 savedPuzzles={savedPuzzles}
                 showRatings={showRatings}
                 shortenLinks={shortenLinks}
                 discardHandler={discardHandler}
                 cancelHandler={cancelHandler}
             />
           );
    return (
        <div className="modal saved-puzzles">
            {modalContent}
        </div>
    );
}


export default ModalSavedPuzzles;
