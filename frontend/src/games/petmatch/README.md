# 🐾 PetMatch

Um mini-jogo Match-3 simples, fofo e performático integrado ao módulo /pausa do 7Pet.

## Estrutura

- **engine/**: Lógica pura do jogo (sem React).
  - `board.ts`: Geração e manipulação da matriz.
  - `match.ts`: Algoritmos de detecção de matches (3+ horizontais/verticais).
  - `resolve.ts`: Loop de resolução (match -> clear -> drop -> refill).
  - `levels.ts`: Configuração das fases.
- **ui/**: Componentes visuais.
  - `PetMatchGrid.tsx`: O tabuleiro interativo.
  - `PetTile.tsx`: A peça animada (framer-motion).
  - `theme/petmatchTokens.ts`: Cores e tokens visuais.
- **storage/**: Persistência local (localStorage).

## Configuração

### Ajustar Fases

Edite `src/games/petmatch/engine/levels.ts`.
Cada fase tem:

- `goalScore`: Meta de pontos.
- `moves`: Limite de jogadas.

### Ajustar Cores

Edite `src/games/petmatch/ui/theme/petmatchTokens.ts`.
As cores usam variáveis CSS do design system (`var(--color-...)`) mas possuem fallbacks.

## Performance

- O jogo usa `React.lazy` para não pesar no bundle inicial.
- Renderização otimizada para evitar repaints desnecessários no Grid.
- Pausa automática ao trocar de aba (`document.hidden`).

## Próximos Passos (V2)

- Power-ups (foguete, bomba).
- Animações mais elaboradas de "pop".
- Sons (via hook useSound).
