/**
 * NYT Puzzle Loader
 * 
 * Loads NYT Sudoku puzzles from the pre-generated JSON file.
 */

import NYT_PUZZLES_DATA from './nyt_puzzles.json';

/**
 * Loads all NYT puzzles from pre-generated data JSON
 * @returns {Array} Array of puzzle objects sorted by date (newest first)
 */
export function loadNYTPuzzles() {
    try {
        // Convert date strings back to Date objects
        const puzzles = NYT_PUZZLES_DATA.map(puzzle => ({
            ...puzzle,
            date: puzzle.date ? new Date(puzzle.date) : null,
        }));

        // Sort by date, newest first
        puzzles.sort((a, b) => {
            if (!a.date && !b.date) return 0;
            if (!a.date) return 1;
            if (!b.date) return -1;
            return b.date.getTime() - a.date.getTime();
        });

        return puzzles;
    } catch (error) {
        console.error('Failed to load NYT puzzles from JSON:', error);
        return [];
    }
}

/**
 * Maps difficulty levels to display names
 */
export const DIFFICULTY_DISPLAY_NAMES = {
    'easy': 'Easy',
    'medium': 'Medium',
    'hard': 'Hard',
    'expert': 'Expert',
};

/**
 * Maps difficulty levels to numeric values (for consistency with existing app)
 * 1 = Easy, 2 = Medium, 3 = Hard, 4 = Expert
 */
export const DIFFICULTY_TO_LEVEL = {
    'easy': '1',
    'medium': '2',
    'hard': '3',
    'expert': '4',
};
