import { create } from 'zustand';

interface ModalState {
  appointmentModalOpen: boolean;
  detailsModalOpen: boolean;
  appointmentData: any;
  appointmentId: string | null;
  preFill: any;
  isCopy: boolean;
  openAppointmentModal: (data: any) => void;
  closeAppointmentModal: () => void;
  openDetailsModal: (id: string) => void;
  closeDetailsModal: () => void;
}

export const useModalStore = create<ModalState>((set) => ({
  appointmentModalOpen: false,
  detailsModalOpen: false,
  appointmentData: null,
  appointmentId: null,
  preFill: null,
  isCopy: false,

  openAppointmentModal: (data) => set({
    appointmentModalOpen: true,
    appointmentData: data.appointment || null,
    appointmentId: data.id || null,
    preFill: data.preFill || null,
    isCopy: data.isCopy || false
  }),

  closeAppointmentModal: () => set({
    appointmentModalOpen: false,
    appointmentData: null,
    appointmentId: null,
    preFill: null,
    isCopy: false
  }),

  openDetailsModal: (id) => set({
    detailsModalOpen: true,
    appointmentId: id
  }),

  closeDetailsModal: () => set({
    detailsModalOpen: false,
    appointmentId: null
  })
}));