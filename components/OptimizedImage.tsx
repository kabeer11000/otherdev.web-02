'use client';

import Image from 'next/image';
import { useState, useRef, useEffect } from 'react';
import { m } from 'framer-motion';

interface OptimizedImageProps {
  src: string;
  alt: string;
  width: number;
  height: number;
  className?: string;
  priority?: boolean;
  quality?: number;
  placeholder?: 'blur' | 'empty';
  blurDataURL?: string;
  sizes?: string;
  fill?: boolean;
  style?: React.CSSProperties;
}

const OptimizedImage = ({
  src,
  alt,
  width,
  height,
  className = '',
  priority = false,
  quality = 90,
  placeholder = 'blur',
  blurDataURL,
  sizes,
  fill = false,
  style,
  ...props
}: OptimizedImageProps) => {
  const [isLoaded, setIsLoaded] = useState(false);
  const [hasError, setHasError] = useState(false);
  const imageRef = useRef<HTMLDivElement>(null);

  // Generate blur placeholder if not provided
  const generateBlurDataURL = (width: number, height: number) => {
    const svg = `
      <svg width="${width}" height="${height}" xmlns="http://www.w3.org/2000/svg">
        <rect width="100%" height="100%" fill="#f3f4f6"/>
      </svg>
    `;
    return `data:image/svg+xml;base64,${Buffer.from(svg).toString('base64')}`;
  };

  const defaultBlurDataURL = blurDataURL || generateBlurDataURL(width, height);

  // Intersection Observer for lazy loading
  useEffect(() => {
    if (priority) return;

    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          observer.disconnect();
        }
      },
      { threshold: 0.1, rootMargin: '50px' }
    );

    if (imageRef.current) {
      observer.observe(imageRef.current);
    }

    return () => observer.disconnect();
  }, [priority]);

  const handleLoad = () => {
    setIsLoaded(true);
  };

  const handleError = () => {
    setHasError(true);
    setIsLoaded(true);
  };

  const imageProps = {
    src: hasError ? '/images/placeholder.jpg' : src,
    alt,
    width: fill ? undefined : width,
    height: fill ? undefined : height,
    className: `transition-opacity duration-500 ${isLoaded ? 'opacity-100' : 'opacity-0'} ${className}`,
    quality,
    priority,
    placeholder: placeholder as 'blur' | 'empty',
    blurDataURL: defaultBlurDataURL,
    sizes: sizes || `(max-width: 810px) 100vw, (max-width: 1200px) 50vw, 33vw`,
    fill,
    style: {
      objectFit: 'cover' as const,
      ...style,
    },
    onLoad: handleLoad,
    onError: handleError,
    ...props,
  };

  return (
    <div
      ref={imageRef}
      className={`relative overflow-hidden ${fill ? 'w-full h-full' : ''}`}
      style={fill ? { width: '100%', height: '100%' } : { width, height }}
    >
      {/* Loading placeholder */}
      {!isLoaded && (
        <m.div
          className="absolute inset-0 bg-gray-100 animate-pulse"
          initial={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.3 }}
        />
      )}
      
      {/* Optimized Image with AVIF/WebP fallback */}
      <Image {...imageProps} />
    </div>
  );
};

export default OptimizedImage;