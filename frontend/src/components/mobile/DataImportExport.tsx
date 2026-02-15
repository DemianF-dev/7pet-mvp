import React, { useRef } from 'react';
import { X, Upload, Download, FileText, Users, Calendar, DollarSign } from 'lucide-react';
import { Button } from '../ui';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';

interface DataImportExportProps {
    isOpen: boolean;
    onClose: () => void;
    exportType?: 'quotes' | 'customers' | 'services' | 'appointments';
    data?: any[];
    onImport?: (file: File) => void;
}

export const DataImportExport: React.FC<DataImportExportProps> = ({
    isOpen,
    onClose,
    exportType = 'quotes',
    data = [],
    onImport
}) => {
    const fileInputRef = useRef<HTMLInputElement>(null);

    const handleExport = (exportFormat: 'csv' | 'json') => {
        if (data.length === 0) return;

        const filename = `${exportType}-${format(new Date(), 'yyyy-MM-dd', { locale: ptBR })}`;

        if (exportFormat === 'csv') {
            const csvData = generateCSV(data, exportType);
            downloadFile(csvData, `${filename}.csv`, 'text/csv;charset=utf-8;');
        } else {
            const jsonData = JSON.stringify(data, null, 2);
            downloadFile(jsonData, `${filename}.json`, 'application/json;charset=utf-8;');
        }
    };

    const handleFileSelect = (event: React.ChangeEvent<HTMLInputElement>) => {
        const file = event.target.files?.[0];
        if (file && onImport) {
            onImport(file);
        }
    };

    const downloadFile = (content: string, filename: string, mimeType: string) => {
        const blob = new Blob([content], { type: mimeType });
        const url = URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.href = url;
        link.download = filename;
        link.style.visibility = 'hidden';
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        URL.revokeObjectURL(url);
    };

    const generateCSV = (data: any[], type: string): string => {
        if (type === 'quotes') {
            const headers = ['Referência', 'Cliente', 'Pet', 'Título', 'Total', 'Status', 'Data', 'Itens'];
            const rows = data.map(quote => [
                `OC-${String((quote.seqId || 0) + 1000).padStart(4, '0')}`,
                quote.customer?.name || 'Cliente s/ nome',
                quote.pet?.name || '-',
                quote.title || '-',
                `R$ ${quote.totalAmount?.toLocaleString('pt-BR', { minimumFractionDigits: 2 }) || '0,00'}`,
                quote.status || '-',
                new Date(quote.createdAt).toLocaleDateString('pt-BR'),
                quote.items?.length || 0
            ]);
            return [headers, ...rows].map(row => row.map(cell => `"${cell}"`).join(',')).join('\n');
        }

        if (type === 'customers') {
            const headers = ['Nome', 'Telefone', 'Email', 'Pets', 'Data Cadastro', 'Status'];
            const rows = data.map(customer => [
                customer.name || '-',
                customer.phone || '-',
                customer.email || '-',
                customer.pets?.length || 0,
                new Date(customer.createdAt).toLocaleDateString('pt-BR'),
                customer.status || 'ATIVO'
            ]);
            return [headers, ...rows].map(row => row.map(cell => `"${cell}"`).join(',')).join('\n');
        }

        if (type === 'services') {
            const headers = ['Código', 'Nome', 'Categoria', 'Espécie', 'Preço', 'Duração', 'Status'];
            const rows = data.map(service => [
                `SRV-${String((service.seqId || 0) + 999).padStart(4, '0')}`,
                service.name || '-',
                service.category || 'ESTÉTICA',
                service.species || 'Canino',
                `R$ ${service.basePrice?.toLocaleString('pt-BR', { minimumFractionDigits: 2 }) || '0,00'}`,
                `${service.duration || 0} min`,
                service.status || 'ATIVO'
            ]);
            return [headers, ...rows].map(row => row.map(cell => `"${cell}"`).join(',')).join('\n');
        }

        return '';
    };

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 z-50 bg-black/50 flex items-end">
            <div className="bg-white dark:bg-zinc-900 rounded-t-3xl w-full max-h-[85vh] overflow-y-auto animate-in slide-in-from-bottom">
                {/* Header */}
                <div className="sticky top-0 bg-white dark:bg-zinc-900 border-b border-gray-200 dark:border-zinc-800 p-4 rounded-t-3xl">
                    <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                            <FileText className="text-blue-500" size={20} />
                            <h2 className="text-lg font-bold text-gray-900 dark:text-white">Importar/Exportar Dados</h2>
                        </div>
                        <Button onClick={onClose} variant="ghost" size="sm" icon={X} />
                    </div>
                </div>

                {/* Content */}
                <div className="p-4 space-y-6">
                    {/* Export Section */}
                    <div>
                        <h3 className="text-sm font-bold text-gray-500 uppercase tracking-widest mb-3">Exportar Dados</h3>
                        
                        {data.length > 0 ? (
                            <div className="bg-gray-50 dark:bg-zinc-800 rounded-xl p-4 mb-4">
                                <div className="flex items-center gap-3 mb-2">
                                    {exportType === 'quotes' && <DollarSign className="text-green-500" size={20} />}
                                    {exportType === 'customers' && <Users className="text-blue-500" size={20} />}
                                    {exportType === 'services' && <Calendar className="text-purple-500" size={20} />}
                                    <span className="text-sm font-medium text-gray-700 dark:text-gray-300">
                                        {data.length} registros encontrados
                                    </span>
                                </div>
                                <p className="text-xs text-gray-500 dark:text-gray-400">
                                    Última atualização: {format(new Date(), "dd 'de' MMMM 'às' HH:mm", { locale: ptBR })}
                                </p>
                            </div>
                        ) : (
                            <div className="bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800 rounded-xl p-4 mb-4">
                                <p className="text-sm text-yellow-800 dark:text-yellow-200">
                                    Nenhum dado encontrado para exportar
                                </p>
                            </div>
                        )}

                        <div className="grid grid-cols-2 gap-3">
                            <Button
                                onClick={() => handleExport('csv')}
                                variant="outline"
                                className="flex items-center gap-2"
                                disabled={data.length === 0}
                            >
                                <Download size={16} />
                                Exportar CSV
                            </Button>
                            <Button
                                onClick={() => handleExport('json')}
                                variant="outline"
                                className="flex items-center gap-2"
                                disabled={data.length === 0}
                            >
                                <Download size={16} />
                                Exportar JSON
                            </Button>
                        </div>
                    </div>

                    {/* Import Section */}
                    {onImport && (
                        <div>
                            <h3 className="text-sm font-bold text-gray-500 uppercase tracking-widest mb-3">Importar Dados</h3>
                            
                            <div className="space-y-4">
                                <div>
                                    <input
                                        ref={fileInputRef}
                                        type="file"
                                        accept=".csv,.json"
                                        onChange={handleFileSelect}
                                        className="hidden"
                                    />
                                    <Button
                                        onClick={() => fileInputRef.current?.click()}
                                        variant="outline"
                                        className="w-full flex items-center gap-2 justify-center"
                                    >
                                        <Upload size={16} />
                                        Selecionar Arquivo
                                    </Button>
                                </div>

                                <div className="text-xs text-gray-500 dark:text-gray-400 space-y-2">
                                    <p><strong>Formatos aceitos:</strong> CSV, JSON</p>
                                    <p><strong>Tamanho máximo:</strong> 10MB</p>
                                    <p><strong>Estrutura esperada:</strong></p>
                                    <ul className="ml-4 list-disc space-y-1">
                                        <li>CSV: Colunas com cabeçalho</li>
                                        <li>JSON: Array de objetos</li>
                                    </ul>
                                </div>
                            </div>
                        </div>
                    )}

                    {/* Quick Actions */}
                    <div>
                        <h3 className="text-sm font-bold text-gray-500 uppercase tracking-widest mb-3">Ações Rápidas</h3>
                        <div className="grid grid-cols-1 gap-2">
                            <Button
                                onClick={() => {
                                    // Export all data in compressed format
                                    handleExport('csv');
                                }}
                                variant="ghost"
                                size="sm"
                                className="justify-start"
                            >
                                📊 Baixar relatório completo
                            </Button>
                            <Button
                                onClick={() => {
                                    // Generate backup
                                    handleExport('json');
                                }}
                                variant="ghost"
                                size="sm"
                                className="justify-start"
                            >
                                💾 Criar backup dos dados
                            </Button>
                        </div>
                    </div>
                </div>

                {/* Actions */}
                <div className="sticky bottom-0 bg-white dark:bg-zinc-900 border-t border-gray-200 dark:border-zinc-800 p-4">
                    <Button onClick={onClose} variant="primary" className="w-full">
                        Fechar
                    </Button>
                </div>
            </div>
        </div>
    );
};
