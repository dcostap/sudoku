import { useCallback } from 'react';

import ButtonIcon from '../svg-sprites/button-icon';

function SettingsButton ({menuHandler}) {
    const clickHandler = useCallback(
        e => {
            e.preventDefault();
            const menuAction = 'show-settings-modal';
            menuHandler(menuAction);
        },
        [menuHandler]
    );

    return (
        <button 
            id="settings-button" 
            type="button" 
            title="Settings" 
            onClick={clickHandler}
            className="w-11 h-11 flex items-center justify-center rounded-lg bg-white/50 hover:bg-white/80 backdrop-blur-sm border border-gray-200/50 hover:border-primary-300 transition-all duration-200 hover:shadow-md active:scale-95"
        >
            <ButtonIcon name="settings" />
        </button>
    )
}

export default SettingsButton;
