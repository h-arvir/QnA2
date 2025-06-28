import { useRef, useEffect, useCallback, useState } from "react";

const ClickSpark = ({
  sparkColor = "#fff",
  lightThemeColor = "#E3618C", // Rose-pink for light theme
  darkThemeColor = "#F5C518",  // Gold-yellow for dark theme
  sparkSize = 10,
  sparkRadius = 15,
  sparkCount = 8,
  duration = 400,
  easing = "ease-out",
  extraScale = 1.0,
  children
}) => {
  const canvasRef = useRef(null);
  const sparksRef = useRef([]);     
  const startTimeRef = useRef(null);
  const [currentSparkColor, setCurrentSparkColor] = useState(sparkColor);

  // Theme detection and color management
  useEffect(() => {
    const updateSparkColor = () => {
      const savedTheme = localStorage.getItem('theme');
      const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
      const isDark = savedTheme === 'dark' || (!savedTheme && prefersDark);
      
      // Use theme-specific colors if provided, otherwise fall back to sparkColor
      if (lightThemeColor && darkThemeColor) {
        setCurrentSparkColor(isDark ? darkThemeColor : lightThemeColor);
      } else {
        setCurrentSparkColor(sparkColor);
      }
    };

    // Initial color setup
    updateSparkColor();

    // Listen for theme changes via storage events (when changed in other tabs)
    const handleStorageChange = (e) => {
      if (e.key === 'theme') {
        updateSparkColor();
      }
    };

    // Listen for theme changes via custom event (when changed in same tab)
    const handleThemeChange = () => {
      updateSparkColor();
    };

    // Listen for system theme changes
    const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)');
    const handleMediaChange = () => {
      updateSparkColor();
    };

    window.addEventListener('storage', handleStorageChange);
    window.addEventListener('themechange', handleThemeChange);
    mediaQuery.addEventListener('change', handleMediaChange);

    return () => {
      window.removeEventListener('storage', handleStorageChange);
      window.removeEventListener('themechange', handleThemeChange);
      mediaQuery.removeEventListener('change', handleMediaChange);
    };
  }, [sparkColor, lightThemeColor, darkThemeColor]);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    let resizeTimeout;

    const resizeCanvas = () => {
      // Use viewport dimensions for fixed positioning
      const width = window.innerWidth;
      const height = window.innerHeight;
      
      // Set canvas size to match viewport exactly
      if (canvas.width !== width || canvas.height !== height) {
        canvas.width = width;
        canvas.height = height;
      }
    };

    const handleResize = () => {
      clearTimeout(resizeTimeout);
      resizeTimeout = setTimeout(resizeCanvas, 100);
    };

    window.addEventListener('resize', handleResize);
    resizeCanvas();

    return () => {
      window.removeEventListener('resize', handleResize);
      clearTimeout(resizeTimeout);
    };
  }, []);

  const easeFunc = useCallback(
    (t) => {
      switch (easing) {
        case "linear":
          return t;
        case "ease-in":
          return t * t;
        case "ease-in-out":
          return t < 0.5 ? 2 * t * t : -1 + (4 - 2 * t) * t;
        default:
          return t * (2 - t);
      }
    },
    [easing]
  );

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");

    let animationId;

    const draw = (timestamp) => {
      if (!startTimeRef.current) {
        startTimeRef.current = timestamp; 
      }
      ctx.clearRect(0, 0, canvas.width, canvas.height);

      sparksRef.current = sparksRef.current.filter((spark) => {
        const elapsed = timestamp - spark.startTime;
        if (elapsed >= duration) {
          return false;
        }

        const progress = elapsed / duration;
        const eased = easeFunc(progress);

        const distance = eased * sparkRadius * extraScale;
        const lineLength = sparkSize * (1 - eased);

        const x1 = spark.x + distance * Math.cos(spark.angle);
        const y1 = spark.y + distance * Math.sin(spark.angle);
        const x2 = spark.x + (distance + lineLength) * Math.cos(spark.angle);
        const y2 = spark.y + (distance + lineLength) * Math.sin(spark.angle);

        ctx.strokeStyle = currentSparkColor;
        ctx.lineWidth = 2;
        ctx.beginPath();
        ctx.moveTo(x1, y1);
        ctx.lineTo(x2, y2);
        ctx.stroke();

        return true;
      });

      animationId = requestAnimationFrame(draw);
    };

    animationId = requestAnimationFrame(draw);

    return () => {
      cancelAnimationFrame(animationId);
    };
  }, [
    currentSparkColor,
    sparkSize,
    sparkRadius,
    sparkCount,
    duration,
    easeFunc,
    extraScale,
  ]);

  const handleClick = (e) => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    
    // Use viewport coordinates directly since canvas is fixed positioned
    // No need to scale by device pixel ratio for coordinates since we're using CSS pixels
    const x = e.clientX;
    const y = e.clientY;

    // Ensure coordinates are within viewport bounds
    if (x < 0 || x > window.innerWidth || y < 0 || y > window.innerHeight) {
      return;
    }

    const now = performance.now();
    const newSparks = Array.from({ length: sparkCount }, (_, i) => ({
      x,
      y,
      angle: (2 * Math.PI * i) / sparkCount,
      startTime: now,
    }));

    sparksRef.current.push(...newSparks);
  };

  return (
    <div 
      style={{
        position: 'relative',
        width: '100%',
        height: '100%'
      }}
      onClick={handleClick}
    >
      <canvas
        ref={canvasRef}
        style={{
          width: "100vw",
          height: "100vh",
          display: "block",
          userSelect: "none",
          position: "fixed",
          top: 0,
          left: 0,
          pointerEvents: "none",
          zIndex: 9999,
          margin: 0,
          padding: 0
        }}
      />
      {children}
    </div>
  );
};

export default ClickSpark;