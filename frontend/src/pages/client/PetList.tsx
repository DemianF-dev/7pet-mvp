import { useState, useEffect } from 'react';
import { Plus, Search, Dog, Edit2, Trash2, Heart } from 'lucide-react';
import BackButton from '../../components/BackButton';
import { motion } from 'framer-motion';
import PetForm from '../../components/pets/PetForm';
import api from '../../services/api';
import ConfirmModal from '../../components/ConfirmModal';
import Skeleton from '../../components/Skeleton';

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
    const [petToDelete, setPetToDelete] = useState<string | null>(null);

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

    const handleDelete = async () => {
        if (!petToDelete) return;
        try {
            await api.delete(`/pets/${petToDelete}`);
            setPets(pets.filter(pet => pet.id !== petToDelete));
            setPetToDelete(null);
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
        <main className="p-6 md:p-10">
            <header className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-10">
                <div>
                    <BackButton className="mb-4 ml-[-1rem]" />
                    <h1 className="text-4xl font-extrabold text-secondary">Meus <span className="text-primary underline decoration-wavy decoration-2 underline-offset-8">Pets</span></h1>
                    <p className="text-gray-500 mt-3">Gerencie as informações dos seus melhores amigos para um atendimento personalizado.</p>
                </div>

                <button
                    id="tour-new-pet"
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
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {[1, 2, 3].map(i => (
                        <div key={i} className="bg-white rounded-[32px] p-6 shadow-sm border border-gray-50 flex flex-col gap-4">
                            <div className="flex justify-between items-start mb-2">
                                <Skeleton variant="rounded" className="w-16 h-16" />
                                <div className="flex gap-2">
                                    <Skeleton variant="rounded" className="w-8 h-8 opacity-20" />
                                    <Skeleton variant="rounded" className="w-8 h-8 opacity-20" />
                                </div>
                            </div>
                            <Skeleton variant="text" className="w-2/3 h-8" />
                            <Skeleton variant="text" className="w-1/2 h-4" />
                            <div className="space-y-3 mt-4">
                                <Skeleton variant="text" className="w-full h-3" />
                                <Skeleton variant="text" className="w-full h-3" />
                                <div className="flex gap-2 mt-2">
                                    <Skeleton variant="rounded" className="w-12 h-4" />
                                    <Skeleton variant="rounded" className="w-12 h-4" />
                                </div>
                            </div>
                            <Skeleton variant="rounded" className="mt-6 w-full h-12" />
                        </div>
                    ))}
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
                                        onClick={() => setPetToDelete(pet.id)}
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
                        id="tour-first-pet"
                        onClick={handleOpenCreateModal}
                        className="btn-primary mx-auto flex items-center gap-2"
                    >
                        <Plus size={20} />
                        Adicionar Meu Primeiro Pet
                    </button>
                </div>
            )
            }

            <PetForm
                isOpen={isModalOpen}
                onClose={() => setIsModalOpen(false)}
                onSubmit={handleSubmit}
                initialData={editingPet}
                isLoading={isSaving}
            />

            <ConfirmModal
                isOpen={!!petToDelete}
                onClose={() => setPetToDelete(null)}
                onConfirm={handleDelete}
                title="Remover Pet?"
                description="Tem certeza que deseja remover este pet? Esta ação não pode ser desfeita e todos os dados associados a ele serão perdidos."
                confirmText="Sim, Remover"
                confirmColor="bg-red-500"
            />
        </main>
    );
}
