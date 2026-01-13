import api from './api';
import { AppointmentsService } from '../features/agenda/services/appointments.service';
import { CustomersService } from './domains/customers.service';
import { UsersService } from './domains/users.service';

export interface Services {
    appointments: AppointmentsService;
    customers: CustomersService;
    users: UsersService;
}

export const createServices = (): Services => {
    return {
        appointments: new AppointmentsService(api),
        customers: new CustomersService(api),
        users: new UsersService(api),
    };
};

export * from '../features/agenda/services/appointments.service';
export * from './domains/customers.service';
export * from './domains/users.service';
