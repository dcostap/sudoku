import { useState } from 'react';
import { compressPuzzleDigits } from '../../lib/string-utils';
import SudokuMiniGrid from '../sudoku-grid/sudoku-mini-grid';
import './home-page.css';

function stopPropagation(e) {
    e.stopPropagation();
}

function NYTPuzzleItem({ puzzle, showRatings, shortenLinks }) {
    const puzzleString = shortenLinks
        ? compressPuzzleDigits(puzzle.digits)
        : puzzle.digits;

    // Map difficulty to level number for URL compatibility
    const difficultyLevelMap = {
        'easy': '1',
        'medium': '2',
        'hard': '3',
        'expert': '4',
    };
    const level = difficultyLevelMap[puzzle.difficulty] || '3';

    // Format date as "May 13, 2023"
    const dateStr = puzzle.date
        ? puzzle.date.toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric' })
        : '';

    const difficultyBadge = puzzle.difficulty
        ? <span className={`difficulty-badge ${puzzle.difficulty}`}>{puzzle.difficulty}</span>
        : null;

    return (
        <li>
            <a href={`./?s=${puzzleString}&d=${level}`} onClick={stopPropagation}>
                <div className="nyt-puzzle-item">
                    <SudokuMiniGrid puzzle={puzzle} showRatings={showRatings} />
                    <div className="nyt-puzzle-info">
                        <div className="nyt-puzzle-date">{dateStr}</div>
                        {difficultyBadge}
                    </div>
                </div>
            </a>
        </li>
    );
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

function NYTPuzzleList({ nytPuzzles, showRatings, shortenLinks }) {
    const [collapsed, setCollapsed] = useState({});

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
            <NYTPuzzleItem
                key={puzzle.id || i}
                puzzle={puzzle}
                showRatings={showRatings}
                shortenLinks={shortenLinks}
            />
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

function HomePage({ nytPuzzles, showRatings, shortenLinks, onNewPuzzle, onImportPuzzle, onSettings, onAbout }) {
    return (
        <div className="home-page">
            <div className="home-page-header">
                <h1>Sudoku Exchange</h1>
                <p className="tagline">Solve, Share, and Exchange Sudoku Puzzles</p>
            </div>

            <div className="home-page-content">
                <section className="action-section">
                    <h2>Get Started</h2>
                    <div className="action-cards">
                        <div className="action-card" onClick={onNewPuzzle}>
                            <div className="action-icon">
                                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                    <rect x="3" y="3" width="18" height="18" rx="2" />
                                    <line x1="9" y1="3" x2="9" y2="21" />
                                    <line x1="15" y1="3" x2="15" y2="21" />
                                    <line x1="3" y1="9" x2="21" y2="9" />
                                    <line x1="3" y1="15" x2="21" y2="15" />
                                </svg>
                            </div>
                            <h3>New Puzzle</h3>
                            <p>Create a new puzzle from scratch</p>
                        </div>

                        <div className="action-card" onClick={onImportPuzzle}>
                            <div className="action-icon">
                                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                    <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
                                    <polyline points="7 10 12 15 17 10" />
                                    <line x1="12" y1="15" x2="12" y2="3" />
                                </svg>
                            </div>
                            <h3>Import Puzzle</h3>
                            <p>Paste or import a puzzle</p>
                        </div>

                        <div className="action-card" onClick={onSettings}>
                            <div className="action-icon">
                                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                    <circle cx="12" cy="12" r="3" />
                                    <path d="M12 1v6m0 6v6m4.22-13.22l-4.24 4.24m-4.24 4.24L3.5 18.5m17-2.72l-4.24-4.24m-4.24-4.24L7.78 3.06" />
                                </svg>
                            </div>
                            <h3>Settings</h3>
                            <p>Configure app preferences</p>
                        </div>
                    </div>
                </section>

                <section className="nyt-section">
                    <h2>NYT Puzzles</h2>
                    <p className="section-description">Select from a collection of New York Times Sudoku puzzles</p>
                    <NYTPuzzleList 
                        nytPuzzles={nytPuzzles}
                        showRatings={showRatings}
                        shortenLinks={shortenLinks}
                    />
                </section>
            </div>

            <footer className="home-page-footer">
                <p>
                    Follow <a href="https://twitter.com/SudokuExchange" target="_blank" rel="noreferrer">@SudokuExchange</a> on Twitter for updates
                    {onAbout && <> · <button className="link-button" onClick={onAbout}>About</button></>}
                </p>
            </footer>
        </div>
    );
}

export default HomePage;
