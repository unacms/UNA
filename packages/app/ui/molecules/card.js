import * as React from 'react';
import { View } from 'app/design/view';
import { Text } from 'app/design/typography';
import { cn } from 'app/lib/util';
import { useDensityOrDefault } from 'app/context/density';

function Card({ 
  className, 
  density, // Can override global density
  ...props 
}) {
  const effectiveDensity = useDensityOrDefault(density);
  
  return (
    <View
      className={cn(`u-card-base-${effectiveDensity}`, className)}
      {...props}
    />
  );
}

function CardHeader({ 
  className, 
  density,
  ...props 
}) {
  const effectiveDensity = useDensityOrDefault(density);
  
  return (
    <View 
      className={cn(`u-card-header-${effectiveDensity}`, className)} 
      {...props} 
    />
  );
}

function CardTitle({ 
  className, 
  density,
  ...props 
}) {
  const effectiveDensity = useDensityOrDefault(density);
  
  return (
    <Text
      role="heading"
      aria-level={3}
      className={cn(`u-card-title-${effectiveDensity}`, className)}
      {...props}
    />
  );
}

function CardDescription({ 
  className, 
  density,
  ...props 
}) {
  const effectiveDensity = useDensityOrDefault(density);
  
  return (
    <Text
      className={cn(`u-card-description-${effectiveDensity}`, className)}
      {...props}
    />
  );
}

function CardContent({ 
  className, 
  density,
  ...props 
}) {
  const effectiveDensity = useDensityOrDefault(density);
  
  return (
    <View
      className={cn(`u-card-content-${effectiveDensity}`, className)}
      {...props}
    />
  );
}

function CardFooter({ 
  className, 
  density,
  ...props 
}) {
  const effectiveDensity = useDensityOrDefault(density);
  
  return (
    <View
      className={cn(`u-card-footer-${effectiveDensity}`, className)}
      {...props}
    />
  );
}

// Export default card
export default Card;

// Export all card components
export { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle };
