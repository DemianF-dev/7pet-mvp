import GameHost from '../../components/games/GameHost';

// Wrapper page
export default function PetMatchPage() {
    return (
        <GameHost
            gameLoader={() => import('../../games/petmatch/index')}
            className="w-full h-full"
            options={{}}
        />
    );
}
