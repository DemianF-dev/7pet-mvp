

import { useEffect, lazy, Suspense } from 'react';
import { Routes, Route, Navigate, useLocation } from 'react-router-dom';
import { useQueryClient } from '@tanstack/react-query';
import { useSocket } from './context/SocketContext';
import { useAuthStore } from './store/authStore';
import api from './services/api';
import { AnimatePresence } from 'framer-motion';
import PageTransition from './components/ui/PageTransition';
import PageLoader from './components/PageLoader';
import { useServiceWorkerUpdate } from './hooks/useServiceWorkerUpdate';

// ⚡ STATIC IMPORTS - Critical path pages that need to load immediately
import LandingPage from './pages/LandingPage';
import ClientEntry from './pages/client/ClientEntry';
import ClientLogin from './pages/client/ClientLogin';
import ClientRegister from './pages/client/ClientRegister';
import ClientDashboard from './pages/client/ClientDashboard';
import StaffLogin from './pages/staff/StaffLogin';
import StaffDashboard from './pages/staff/StaffDashboard';

// ⚡ LAZY IMPORTS - Heavy pages loaded on-demand for faster initial load
const PetList = lazy(() => import('./pages/client/PetList'));
const AppointmentBooking = lazy(() => import('./pages/client/AppointmentBooking'));
const AppointmentList = lazy(() => import('./pages/client/AppointmentList'));
const QuoteRequest = lazy(() => import('./pages/client/QuoteRequest'));
const QuoteList = lazy(() => import('./pages/client/QuoteList'));
const NotificationList = lazy(() => import('./pages/client/NotificationList'));
const PaymentList = lazy(() => import('./pages/client/PaymentList'));
const ClientProfile = lazy(() => import('./pages/client/ClientProfile'));
const ClientChatPage = lazy(() => import('./pages/client/ClientChatPage'));

const ServiceKanban = lazy(() => import('./pages/staff/ServiceKanban'));
const AgendaSPA = lazy(() => import('./pages/staff/AgendaSPA'));
const AgendaLOG = lazy(() => import('./pages/staff/AgendaLOG'));
const TransportManager = lazy(() => import('./pages/staff/TransportManager'));
const QuoteManager = lazy(() => import('./pages/staff/QuoteManager'));
const QuoteEditor = lazy(() => import('./pages/staff/QuoteEditor'));
const CustomerManager = lazy(() => import('./pages/staff/CustomerManager'));
const CustomerDetail = lazy(() => import('./pages/staff/CustomerDetail'));
const ServiceManager = lazy(() => import('./pages/staff/ServiceManager'));
const BillingManager = lazy(() => import('./pages/staff/BillingManager'));
const ManagementDashboard = lazy(() => import('./pages/staff/ManagementDashboard'));
const FinancialReports = lazy(() => import('./pages/staff/FinancialReports'));
const UserManager = lazy(() => import('./pages/staff/UserManager'));
const StaffNotificationList = lazy(() => import('./pages/staff/StaffNotificationList'));
const StaffProfile = lazy(() => import('./pages/staff/StaffProfile'));
const ProductManager = lazy(() => import('./pages/staff/ProductManager'));
const SupportTicketList = lazy(() => import('./pages/staff/SupportTicketList'));
const TransportConfig = lazy(() => import('./pages/staff/TransportConfig'));
const FeedPage = lazy(() => import('./pages/staff/FeedPage'));
const ChatPage = lazy(() => import('./pages/staff/ChatPage'));
const MyHR = lazy(() => import('./pages/staff/MyHR'));
const StaffProfiles = lazy(() => import('./pages/staff/hr/StaffProfiles'));
const StaffProfileDetails = lazy(() => import('./pages/staff/hr/StaffProfileDetails'));
const PayPeriods = lazy(() => import('./pages/staff/hr/PayPeriods'));
const PayStatementDetail = lazy(() => import('./pages/staff/hr/PayStatementDetail'));
const MobileMenuHub = lazy(() => import('./pages/staff/MobileMenuHub'));
const MarketingCenter = lazy(() => import('./pages/staff/marketing/MarketingCenter'));
const StrategyManager = lazy(() => import('./pages/staff/StrategyManager'));
const AuditConsole = lazy(() => import('./pages/staff/AuditConsole'));

// ⚡ LAYOUT SYSTEM - Shell for mobile/desktop
import AppShell from './layouts/AppShell';
import ClientAppShell from './layouts/ClientAppShell';
import DynamicPausaLayout from './layouts/DynamicPausaLayout';

// ⚡ PAUSA MODULE - Mini-games (lazy loaded)
const PausaPage = lazy(() => import('./pages/pausa/PausaPage'));
const PacienciaPage = lazy(() => import('./pages/pausa/PacienciaPage'));
const DesenroscaPage = lazy(() => import('./pages/pausa/DesenroscaPage'));
const PauseZenEspuma = lazy(() => import('./pages/pausa/PauseZenEspuma'));
const PetMatchPage = lazy(() => import('./pages/pausa/PetMatchPage'));

import FeedbackWidget from './components/FeedbackWidget';
import ProtectedRoute from './components/ProtectedRoute';
import PWAInstallPrompt from './components/PWAInstallPrompt';
import PWASettings from './components/PWASettings';
import RouteSkeleton from './components/system/RouteSkeleton';
import NetworkStatus from './components/NetworkStatus';

import { NotificationProvider } from './context/NotificationContext';
import { ServicesProvider } from './context/ServicesContext';
import toast, { Toaster } from 'react-hot-toast';
import { ThemeProvider } from './context/ThemeContext';

// Helper component to wrap lazy pages with Suspense
const LazyPage = ({ children }: { children: React.ReactNode }) => (
    <Suspense fallback={<RouteSkeleton />}>
        <PageTransition>{children}</PageTransition>
    </Suspense>
);


function App() {
    const location = useLocation();

    const queryClient = useQueryClient();
    const { socket } = useSocket();
    const { user, updateUser } = useAuthStore();

    // 🔄 PWA Auto-Update Detection
    useServiceWorkerUpdate();

    useEffect(() => {
        if (!socket) return;

        const handleNewMessage = (message: any) => {
            if (import.meta.env.DEV) console.log('💬 Nova mensagem recebida socket:', message);
            // Invalidate conversations list to update unread counts/order
            queryClient.invalidateQueries({ queryKey: ['conversations'] });
            // Invalidate specific chat messages if open (React Query handles active observers)
            queryClient.invalidateQueries({ queryKey: ['messages', message.conversationId] });
        };

        const handleNotification = (notification: any) => {
            if (import.meta.env.DEV) console.log('🔔 Notificação recebida no App (invalidando cache):', notification);
            // Always invalidate conversations when a notification arrives (e.g. from a new message)
            if (notification.type === 'chat') {
                queryClient.invalidateQueries({ queryKey: ['conversations'] });
            }
        };

        const handlePermissionsUpdate = async (data: any) => {
            if (import.meta.env.DEV) console.log('🔐 Permissões atualizadas via socket:', data);
            try {
                // Fetch the absolute latest user data to be sure
                const response = await api.get('/auth/me');
                if (response.data) {
                    updateUser(response.data);
                    toast.success('Suas permissões foram atualizadas por um administrador.', {
                        icon: '🔐',
                        duration: 5000
                    });
                }
            } catch (err) {
                console.error('Erro ao atualizar permissões via socket:', err);
            }
        };

        socket.on('chat:new_message', handleNewMessage);
        socket.on('notification:new', handleNotification);
        socket.on('USER_PERMISSIONS_UPDATED', handlePermissionsUpdate);

        return () => {
            socket.off('chat:new_message', handleNewMessage);
            socket.off('notification:new', handleNotification);
            socket.off('USER_PERMISSIONS_UPDATED', handlePermissionsUpdate);
        };
    }, [socket, queryClient]);

    return (
        <ThemeProvider defaultTheme="system" storageKey="7pet-theme">
            <Toaster position="top-right" reverseOrder={false} />
            <FeedbackWidget />
            <NetworkStatus />
            <PWAInstallPrompt />

            <ServicesProvider>
                <NotificationProvider>
                    <AnimatePresence mode="sync" initial={false}>
                        <Routes location={location} key={location.pathname}>
                            <Route path="/" element={<PageTransition><LandingPage /></PageTransition>} />
                            <Route path="/client" element={<ClientEntry />} />
                            <Route path="/client/entry" element={<PageTransition><ClientEntry /></PageTransition>} />
                            <Route path="/client/login" element={<PageTransition><ClientLogin /></PageTransition>} />
                            <Route path="/client/register" element={<PageTransition><ClientRegister /></PageTransition>} />

                            {/* Client Routes */}
                            <Route element={<ProtectedRoute allowedRoles={['CLIENTE']} redirectTo="/client/login" />}>
                                <Route element={<ClientAppShell />}>
                                    <Route path="/client/dashboard" element={<ClientDashboard />} />
                                    <Route path="/client/pets" element={<LazyPage><PetList /></LazyPage>} />
                                    <Route path="/client/chat" element={<LazyPage><ClientChatPage /></LazyPage>} />
                                    <Route path="/client/profile" element={<LazyPage><ClientProfile /></LazyPage>} />
                                    <Route path="/client/schedule" element={<LazyPage><AppointmentBooking /></LazyPage>} />
                                    <Route path="/client/appointments" element={<LazyPage><AppointmentList /></LazyPage>} />
                                    <Route path="/client/quote-request" element={<LazyPage><QuoteRequest /></LazyPage>} />
                                    <Route path="/client/quotes" element={<LazyPage><QuoteList /></LazyPage>} />
                                    <Route path="/client/notifications" element={<LazyPage><NotificationList /></LazyPage>} />
                                    <Route path="/client/payments" element={<LazyPage><PaymentList /></LazyPage>} />
                                    <Route path="/client/settings" element={<PageTransition><PWASettings /></PageTransition>} />
                                </Route>
                            </Route>




                            {/* Colaborador Routes */}
                            <Route path="/staff/login" element={<PageTransition><StaffLogin /></PageTransition>} />
                            <Route element={<ProtectedRoute allowedRoles={['OPERACIONAL', 'GESTAO', 'ADMIN', 'MASTER', 'SPA', 'COMERCIAL']} redirectTo="/staff/login" />}>
                                <Route element={<AppShell />}>
                                    <Route path="/staff/dashboard" element={<StaffDashboard />} />
                                    <Route path="/staff/menu" element={<LazyPage><MobileMenuHub /></LazyPage>} />
                                    <Route path="/staff/kanban" element={<LazyPage><ServiceKanban /></LazyPage>} />
                                    <Route path="/staff/agenda-spa" element={<LazyPage><AgendaSPA /></LazyPage>} />
                                    <Route path="/staff/agenda-log" element={<LazyPage><AgendaLOG /></LazyPage>} />
                                    <Route path="/staff/transport" element={<LazyPage><TransportManager /></LazyPage>} />
                                    <Route path="/staff/quotes" element={<LazyPage><QuoteManager /></LazyPage>} />
                                    <Route path="/staff/quotes/:id" element={<LazyPage><QuoteEditor /></LazyPage>} />
                                    <Route path="/staff/customers" element={<LazyPage><CustomerManager /></LazyPage>} />
                                    <Route path="/staff/customers/:id" element={<LazyPage><CustomerDetail /></LazyPage>} />
                                    <Route path="/staff/services" element={<LazyPage><ServiceManager /></LazyPage>} />
                                    <Route path="/staff/products" element={<LazyPage><ProductManager /></LazyPage>} />
                                    <Route path="/staff/billing" element={<LazyPage><BillingManager /></LazyPage>} />
                                    <Route path="/staff/management" element={<LazyPage><ManagementDashboard /></LazyPage>} />
                                    <Route path="/staff/hr" element={<LazyPage><MyHR /></LazyPage>} />
                                    <Route path="/staff/strategy" element={<LazyPage><StrategyManager /></LazyPage>} />
                                    <Route path="/staff/audit" element={<LazyPage><AuditConsole /></LazyPage>} />
                                    <Route path="/staff/reports" element={<LazyPage><FinancialReports /></LazyPage>} />
                                    <Route path="/staff/users" element={<LazyPage><UserManager /></LazyPage>} />
                                    <Route path="/staff/notifications" element={<LazyPage><StaffNotificationList /></LazyPage>} />
                                    <Route path="/staff/profile" element={<LazyPage><StaffProfile /></LazyPage>} />
                                    <Route path="/staff/support" element={<LazyPage><SupportTicketList /></LazyPage>} />
                                    <Route path="/staff/transport-config" element={<LazyPage><TransportConfig /></LazyPage>} />
                                    <Route path="/staff/settings" element={<PageTransition><PWASettings /></PageTransition>} />
                                    <Route path="/staff/chat" element={<LazyPage><ChatPage /></LazyPage>} />
                                    <Route path="/staff/feed" element={<LazyPage><FeedPage /></LazyPage>} />
                                    <Route path="/staff/my-hr" element={<LazyPage><MyHR /></LazyPage>} />
                                    <Route path="/staff/hr/collaborators" element={<LazyPage><StaffProfiles /></LazyPage>} />
                                    <Route path="/staff/hr/collaborators/:id" element={<LazyPage><StaffProfileDetails /></LazyPage>} />
                                    <Route path="/staff/hr/pay-periods" element={<LazyPage><PayPeriods /></LazyPage>} />
                                    <Route path="/staff/hr/pay-statements/:statementId" element={<LazyPage><PayStatementDetail /></LazyPage>} />
                                </Route>
                            </Route>

                            {/* Pausa Module - Accessible to all authenticated users (staff and clients) */}
                            <Route element={<ProtectedRoute allowedRoles={['CLIENTE', 'OPERACIONAL', 'GESTAO', 'ADMIN', 'MASTER', 'SPA', 'COMERCIAL']} redirectTo="/" />}>
                                <Route element={<DynamicPausaLayout />}>
                                    <Route path="/pausa" element={<LazyPage><PausaPage /></LazyPage>} />
                                    <Route path="/pausa/paciencia-pet" element={<LazyPage><PacienciaPage /></LazyPage>} />
                                    <Route path="/pausa/coleira" element={<LazyPage><DesenroscaPage /></LazyPage>} />
                                    <Route path="/pausa/petmatch" element={<LazyPage><PetMatchPage /></LazyPage>} />
                                    <Route path="/pausa/zen-espuma" element={<LazyPage><PauseZenEspuma /></LazyPage>} />
                                </Route>
                            </Route>


                            {/* Fallback */}
                            <Route path="*" element={<Navigate to="/" replace />} />
                        </Routes>
                    </AnimatePresence>
                </NotificationProvider>
            </ServicesProvider>
        </ThemeProvider >
    );
}

export default App;
