"use client"

import React from 'react'
import { Button } from './button'

interface ModalProps {
  isOpen: boolean
  onClose: () => void
  title?: string
  children: React.ReactNode
  maxWidth?: string
  showCloseButton?: boolean
  className?: string
}

export function Modal({ 
  isOpen, 
  onClose, 
  title, 
  children, 
  maxWidth = 'max-w-2xl',
  showCloseButton = true,
  className = ''
}: ModalProps) {
  // Handle escape key
  React.useEffect(() => {
    if (!isOpen) return

    const handleEscape = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        onClose()
      }
    }

    document.addEventListener('keydown', handleEscape)
    return () => document.removeEventListener('keydown', handleEscape)
  }, [isOpen, onClose])

  if (!isOpen) return null

  // Handle click outside
  const handleOverlayClick = (event: React.MouseEvent) => {
    if (event.target === event.currentTarget) {
      onClose()
    }
  }

  return (
    <>
      {/* Standardized grey blur overlay */}
      <div 
        className="fixed inset-0 bg-gray-500/[.15] backdrop-blur-sm z-40"
        onClick={handleOverlayClick}
      />
      
      {/* Centered modal */}
      <div className="fixed top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 z-50">
        <div className={`bg-white rounded-lg p-6 ${maxWidth} w-full mx-4 max-h-screen overflow-y-auto shadow-2xl border ${className}`}>
          {/* Header with optional title and close button */}
          {(title || showCloseButton) && (
            <div className="flex justify-between items-center mb-4">
              {title && (
                <h2 className="text-2xl font-bold text-gray-900">{title}</h2>
              )}
              {showCloseButton && (
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={onClose}
                  className="text-gray-400 hover:text-gray-600"
                >
                  ✕
                </Button>
              )}
            </div>
          )}
          
          {/* Modal content */}
          <div className="modal-content">
            {children}
          </div>
        </div>
      </div>
    </>
  )
}

// Convenience hook for modal state management
export function useModal(initialState = false) {
  const [isOpen, setIsOpen] = React.useState(initialState)
  
  const openModal = React.useCallback(() => setIsOpen(true), [])
  const closeModal = React.useCallback(() => setIsOpen(false), [])
  const toggleModal = React.useCallback(() => setIsOpen(prev => !prev), [])
  
  return {
    isOpen,
    openModal,
    closeModal,
    toggleModal,
    setIsOpen
  }
}