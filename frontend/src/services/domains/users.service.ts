import { AxiosInstance } from 'axios';

// Interface copied from AgendaSPA.tsx
export interface Staff {
    id: string;
    name: string;
    role: string;
    color?: string;
}

export class UsersService {
    constructor(private api: AxiosInstance) { }

    async listManagementUsers(): Promise<Staff[]> {
        const response = await this.api.get('/management/users');
        const allUsers = response.data || [];
        // Filter only staff (non-clients) as done in AgendaSPA
        return allUsers.filter((u: any) => u.role !== 'CLIENTE');
    }
}
