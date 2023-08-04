import React, { useEffect, useRef } from "react";

interface ModalProps {
  onClose: () => void;
  isOpen: boolean;
  children: React.ReactNode
}

const Modal: React.FC<ModalProps> = ({ onClose, isOpen, children }) => {
  const modalRef = useRef<HTMLDivElement>(null);

  const closeModal = () => {
    onClose();
  };

  const handleClickOutside = (event: MouseEvent) => {
    if (modalRef.current && !modalRef.current.contains(event.target as Node)) {
      closeModal();
    }
  };

  const handleKeyDown = (event: KeyboardEvent) => {
    if (event.key === "Escape") {
      closeModal();
    }
  };

  useEffect(() => {
    if (isOpen) {
      document.addEventListener("mousedown", handleClickOutside);
      document.addEventListener("keydown", handleKeyDown);
    } else {
      document.removeEventListener("mousedown", handleClickOutside);
      document.removeEventListener("keydown", handleKeyDown);
    }

    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
      document.removeEventListener("keydown", handleKeyDown);
    };
  }, [isOpen]);

  return (
    <>
      {isOpen && (
        <div className="fixed inset-0 flex items-center justify-center bg-black dark:bg-opacity-90 bg-opacity-70 z-50">
          <div className="bg-white dark:bg-neutral-800 dark:text-neutral-300 rounded w-[250px] p-6 shadow-lg relative" ref={modalRef}>
            <button
              className="absolute top-2 right-2 text-gray-500 hover:text-gray-700 z-60"
              onClick={closeModal}
            >
              &#10005;
            </button>
            {children}
          </div>
        </div>
      )}
    </>
  );
};

export default Modal;
