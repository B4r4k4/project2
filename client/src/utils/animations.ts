/**
 * Creates a ripple effect at the click/tap position
 * @param event - The mouse or touch event
 * @param element - The element to create the ripple on
 */
export const createRipple = (
  event: React.MouseEvent<HTMLElement> | React.TouchEvent<HTMLElement>,
  element: HTMLElement
) => {
  const ripple = document.createElement('div');
  const rect = element.getBoundingClientRect();
  
  // Determine position based on event type
  let x: number, y: number;
  
  if ('touches' in event) {
    // Touch event
    x = event.touches[0].clientX - rect.left;
    y = event.touches[0].clientY - rect.top;
  } else {
    // Mouse event
    x = event.clientX - rect.left;
    y = event.clientY - rect.top;
  }
  
  // Set ripple size
  const size = Math.max(rect.width, rect.height) * 0.5;
  
  // Style the ripple
  ripple.className = 'click-effect';
  ripple.style.width = ripple.style.height = `${size}px`;
  ripple.style.left = `${x}px`;
  ripple.style.top = `${y}px`;
  
  // Add ripple to element
  element.appendChild(ripple);
  
  // Remove ripple after animation
  setTimeout(() => {
    ripple.remove();
  }, 600);
};

/**
 * Animates a number incrementing from start to end
 * @param start - Starting value
 * @param end - Ending value
 * @param duration - Duration in milliseconds
 * @param callback - Function called on each frame with current value
 */
export const animateNumber = (
  start: number,
  end: number,
  duration: number,
  callback: (value: number) => void
) => {
  const startTime = performance.now();
  
  const step = (timestamp: number) => {
    const progress = Math.min((timestamp - startTime) / duration, 1);
    const value = start + (end - start) * progress;
    
    callback(value);
    
    if (progress < 1) {
      requestAnimationFrame(step);
    }
  };
  
  requestAnimationFrame(step);
};

/**
 * Creates a floating points animation
 * @param value - Points value to display
 * @param x - X position
 * @param y - Y position
 * @param container - Container element to add the animation to
 */
export const createFloatingPoints = (
  value: number,
  x: number,
  y: number,
  container: HTMLElement
) => {
  const element = document.createElement('div');
  
  // Style the floating points
  element.className = 'floating-points';
  element.style.position = 'absolute';
  element.style.left = `${x}px`;
  element.style.top = `${y}px`;
  element.style.opacity = '1';
  element.style.color = '#FFC107'; // accent color
  element.style.fontWeight = 'bold';
  element.style.fontSize = '1.2rem';
  element.style.pointerEvents = 'none';
  element.style.transition = 'all 0.8s ease-out';
  element.style.zIndex = '100';
  element.textContent = `+${value}`;
  
  // Add element to container
  container.appendChild(element);
  
  // Animate the element
  setTimeout(() => {
    element.style.transform = 'translateY(-50px)';
    element.style.opacity = '0';
  }, 10);
  
  // Remove element after animation
  setTimeout(() => {
    element.remove();
  }, 800);
};
