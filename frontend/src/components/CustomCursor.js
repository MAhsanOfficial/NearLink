'use client';
import { useEffect, useRef } from 'react';

export default function CustomCursor() {
  const dotRef = useRef(null);
  const ringRef = useRef(null);

  useEffect(() => {
    // Check if device supports hover (mouse interface)
    const mediaQuery = window.matchMedia('(hover: hover)');
    if (!mediaQuery.matches) return;

    const dot = dotRef.current;
    const ring = ringRef.current;
    if (!dot || !ring) return;

    let mouseX = 0;
    let mouseY = 0;
    let ringX = 0;
    let ringY = 0;
    let isHovering = false;
    let isMouseDown = false;

    const onMouseMove = (e) => {
      mouseX = e.clientX;
      mouseY = e.clientY;
      
      // Update dot instantly
      dot.style.transform = `translate3d(${mouseX}px, ${mouseY}px, 0) translate(-50%, -50%)`;
    };

    const animateRing = () => {
      // Easing factor for the outer ring
      const ease = 0.15;
      ringX += (mouseX - ringX) * ease;
      ringY += (mouseY - ringY) * ease;

      // Handle hover or mouse down scale changes
      let scale = 1;
      if (isMouseDown) {
        scale = 0.8;
      } else if (isHovering) {
        scale = 1.6;
      }

      ring.style.transform = `translate3d(${ringX}px, ${ringY}px, 0) translate(-50%, -50%) scale(${scale})`;
      requestAnimationFrame(animateRing);
    };

    const onMouseDown = () => {
      isMouseDown = true;
    };

    const onMouseUp = () => {
      isMouseDown = false;
    };

    const handleMouseOver = (e) => {
      // Check if target or parent is clickable (a, button, role=button, input, select, textarea, onclick)
      const target = e.target;
      const isClickable = 
        target.tagName === 'A' || 
        target.tagName === 'BUTTON' || 
        target.getAttribute('role') === 'button' ||
        target.tagName === 'INPUT' ||
        target.tagName === 'SELECT' ||
        target.tagName === 'TEXTAREA' ||
        target.closest('a') ||
        target.closest('button') ||
        target.closest('[role="button"]') ||
        window.getComputedStyle(target).cursor === 'pointer';

      if (isClickable) {
        isHovering = true;
        ring.style.borderColor = 'var(--green-light)';
        ring.style.borderWidth = '2px';
        dot.style.background = 'var(--green-light)';
      } else {
        isHovering = false;
        ring.style.borderColor = 'var(--gold)';
        ring.style.borderWidth = '1.5px';
        dot.style.background = 'var(--gold)';
      }
    };

    window.addEventListener('mousemove', onMouseMove);
    window.addEventListener('mousedown', onMouseDown);
    window.addEventListener('mouseup', onMouseUp);
    window.addEventListener('mouseover', handleMouseOver);
    const animationFrameId = requestAnimationFrame(animateRing);

    return () => {
      window.removeEventListener('mousemove', onMouseMove);
      window.removeEventListener('mousedown', onMouseDown);
      window.removeEventListener('mouseup', onMouseUp);
      window.removeEventListener('mouseover', handleMouseOver);
      cancelAnimationFrame(animationFrameId);
    };
  }, []);

  return (
    <>
      <div 
        ref={dotRef}
        aria-hidden="true" 
        style={{
          position: 'fixed',
          top: 0,
          left: 0,
          width: '5px',
          height: '5px',
          background: 'var(--gold)',
          borderRadius: '0', // Square cursor style matching SLC
          pointerEvents: 'none',
          zIndex: 9999,
          transform: 'translate3d(-100px, -100px, 0)',
          willChange: 'transform',
          transition: 'background 0.25s ease'
        }}
      />
      <div 
        ref={ringRef}
        aria-hidden="true" 
        style={{
          position: 'fixed',
          top: 0,
          left: 0,
          width: '28px',
          height: '28px',
          border: '1.5px solid var(--gold)',
          borderRadius: '0', // Square cursor style matching SLC
          pointerEvents: 'none',
          zIndex: 9998,
          transform: 'translate3d(-100px, -100px, 0)',
          opacity: 0.6,
          willChange: 'transform',
          transition: 'width 0.2s, height 0.2s, opacity 0.2s, border-color 0.25s ease, border-width 0.25s ease'
        }}
      />
    </>
  );
}
