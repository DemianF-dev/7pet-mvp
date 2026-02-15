import React from 'react';
import { PayrollConfig } from './PayrollConfig';
import { PayrollPreview } from './PayrollPreview';
import { PayStatementList } from './PayStatementList';
import { History } from 'lucide-react';

interface FinancialTabProps {
    staff: any;
    isManager: boolean;
    onUpdate: () => void;
}

export const FinancialTab: React.FC<FinancialTabProps> = ({ staff, isManager, onUpdate }) => {
    return (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            <div className="lg:col-span-2 space-y-8">
                {/* Live Preview */}
                <PayrollPreview staffId={staff.id} />

                {/* Payment History */}
                <div className="bg-white rounded-2xl border border-slate-100 shadow-sm overflow-hidden p-6">
                    <h3 className="font-bold text-slate-800 mb-4 flex items-center gap-2">
                        <History size={20} className="text-slate-500" />
                        Histórico de Pagamentos
                    </h3>
                    <PayStatementList staffId={staff.id} />
                </div>
            </div>

            <div className="lg:col-span-1 space-y-8">
                <PayrollConfig
                    staff={staff}
                    onUpdate={onUpdate}
                    readOnly={!isManager}
                />
            </div>
        </div>
    );
};
