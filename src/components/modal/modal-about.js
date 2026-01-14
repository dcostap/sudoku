import projectPackageJson from '../../../package.json';

const appVersion = projectPackageJson.version || "unknown";


export default function ModalAbout({modalHandler}) {
    const closeHandler = () => modalHandler('cancel');
    const thisYear = (new Date()).getFullYear();
    return (
        <div className="modal about">
            <h1>About</h1>
            <p>Version {appVersion}</p>
            <p>A beautiful, open-source Sudoku application designed for clarity and simplicity.</p>
            
            <div className="about-details space-y-4 mb-8">
                <p className="text-xs text-gray-400">
                    Created for <a href="https://sudokuexchange.com/" className="text-primary-600 hover:underline">SudokuExchange.com</a> by <a href="https://grantm.github.io/" className="text-primary-600 hover:underline">Grant McLean</a>.
                </p>
                <p className="text-xs text-gray-400">
                    This is <a href="https://www.fsf.org/about/what-is-free-software" className="text-primary-600 hover:underline">free software</a> under the <a href="https://opensource.org/licenses/AGPL-3.0" className="text-primary-600 hover:underline">AGPLv3</a>.
                </p>
                <p className="text-xs text-gray-400">
                    Source code: <a href="https://github.com/grantm/sudoku-web-app" className="text-primary-600 hover:underline">github.com/grantm/sudoku-web-app</a>
                </p>
                <p className="text-xs text-gray-400">
                    Copyright © 2020{thisYear > 2020 ? `-${thisYear}` : ''} Grant McLean
                </p>
            </div>
            
            <div className="buttons">
                <button className="primary" onClick={closeHandler} autoFocus>Close</button>
            </div>
        </div>
    )
}
