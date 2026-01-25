import { useEffect } from 'react';
import { useModalStore } from '../store/modalStore';

/**
 * Global event listener component to handle modal events dispatched throughout the app
 * This should be rendered once at the root level
 */
export function ModalEventProvider() {
  const { openAppointmentModal, openDetailsModal } = useModalStore();

  useEffect(() => {
    const handleOpenModal = (event: CustomEvent) => {
      openAppointmentModal(event.detail);
    };

    const handleOpenDetails = (event: CustomEvent) => {
      openDetailsModal(event.detail.id);
    };

    window.addEventListener('openAppointmentModal', handleOpenModal as EventListener);
    window.addEventListener('openAppointmentDetails', handleOpenDetails as EventListener);

    return () => {
      window.removeEventListener('openAppointmentModal', handleOpenModal as EventListener);
      window.removeEventListener('openAppointmentDetails', handleOpenDetails as EventListener);
    };
  }, [openAppointmentModal, openDetailsModal]);

  return null;
}