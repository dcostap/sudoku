import { useState, useCallback, useEffect, useMemo } from 'react';

import {saveSvgAsPng} from 'save-svg-as-png';

import { newSudokuModel, modelHelpers, SETTINGS } from '../../lib/sudoku-model.js';
import useWindowSize from '../../lib/use-window-size.js';
import { loadNYTPuzzles } from '../../lib/nyt-puzzle-loader.js';

import SvgSprites from '../svg-sprites/svg-sprites';
import StatusBar from '../status-bar/status-bar';
import SudokuGrid from '../sudoku-grid/sudoku-grid';
import VirtualKeyboard from '../virtual-keyboard/virtual-keyboard';
import SolvedPuzzleOptions from '../solved-puzzle-options/solved-puzzle-options';
import ModalContainer from '../modal/modal-container';
import HomePage from '../home-page/home-page';
import ReplayControls from '../replay-controls/replay-controls';

import {
    MODAL_TYPE_RESUME_OR_RESTART,
    MODAL_TYPE_HINT
} from '../../lib/modal-types';

const FETCH_DELAY = 1000;
const RETRY_INTERVAL = 3000;
const MAX_RETRIES = 10;

const inputModeFromHotKey = {
    z: 'digit',
    x: 'outer',
    c: 'inner',
    v: 'color',
}

function initialGridFromURL () {
    const params = new URLSearchParams(window.location.search);
    const initialDigits = params.get('s');
    
    // If no puzzle is specified, return null to show the home page
    if (!initialDigits) {
        return null;
    }

    // Check if this is replay mode
    const isReplay = params.get('replay') === '1';
    
    if (isReplay) {
        const attemptIndex = parseInt(params.get('attempt') || '0', 10);
        
        // Load the history entry
        const history = modelHelpers.getPuzzleHistory(initialDigits);
        const historyEntry = history[attemptIndex];
        
        if (historyEntry) {
            const grid = modelHelpers.createReplayGrid(historyEntry);
            document.body.dataset.initialDigits = grid.get('initialDigits');
            document.body.dataset.replayMode = 'true';
            return grid;
        }
    }
    
    let grid = newSudokuModel({
        initialDigits: initialDigits,
        difficultyLevel: params.get('d'),
        onPuzzleStateChange: grid => {
            document.body.dataset.currentSnapshot = grid.get('currentSnapshot');
            modelHelpers.persistPuzzleState(grid);
        }
    });

    if (window.location.hash === "#features") {
        grid = modelHelpers.showFeaturesModal(grid);
    }

    if (params.get('r') === "1") {
        const puzzleStateKey = 'save-' + grid.get('initialDigits')
        grid = modelHelpers.restoreFromPuzzleState(grid, puzzleStateKey);
    }

    document.body.dataset.initialDigits = grid.get('initialDigits');
    return grid;
}

function saveScreenshot () {
    // Copy all applicable CSS custom property (variable) values directly into
    // the style property of the SVG element
    const svgGrid = document.getElementById('main-grid').firstChild;
    const elStyle = getComputedStyle(svgGrid); // computed values for current theme
    const cssVars = Array.from(document.styleSheets)
        .map(styleSheet => Array.from(styleSheet.cssRules))
        .flat()
        .filter(cssRule => cssRule.selectorText === ':root')
        .map(cssRule => cssRule.cssText.split('{')[1].split('}')[0].trim().split(';'))
        .flat()
        .filter(text => text !== "")
        .map(text => text.split(':')[0].trim())
        .filter(name => name.startsWith('--'))
        .map(name => {return {name: name, value: elStyle.getPropertyValue(name)}});
    cssVars.forEach(cv => svgGrid.style.setProperty(cv.name, cv.value));
    // Save SVG element to PNG (which will complete asynchronously)
    const options = {
        selectorRemap: (selector) => selector.replace(/[.]sudoku-grid\s+/, '')
    };
    saveSvgAsPng(svgGrid, "sudoku-exchange-screenshot.png", options);
    // Remove the variable values from the SVG element some time later
    setTimeout(
        () => cssVars.forEach(cv => svgGrid.style.setProperty(cv.name, '')),
        1000
    );
}

function handleVisibilityChange(setGrid) {
    const isVisible = document.visibilityState === 'visible';
    setGrid(grid => modelHelpers.handleVisibilityChange(grid, isVisible));
}

function indexFromCellEvent (e) {
    const index = e.target.dataset.cellIndex;
    if (index === undefined) {
        return;
    }
    return parseInt(index, 10);
}

function cellMouseDownHandler (e, setGrid) {
    e.stopPropagation();
    const index = indexFromCellEvent(e);
    if (index === undefined) {
        // Remember, this is a mouseDown handler, not a click handler
        setGrid((grid) => modelHelpers.applySelectionOp(grid, 'clearSelection'));
    }
    else {
        if (e.ctrlKey || e.metaKey || e.shiftKey) {
            setGrid((grid) => modelHelpers.applySelectionOp(grid, 'toggleExtendSelection', index));
        }
        else {
            setGrid((grid) => modelHelpers.applySelectionOp(grid, 'setSelection', index));
        }
    }
    e.preventDefault();
}

function cellMouseOverHandler (e, setGrid) {
    e.stopPropagation();
    if ((e.buttons & 1) === 1) {
        const index = indexFromCellEvent(e);
        setGrid((grid) => modelHelpers.applySelectionOp(grid, 'extendSelection', index));
        e.preventDefault();
    }
}

function docKeyDownHandler (e, modalActive, setGrid, solved, inputMode) {
    if (solved) {
        return;
    }
    const keyName = e.code;
    if (modalActive) {
        if (keyName === 'Escape') {
            escapeFromModal(setGrid);
        }
        return;
    }
    if (e.altKey) {
        return;     // Don't intercept browser hot-keys
    }
    const ctrlOrMeta = e.ctrlKey || e.metaKey;
    const shiftOrCtrl = e.shiftKey || ctrlOrMeta;
    let digit = undefined;
    const match = RegExp(/^(?:Digit|Numpad)([0-9])$/).exec(keyName)
    if (match) {
        digit = match[1];
    }
    if (digit !== undefined) {
        setGrid((grid) => {
            let cellOp;
            if ((e.shiftKey && ctrlOrMeta) || inputMode === 'color') {
                cellOp = 'setCellColor';
            }
            else if (ctrlOrMeta || inputMode === 'inner') {
                cellOp = 'toggleInnerPencilMark';
            }
            else if (e.shiftKey || inputMode === 'outer') {
                cellOp = 'toggleOuterPencilMark';
            }
            else {
                cellOp = modelHelpers.defaultDigitOpForSelection(grid);
            }
            return modelHelpers.updateSelectedCells(grid, cellOp, digit);
        });
        e.preventDefault();
        return;
    }
    else if (keyName === "Backspace" || keyName === "Delete") {
        if (e.target === document.body) {
            // We don't want browser to treat this as a back button action
            e.preventDefault();
        }
        setGrid((grid) => modelHelpers.updateSelectedCells(grid, 'clearCell'));
        return;
    }
    else if (e.key === ".") {
        setGrid((grid) => modelHelpers.updateSelectedCells(grid, 'pencilMarksToInner'));
        return;
    }
    else if (e.key === "?") {
        setGrid((grid) => modelHelpers.showHintModal(grid));
        return;
    }
    else if (keyName === "Escape") {
        setGrid((grid) => modelHelpers.applySelectionOp(grid, 'clearSelection'));
        return;
    }
    else if ((keyName === "KeyZ" && ctrlOrMeta) || keyName === "BracketLeft") {
        setGrid((grid) => modelHelpers.undoOneAction(grid));
        return;
    }
    else if ((keyName === "KeyY" && ctrlOrMeta) || keyName === "BracketRight") {
        setGrid((grid) => modelHelpers.redoOneAction(grid));
        return;
    }
    else if (keyName === "ArrowRight" || keyName === "KeyD") {
        setGrid((grid) => modelHelpers.moveFocus(grid, 1, 0, shiftOrCtrl));
        e.preventDefault();
        return;
    }
    else if (keyName === "ArrowLeft" || keyName === "KeyA") {
        setGrid((grid) => modelHelpers.moveFocus(grid, -1, 0, shiftOrCtrl));
        e.preventDefault();
        return;
    }
    else if (keyName === "ArrowUp" || keyName === "KeyW") {
        setGrid((grid) => modelHelpers.moveFocus(grid, 0, -1, shiftOrCtrl));
        // Don't prevent Cmd-W closing the window (#32)
        if (!(ctrlOrMeta && keyName === "KeyW")) {
            e.preventDefault();
        }
        return;
    }
    else if (keyName === "ArrowDown" || keyName === "KeyS") {
        setGrid((grid) => modelHelpers.moveFocus(grid, 0, 1, shiftOrCtrl));
        e.preventDefault();
        return;
    }
    else if (keyName === "KeyF") {
        if (window.document.fullscreen) {
            window.document.exitFullscreen();
        }
        else {
            window.document.body.requestFullscreen();
        }
        return;
    }
    else if (keyName === "KeyP") {
        setGrid((grid) => modelHelpers.toggleShowPencilmarks(grid));
    }
    else if (keyName === "F1") {
        setGrid((grid) => modelHelpers.showHelpPage(grid));
        return;
    }
    else if (keyName === "Enter") {
        setGrid((grid) => modelHelpers.gameOverCheck(grid));
        return;
    }
    else if (keyName === "Home") {
        setGrid((grid) => modelHelpers.applySelectionOp(grid, 'setSelection', modelHelpers.CENTER_CELL));
        return;
    }
    else if (keyName === "Space") {
        setGrid((grid) => modelHelpers.applySelectionOp(grid, 'toggleExtendSelection', grid.get('focusIndex')));
        return;
    }
    else if (e.key === "Control" || e.key === "Meta") {
        if (e.shiftKey) {
            setGrid((grid) => modelHelpers.setTempInputMode(grid, 'color'));
        }
        else {
            setGrid((grid) => modelHelpers.setTempInputMode(grid, 'inner'));
        }
        return;
    }
    else if (e.key === "Shift") {
        if (ctrlOrMeta) {
            setGrid((grid) => modelHelpers.setTempInputMode(grid, 'color'));
        }
        else {
            setGrid((grid) => modelHelpers.setTempInputMode(grid, 'outer'));
        }
        return;
    }
    else if (inputModeFromHotKey[e.key]) {
        setGrid((grid) => modelHelpers.setInputMode(grid, inputModeFromHotKey[e.key]));
        return;
    }
    // else { console.log('keydown event:', e); }
}

function escapeFromModal(setGrid) {
    setGrid((grid) => {
        const modalState = grid.get('modalState');
        if (modalState && modalState.escapeAction) {
            grid = modelHelpers.applyModalAction(grid, modalState.escapeAction);
        }
        return grid;
    });
}

function docKeyUpHandler(e, modalActive, setGrid) {
    if (modalActive) {
        return;
    }
    if (e.key === "Control" || e.key === "Meta") {
        if (e.shiftKey) {
            setGrid((grid) => modelHelpers.setTempInputMode(grid, 'outer'));
        }
        else {
            setGrid((grid) => modelHelpers.clearTempInputMode(grid));
        }
        return;
    }
    else if (e.key === 'Shift') {
        if (e.ctrlKey || e.metaKey) {
            setGrid((grid) => modelHelpers.setTempInputMode(grid, 'inner'));
        }
        else {
            setGrid((grid) => modelHelpers.clearTempInputMode(grid));
        }
        return;
    }
    // else { console.log('keyup event:', e); }
}

function clearTempInputMode(setGrid) {
    setGrid((grid) => modelHelpers.clearTempInputMode(grid));
}

const inputEventHandler = (function() {
    const DOUBLE_CLICK_TIME = 650
    let lastEvent = {};

    return (e, setGrid, inputMode) => {
        const {type, value} = e;
        const now = Date.now();
        if (e.wantDoubleClick && type === lastEvent.type && value === lastEvent.value) {
            if ((now - lastEvent.eventTime) < DOUBLE_CLICK_TIME) {
                e.isDoubleClick = true;
            }
        }
        lastEvent = {type, value, eventTime: now};
        if (e.type === 'vkbdKeyPress') {
            return vkbdKeyPressHandler(e, setGrid, inputMode);
        }
        else if (e.type === 'cellTouched' || e.type === 'cellSwipedTo') {
            return cellTouchHandler(e, setGrid);
        }
    }
})();

function cellTouchHandler (e, setGrid) {
    const eventType = e.type;
    const index = e.cellIndex;
    if (eventType === 'cellTouched') {
        setGrid((grid) => modelHelpers.applySelectionOp(grid, 'setSelection', index));
    }
    else if (eventType === 'cellSwipedTo') {
        setGrid((grid) => modelHelpers.applySelectionOp(grid, 'extendSelection', index));
    }
}

function vkbdKeyPressHandler(e, setGrid, inputMode) {
    const keyValue = e.keyValue;
    if (e.isDoubleClick) {
        if (keyValue === 'input-mode-color') {
            setGrid((grid) => modelHelpers.confirmClearColorHighlights(grid));
        }
        else if (keyValue === 'input-mode-inner') {
            setGrid((grid) => modelHelpers.updateSelectedCells(grid, 'pencilMarksToInner'));
        }
        else if ('1' <= keyValue && keyValue <= '9') {
            if (inputMode === 'inner' || inputMode === 'outer') {
                // dblclick overrides input mode and forces setDigit
                setGrid((grid) => modelHelpers.updateSelectedCells(grid, 'setDigit', keyValue, {replaceUndo: true}));
            }
        }
        return;
    }
    if ('0' <= keyValue && keyValue <= '9') {
        setGrid((grid) => {
            const selectedCellCount = grid.get("cells").count((c) => c.get("isSelected"));
            if (e.ctrlKey || e.metaKey || inputMode === 'inner') {
                return modelHelpers.updateSelectedCells(grid, 'toggleInnerPencilMark', keyValue);
            }
            else if (inputMode === 'color') {
                return modelHelpers.updateSelectedCells(grid, 'setCellColor', keyValue);
            }
            else if (e.shiftKey || inputMode === 'outer' || selectedCellCount > 1) {
                return modelHelpers.updateSelectedCells(grid, 'toggleOuterPencilMark', keyValue);
            }
            else {
                return modelHelpers.updateSelectedCells(grid, 'setDigit', keyValue);
            }
        });
        return;
    }
    else if (keyValue === 'delete') {
        setGrid((grid) => modelHelpers.updateSelectedCells(grid, 'clearCell'));
        return;
    }
    else if (keyValue === 'check') {
        setGrid((grid) => modelHelpers.gameOverCheck(grid));
        return;
    }
    else if (keyValue === 'undo') {
        setGrid((grid) => modelHelpers.undoOneAction(grid));
        return;
    }
    else if (keyValue === 'redo') {
        setGrid((grid) => modelHelpers.redoOneAction(grid));
        return;
    }
    else if (keyValue === 'restart') {
        setGrid((grid) => modelHelpers.confirmRestart(grid));
        return;
    }
    else if (keyValue.match(/^input-mode-(digit|inner|outer|color)$/)) {
        const newMode = keyValue.substr(11);
        setGrid((grid) => modelHelpers.setInputMode(grid, newMode));
        return;
    }
    else {
        console.log('keyValue:', keyValue);
    }
}

function dispatchModalAction(action, setGrid) {
    if (action.action === 'paste-initial-digits') {
        // Suppress onpageunload handling when user clicks 'Start' after pasting a puzzle
        delete document.body.dataset.currentSnapshot;
    }
    setGrid((grid) => modelHelpers.applyModalAction(grid, action));
}

function dispatchMenuAction(action, setGrid) {
    if (action === 'show-share-modal') {
        setGrid((grid) => modelHelpers.showShareModal(grid));
    }
    else if (action === 'show-paste-modal') {
        setGrid((grid) => modelHelpers.showPasteModal(grid));
    }
    else if (action === 'show-settings-modal') {
        setGrid((grid) => modelHelpers.showSettingsModal(grid));
    }
    else if (action === 'show-solver-modal') {
        setGrid((grid) => modelHelpers.showSolverModal(grid));
    }
    else if (action === 'toggle-show-pencilmarks') {
        setGrid((grid) => modelHelpers.toggleShowPencilmarks(grid));
    }
    else if (action === 'clear-pencilmarks') {
        setGrid((grid) => modelHelpers.clearPencilmarks(grid));
    }
    else if (action === 'calculate-candidates') {
        setGrid((grid) => modelHelpers.showCalculatedCandidates(grid));
    }
    else if (action === 'show-help-page') {
        setGrid((grid) => modelHelpers.showHelpPage(grid));
    }
    else if (action === 'show-about-modal') {
        setGrid((grid) => modelHelpers.showAboutModal(grid));
    }
    else if (action === 'save-screenshot') {
        saveScreenshot();
    }
    else if (action === 'show-hint-modal') {
        setGrid((grid) => modelHelpers.showHintModal(grid));
    }
    else if (action === 'restart-puzzle') {
        setGrid((grid) => modelHelpers.confirmRestart(grid));
    }
    else if (action === 'abandon-puzzle') {
        setGrid((grid) => modelHelpers.showConfirmAbandonModal(grid));
    }
    else {
        console.log(`Unrecognised menu action: '${action}'`);
    }
}

function pauseTimer(setGrid) {
    setGrid((grid) => modelHelpers.pauseTimer(grid));
}

function preStartCheck() {
    // Suppress onpageunload handling when user clicks 'Start' after entering a puzzle
    delete document.body.dataset.currentSnapshot;
}

function getDimensions(winSize) {
    const dim = { ...winSize };
    if (dim.width > dim.height) {
        dim.orientation = 'landscape';
        dim.gridLength = Math.min(
            Math.floor(dim.height * 0.80),
            Math.floor(dim.width * 0.52)
        );
        dim.vkbdWidth = Math.floor(dim.gridLength * 0.56);
    }
    else {
        dim.orientation = 'portrait';
        dim.gridLength = Math.min(
            Math.floor(dim.height * 0.54),
            Math.floor(dim.width * 0.95)
        );
        dim.vkbdWidth = Math.floor(dim.gridLength * 0.7);
    }
    return dim;
}

function App() {
    const [grid, setGrid] = useState(initialGridFromURL);
    
    // Determine what to render
    const isHomePage = grid === null;
    const isHomePageModal = !isHomePage && grid.get('initialDigits') === '0'.repeat(81) && grid.get('modalState');
    const isPuzzleView = !isHomePage && !isHomePageModal;
    
    // Extract values from grid for puzzle view (or use defaults)
    const settings = grid ? grid.get('settings') : modelHelpers.loadSettings();
    let showTimer = settings[SETTINGS.showTimer];
    const intervalStartTime = grid ? grid.get('intervalStartTime') : undefined;
    const endTime = grid ? grid.get('endTime') : undefined;
    const pausedAt = grid ? grid.get('pausedAt') : undefined;
    const hintsUsedCount = grid ? grid.get('hintsUsed').size : 0;
    const solved = grid ? grid.get('solved') : false;
    const mode = grid ? grid.get('mode') : 'enter';
    const inputMode = grid ? (grid.get('tempInputMode') || grid.get('inputMode')) : 'digit';
    const completedDigits = grid ? grid.get('completedDigits') : {};
    const modalState = grid ? grid.get('modalState') : undefined;
    
    if (modalState) {
        if (modalState.fetchRequired) {
            if (modalState.modalType === MODAL_TYPE_HINT) {
                modelHelpers.fetchExplainPlan(grid, setGrid, RETRY_INTERVAL, MAX_RETRIES);
            }
        }
        if (modalState.modalType === MODAL_TYPE_RESUME_OR_RESTART) {
            showTimer = false;
        }
    }
    const modalActive = modalState !== undefined;
    
    // All hooks must be called before any conditional returns
    const mouseDownHandler = useCallback(e => cellMouseDownHandler(e, setGrid), []);
    const mouseOverHandler = useCallback(e => cellMouseOverHandler(e, setGrid), []);
    const inputHandler = useCallback(e => inputEventHandler(e, setGrid, inputMode), [inputMode]);
    const modalHandler = useCallback(a => dispatchModalAction(a, setGrid), []);
    const menuHandler = useCallback(a => dispatchMenuAction(a, setGrid), []);
    const pauseHandler = useCallback(() => pauseTimer(setGrid), []);
    
    // Handle browser back button
    useEffect(() => {
        const handlePopState = (e) => {
            // When back button is pressed, check current URL and update state
            const params = new URLSearchParams(window.location.search);
            if (!params.get('s')) {
                // No puzzle in URL, show home page
                setGrid(null);
            } else {
                // Reload the grid from URL
                window.location.reload();
            }
        };
        
        window.addEventListener('popstate', handlePopState);
        return () => window.removeEventListener('popstate', handlePopState);
    }, []);

    useEffect(
        () => {
            const pressHandler = (e) => docKeyDownHandler(e, modalActive, setGrid, solved, inputMode);
            document.addEventListener('keydown', pressHandler);
            const releaseHandler = (e) => docKeyUpHandler(e, modalActive, setGrid);
            document.addEventListener('keyup', releaseHandler);
            return () => {
                document.removeEventListener('keydown', pressHandler)
                document.removeEventListener('keyup', releaseHandler)
            };
        },
        [solved, inputMode, modalActive]
    );

    useEffect(
        () => {
            const blurHandler = (e) => clearTempInputMode(setGrid);
            window.addEventListener('blur', blurHandler);
            return () => window.removeEventListener('blur', blurHandler);
        },
        [setGrid]
    );

    useEffect(
        () => {
            const visibilityHandler = (e) => handleVisibilityChange(setGrid);
            document.addEventListener("visibilitychange", visibilityHandler);
            return () => window.removeEventListener('blur', visibilityHandler);
        },
        [setGrid]
    );

    const winSize = useWindowSize(400);
    const dimensions = useMemo(() => getDimensions(winSize), [winSize]);
    
    // Now we can do conditional rendering after all hooks are called
    if (isHomePage) {
        const nytPuzzles = loadNYTPuzzles();
        
        // Load settings from localStorage
        const savedSettings = localStorage.getItem('settings');
        const homeSettings = savedSettings ? JSON.parse(savedSettings) : {};
        
        const handleNewPuzzle = () => {
            // Push state to enable back button
            window.history.pushState({ view: 'new-puzzle' }, '', '/?new');
            // Create empty puzzle in enter mode
            const emptyGrid = newSudokuModel({
                initialDigits: '0'.repeat(81),
                skipCheck: true,
                onPuzzleStateChange: grid => {
                    document.body.dataset.currentSnapshot = grid.get('currentSnapshot');
                    modelHelpers.persistPuzzleState(grid);
                }
            });
            setGrid(emptyGrid);
        };
        
        const handleImportPuzzle = () => {
            // Push state to enable back button
            window.history.pushState({ view: 'import' }, '', '/?import');
            // Create a minimal grid to show the paste modal
            const tempGrid = newSudokuModel({
                initialDigits: '0'.repeat(81),
                skipCheck: true,
                onPuzzleStateChange: () => {}
            });
            setGrid(modelHelpers.showPasteModal(tempGrid));
        };
        
        const handleSettings = () => {
            // Push state to enable back button
            window.history.pushState({ view: 'settings' }, '', '/?settings');
            // Create a minimal grid to show the settings modal
            const tempGrid = newSudokuModel({
                initialDigits: '0'.repeat(81),
                skipCheck: true,
                onPuzzleStateChange: () => {}
            });
            setGrid(modelHelpers.showSettingsModal(tempGrid));
        };
        
        const handleAbout = () => {
            // Push state to enable back button
            window.history.pushState({ view: 'about' }, '', '/?about');
            // Create a minimal grid to show the about modal
            const tempGrid = newSudokuModel({
                initialDigits: '0'.repeat(81),
                skipCheck: true,
                onPuzzleStateChange: () => {}
            });
            setGrid(modelHelpers.showAboutModal(tempGrid));
        };
        
        return (
            <div className="sudoku-app">
                <SvgSprites />
                <HomePage
                    nytPuzzles={nytPuzzles}
                    showRatings={homeSettings[SETTINGS.showRatings]}
                    shortenLinks={homeSettings[SETTINGS.shortenLinks]}
                    onNewPuzzle={handleNewPuzzle}
                    onImportPuzzle={handleImportPuzzle}
                    onSettings={handleSettings}
                    onAbout={handleAbout}
                />
            </div>
        );
    }
    
    if (isHomePageModal) {
        const homeModalHandler = (a) => {
            if (a === 'cancel' || a === 'close' || a === 'cancel-paste') {
                // Return to home page
                setGrid(null);
            } else if (a.action === 'save-settings') {
                // Apply settings then return to home page
                modelHelpers.applyModalAction(grid, a);
                setGrid(null);
            } else if (a.action === 'save-feature-flags') {
                // Feature flags save will reload the page
                setGrid((grid) => modelHelpers.applyModalAction(grid, a));
            } else {
                // For paste-initial-digits and other actions, let them handle navigation
                setGrid((grid) => modelHelpers.applyModalAction(grid, a));
            }
        };
        
        return (
            <div className="sudoku-app">
                <SvgSprites />
                <ModalContainer
                    modalState={modalState}
                    modalHandler={homeModalHandler}
                    menuHandler={menuHandler}
                />
            </div>
        );
    }

    const classes = [`sudoku-app mode-${mode} ${dimensions.orientation}`];
    if (solved) {
        classes.push('solved');
    }
    if (pausedAt) {
        classes.push('paused');
    }
    
    const isReplayMode = mode === 'replay';

    const startButton = mode === 'enter'
        ? (
            <div className="buttons">
                <a className="btn" href={'?s=' + modelHelpers.asDigits(grid)} onClick={preStartCheck}>Start</a>
            </div>
        )
        : null;

    const modal = (
        <ModalContainer
            modalState={modalState}
            modalHandler={modalHandler}
            menuHandler={menuHandler}
        />
    );
    
    const statusBarOrReplayControls = isReplayMode
        ? <ReplayControls grid={grid} setGrid={setGrid} modelHelpers={modelHelpers} />
        : (
            <StatusBar
                showTimer={showTimer}
                startTime={grid.get('startTime')}
                intervalStartTime={intervalStartTime}
                endTime={endTime}
                pausedAt={pausedAt}
                hintsUsedCount={hintsUsedCount}
                showPencilmarks={grid.get('showPencilmarks')}
                menuHandler={menuHandler}
                pauseHandler={pauseHandler}
                initialDigits={grid.get('initialDigits')}
            />
        );

    return (
        <div className={classes.join(' ')} onMouseDown={mouseDownHandler}>
            <SvgSprites />
            {statusBarOrReplayControls}
            <div className="ui-elements">
                <SudokuGrid
                    grid={grid}
                    gridId="main-grid"
                    dimensions={dimensions}
                    isPaused={!!pausedAt || isReplayMode}
                    mouseDownHandler={isReplayMode ? null : mouseDownHandler}
                    mouseOverHandler={isReplayMode ? null : mouseOverHandler}
                    inputHandler={isReplayMode ? null : inputHandler}
                />
                <div>
                    {
                        isReplayMode
                            ? null
                            : solved
                            ? (
                                <SolvedPuzzleOptions
                                    elapsedTime={Math.floor((endTime - intervalStartTime) / 1000)}
                                    hintsUsedCount={hintsUsedCount}
                                    menuHandler={menuHandler}
                                />
                            )
                            : <>
                                <VirtualKeyboard
                                    dimensions={dimensions}
                                    inputMode={inputMode}
                                    flipNumericKeys={settings[SETTINGS.flipNumericKeys]}
                                    completedDigits={completedDigits}
                                    inputHandler={inputHandler}
                                    simplePencilMarking={settings[SETTINGS.simplePencilMarking]}
                                />
                                {startButton}
                            </>
                    }
                </div>
            </div>
            {modal}
        </div>
    );
}

export default App;
