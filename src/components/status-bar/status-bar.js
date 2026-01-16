import { modelHelpers } from '../../lib/sudoku-model';
import TimerWithPause from '../timer-with-pause/timer-with-pause';
import MenuButton from '../buttons/menu-button';
import SettingsButton from '../buttons/settings-button';
import HintButton from '../buttons/hint-button';
import FullscreenButton from '../buttons/fullscreen-button';


import './status-bar.css';

const stopPropagation = (e) => e.stopPropagation();


function SiteLink () {
    return (
        <a href="/" className="text-lg font-semibold text-gray-800 hover:text-primary-600 transition-colors duration-200">
             ❮ Go back
        </a>
    );
}

function StatusBar ({
    showTimer, startTime, intervalStartTime, endTime, pausedAt, hintsUsedCount,
    showPencilmarks, menuHandler, pauseHandler, initialDigits, mode
}) {
    const isDesignMode = mode === 'enter';
    const nytInfo = !isDesignMode && initialDigits ? modelHelpers.getNYTInfo(initialDigits) : null;

    const timer = showTimer && !isDesignMode
        ? (
            <TimerWithPause
                startTime={startTime}
                intervalStartTime={intervalStartTime}
                endTime={endTime}
                pausedAt={pausedAt}
                pauseHandler={pauseHandler}
                hintsUsedCount={hintsUsedCount}
            />
        )
        : isDesignMode ? (
            <div className="flex items-center gap-2 px-4 py-1.5 bg-amber-50 border border-amber-200 rounded-full">
                <span className="text-amber-600">✎</span>
                <span className="text-xs font-black text-amber-700 uppercase tracking-widest">Design Mode</span>
            </div>
        ) : null;

    const nytBadge = nytInfo ? (
        <div className="hidden lg:flex items-center gap-2 px-3 py-1 bg-blue-50 border border-blue-100 rounded-full">
            <span className="text-blue-600 text-[10px] font-bold uppercase">NYT</span>
            <span className="text-[10px] font-semibold text-blue-800">
                {nytInfo.date.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
            </span>
            <span className={`text-[10px] font-black uppercase px-1.5 rounded-sm ${
                nytInfo.difficulty === 'hard' ? 'bg-rose-100 text-rose-700' :
                nytInfo.difficulty === 'medium' ? 'bg-amber-100 text-amber-700' :
                nytInfo.difficulty === 'easy' ? 'bg-emerald-100 text-emerald-700' :
                'bg-slate-800 text-white'
            }`}>
                {nytInfo.difficulty}
            </span>
        </div>
    ) : null;

    return (
        <div className="fixed top-0 left-0 w-full h-[7.5vh] z-50" onMouseDown={stopPropagation}>
            <div className="h-full flex items-center justify-between px-4 pt-2">
                <div className="hidden md:flex items-center gap-4 flex-1">
                    <SiteLink />
                    {nytBadge}
                </div>
                {timer}
                <div className="flex items-center gap-2 ml-auto">
                    <FullscreenButton />
                    <HintButton menuHandler={menuHandler} />
                    <SettingsButton menuHandler={menuHandler} />
                    <MenuButton
                        initialDigits={initialDigits}
                        showPencilmarks={showPencilmarks}
                        menuHandler={menuHandler}
                    />
                </div>
            </div>
        </div>
    );
}

export default StatusBar;
