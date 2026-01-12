/**
 * PacienciaPage - Paciência Pet game
 * 
 * Renders the game directly without GameHost wrapper.
 */

import PacienciaGame from '../../games/paciencia-pet/PacienciaGame';
import StaffSidebar from '../../components/StaffSidebar';
import BackButton from '../../components/BackButton';

export default function PacienciaPage() {
    return (
        <div className="min-h-screen flex bg-bg-primary overflow-hidden">
            <StaffSidebar />

            <main className="flex-1 md:ml-64 relative h-screen flex flex-col">
                <div className="p-4 bg-black/20 backdrop-blur-md border-b border-white/10 z-50">
                    <BackButton className="w-fit text-white hover:bg-white/10" />
                </div>

                <div className="flex-1 relative">
                    <PacienciaGame />
                </div>

                {/* Mobile spacer for bottom nav */}
                <div className="h-16 md:hidden" aria-hidden="true" />
            </main>
        </div>
    );
}
