import React, { useState } from 'react';
import Flashcard from './Flashcard';

const FlashcardList = ({ flashcards }) => {
  const [flippedCards, setFlippedCards] = useState([]);

  const handleCardClick = (index) => {
    setFlippedCards((prevFlipped) =>
      prevFlipped.includes(index)
        ? prevFlipped.filter((i) => i !== index)
        : [...prevFlipped, index]
    );
  };

  if (!flashcards || flashcards.length === 0) {
    return <div className='text-black'>Generate Flashcards</div>;
  }

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
      {flashcards.map((flashcard, index) => (
        <Flashcard
          key={index}
          question={flashcard.question}
          answer={flashcard.answer}
          isFlipped={flippedCards.includes(index)}
          onClick={() => handleCardClick(index)}
        />
      ))}
    </div>
  );
};

export default FlashcardList;
