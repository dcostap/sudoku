import { useCallback } from 'react';

import ButtonIcon from '../svg-sprites/button-icon';

export default function HintButton ({menuHandler}) {
    const clickHandler = useCallback(
        e => {
            e.preventDefault();
            const menuAction = 'show-hint-modal';
            menuHandler(menuAction);
        },
        [menuHandler]
    );

    return (
        <button 
            id="hint-button" 
            type="button" 
            title="Hint" 
            onClick={clickHandler}
            className="w-11 h-11 flex items-center justify-center rounded-lg bg-white/50 hover:bg-white/80 backdrop-blur-sm border border-gray-200/50 hover:border-primary-300 transition-all duration-200 hover:shadow-md active:scale-95"
        >
            <ButtonIcon name="hint" />
        </button>
    )
}
