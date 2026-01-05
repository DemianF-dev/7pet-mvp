import { useEffect } from 'react';

/**
 * Hook para adicionar navegação por teclado em modais
 * - Fecha modal com tecla Escape
 * - Previne propagação do evento
 * 
 * @param isOpen - Estado do modal (aberto/fechado)
 * @param onClose - Função para fechar o modal
 */
export function useModalKeyboard(isOpen: boolean, onClose: () => void) {
    useEffect(() => {
        if (!isOpen) return;

        const handleKeyDown = (event: KeyboardEvent) => {
            if (event.key === 'Escape') {
                event.preventDefault();
                event.stopPropagation();
                onClose();
            }
        };

        // Adiciona listener quando modal abre
        document.addEventListener('keydown', handleKeyDown);

        // Remove listener quando modal fecha ou componente desmonta
        return () => {
            document.removeEventListener('keydown', handleKeyDown);
        };
    }, [isOpen, onClose]);
}

/**
 * Hook para gerenciar foco em modais (focus trap)
 * Mantém o foco dentro do modal e retorna ao elemento que abriu
 * 
 * @param isOpen - Estado do modal
 * @param modalRef - Ref do elemento do modal
 */
export function useModalFocusTrap(isOpen: boolean, modalRef: React.RefObject<HTMLElement>) {
    useEffect(() => {
        if (!isOpen || !modalRef.current) return;

        // Salva elemento que tinha foco antes do modal abrir
        const previousActiveElement = document.activeElement as HTMLElement;

        // Foca no modal quando abre
        const firstFocusable = modalRef.current.querySelector<HTMLElement>(
            'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])'
        );
        firstFocusable?.focus();

        // Retorna foco ao elemento anterior quando modal fecha
        return () => {
            previousActiveElement?.focus();
        };
    }, [isOpen, modalRef]);
}
