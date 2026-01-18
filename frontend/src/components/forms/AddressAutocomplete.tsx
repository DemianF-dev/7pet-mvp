import { useState, useEffect, useRef } from 'react';
import { loadGoogleMaps, getLoaderStatus } from '../../utils/googleMapsLoader';
import { AlertCircle } from 'lucide-react';

interface AddressAutocompleteProps {
    value: string;
    onChange: (address: string) => void;
    placeholder?: string;
    label?: string;
    className?: string;
    isMasterUser?: boolean;
}

export default function AddressAutocomplete({
    value,
    onChange,
    placeholder = 'Digite o endereço',
    label,
    className = '',
    isMasterUser = false
}: AddressAutocompleteProps) {
    const inputRef = useRef<HTMLInputElement>(null);
    const [isLoading, setIsLoading] = useState(true);
    const [autocompleteReady, setAutocompleteReady] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const autocompleteRef = useRef<google.maps.places.Autocomplete | null>(null);

    useEffect(() => {
        let mounted = true;

        async function initAutocomplete() {
            try {
                const loaded = await loadGoogleMaps();

                if (!mounted) return;

                if (!loaded) {
                    const status = getLoaderStatus();
                    setError(status.error || 'Failed to load address suggestions');
                    setIsLoading(false);
                    setAutocompleteReady(false);
                    return;
                }

                if (!inputRef.current) {
                    setIsLoading(false);
                    return;
                }

                // Initialize Places Autocomplete
                const autocomplete = new (window as any).google.maps.places.Autocomplete(
                    inputRef.current,
                    {
                        componentRestrictions: { country: 'br' },
                        fields: ['formatted_address', 'address_components', 'geometry'],
                        types: ['address']
                    }
                );

                autocomplete.addListener('place_changed', () => {
                    const place = autocomplete.getPlace();
                    if (place.formatted_address) {
                        onChange(place.formatted_address);
                    }
                });

                autocompleteRef.current = autocomplete;
                setAutocompleteReady(true);
                setError(null);
            } catch (err) {
                console.error('[AddressAutocomplete] Error initializing:', err);
                setError('Failed to initialize address suggestions');
            } finally {
                if (mounted) {
                    setIsLoading(false);
                }
            }
        }

        initAutocomplete();

        return () => {
            mounted = false;
            // Cleanup autocomplete listeners
            if (autocompleteRef.current) {
                (window as any).google?.maps?.event?.clearInstanceListeners?.(autocompleteRef.current);
            }
        };
    }, []);

    return (
        <div className={className}>
            {label && (
                <label className="block text-sm font-bold text-gray-700 dark:text-gray-300 mb-2 uppercase tracking-wide">
                    {label}
                </label>
            )}

            <input
                ref={inputRef}
                type="text"
                value={value}
                onChange={(e) => onChange(e.target.value)}
                placeholder={placeholder}
                className="w-full px-6 py-4 rounded-3xl border-2 border-gray-200 dark:border-gray-700 
                          focus:border-primary focus:outline-none transition-all font-medium
                          bg-white dark:bg-gray-800 text-gray-900 dark:text-white"
                disabled={isLoading}
            />

            {isLoading && (
                <p className="text-xs text-gray-400 mt-2">Carregando sugestões de endereço...</p>
            )}

            {!isLoading && !autocompleteReady && error && (
                <div className="mt-2 p-3 bg-yellow-50 dark:bg-yellow-900/20 rounded-2xl border border-yellow-200 dark:border-yellow-800">
                    <div className="flex items-start gap-2">
                        <AlertCircle size={16} className="text-yellow-600 dark:text-yellow-400 mt-0.5 flex-shrink-0" />
                        <div className="flex-1">
                            <p className="text-xs font-medium text-yellow-800 dark:text-yellow-200">
                                Sugestão de endereço indisponível. Digite manualmente.
                            </p>
                            {isMasterUser && (
                                <p className="text-[10px] text-yellow-600 dark:text-yellow-400 mt-1 font-mono">
                                    DEV: {error}
                                </p>
                            )}
                        </div>
                    </div>
                </div>
            )}

            {!isLoading && autocompleteReady && (
                <p className="text-[10px] text-green-600 dark:text-green-400 mt-1 font-medium">
                    ✓ Sugestões ativadas - comece a digitar
                </p>
            )}
        </div>
    );
}
