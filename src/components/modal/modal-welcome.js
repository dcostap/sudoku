import { useState } from 'react';

import { compressPuzzleDigits } from '../../lib/string-utils';

import SudokuMiniGrid from '../sudoku-grid/sudoku-mini-grid';
import PuzzleItem from '../puzzle-item/puzzle-item';

function stopPropagation (e) {
    e.stopPropagation();
}

function groupPuzzlesByMonth(puzzles) {
    const groups = {};
    puzzles.forEach(puzzle => {
        if (!puzzle.date) return;

        const monthYear = puzzle.date.toLocaleDateString('en-US', { year: 'numeric', month: 'long' });
        if (!groups[monthYear]) {
            groups[monthYear] = [];
        }
        groups[monthYear].push(puzzle);
    });
    return groups;
}

function NYTPuzzleList({ modalState }) {
    const [collapsed, setCollapsed] = useState({});
    const { nytPuzzles, showRatings, shortenLinks } = modalState;

    if (!nytPuzzles || nytPuzzles.length === 0) {
        return (
            <div className="nyt-puzzles-empty">
                No NYT puzzles found. Please check the nyt-scraper/sudoku directory.
            </div>
        );
    }

    const puzzlesByMonth = groupPuzzlesByMonth(nytPuzzles);
    const monthNames = Object.keys(puzzlesByMonth);

    const sections = monthNames.map((monthName, idx) => {
        const isCollapsed = collapsed[monthName] !== undefined ? collapsed[monthName] : (idx > 0);
        const puzzles = puzzlesByMonth[monthName];

        const puzzleItems = puzzles.map((puzzle, i) => (
            <li key={puzzle.id || i}>
                <PuzzleItem
                    puzzle={puzzle}
                    showRatings={showRatings}
                    shortenLinks={shortenLinks}
                    type="nyt"
                />
            </li>
        ));

        const toggleCollapsed = () => {
            setCollapsed(prev => ({ ...prev, [monthName]: !isCollapsed }));
        };

        const classes = `section nyt-month-section ${isCollapsed ? 'collapsed' : ''}`;

        return (
            <div key={monthName} className={classes} onClick={toggleCollapsed}>
                <h2>{monthName} <span className="puzzle-count">({puzzles.length})</span></h2>
                <ul>{puzzleItems}</ul>
            </div>
        );
    });

    return (
        <div className="nyt-puzzles">
            {sections}
        </div>
    );
}


function CountBadge ({count}) {
    return <sup className="count-badge">{count}</sup>;
}


function SavedPuzzlesButton({savedPuzzles, modalHandler}) {
    if (!savedPuzzles || savedPuzzles.length === 0) {
        return null;
    }
    const savedPuzzlesHandler = () => modalHandler("show-saved-puzzles-modal");
    return (
        <button className="primary new-puzzle" onClick={savedPuzzlesHandler}>
            Resume a puzzle
            <CountBadge count={savedPuzzles.length} />
        </button>
    );
}


function ModalWelcome({modalState, modalHandler}) {
    const {savedPuzzles} = modalState;
    const cancelHandler = () => modalHandler('cancel');
    const showPasteHandler = () => modalHandler('show-paste-modal');
    const twitterUrl = "https://twitter.com/SudokuExchange";
    const orRestoreMsg = (savedPuzzles && savedPuzzles.length > 0)
        ? ", or return to a puzzle you started previously"
        : "";
    return (
        <div className="modal welcome">
            <h1>Welcome to SudokuExchange</h1>
            <p>You can get started by entering a new puzzle into a blank grid{orRestoreMsg}:</p>
            <div className="primary-buttons">
                <span>
                    <button className="primary new-puzzle" onClick={cancelHandler}>Enter a new puzzle</button>
                    <button className="primary new-puzzle" onClick={showPasteHandler}>Paste a new puzzle</button>
                    <SavedPuzzlesButton savedPuzzles={savedPuzzles} modalHandler={modalHandler} />
                </span>
            </div>
            <p>Or select an NYT puzzle:</p>
            <NYTPuzzleList modalState={modalState} />
            <div id="welcome-footer">
                <p>Follow <a href={twitterUrl} target="_blank" rel="noreferrer">@SudokuExchange</a> on Twitter for updates.</p>
            </div>
        </div>
    );
}


export default ModalWelcome;
