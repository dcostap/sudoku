export default function ModalConfirmAbandon({modalHandler}) {
    return (
        <div className="modal-content small">
            <h2>Abandon Puzzle?</h2>
            <p>
                Are you sure you want to abandon this puzzle? It will be moved to your history 
                and you can resume it later if you change your mind.
            </p>
            <div className="button-group">
                <button 
                    className="secondary" 
                    onClick={() => modalHandler('close')}
                >
                    Cancel
                </button>
                <button 
                    className="danger" 
                    onClick={() => modalHandler('abandon-confirmed')}
                >
                    Abandon Puzzle
                </button>
            </div>
        </div>
    );
}
