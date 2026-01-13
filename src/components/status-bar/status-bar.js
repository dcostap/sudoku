import TimerWithPause from '../timer-with-pause/timer-with-pause';
import MenuButton from '../buttons/menu-button';
import SettingsButton from '../buttons/settings-button';
import HintButton from '../buttons/hint-button';
import FullscreenButton from '../buttons/fullscreen-button';


import './status-bar.css';

const stopPropagation = (e) => e.stopPropagation();


function SiteLink () {
    return (
        <div className="flex items-center justify-center w-full h-full">
            <a href="/" className="inline-block hover:opacity-100 opacity-80 transition-opacity duration-200">
                <svg className="w-[38vh] h-auto" version="1.1" viewBox="0 0 650 120" title="SudokuExchange.com">
                    <use href="#site-domain" />
                </svg>
            </a>
        </div>
    );
}

function StatusBar ({
    showTimer, startTime, intervalStartTime, endTime, pausedAt, hintsUsedCount,
    showPencilmarks, menuHandler, pauseHandler, initialDigits
}) {
    const timer = showTimer
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
        : null;
    return (
        <div className="fixed top-0 left-0 w-full h-[7.5vh] bg-gradient-to-b from-white/90 to-white/80 backdrop-blur-md border-b border-gray-200/50 shadow-lg z-50" onMouseDown={stopPropagation}>
            <div className="h-full flex items-center justify-between px-4">
                <div className="hidden md:block flex-1">
                    <SiteLink />
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
