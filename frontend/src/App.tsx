import { Routes, Route, Navigate } from 'react-router-dom';
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

import { Toaster } from 'react-hot-toast';

function App() {
    return (
        <>
            <Toaster position="top-right" reverseOrder={false} />
            <FeedbackWidget />
            <Routes>
                <Route path="/" element={<LandingPage />} />
                <Route path="/client" element={<ClientEntry />} />
                <Route path="/client/login" element={<ClientLogin />} />
                <Route path="/client/register" element={<ClientRegister />} />

                {/* Cliente Routes */}
                <Route element={<ProtectedRoute allowedRoles={['CLIENTE', 'MASTER']} redirectTo="/client/login" />}>
                    <Route path="/client/dashboard" element={<ClientDashboard />} />
                    <Route path="/client/pets" element={<PetList />} />
                    <Route path="/client/profile" element={<ClientProfile />} />
                    <Route path="/client/schedule" element={<AppointmentBooking />} />
                    <Route path="/client/appointments" element={<AppointmentList />} />
                    <Route path="/client/quote-request" element={<QuoteRequest />} />
                    <Route path="/client/quotes" element={<QuoteList />} />
                    <Route path="/client/notifications" element={<NotificationList />} />
                    <Route path="/client/payments" element={<PaymentList />} />
                </Route>

                {/* Colaborador Routes */}
                <Route path="/staff/login" element={<StaffLogin />} />
                <Route element={<ProtectedRoute allowedRoles={['OPERACIONAL', 'GESTAO', 'ADMIN', 'MASTER']} redirectTo="/staff/login" />}>
                    <Route path="/staff/dashboard" element={<StaffDashboard />} />
                    <Route path="/staff/kanban" element={<ServiceKanban />} />
                    <Route path="/staff/agenda-spa" element={<AgendaSPA />} />
                    <Route path="/staff/agenda-log" element={<AgendaLOG />} />
                    <Route path="/staff/transport" element={<TransportManager />} />
                    <Route path="/staff/quotes" element={<QuoteManager />} />
                    <Route path="/staff/quotes/:id" element={<QuoteEditor />} />
                    <Route path="/staff/customers" element={<CustomerManager />} />
                    <Route path="/staff/customers/:id" element={<CustomerDetail />} />
                    <Route path="/staff/services" element={<ServiceManager />} />
                    <Route path="/staff/products" element={<ProductManager />} />
                    <Route path="/staff/billing" element={<BillingManager />} />
                    <Route path="/staff/management" element={<ManagementDashboard />} />
                    <Route path="/staff/reports" element={<FinancialReports />} />
                    <Route path="/staff/users" element={<UserManager />} />
                    <Route path="/staff/notifications" element={<StaffNotificationList />} />
                    <Route path="/staff/profile" element={<StaffProfile />} />
                    <Route path="/staff/support" element={<SupportTicketList />} />
                    <Route path="/staff/transport-config" element={<TransportConfig />} />
                </Route>

                {/* Fallback */}
                <Route path="*" element={<Navigate to="/" replace />} />
            </Routes>
        </>
    );
}

export default App;
