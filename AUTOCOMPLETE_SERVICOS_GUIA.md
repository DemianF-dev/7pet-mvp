# Correção: Autocomplete de Serviços no QuoteEditor

## Problema
O campo de descrição dos itens no orçamento não possui autocomplete de serviços, dificultando a adição de produtos/serviços.

## Solução

### 1. Adicionar Estados (após linha 92 em QuoteEditor.tsx)

```tsx
const [availableServices, setAvailableServices] = useState<any[]>([]);
const [serviceSearch, setServiceSearch] = useState<{ [key: number]: string }>({});
const [showServiceDropdown, setShowServiceDropdown] = useState<{ [key: number]: boolean }>({});
```

### 2. Adicionar Função de Busca de Serviços (após linha 99)

```tsx
const fetchServices = async () => {
    try {
        const response = await api.get('/services');
        setAvailableServices(response.data);
    } catch (error) {
        console.error('Erro ao buscar serviços:', error);
    }
};
```

### 3. Atualizar useEffect (substituir linha 97-99)

```tsx
useEffect(() => {
    if (id) fetchQuote();
    fetchServices(); // Adicionar esta linha
}, [id]);
```

### 4. Filtrar Serviços por Espécie do Pet

```tsx
const getFilteredServices = (searchTerm: string) => {
    if (!quote?.pet) return [];
    
    const petSpecies = quote.pet.species; // "Canino" ou "Felino"
    
    return availableServices.filter(service => {
        const matchesSearch = service.name.toLowerCase().includes(searchTerm.toLowerCase());
        const matchesSpecies = service.species === petSpecies || service.species === 'Ambos';
        return matchesSearch && matchesSpecies;
    });
};
```

### 5. Substituir Input de Descrição (linha 393-399)

```tsx
<div className="md:col-span-6 relative">
    <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest block mb-2 px-2">
        Descrição / Serviço
    </label>
    <input
        type="text"
        value={serviceSearch[index] || item.description}
        onChange={(e) => {
            const value = e.target.value;
            setServiceSearch({...serviceSearch, [index]: value});
            handleItemChange(index, 'description', value);
            setShowServiceDropdown({...showServiceDropdown, [index]: true});
        }}
        onFocus={() => setShowServiceDropdown({...showServiceDropdown, [index]: true})}
        className="w-full bg-white border-transparent rounded-2xl px-4 py-3 text-sm font-bold shadow-sm focus:ring-2 focus:ring-primary/20 transition-all"
        placeholder="Digite para buscar serviços..."
    />
    
    {/* Dropdown de Serviços */}
    {showServiceDropdown[index] && getFilteredServices(serviceSearch[index] || '').length > 0 && (
        <div className="absolute z-50 w-full mt-2 bg-white rounded-2xl shadow-xl border border-gray-100 max-h-60 overflow-y-auto">
            {getFilteredServices(serviceSearch[index] || '').map(service => (
                <button
                    key={service.id}
                    type="button"
                    onClick={() => {
                        handleItemChange(index, 'description', service.name);
                        handleItemChange(index, 'price', service.basePrice);
                        setServiceSearch({...serviceSearch, [index]: service.name});
                        setShowServiceDropdown({...showServiceDropdown, [index]: false});
                    }}
                    className="w-full text-left px-4 py-3 hover:bg-primary/5 transition-colors border-b border-gray-50 last:border-0 flex justify-between items-center"
                >
                    <div>
                        <p className="font-bold text-sm text-secondary">{service.name}</p>
                        <p className="text-xs text-gray-400">{service.species} • {service.category || 'Geral'}</p>
                    </div>
                    <span className="text-sm font-black text-primary">
                        R$ {service.basePrice.toLocaleString('pt-BR', {minimumFractionDigits: 2})}
                    </span>
                </button>
            ))}
        </div>
    )}
</div>
```

### 6. Fechar Dropdown ao Clicar Fora

```tsx
// Adicionar após a definição de getFilteredServices
useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
        const target = event.target as HTMLElement;
        if (!target.closest('.service-dropdown-container')) {
            setShowServiceDropdown({});
        }
    };
    
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
}, []);
```

### 7. Adicionar Classe ao Container

Na `<div className="md:col-span-6 relative">` adicionar:
```tsx
<div className="md:col-span-6 relative service-dropdown-container">
```

## Benefícios

1. ✅ Autocomplete inteligente baseado na espécie do pet
2. ✅ Preenchimento automático de preço ao selecionar serviço
3. ✅ Busca em tempo real conforme digita
4. ✅ Só mostra serviços compatíveis (Canino/Felino/Ambos)
5. ✅ Interface moderna com dropdown estilizado

## Suporte a Múltiplos Pets

Para orçamentos com múltiplos pets:
- Se houver apenas 1 pet: filtra pela espécie dele
- Se houver múltiplos pets de espécies diferentes: mostra serviços "Ambos" ou de ambas espécies
- Staff pode sempre adicionar itens customizados manualmente

## Teste

1. Abrir orçamento de um cliente com pet cadastrado
2. Clicar em "Adicionar Item"
3. Começar a digitar no campo Descrição
4. Ver lista de serviços filtrados aparecer
5. Clicar num serviço para auto-preencher nome e preço
