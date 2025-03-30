// Flashcard.js
import React from 'react';

const Flashcard = ({ question, answer, isFlipped, onClick }) => {
  const cardContainerStyle = {
    perspective: '1000px'
  };

  const cardStyle = (isFlipped) => ({
    position: 'relative',
    width: '100%',
    height: '100%',
    transformStyle: 'preserve-3d',
    transition: 'transform 0.6s',
    transform: isFlipped ? 'rotateY(180deg)' : 'rotateY(0deg)'
  });

  const sideStyle = {
    position: 'absolute',
    width: '100%',
    height: '100%',
    backfaceVisibility: 'hidden',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: '8px',
    padding: '16px',
    boxShadow: '0 4px 6px rgba(0, 0, 0, 0.1)',
    backgroundColor: 'white'
  };

  const backSideStyle = {
    ...sideStyle,
    transform: 'rotateY(180deg)',
    backgroundColor: '#f3f4f6'
  };

  return (
    <div
      style={cardContainerStyle}
      className="relative w-full h-40 cursor-pointer"
      onClick={onClick}
    >
      <div style={cardStyle(isFlipped)}>
        {/* Front Side of the Card */}
        <div style={sideStyle}>
          <div className="font-semibold text-md mb-2 text-black">Q: {question}</div>
        </div>
        {/* Back Side of the Card */}
        <div style={backSideStyle}>
          <div className="text-gray-600">A: {answer}</div>
        </div>
      </div>
    </div>
  );
};

export default Flashcard;
