
import { useEffect } from 'react';
import { Routes, Route, Navigate, useLocation } from 'react-router-dom';
import { useQueryClient } from '@tanstack/react-query';
import { useSocket } from './context/SocketContext';
import { AnimatePresence } from 'framer-motion';
import PageTransition from './components/ui/PageTransition';
import LandingPage from './pages/LandingPage';
import ClientEntry from './pages/client/ClientEntry';
import ClientLogin from './pages/client/ClientLogin';
import ClientRegister from './pages/client/ClientRegister';
import ClientDashboard from './pages/client/ClientDashboard';
import PetList from './pages/client/PetList';
import AppointmentBooking from './pages/client/AppointmentBooking';
import AppointmentList from './pages/client/AppointmentList';
import QuoteRequest from './pages/client/QuoteRequest';
import QuoteList from './pages/client/QuoteList';
import NotificationList from './pages/client/NotificationList';
import PaymentList from './pages/client/PaymentList';
import ClientProfile from './pages/client/ClientProfile';
import ClientChatPage from './pages/client/ClientChatPage';
import StaffLogin from './pages/staff/StaffLogin';
import StaffDashboard from './pages/staff/StaffDashboard';
import ServiceKanban from './pages/staff/ServiceKanban';
import AgendaSPA from './pages/staff/AgendaSPA';
import AgendaLOG from './pages/staff/AgendaLOG';
import TransportManager from './pages/staff/TransportManager';
import QuoteManager from './pages/staff/QuoteManager';
import QuoteEditor from './pages/staff/QuoteEditor';
import CustomerManager from './pages/staff/CustomerManager';
import CustomerDetail from './pages/staff/CustomerDetail';
import ServiceManager from './pages/staff/ServiceManager';
import BillingManager from './pages/staff/BillingManager';
import ManagementDashboard from './pages/staff/ManagementDashboard';
import FinancialReports from './pages/staff/FinancialReports';
import UserManager from './pages/staff/UserManager';
import StaffNotificationList from './pages/staff/StaffNotificationList';
import StaffProfile from './pages/staff/StaffProfile';
import ProductManager from './pages/staff/ProductManager';
import SupportTicketList from './pages/staff/SupportTicketList';
import TransportConfig from './pages/staff/TransportConfig';
import FeedbackWidget from './components/FeedbackWidget';
import ProtectedRoute from './components/ProtectedRoute';
import PWAInstallPrompt from './components/PWAInstallPrompt';
import PWASettings from './components/PWASettings';
import FeedPage from './pages/staff/FeedPage';
import ChatPage from './pages/staff/ChatPage';

import { NotificationProvider } from './context/NotificationContext';
import { Toaster } from 'react-hot-toast';
import { ThemeProvider } from './context/ThemeContext';

function App() {
    const location = useLocation();

    const queryClient = useQueryClient();
    const { socket } = useSocket();

    useEffect(() => {
        if (!socket) return;

        const handleNewMessage = (message: any) => {
            console.log('💬 Nova mensagem recebida socket:', message);
            // Invalidate conversations list to update unread counts/order
            queryClient.invalidateQueries({ queryKey: ['conversations'] });
            // Invalidate specific chat messages if open (React Query handles active observers)
            queryClient.invalidateQueries({ queryKey: ['messages', message.conversationId] });
        };

        const handleNotification = (notification: any) => {
            console.log('🔔 Notificação recebida no App (invalidando cache):', notification);
            // Always invalidate conversations when a notification arrives (e.g. from a new message)
            if (notification.type === 'chat') {
                queryClient.invalidateQueries({ queryKey: ['conversations'] });
            }
        };

        socket.on('chat:new_message', handleNewMessage);
        socket.on('notification:new', handleNotification);

        return () => {
            socket.off('chat:new_message', handleNewMessage);
            socket.off('notification:new', handleNotification);
        };
    }, [socket, queryClient]);

    return (
        <ThemeProvider defaultTheme="system" storageKey="7pet-theme">
            <Toaster position="top-right" reverseOrder={false} />
            <FeedbackWidget />
            <PWAInstallPrompt />

            <NotificationProvider>
                <AnimatePresence mode="wait" initial={false}>
                    <Routes location={location} key={location.pathname}>
                        <Route path="/" element={<PageTransition><LandingPage /></PageTransition>} />
                        <Route path="/client" element={<ClientEntry />} />
                        <Route path="/client/entry" element={<PageTransition><ClientEntry /></PageTransition>} />
                        <Route path="/client/login" element={<PageTransition><ClientLogin /></PageTransition>} />
                        <Route path="/client/register" element={<PageTransition><ClientRegister /></PageTransition>} />

                        {/* Client Routes */}
                        <Route element={<ProtectedRoute allowedRoles={['CLIENTE']} redirectTo="/client/login" />}>
                            <Route path="/client/dashboard" element={<PageTransition><ClientDashboard /></PageTransition>} />
                            <Route path="/client/pets" element={<PageTransition><PetList /></PageTransition>} />
                            <Route path="/client/chat" element={<PageTransition><ClientChatPage /></PageTransition>} />
                            <Route path="/client/profile" element={<PageTransition><ClientProfile /></PageTransition>} />
                            <Route path="/client/schedule" element={<PageTransition><AppointmentBooking /></PageTransition>} />
                            <Route path="/client/appointments" element={<PageTransition><AppointmentList /></PageTransition>} />
                            <Route path="/client/quote-request" element={<PageTransition><QuoteRequest /></PageTransition>} />
                            <Route path="/client/quotes" element={<PageTransition><QuoteList /></PageTransition>} />
                            <Route path="/client/notifications" element={<PageTransition><NotificationList /></PageTransition>} />
                            <Route path="/client/payments" element={<PageTransition><PaymentList /></PageTransition>} />
                            <Route path="/client/settings" element={<PageTransition><PWASettings /></PageTransition>} />
                        </Route>


                        {/* Colaborador Routes */}
                        <Route path="/staff/login" element={<PageTransition><StaffLogin /></PageTransition>} />
                        <Route element={<ProtectedRoute allowedRoles={['OPERACIONAL', 'GESTAO', 'ADMIN', 'MASTER', 'SPA']} redirectTo="/staff/login" />}>
                            <Route path="/staff/dashboard" element={<PageTransition><StaffDashboard /></PageTransition>} />
                            <Route path="/staff/kanban" element={<PageTransition><ServiceKanban /></PageTransition>} />
                            <Route path="/staff/agenda-spa" element={<PageTransition><AgendaSPA /></PageTransition>} />
                            <Route path="/staff/agenda-log" element={<PageTransition><AgendaLOG /></PageTransition>} />
                            <Route path="/staff/transport" element={<PageTransition><TransportManager /></PageTransition>} />
                            <Route path="/staff/quotes" element={<PageTransition><QuoteManager /></PageTransition>} />
                            <Route path="/staff/quotes/:id" element={<PageTransition><QuoteEditor /></PageTransition>} />
                            <Route path="/staff/customers" element={<PageTransition><CustomerManager /></PageTransition>} />
                            <Route path="/staff/customers/:id" element={<PageTransition><CustomerDetail /></PageTransition>} />
                            <Route path="/staff/services" element={<PageTransition><ServiceManager /></PageTransition>} />
                            <Route path="/staff/products" element={<PageTransition><ProductManager /></PageTransition>} />
                            <Route path="/staff/billing" element={<PageTransition><BillingManager /></PageTransition>} />
                            <Route path="/staff/management" element={<PageTransition><ManagementDashboard /></PageTransition>} />
                            <Route path="/staff/reports" element={<PageTransition><FinancialReports /></PageTransition>} />
                            <Route path="/staff/users" element={<PageTransition><UserManager /></PageTransition>} />
                            <Route path="/staff/notifications" element={<PageTransition><StaffNotificationList /></PageTransition>} />
                            <Route path="/staff/profile" element={<PageTransition><StaffProfile /></PageTransition>} />
                            <Route path="/staff/support" element={<PageTransition><SupportTicketList /></PageTransition>} />
                            <Route path="/staff/transport-config" element={<PageTransition><TransportConfig /></PageTransition>} />
                            <Route path="/staff/settings" element={<PageTransition><PWASettings /></PageTransition>} />
                            <Route path="/staff/chat" element={<PageTransition><ChatPage /></PageTransition>} />
                            <Route path="/staff/feed" element={<PageTransition><FeedPage /></PageTransition>} />
                        </Route>


                        {/* Fallback */}
                        <Route path="*" element={<Navigate to="/" replace />} />
                    </Routes>
                </AnimatePresence>
            </NotificationProvider>
        </ThemeProvider >
    );
}

export default App;
