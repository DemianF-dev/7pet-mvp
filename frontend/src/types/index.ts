// Interfaces para dados de usuários
export interface User {
  id: string;
  email: string;
  name?: string;
  role?: string;
  division: string;
  active: boolean;
  createdAt: string;
  updatedAt: string;
}

// Interfaces para dados de clientes
export interface Customer {
  id: string;
  userId: string;
  name: string;
  phone?: string;
  address?: string;
  type: 'AVULSO' | 'MENSALISTA';
  noShowCount: number;
  isBlocked: boolean;
  requiresPrepayment: boolean;
  balance: number;
  createdAt: string;
  updatedAt: string;
  user?: User;
  pets?: Pet[];
}

// Interfaces para dados de pets
export interface Pet {
  id: string;
  customerId: string;
  name: string;
  species: string;
  breed?: string;
  weight?: number;
  observations?: string;
  preferences?: string;
  coatType?: string;
  usesPerfume: boolean;
  usesOrnaments: boolean;
  marketingConsent: boolean;
  temperament?: string;
  firstTime: boolean;
  age?: string;
  healthIssues?: string;
  allergies?: string;
  hasKnots: boolean;
  hasMattedFur: boolean;
  createdAt: string;
  updatedAt: string;
  customer?: Customer;
}

// Interfaces para agendamentos
export interface Appointment {
  id: string;
  customerId: string;
  petId: string;
  startAt: string;
  status: 'PENDENTE' | 'CONFIRMADO' | 'EM_ATENDIMENTO' | 'FINALIZADO' | 'CANCELADO' | 'NO_SHOW';
  category: 'SPA' | 'LOGISTICA';
  cancellationReason?: string;
  noShowReason?: string;
  deletedAt?: string;
  createdAt: string;
  updatedAt: string;
  notified24h: boolean;
  notified1h: boolean;
  performerId?: string;
  pickupProviderId?: string;
  dropoffProviderId?: string;
  quoteId?: string;
  logisticsStatus?: string;
  customer?: Customer;
  pet?: Pet;
  performer?: User;
  services?: Service[];
}

// Interfaces para orçamentos
export interface Quote {
  id: string;
  customerId: string;
  petId?: string;
  status: 'SOLICITADO' | 'EM_PRODUCAO' | 'CALCULADO' | 'ENVIADO' | 'APROVADO' | 'REJEITADO' | 'AGENDAR' | 'ENCERRADO' | 'AGENDADO' | 'FATURAR' | 'RASCUNHO';
  totalAmount: number;
  desiredAt?: string;
  createdAt: string;
  updatedAt: string;
  deletedAt?: string;
  transportDestination?: string;
  transportOrigin?: string;
  transportPeriod?: 'MANHA' | 'TARDE' | 'NOITE';
  type: 'SPA' | 'TRANSPORTE' | 'SPA_TRANSPORTE';
  hairLength?: string;
  hasKnots: boolean;
  hasParasites: boolean;
  knotRegions?: string;
  petQuantity: number;
  transportReturnAddress?: string;
  scheduledAt?: string;
  transportAt?: string;
  invoiceId?: string;
  parasiteComments?: string;
  parasiteTypes?: string;
  wantsMedicatedBath: boolean;
  notes?: string;
  customer?: Customer;
  pet?: Pet;
  items?: QuoteItem[];
}

// Interfaces para itens de orçamento
export interface QuoteItem {
  id: string;
  quoteId: string;
  description: string;
  quantity: number;
  price: number;
  serviceId?: string;
  performerId?: string;
  discount: number;
  productId?: string;
  service?: Service;
  product?: Product;
  performer?: User;
}

// Interfaces para serviços
export interface Service {
  id: string;
  name: string;
  description?: string;
  basePrice: number;
  duration: number;
  category?: string;
  species: string;
  createdAt: string;
  updatedAt: string;
  maxWeight?: number;
  minWeight?: number;
  sizeLabel?: string;
  responsibleId?: string;
  seqId: number;
  deletedAt?: string;
  subcategory?: string;
  type?: string;
  coatType?: string;
  unit?: string;
  notes?: string;
  bathCategory?: string;
  groomingType?: string;
  responsible?: User;
}

// Interfaces para produtos
export interface Product {
  id: string;
  seqId: number;
  name: string;
  description?: string;
  price: number;
  stock: number;
  category?: string;
  sku?: string;
  createdAt: string;
  updatedAt: string;
  deletedAt?: string;
}

// Interfaces para respostas de API
export interface ApiResponse<T = any> {
  success: boolean;
  data?: T;
  error?: string;
  message?: string;
}

// Interfaces para paginação
export interface PaginatedResponse<T = any> {
  data: T[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
}

// Interfaces para formulários
export interface LoginForm {
  email: string;
  password: string;
}

export interface CreateCustomerForm {
  name: string;
  phone?: string;
  address?: string;
  type?: 'AVULSO' | 'MENSALISTA';
}

export interface CreatePetForm {
  name: string;
  species: string;
  breed?: string;
  weight?: number;
  observations?: string;
  preferences?: string;
  coatType?: string;
  usesPerfume?: boolean;
  usesOrnaments?: boolean;
  marketingConsent?: boolean;
  temperament?: string;
  firstTime?: boolean;
  age?: string;
  healthIssues?: string;
  allergies?: string;
  hasKnots?: boolean;
  hasMattedFur?: boolean;
}

export interface CreateAppointmentForm {
  customerId: string;
  petId: string;
  startAt: string;
  category?: 'SPA' | 'LOGISTICA';
  performerId?: string;
}

export interface CreateQuoteForm {
  customerId: string;
  petId?: string;
  type?: 'SPA' | 'TRANSPORTE' | 'SPA_TRANSPORTE';
  totalAmount?: number;
  desiredAt?: string;
  hairLength?: string;
  hasKnots?: boolean;
  hasParasites?: boolean;
  knotRegions?: string;
  petQuantity?: number;
  transportOrigin?: string;
  transportDestination?: string;
  transportPeriod?: 'MANHA' | 'TARDE' | 'NOITE';
  wantsMedicatedBath?: boolean;
  notes?: string;
}