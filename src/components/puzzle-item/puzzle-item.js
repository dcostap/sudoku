import { modelHelpers } from '../../lib/sudoku-model';
import { compressPuzzleDigits } from '../../lib/string-utils';
import SudokuMiniGrid from '../sudoku-grid/sudoku-mini-grid';
import './puzzle-item.css';

function stopPropagation(e) {
    if (e) e.stopPropagation();
}

function PuzzleItem({ 
    puzzle, 
    showRatings, 
    shortenLinks,
    type = 'nyt', // 'nyt', 'saved', 'history'
}) {
    const digits = puzzle.initialDigits || puzzle.digits;
    const puzzleString = shortenLinks
        ? compressPuzzleDigits(digits)
        : digits;

    const nytInfo = modelHelpers.getNYTInfo(digits);
    
    // Map difficulty to level number for URL compatibility
    const difficultyLevelMap = {
        'easy': '1',
        'medium': '2',
        'hard': '3',
        'expert': '4',
    };
    
    const difficulty = puzzle.difficulty || (nytInfo && nytInfo.difficulty) || puzzle.difficultyRating;
    const level = difficultyLevelMap[difficulty] || puzzle.difficultyLevel || '3';

    // Format date properly
    let dateStr = '';
    if (nytInfo && nytInfo.date) {
        dateStr = nytInfo.date.toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric' });
    } else if (puzzle.date) { // For NYT puzzles passed directly
        const d = puzzle.date instanceof Date ? puzzle.date : new Date(puzzle.date);
        dateStr = d.toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric' });
    } else if (puzzle.lastUpdatedTime || puzzle.archivedAt) {
        dateStr = new Date(puzzle.lastUpdatedTime || puzzle.archivedAt).toLocaleDateString('en-US', {
            year: 'numeric',
            month: 'short',
            day: 'numeric',
            hour: '2-digit',
            minute: '2-digit'
        });
    }

    const difficultyBadge = difficulty
        ? <span className={`difficulty-badge ${difficulty}`}>{difficulty}</span>
        : null;

    const url = `./?s=${puzzleString}&d=${level}${type === 'saved' ? '&r=1' : ''}`;

    const formatElapsedTime = (elapsedTime) => {
        if (!elapsedTime) return '0s';
        const seconds = Math.floor(elapsedTime / 1000);
        const minutes = Math.floor(seconds / 60);
        const hours = Math.floor(minutes / 60);
        
        if (hours > 0) {
            return `${hours}h ${minutes % 60}m`;
        } else if (minutes > 0) {
            return `${minutes}m ${seconds % 60}s`;
        } else {
            return `${seconds}s`;
        }
    };

    if (type === 'nyt') {
        return (
            <div className="puzzle-item nyt">
                <a href={url} onClick={stopPropagation}>
                    <SudokuMiniGrid puzzle={{ digits, difficulty }} showRatings={showRatings} />
                    <div className="puzzle-info">
                        <div className="puzzle-date">{dateStr}</div>
                        {difficultyBadge}
                    </div>
                </a>
            </div>
        );
    }

    if (type === 'saved') {
        return (
            <div className="puzzle-item saved">
                <a href={url} onClick={stopPropagation}>
                    <SudokuMiniGrid 
                        puzzle={{ 
                            digits: puzzle.completedDigits || puzzle.initialDigits,
                            difficulty: difficulty
                        }} 
                        showRatings={showRatings} 
                    />
                    <div className="puzzle-info">
                        <div className="puzzle-time">
                            <strong>Time:</strong> {formatElapsedTime(puzzle.elapsedTime)}
                        </div>
                        <div className="puzzle-date">
                            {nytInfo ? `NYT ${nytInfo.date.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}` : `Last played: ${dateStr}`}
                        </div>
                        {nytInfo && (
                            <div className="nyt-tag">
                                <span className="nyt-icon">NYT</span>
                                {nytInfo.difficulty}
                            </div>
                        )}
                    </div>
                </a>
            </div>
        );
    }

    if (type === 'history') {
        const isDraft = puzzle.mode === 'enter';
        let statusBadge = puzzle.status === 'solved' 
            ? <span className="status-badge solved">✓ Solved</span>
            : <span className="status-badge abandoned">Abandoned</span>;

        if (isDraft) {
            statusBadge = <span className="status-badge draft">✎ Draft</span>;
        }

        const replayUrl = `./?s=${puzzleString}&d=${level}&replay=1&attempt=${puzzle.attemptIndex}`;
        const solveAgainUrl = `./?s=${puzzleString}&d=${level}${isDraft ? '&mode=enter' : ''}`;

        return (
            <div className="puzzle-item history">
                <SudokuMiniGrid 
                    puzzle={{ 
                        digits: puzzle.initialDigits,
                        difficulty: difficulty
                    }} 
                    showRatings={showRatings} 
                />
                <div className="puzzle-info">
                    {statusBadge}
                    <div className="puzzle-time">
                        <strong>Time:</strong> {formatElapsedTime(puzzle.elapsedTime)}
                    </div>
                    <div className="puzzle-date">
                        {nytInfo ? `NYT - ${dateStr}` : `History: ${dateStr}`}
                    </div>
                    <div className="puzzle-actions">
                        <a href={replayUrl} className="btn-small btn-secondary" onClick={stopPropagation}>
                            ▶ Replay
                        </a>
                        <a href={solveAgainUrl} className="btn-small btn-primary" onClick={stopPropagation}>
                            {isDraft ? '✎ Continue' : '↻ Again'}
                        </a>
                    </div>
                </div>
            </div>
        );
    }

    return null;
}

export default PuzzleItem;
