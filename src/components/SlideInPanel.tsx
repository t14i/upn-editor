import React, { useState, useEffect } from 'react';

interface SlideInPanelProps {
  children: React.ReactNode;
  onClose: () => void;
}

const SlideInPanel: React.FC<SlideInPanelProps> = ({ children, onClose }) => {
  const [isClosing, setIsClosing] = useState(false);

  useEffect(() => {
    if (isClosing) {
      const timer = setTimeout(() => {
        onClose();
      }, 300); // アニメーションの時間と合わせる
      return () => clearTimeout(timer);
    }
  }, [isClosing, onClose]);

  const handleClose = () => {
    setIsClosing(true);
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex justify-end">
      <div
        className={`bg-white w-[90%] h-full overflow-auto transition-transform duration-300 ease-in-out transform ${
          isClosing ? 'translate-x-full' : 'translate-x-0'
        } animate-slide-in`}
      >
        {React.cloneElement(children as React.ReactElement, { onClose: handleClose })}
      </div>
    </div>
  );
};

export default SlideInPanel;