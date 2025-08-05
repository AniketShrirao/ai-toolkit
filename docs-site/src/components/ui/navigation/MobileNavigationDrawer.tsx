'use client';

import React, { useEffect, useRef, useCallback } from 'react';
import { createPortal } from 'react-dom';
import { useNavigation } from '@/contexts/NavigationContext';
import { NavigationTree } from './NavigationTree';
import styles from './MobileNavigationDrawer.module.scss';

interface MobileNavigationDrawerProps {
  className?: string;
}

export function MobileNavigationDrawer({ className }: MobileNavigationDrawerProps) {
  const { 
    isOpen, 
    isMobile, 
    closeNavigation, 
    navigationSections, 
    isActiveRoute 
  } = useNavigation();
  
  const drawerRef = useRef<HTMLDivElement>(null);
  const overlayRef = useRef<HTMLDivElement>(null);
  const startXRef = useRef<number>(0);
  const currentXRef = useRef<number>(0);
  const isDraggingRef = useRef<boolean>(false);

  // Handle touch gestures for swipe to close
  const handleTouchStart = useCallback((e: TouchEvent) => {
    if (!isOpen || !isMobile) return;
    
    const touch = e.touches[0];
    startXRef.current = touch.clientX;
    currentXRef.current = touch.clientX;
    isDraggingRef.current = true;
  }, [isOpen, isMobile]);

  const handleTouchMove = useCallback((e: TouchEvent) => {
    if (!isDraggingRef.current || !isOpen || !isMobile) return;
    
    const touch = e.touches[0];
    currentXRef.current = touch.clientX;
    const deltaX = currentXRef.current - startXRef.current;
    
    // Only allow swiping left (closing)
    if (deltaX < 0) {
      const drawer = drawerRef.current;
      if (drawer) {
        const translateX = Math.max(deltaX, -320); // Max drawer width
        drawer.style.transform = `translateX(${translateX}px)`;
      }
    }
  }, [isOpen, isMobile]);

  const handleTouchEnd = useCallback(() => {
    if (!isDraggingRef.current || !isOpen || !isMobile) return;
    
    const deltaX = currentXRef.current - startXRef.current;
    const drawer = drawerRef.current;
    
    if (drawer) {
      // If swiped more than 50px left, close the drawer
      if (deltaX < -50) {
        closeNavigation();
      } else {
        // Snap back to open position
        drawer.style.transform = 'translateX(0)';
      }
    }
    
    isDraggingRef.current = false;
  }, [isOpen, isMobile, closeNavigation]);

  // Add touch event listeners
  useEffect(() => {
    if (!isMobile) return;

    const drawer = drawerRef.current;
    if (drawer) {
      drawer.addEventListener('touchstart', handleTouchStart, { passive: true });
      drawer.addEventListener('touchmove', handleTouchMove, { passive: true });
      drawer.addEventListener('touchend', handleTouchEnd, { passive: true });
      
      return () => {
        drawer.removeEventListener('touchstart', handleTouchStart);
        drawer.removeEventListener('touchmove', handleTouchMove);
        drawer.removeEventListener('touchend', handleTouchEnd);
      };
    }
  }, [isMobile, handleTouchStart, handleTouchMove, handleTouchEnd]);

  // Handle escape key
  useEffect(() => {
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && isOpen && isMobile) {
        closeNavigation();
      }
    };

    if (isOpen && isMobile) {
      document.addEventListener('keydown', handleEscape);
      return () => document.removeEventListener('keydown', handleEscape);
    }
  }, [isOpen, isMobile, closeNavigation]);

  // Prevent body scroll when drawer is open
  useEffect(() => {
    if (isOpen && isMobile) {
      document.body.style.overflow = 'hidden';
      return () => {
        document.body.style.overflow = '';
      };
    }
  }, [isOpen, isMobile]);

  // Don't render on desktop or when closed
  if (!isMobile) return null;

  const drawerContent = (
    <>
      {/* Overlay */}
      {isOpen && (
        <div
          ref={overlayRef}
          className={styles.overlay}
          onClick={closeNavigation}
          aria-hidden="true"
        />
      )}

      {/* Drawer */}
      <div
        ref={drawerRef}
        className={`${styles.drawer} ${isOpen ? styles.open : ''} ${className || ''}`}
        aria-label="Mobile navigation"
        role="dialog"
        aria-modal="true"
      >
        <div className={styles.drawerContent}>
          {/* Header */}
          <div className={styles.drawerHeader}>
            <h2 className={styles.drawerTitle}>Navigation</h2>
            <button
              className={styles.closeButton}
              onClick={closeNavigation}
              aria-label="Close navigation"
              type="button"
            >
              <svg
                className={styles.closeIcon}
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
                xmlns="http://www.w3.org/2000/svg"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M6 18L18 6M6 6l12 12"
                />
              </svg>
            </button>
          </div>

          {/* Navigation content */}
          <div className={styles.drawerBody}>
            {navigationSections.map((section, index) => (
              <div key={index} className={styles.navigationSection}>
                <h3 className={styles.sectionTitle}>{section.title}</h3>
                <NavigationTree
                  items={section.items}
                  isActiveRoute={isActiveRoute}
                  className={styles.navigationTree}
                />
              </div>
            ))}
          </div>

          {/* Footer with swipe hint */}
          <div className={styles.drawerFooter}>
            <div className={styles.swipeHint}>
              <svg
                className={styles.swipeIcon}
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
                xmlns="http://www.w3.org/2000/svg"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M7 16l-4-4m0 0l4-4m-4 4h18"
                />
              </svg>
              <span className={styles.swipeText}>Swipe left to close</span>
            </div>
          </div>
        </div>
      </div>
    </>
  );

  // Render in portal to ensure proper z-index stacking
  return typeof window !== 'undefined' 
    ? createPortal(drawerContent, document.body)
    : null;
}