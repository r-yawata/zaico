import * as React from 'react';
import { createContext, useContext, useState, useRef, useEffect } from 'react';

interface PopoverContextType {
  open: boolean;
  setOpen: (open: boolean) => void;
  triggerRef: React.RefObject<HTMLButtonElement | null>;
  contentRef: React.RefObject<HTMLDivElement | null>;
}

const PopoverContext = createContext<PopoverContextType | undefined>(undefined);

interface PopoverProps {
  children: React.ReactNode;
  open?: boolean;
  onOpenChange?: (open: boolean) => void;
}

export function Popover({ children, open: controlledOpen, onOpenChange }: PopoverProps) {
  const [uncontrolledOpen, setUncontrolledOpen] = useState(false);
  const triggerRef = useRef<HTMLButtonElement>(null);
  const contentRef = useRef<HTMLDivElement>(null);

  const open = controlledOpen ?? uncontrolledOpen;
  const setOpen = (newOpen: boolean) => {
    if (controlledOpen === undefined) {
      setUncontrolledOpen(newOpen);
    }
    onOpenChange?.(newOpen);
  };

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        contentRef.current &&
        !contentRef.current.contains(event.target as Node) &&
        triggerRef.current &&
        !triggerRef.current.contains(event.target as Node)
      ) {
        setOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  return (
    <PopoverContext.Provider value={{ open, setOpen, triggerRef, contentRef }}>
      {children}
    </PopoverContext.Provider>
  );
}

interface PopoverTriggerProps {
  children: React.ReactNode;
  asChild?: boolean;
}

export function PopoverTrigger({ children, asChild }: PopoverTriggerProps) {
  const context = useContext(PopoverContext);
  if (!context) throw new Error('PopoverTrigger must be used within a Popover');

  const { open, setOpen, triggerRef } = context;

  const triggerProps = {
    ref: triggerRef,
    onClick: () => setOpen(!open),
    'aria-expanded': open,
  };

  if (asChild && React.isValidElement(children)) {
    return React.cloneElement(children, triggerProps);
  }

  return (
    <button type="button" {...triggerProps}>
      {children}
    </button>
  );
}

interface PopoverContentProps {
  children: React.ReactNode;
  className?: string;
  align?: 'start' | 'center' | 'end';
  side?: 'top' | 'right' | 'bottom' | 'left';
  sideOffset?: number;
}

export function PopoverContent({
  children,
  className = '',
  align = 'center',
  side = 'bottom',
  sideOffset = 4,
}: PopoverContentProps) {
  const context = useContext(PopoverContext);
  if (!context) throw new Error('PopoverContent must be used within a Popover');

  const { open, contentRef } = context;

  if (!open) return null;

  return (
    <div
      ref={contentRef}
      className={`absolute z-50 bg-white rounded-md shadow-lg p-2 ${className}`}
      style={{
        top: side === 'bottom' ? '100%' : side === 'top' ? 'auto' : '50%',
        bottom: side === 'top' ? '100%' : 'auto',
        left: align === 'start' ? '0' : align === 'center' ? '50%' : 'auto',
        right: align === 'end' ? '0' : 'auto',
        transform: `translate(${align === 'center' ? '-50%' : '0'}, ${
          side === 'top' || side === 'bottom' ? `${sideOffset}px` : '-50%'
        })`,
      }}
    >
      {children}
    </div>
  );
} 