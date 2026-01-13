import { useState, useCallback } from 'react';

import ButtonIcon from '../svg-sprites/button-icon';

import './menu-button.css';


function MenuButton ({initialDigits, showPencilmarks, menuHandler}) {
    const [hidden, setHidden] = useState(true);

    const toggleHandler = useCallback(
        () => setHidden(h => !h),
        []
    );

    const clickHandler = useCallback(
        e => {
            const parent = e.target.parentElement;
            if (parent.classList && parent.classList.contains('disabled')) {
                e.preventDefault();
                return;
            }
            const menuAction = e.target.dataset.menuAction;
            if (menuAction) {
                e.preventDefault();
                menuHandler(menuAction);
            }
            setHidden(true);
        },
        [menuHandler]
    );

    const showHidePencilmarks = showPencilmarks ? 'Hide' : 'Show';

    const overlay = hidden
        ? null
        : <div className="fixed inset-0 z-40" onClick={() => setHidden(true)} />

    const shareLinkClass = initialDigits ? '' : 'disabled';

    return (
        <div className="relative">
            { overlay }
            <button 
                type="button" 
                title="Menu" 
                onClick={toggleHandler}
                className="w-11 h-11 flex items-center justify-center rounded-lg bg-white/50 hover:bg-white/80 backdrop-blur-sm border border-gray-200/50 hover:border-primary-300 transition-all duration-200 hover:shadow-md active:scale-95"
            >
                <ButtonIcon name="menu" />
            </button>
            {!hidden && (
                <ul 
                    onClick={clickHandler}
                    className="absolute right-0 top-14 w-56 max-w-[92vw] max-h-[90vh] overflow-y-auto bg-white/95 backdrop-blur-lg border border-gray-200/50 rounded-xl shadow-2xl py-2 z-50 animate-slide-down"
                >
                    <li className={shareLinkClass}>
                        <a 
                            href="./" 
                            data-menu-action="show-share-modal"
                            className="block px-4 py-2.5 text-sm text-gray-700 hover:bg-primary-50 hover:text-primary-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                        >Share this puzzle</a>
                    </li>
                    <li>
                        <a 
                            href="./" 
                            data-menu-action="toggle-show-pencilmarks"
                            className="block px-4 py-2.5 text-sm text-gray-700 hover:bg-primary-50 hover:text-primary-700 transition-colors"
                        >{showHidePencilmarks} pencil marks</a>
                    </li>
                    <li>
                        <a 
                            href="./" 
                            data-menu-action="clear-pencilmarks"
                            className="block px-4 py-2.5 text-sm text-gray-700 hover:bg-primary-50 hover:text-primary-700 transition-colors"
                        >Clear all pencil marks</a>
                    </li>
                    <li className={shareLinkClass}>
                        <a 
                            href="./" 
                            data-menu-action="calculate-candidates"
                            className="block px-4 py-2.5 text-sm text-gray-700 hover:bg-primary-50 hover:text-primary-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                        >Auto calculate candidates</a>
                    </li>
                    <div className="my-2 border-t border-gray-200/50" />
                    <li>
                        <a 
                            href="./" 
                            data-menu-action="save-screenshot"
                            className="block px-4 py-2.5 text-sm text-gray-700 hover:bg-primary-50 hover:text-primary-700 transition-colors"
                        >Save a screenshot</a>
                    </li>
                    <li className={shareLinkClass}>
                        <a 
                            href="./" 
                            data-menu-action="show-solver-modal"
                            className="block px-4 py-2.5 text-sm text-gray-700 hover:bg-primary-50 hover:text-primary-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                        >Open in SudokuWiki.org solver</a>
                    </li>
                    <div className="my-2 border-t border-gray-200/50" />
                    <li className={shareLinkClass}>
                        <a 
                            href="./" 
                            data-menu-action="restart-puzzle"
                            className="block px-4 py-2.5 text-sm text-gray-700 hover:bg-primary-50 hover:text-primary-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                        >Restart puzzle</a>
                    </li>
                    <li className={shareLinkClass}>
                        <a 
                            href="./" 
                            data-menu-action="abandon-puzzle"
                            className="block px-4 py-2.5 text-sm text-red-600 hover:bg-red-50 hover:text-red-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                        >Abandon puzzle</a>
                    </li>
                    <div className="my-2 border-t border-gray-200/50" />
                    <li>
                        <a 
                            href="./"
                            className="block px-4 py-2.5 text-sm text-gray-700 hover:bg-primary-50 hover:text-primary-700 transition-colors"
                        >New puzzle</a>
                    </li>
                    <li>
                        <a 
                            href="./" 
                            data-menu-action="show-settings-modal"
                            className="block px-4 py-2.5 text-sm text-gray-700 hover:bg-primary-50 hover:text-primary-700 transition-colors"
                        >Settings</a>
                    </li>
                    <li>
                        <a 
                            href="./" 
                            data-menu-action="show-help-page"
                            className="block px-4 py-2.5 text-sm text-gray-700 hover:bg-primary-50 hover:text-primary-700 transition-colors"
                        >Help</a>
                    </li>
                    <li>
                        <a 
                            href="./" 
                            data-menu-action="show-about-modal"
                            className="block px-4 py-2.5 text-sm text-gray-700 hover:bg-primary-50 hover:text-primary-700 transition-colors"
                        >About this app</a>
                    </li>
                </ul>
            )}
        </div>
    )
}

export default MenuButton;
