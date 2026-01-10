import { useState, useEffect } from 'react';
import api from '../../services/api';
import { Card } from '../ui/Card';
import './UserNotificationMatrix.css';

interface UserWithPreferences {
    id: string;
    email: string;
    name: string | null;
    role: string | null;
    division: string | null;
    notificationPreferences: {
        notificationType: string;
        enabled: boolean;
        channels: string;
    }[];
}

const NOTIFICATION_TYPES = [
    { key: 'APPOINTMENT_REMINDER', label: '📅 Agendamento' },
    { key: 'QUOTE_UPDATE', label: '💰 Orçamento' },
    { key: 'CHAT_MESSAGE', label: '💬 Chat' },
    { key: 'DAILY_REVIEW', label: '🌙 Revisão' }
];

export const UserNotificationMatrix = () => {
    const [users, setUsers] = useState<UserWithPreferences[]>([]);
    const [loading, setLoading] = useState(true);
    const [filter, setFilter] = useState({ role: '', division: '' });
    const [changes, setChanges] = useState<Map<string, Map<string, boolean>>>(new Map());

    useEffect(() => {
        loadUsers();
    }, [filter]);

    const loadUsers = async () => {
        try {
            setLoading(true);
            const params = new URLSearchParams();
            if (filter.role) params.append('role', filter.role);
            if (filter.division) params.append('division', filter.division);

            const response = await api.get(`/notification-settings/users?${params.toString()}`);
            setUsers(response.data);
        } catch (error) {
            console.error('Erro ao carregar usuários:', error);
        } finally {
            setLoading(false);
        }
    };

    const isEnabled = (userId: string, notificationType: string): boolean => {
        // Check if there's a pending change
        if (changes.has(userId)) {
            const userChanges = changes.get(userId)!;
            if (userChanges.has(notificationType)) {
                return userChanges.get(notificationType)!;
            }
        }

        // Otherwise, check the user's current preferences
        const user = users.find(u => u.id === userId);
        const pref = user?.notificationPreferences.find(p => p.notificationType === notificationType);
        return pref?.enabled ?? true; // Default to true if no preference exists
    };

    const togglePreference = (userId: string, notificationType: string) => {
        const currentValue = isEnabled(userId, notificationType);
        const newValue = !currentValue;

        const newChanges = new Map(changes);
        if (!newChanges.has(userId)) {
            newChanges.set(userId, new Map());
        }
        newChanges.get(userId)!.set(notificationType, newValue);
        setChanges(newChanges);
    };

    const hasChanges = () => {
        return changes.size > 0;
    };

    const saveChanges = async () => {
        try {
            const updates: any[] = [];

            changes.forEach((userChanges, userId) => {
                userChanges.forEach((enabled, notificationType) => {
                    updates.push({
                        userId,
                        notificationType,
                        enabled,
                        channels: ['IN_APP', 'PUSH'] // Default channels
                    });
                });
            });

            await api.post('/notification-settings/users/preferences/bulk', { updates });

            alert(`✅ ${updates.length} preferências atualizadas com sucesso!`);
            setChanges(new Map());
            loadUsers();
        } catch (error) {
            console.error('Erro ao salvar alterações:', error);
            alert('❌ Erro ao salvar alterações');
        }
    };

    const resetChanges = () => {
        setChanges(new Map());
    };

    if (loading) {
        return (
            <Card>
                <div className="user-matrix">
                    <p>Carregando usuários...</p>
                </div>
            </Card>
        );
    }

    return (
        <Card>
            <div className="user-matrix">
                <div className="matrix-header">
                    <h3>🔔 Matriz de Notificações por Usuário</h3>

                    <div className="filters">
                        <select
                            value={filter.role}
                            onChange={(e) => setFilter({ ...filter, role: e.target.value })}
                        >
                            <option value="">Todas as Roles</option>
                            <option value="MASTER">MASTER</option>
                            <option value="ADMIN">ADMIN</option>
                            <option value="GESTAO">GESTÃO</option>
                            <option value="OPERACIONAL">OPERACIONAL</option>
                            <option value="SPA">SPA</option>
                            <option value="COMERCIAL">COMERCIAL</option>
                            <option value="CLIENTE">CLIENTE</option>
                        </select>

                        <select
                            value={filter.division}
                            onChange={(e) => setFilter({ ...filter, division: e.target.value })}
                        >
                            <option value="">Todas as Divisões</option>
                            <option value="GESTAO">GESTÃO</option>
                            <option value="OPERACIONAL">OPERACIONAL</option>
                            <option value="CLIENTE">CLIENTE</option>
                        </select>
                    </div>
                </div>

                <div className="matrix-table-container">
                    <table className="matrix-table">
                        <thead>
                            <tr>
                                <th>Usuário</th>
                                <th>Role</th>
                                {NOTIFICATION_TYPES.map(type => (
                                    <th key={type.key}>{type.label}</th>
                                ))}
                            </tr>
                        </thead>
                        <tbody>
                            {users.map(user => (
                                <tr key={user.id}>
                                    <td>
                                        <div className="user-info">
                                            <strong>{user.name || user.email}</strong>
                                            <small>{user.email}</small>
                                        </div>
                                    </td>
                                    <td>
                                        <span className={`role-badge ${user.role?.toLowerCase()}`}>
                                            {user.role}
                                        </span>
                                    </td>
                                    {NOTIFICATION_TYPES.map(type => (
                                        <td key={type.key} className="checkbox-cell">
                                            <input
                                                type="checkbox"
                                                checked={isEnabled(user.id, type.key)}
                                                onChange={() => togglePreference(user.id, type.key)}
                                                className="matrix-checkbox"
                                            />
                                        </td>
                                    ))}
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>

                {hasChanges() && (
                    <div className="action-bar">
                        <div className="changes-info">
                            {Array.from(changes.values()).reduce((sum, map) => sum + map.size, 0)} alterações pendentes
                        </div>
                        <div className="action-buttons">
                            <button onClick={resetChanges} className="btn-cancel">
                                Cancelar
                            </button>
                            <button onClick={saveChanges} className="btn-save">
                                Salvar Alterações
                            </button>
                        </div>
                    </div>
                )}
            </div>
        </Card>
    );
};
