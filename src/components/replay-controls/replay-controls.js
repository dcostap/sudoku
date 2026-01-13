import { useState, useEffect, useCallback } from 'react';
import './replay-controls.css';

function ReplayControls({ grid, setGrid, modelHelpers }) {
    const [isPlaying, setIsPlaying] = useState(false);
    const [playbackSpeed, setPlaybackSpeed] = useState(1000); // ms per step
    
    const replayStep = grid.get('replayStep');
    const totalSteps = grid.get('replayHistory').size;
    const startTime = grid.get('startTime');
    const endTime = grid.get('endTime');
    const solved = grid.get('solved');
    
    const elapsedTime = endTime - startTime;
    const elapsedSeconds = Math.floor(elapsedTime / 1000);
    const minutes = Math.floor(elapsedSeconds / 60);
    const seconds = elapsedSeconds % 60;
    
    const stepForward = useCallback(() => {
        setGrid(g => modelHelpers.replayStepForward(g));
    }, [setGrid, modelHelpers]);
    
    const stepBackward = useCallback(() => {
        setGrid(g => modelHelpers.replayStepBackward(g));
    }, [setGrid, modelHelpers]);
    
    const goToStart = useCallback(() => {
        setGrid(g => modelHelpers.replayGoToStep(g, 0));
    }, [setGrid, modelHelpers]);
    
    const goToEnd = useCallback(() => {
        setGrid(g => modelHelpers.replayGoToStep(g, totalSteps));
    }, [setGrid, modelHelpers, totalSteps]);
    
    const handleSliderChange = useCallback((e) => {
        const step = parseInt(e.target.value, 10);
        setGrid(g => modelHelpers.replayGoToStep(g, step));
    }, [setGrid, modelHelpers]);
    
    const togglePlayback = useCallback(() => {
        setIsPlaying(prev => !prev);
    }, []);
    
    // Auto-play functionality
    useEffect(() => {
        if (!isPlaying) return;
        
        const interval = setInterval(() => {
            setGrid(g => {
                const currentStep = g.get('replayStep');
                const maxSteps = g.get('replayHistory').size;
                
                if (currentStep >= maxSteps) {
                    setIsPlaying(false);
                    return g;
                }
                
                return modelHelpers.replayStepForward(g);
            });
        }, playbackSpeed);
        
        return () => clearInterval(interval);
    }, [isPlaying, playbackSpeed, setGrid, modelHelpers]);
    
    const statusText = solved ? 'Solved' : 'Abandoned';
    const statusClass = solved ? 'status-solved' : 'status-abandoned';
    
    return (
        <div className="replay-controls">
            <div className="replay-header">
                <h2>Replay Mode</h2>
                <span className={`replay-status ${statusClass}`}>{statusText}</span>
                <span className="replay-time">
                    Total time: {minutes}m {seconds}s
                </span>
            </div>
            
            <div className="replay-progress">
                <div className="replay-step-info">
                    Move {replayStep} of {totalSteps}
                </div>
                <input 
                    type="range" 
                    min="0" 
                    max={totalSteps}
                    value={replayStep}
                    onChange={handleSliderChange}
                    className="replay-slider"
                />
            </div>
            
            <div className="replay-buttons">
                <button 
                    onClick={goToStart} 
                    disabled={replayStep === 0}
                    title="Go to start"
                    className="replay-btn"
                >
                    ⏮
                </button>
                <button 
                    onClick={stepBackward} 
                    disabled={replayStep === 0}
                    title="Previous move"
                    className="replay-btn"
                >
                    ◀
                </button>
                <button 
                    onClick={togglePlayback}
                    title={isPlaying ? "Pause" : "Play"}
                    className="replay-btn replay-btn-play"
                >
                    {isPlaying ? '⏸' : '▶'}
                </button>
                <button 
                    onClick={stepForward} 
                    disabled={replayStep === totalSteps}
                    title="Next move"
                    className="replay-btn"
                >
                    ▶
                </button>
                <button 
                    onClick={goToEnd} 
                    disabled={replayStep === totalSteps}
                    title="Go to end"
                    className="replay-btn"
                >
                    ⏭
                </button>
                
                <div className="replay-speed-control">
                    <label>Speed:</label>
                    <select 
                        value={playbackSpeed} 
                        onChange={(e) => setPlaybackSpeed(parseInt(e.target.value, 10))}
                        className="replay-speed-select"
                    >
                        <option value={2000}>0.5x</option>
                        <option value={1000}>1x</option>
                        <option value={500}>2x</option>
                        <option value={250}>4x</option>
                    </select>
                </div>
                
                <a href="/" className="replay-btn-home">
                    Exit Replay
                </a>
            </div>
        </div>
    );
}

export default ReplayControls;
