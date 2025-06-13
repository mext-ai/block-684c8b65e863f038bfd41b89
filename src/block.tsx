import React, { useState, useEffect, useCallback } from 'react';

interface BlockProps {
  title?: string;
  difficulty?: 'easy' | 'medium' | 'hard';
}

interface Card {
  id: number;
  symbol: string;
  name: string;
  matched: boolean;
  flipped: boolean;
}

const WW2_ITEMS = [
  { symbol: '✈️', name: 'Fighter Plane' },
  { symbol: '🚁', name: 'Helicopter' },
  { symbol: '🚢', name: 'Battleship' },
  { symbol: '⚓', name: 'Naval Anchor' },
  { symbol: '🪖', name: 'Military Helmet' },
  { symbol: '🎖️', name: 'Military Medal' },
  { symbol: '💣', name: 'Bomb' },
  { symbol: '🔫', name: 'Rifle' },
  { symbol: '🗺️', name: 'Battle Map' },
  { symbol: '📻', name: 'Radio' },
  { symbol: '🚂', name: 'Military Train' },
  { symbol: '⭐', name: 'Military Star' }
];

const Block: React.FC<BlockProps> = ({ 
  title = "WW2 Memory Game", 
  difficulty = 'medium' 
}) => {
  const [cards, setCards] = useState<Card[]>([]);
  const [flippedCards, setFlippedCards] = useState<number[]>([]);
  const [matchedPairs, setMatchedPairs] = useState(0);
  const [moves, setMoves] = useState(0);
  const [gameStarted, setGameStarted] = useState(false);
  const [gameWon, setGameWon] = useState(false);
  const [startTime, setStartTime] = useState<number>(0);
  const [timeElapsed, setTimeElapsed] = useState(0);

  // Determine grid size based on difficulty
  const getGridSize = (diff: string) => {
    switch (diff) {
      case 'easy': return 4; // 4x4 = 16 cards (8 pairs)
      case 'medium': return 4; // 4x4 = 16 cards (8 pairs)
      case 'hard': return 6; // 6x4 = 24 cards (12 pairs)
      default: return 4;
    }
  };

  const gridSize = getGridSize(difficulty);
  const totalPairs = (gridSize * 4) / 2; // For 4x4=8 pairs, 6x4=12 pairs

  // Initialize game
  const initializeGame = useCallback(() => {
    const selectedItems = WW2_ITEMS.slice(0, totalPairs);
    const gameCards: Card[] = [];
    let cardId = 0;

    // Create pairs
    selectedItems.forEach(item => {
      gameCards.push({
        id: cardId++,
        symbol: item.symbol,
        name: item.name,
        matched: false,
        flipped: false
      });
      gameCards.push({
        id: cardId++,
        symbol: item.symbol,
        name: item.name,
        matched: false,
        flipped: false
      });
    });

    // Shuffle cards
    const shuffled = gameCards.sort(() => Math.random() - 0.5);
    setCards(shuffled);
    setFlippedCards([]);
    setMatchedPairs(0);
    setMoves(0);
    setGameWon(false);
    setGameStarted(false);
    setTimeElapsed(0);
  }, [totalPairs]);

  // Initialize game on mount
  useEffect(() => {
    initializeGame();
  }, [initializeGame]);

  // Timer effect
  useEffect(() => {
    let interval: NodeJS.Timeout;
    if (gameStarted && !gameWon) {
      interval = setInterval(() => {
        setTimeElapsed(Date.now() - startTime);
      }, 100);
    }
    return () => clearInterval(interval);
  }, [gameStarted, gameWon, startTime]);

  // Handle card click
  const handleCardClick = (cardId: number) => {
    if (!gameStarted) {
      setGameStarted(true);
      setStartTime(Date.now());
    }

    if (flippedCards.length === 2) return;
    if (flippedCards.includes(cardId)) return;
    if (cards.find(card => card.id === cardId)?.matched) return;

    const newFlippedCards = [...flippedCards, cardId];
    setFlippedCards(newFlippedCards);

    // Update card state to show it's flipped
    setCards(prevCards =>
      prevCards.map(card =>
        card.id === cardId ? { ...card, flipped: true } : card
      )
    );

    if (newFlippedCards.length === 2) {
      setMoves(prev => prev + 1);
      
      const [firstId, secondId] = newFlippedCards;
      const firstCard = cards.find(card => card.id === firstId);
      const secondCard = cards.find(card => card.id === secondId);

      if (firstCard && secondCard && firstCard.symbol === secondCard.symbol) {
        // Match found!
        setTimeout(() => {
          setCards(prevCards =>
            prevCards.map(card =>
              card.id === firstId || card.id === secondId
                ? { ...card, matched: true, flipped: false }
                : card
            )
          );
          setMatchedPairs(prev => prev + 1);
          setFlippedCards([]);
        }, 1000);
      } else {
        // No match, flip back
        setTimeout(() => {
          setCards(prevCards =>
            prevCards.map(card =>
              card.id === firstId || card.id === secondId
                ? { ...card, flipped: false }
                : card
            )
          );
          setFlippedCards([]);
        }, 1500);
      }
    }
  };

  // Check for game win
  useEffect(() => {
    if (matchedPairs === totalPairs && gameStarted) {
      setGameWon(true);
      // Send completion event
      const completionData = {
        type: 'BLOCK_COMPLETION',
        blockId: 'ww2-memory-game',
        completed: true,
        score: Math.max(1000 - moves * 10, 100),
        maxScore: 1000,
        timeSpent: timeElapsed,
        data: { moves, timeElapsed, difficulty }
      };
      window.postMessage(completionData, '*');
      window.parent.postMessage(completionData, '*');
    }
  }, [matchedPairs, totalPairs, gameStarted, moves, timeElapsed, difficulty]);

  const formatTime = (ms: number) => {
    const seconds = Math.floor(ms / 1000);
    const minutes = Math.floor(seconds / 60);
    return `${minutes}:${(seconds % 60).toString().padStart(2, '0')}`;
  };

  const getGridCols = () => {
    return difficulty === 'hard' ? 6 : 4;
  };

  return (
    <div style={{
      fontFamily: '"Courier New", monospace',
      padding: '20px',
      maxWidth: '800px',
      margin: '0 auto',
      backgroundColor: '#2c3e50',
      color: '#ecf0f1',
      minHeight: '100vh',
      backgroundImage: 'linear-gradient(135deg, #2c3e50 0%, #34495e 100%)'
    }}>
      {/* Header */}
      <div style={{
        textAlign: 'center',
        marginBottom: '30px',
        padding: '20px',
        backgroundColor: 'rgba(0,0,0,0.3)',
        borderRadius: '10px',
        border: '2px solid #8b4513'
      }}>
        <h1 style={{
          fontSize: '2.5rem',
          margin: '0 0 10px 0',
          color: '#f39c12',
          textShadow: '2px 2px 4px rgba(0,0,0,0.5)'
        }}>
          🎖️ {title} 🎖️
        </h1>
        <p style={{
          fontSize: '1.1rem',
          margin: '0',
          color: '#bdc3c7'
        }}>
          Match pairs of World War 2 military items
        </p>
      </div>

      {/* Game Stats */}
      <div style={{
        display: 'flex',
        justifyContent: 'space-between',
        marginBottom: '20px',
        padding: '15px',
        backgroundColor: 'rgba(0,0,0,0.2)',
        borderRadius: '8px',
        border: '1px solid #7f8c8d'
      }}>
        <div style={{ color: '#e74c3c', fontWeight: 'bold' }}>
          ⏱️ Time: {formatTime(timeElapsed)}
        </div>
        <div style={{ color: '#3498db', fontWeight: 'bold' }}>
          🎯 Moves: {moves}
        </div>
        <div style={{ color: '#27ae60', fontWeight: 'bold' }}>
          ✅ Pairs: {matchedPairs}/{totalPairs}
        </div>
      </div>

      {/* Game Grid */}
      <div style={{
        display: 'grid',
        gridTemplateColumns: `repeat(${getGridCols()}, 1fr)`,
        gap: '10px',
        maxWidth: '600px',
        margin: '0 auto 30px auto'
      }}>
        {cards.map(card => (
          <button
            key={card.id}
            onClick={() => handleCardClick(card.id)}
            disabled={card.matched || flippedCards.includes(card.id)}
            style={{
              width: '80px',
              height: '80px',
              border: 'none',
              borderRadius: '8px',
              fontSize: '2rem',
              cursor: card.matched ? 'default' : 'pointer',
              backgroundColor: card.matched 
                ? '#27ae60' 
                : (card.flipped || flippedCards.includes(card.id))
                  ? '#3498db'
                  : '#8b4513',
              color: 'white',
              transition: 'all 0.3s ease',
              transform: card.matched ? 'scale(0.95)' : 'scale(1)',
              boxShadow: card.matched 
                ? 'inset 0 2px 4px rgba(0,0,0,0.3)'
                : '0 4px 8px rgba(0,0,0,0.3)',
              border: card.matched ? '2px solid #2ecc71' : '2px solid #a0522d'
            }}
            title={card.flipped || flippedCards.includes(card.id) || card.matched ? card.name : 'Click to reveal'}
          >
            {(card.flipped || flippedCards.includes(card.id) || card.matched) 
              ? card.symbol 
              : '❓'
            }
          </button>
        ))}
      </div>

      {/* Win Message */}
      {gameWon && (
        <div style={{
          textAlign: 'center',
          padding: '30px',
          backgroundColor: 'rgba(46, 204, 113, 0.2)',
          border: '3px solid #27ae60',
          borderRadius: '15px',
          marginBottom: '20px'
        }}>
          <h2 style={{
            color: '#27ae60',
            fontSize: '2.5rem',
            margin: '0 0 15px 0'
          }}>
            🏆 VICTORY! 🏆
          </h2>
          <p style={{
            fontSize: '1.3rem',
            margin: '10px 0',
            color: '#2ecc71'
          }}>
            Mission Accomplished in {moves} moves!
          </p>
          <p style={{
            fontSize: '1.1rem',
            color: '#27ae60'
          }}>
            Time: {formatTime(timeElapsed)}
          </p>
          <p style={{
            fontSize: '1rem',
            color: '#f39c12',
            marginTop: '15px'
          }}>
            Score: {Math.max(1000 - moves * 10, 100)} points
          </p>
        </div>
      )}

      {/* Control Buttons */}
      <div style={{
        textAlign: 'center',
        display: 'flex',
        gap: '15px',
        justifyContent: 'center'
      }}>
        <button
          onClick={initializeGame}
          style={{
            padding: '12px 25px',
            fontSize: '1.1rem',
            backgroundColor: '#e74c3c',
            color: 'white',
            border: 'none',
            borderRadius: '8px',
            cursor: 'pointer',
            fontWeight: 'bold',
            transition: 'all 0.3s ease',
            boxShadow: '0 4px 8px rgba(0,0,0,0.3)'
          }}
          onMouseOver={(e) => e.currentTarget.style.backgroundColor = '#c0392b'}
          onMouseOut={(e) => e.currentTarget.style.backgroundColor = '#e74c3c'}
        >
          🔄 New Game
        </button>
      </div>

      {/* Instructions */}
      <div style={{
        marginTop: '30px',
        padding: '20px',
        backgroundColor: 'rgba(0,0,0,0.2)',
        borderRadius: '8px',
        border: '1px solid #7f8c8d'
      }}>
        <h3 style={{ color: '#f39c12', marginTop: '0' }}>📋 Mission Brief:</h3>
        <ul style={{ color: '#bdc3c7', lineHeight: '1.6' }}>
          <li>Click on cards to reveal World War 2 military items</li>
          <li>Find matching pairs by remembering card positions</li>
          <li>Match all pairs to complete your mission</li>
          <li>Try to win with fewer moves for a higher score!</li>
        </ul>
      </div>
    </div>
  );
};

export default Block;