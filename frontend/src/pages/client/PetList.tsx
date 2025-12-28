import { useState, useEffect } from 'react';
import { Plus, Search, Dog, Edit2, Trash2, Heart } from 'lucide-react';
import { motion } from 'framer-motion';
import Sidebar from '../../components/Sidebar';
import PetForm from '../../components/pets/PetForm';
import api from '../../services/api';

interface Pet {
    id: string;
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
    customerId: string;
}

export default function PetList() {
    const [pets, setPets] = useState<Pet[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState('');
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [editingPet, setEditingPet] = useState<Pet | undefined>(undefined);
    const [isSaving, setIsSaving] = useState(false);

    useEffect(() => {
        fetchPets();
    }, []);

    const fetchPets = async () => {
        try {
            const response = await api.get('/pets');
            setPets(response.data);
        } catch (error) {
            console.error('Erro ao buscar pets:', error);
        } finally {
            setIsLoading(false);
        }
    };

    const handleOpenCreateModal = () => {
        setEditingPet(undefined);
        setIsModalOpen(true);
    };

    const handleOpenEditModal = (pet: Pet) => {
        setEditingPet(pet);
        setIsModalOpen(true);
    };

    const handleSubmit = async (data: any) => {
        setIsSaving(true);
        try {
            if (editingPet) {
                const response = await api.patch(`/pets/${editingPet.id}`, data);
                setPets(pets.map(p => p.id === editingPet.id ? response.data : p));
            } else {
                const response = await api.post('/pets', data);
                setPets([...pets, response.data]);
            }
            setIsModalOpen(false);
        } catch (error: any) {
            console.error('Erro ao salvar pet:', error);
            alert(error.response?.data?.error || 'Erro ao salvar pet');
        } finally {
            setIsSaving(false);
        }
    };

    const handleDelete = async (id: string) => {
        if (!window.confirm('Tem certeza que deseja remover este pet?')) return;
        try {
            await api.delete(`/pets/${id}`);
            setPets(pets.filter(pet => pet.id !== id));
        } catch (error) {
            alert('Erro ao excluir pet');
        }
    };

    const filteredPets = pets.filter(pet =>
        pet.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        pet.species.toLowerCase().includes(searchTerm.toLowerCase()) ||
        (pet.breed && pet.breed.toLowerCase().includes(searchTerm.toLowerCase()))
    );

    return (
        <div className="min-h-screen bg-gray-50 flex">
            <Sidebar />

            <main className="flex-1 md:ml-64 p-6 md:p-10">
                <header className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-10">
                    <div>
                        <h1 className="text-4xl font-extrabold text-secondary">Meus <span className="text-primary underline decoration-wavy decoration-2 underline-offset-8">Pets</span></h1>
                        <p className="text-gray-500 mt-3">Gerencie as informações dos seus melhores amigos para um atendimento personalizado.</p>
                    </div>

                    <button
                        onClick={handleOpenCreateModal}
                        className="btn-primary flex items-center gap-2 px-6"
                    >
                        <Plus size={20} />
                        Novo Pet
                    </button>
                </header>

                <div className="mb-8 relative max-w-md">
                    <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" size={20} />
                    <input
                        type="text"
                        placeholder="Buscar por nome, espécie ou raça..."
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        className="w-full bg-white border-none rounded-2xl pl-12 pr-4 py-4 text-sm focus:ring-2 focus:ring-primary/20 shadow-sm transition-all"
                    />
                </div>

                {isLoading ? (
                    <div className="flex justify-center items-center py-20">
                        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
                    </div>
                ) : filteredPets.length > 0 ? (
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                        {filteredPets.map((pet) => (
                            <motion.div
                                key={pet.id}
                                initial={{ opacity: 0, y: 20 }}
                                animate={{ opacity: 1, y: 0 }}
                                className="glass-card p-6 flex flex-col group hover:border-primary/30 transition-all shadow-sm"
                            >
                                <div className="flex justify-between items-start mb-4">
                                    <div className="w-16 h-16 bg-primary-light rounded-2xl flex items-center justify-center text-primary">
                                        <Dog size={32} />
                                    </div>
                                    <div className="flex gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                                        <button
                                            onClick={() => handleOpenEditModal(pet)}
                                            title="Editar"
                                            className="p-2 bg-gray-100 hover:bg-primary hover:text-white rounded-lg transition-colors"
                                        >
                                            <Edit2 size={16} />
                                        </button>
                                        <button
                                            onClick={() => handleDelete(pet.id)}
                                            title="Excluir"
                                            className="p-2 bg-gray-100 hover:bg-red-500 hover:text-white rounded-lg transition-colors"
                                        >
                                            <Trash2 size={16} />
                                        </button>
                                    </div>
                                </div>

                                <h3 className="text-2xl font-bold text-secondary mb-1">{pet.name}</h3>
                                <p className="text-primary font-medium text-sm mb-4 uppercase tracking-wider">
                                    {pet.species} • {pet.breed || 'SRD'}
                                </p>

                                <div className="space-y-3 mt-auto">
                                    {pet.weight && (
                                        <div className="flex items-center gap-2 text-gray-500 text-sm">
                                            <Dog className="text-gray-300" size={14} />
                                            <span>Peso: <strong>{pet.weight} kg</strong></span>
                                        </div>
                                    )}
                                    {pet.preferences && (
                                        <div className="flex items-center gap-2 text-gray-500 text-sm">
                                            <Heart size={14} className="text-red-400" />
                                            <span className="line-clamp-1">Prefere: <em>{pet.preferences}</em></span>
                                        </div>
                                    )}
                                    <div className="flex flex-wrap gap-2 mt-2">
                                        {pet.coatType && <span className="text-[10px] bg-blue-50 text-blue-600 px-2 py-0.5 rounded-full font-bold uppercase">{pet.coatType}</span>}
                                        {pet.usesPerfume && <span className="text-[10px] bg-purple-50 text-purple-600 px-2 py-0.5 rounded-full font-bold uppercase">Perfume</span>}
                                        {pet.usesOrnaments && <span className="text-[10px] bg-pink-50 text-pink-600 px-2 py-0.5 rounded-full font-bold uppercase">Enfeites</span>}
                                    </div>
                                </div>

                                <button
                                    onClick={() => handleOpenEditModal(pet)}
                                    className="mt-6 w-full py-3 bg-gray-50 hover:bg-secondary hover:text-white text-secondary font-bold rounded-xl transition-all text-sm"
                                >
                                    Ver Detalhes
                                </button>
                            </motion.div>
                        ))}
                    </div>
                ) : (
                    <div className="text-center py-20 bg-white rounded-3xl border-2 border-dashed border-gray-100">
                        <Dog className="mx-auto text-gray-200 mb-4" size={64} />
                        <h3 className="text-xl font-bold text-secondary mb-2">Nenhum pet encontrado</h3>
                        <p className="text-gray-400 mb-8">Comece adicionando o seu melhor amigo ao sistema.</p>
                        <button
                            onClick={handleOpenCreateModal}
                            className="btn-primary mx-auto flex items-center gap-2"
                        >
                            <Plus size={20} />
                            Adicionar Meu Primeiro Pet
                        </button>
                    </div>
                )}

                <PetForm
                    isOpen={isModalOpen}
                    onClose={() => setIsModalOpen(false)}
                    onSubmit={handleSubmit}
                    initialData={editingPet}
                    isLoading={isSaving}
                />
            </main>
        </div>
    );
}
