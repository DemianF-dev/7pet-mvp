import { useState, useCallback, useEffect } from 'react';

/**
 * Hook to track dirty state of a form and show a confirmation before closing
 * @param isDirty Whether the form has unsaved changes
 * @param onClose The original close function
 */
export function useDirtyState(isDirty: boolean, onClose: () => void) {
    const [showConfirm, setShowConfirm] = useState(false);

    const handleClose = useCallback(() => {
        if (isDirty) {
            setShowConfirm(true);
        } else {
            onClose();
        }
    }, [isDirty, onClose]);

    const confirmClose = useCallback(() => {
        setShowConfirm(false);
        onClose();
    }, [onClose]);

    const cancelClose = useCallback(() => {
        setShowConfirm(false);
    }, []);

    // Also handle browser-level back/reload (optional but recommended)
    useEffect(() => {
        const handleBeforeUnload = (e: BeforeUnloadEvent) => {
            if (isDirty) {
                e.preventDefault();
                e.returnValue = '';
            }
        };

        window.addEventListener('beforeunload', handleBeforeUnload);
        return () => window.removeEventListener('beforeunload', handleBeforeUnload);
    }, [isDirty]);

    return {
        showConfirm,
        handleClose,
        confirmClose,
        cancelClose
    };
}
