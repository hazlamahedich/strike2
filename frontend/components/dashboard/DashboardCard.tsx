import React, { ReactNode } from 'react';
import { motion } from 'framer-motion';
import { cn } from '@/lib/utils';
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from '@/components/ui/card';
import { cva, type VariantProps } from 'class-variance-authority';

const cardVariants = cva(
  "overflow-hidden transition-all duration-200",
  {
    variants: {
      variant: {
        default: "bg-card border",
        gradient: "bg-gradient-to-br from-blue-50 to-indigo-50 dark:from-blue-950/40 dark:to-indigo-950/40 border border-blue-100 dark:border-blue-900/50",
        solid: "bg-primary text-primary-foreground border-primary",
        destructive: "bg-destructive text-destructive-foreground border-destructive",
        success: "bg-green-50 dark:bg-green-950/40 border-green-100 dark:border-green-900/50",
        warning: "bg-yellow-50 dark:bg-yellow-950/40 border-yellow-100 dark:border-yellow-900/50",
      },
      size: {
        default: "",
        sm: "p-2",
        lg: "p-6",
      },
      hover: {
        default: "hover:shadow-md hover:-translate-y-1",
        none: "",
        subtle: "hover:shadow-sm hover:-translate-y-0.5",
        scale: "hover:scale-[1.02]",
      }
    },
    defaultVariants: {
      variant: "default",
      size: "default",
      hover: "default",
    }
  }
);

export interface DashboardCardProps extends React.HTMLAttributes<HTMLDivElement>, VariantProps<typeof cardVariants> {
  title?: string;
  description?: string;
  icon?: ReactNode;
  footer?: ReactNode;
  loading?: boolean;
  value?: string | number;
  trend?: {
    value: number;
    label?: string;
    positive?: boolean;
  };
  chart?: ReactNode;
}

export function DashboardCard({
  title,
  description,
  icon,
  footer,
  loading,
  value,
  trend,
  chart,
  variant,
  size,
  hover,
  className,
  children,
  ...props
}: DashboardCardProps) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3 }}
      whileHover={hover === 'scale' ? { scale: 1.02 } : undefined}
      className="h-full"
    >
      <Card className={cn(cardVariants({ variant, size, hover }), className)} {...props}>
        {(title || description || icon) && (
          <CardHeader className={cn("flex flex-row items-center justify-between space-y-0 pb-2", 
            loading && "animate-pulse")}>
            <div>
              {title && <CardTitle className="text-sm font-medium">{title}</CardTitle>}
              {description && <CardDescription>{description}</CardDescription>}
            </div>
            {icon && <div className="h-5 w-5 text-muted-foreground">{icon}</div>}
          </CardHeader>
        )}
        
        <CardContent className={cn("pt-2", loading && "animate-pulse")}>
          {loading ? (
            <div className="h-12 w-full bg-muted/50 rounded-md" />
          ) : (
            <>
              {value && (
                <div className="flex items-baseline space-x-2">
                  <div className="text-2xl font-bold">{value}</div>
                  {trend && (
                    <div className={cn("text-xs", 
                      trend.positive ? "text-green-500" : "text-red-500")}>
                      {trend.positive ? "+" : ""}{trend.value}%
                      {trend.label && <span className="text-muted-foreground ml-1">{trend.label}</span>}
                    </div>
                  )}
                </div>
              )}
              {chart && <div className="mt-4">{chart}</div>}
              {children}
            </>
          )}
        </CardContent>
        
        {footer && (
          <CardFooter className={cn(loading && "animate-pulse")}>
            {footer}
          </CardFooter>
        )}
      </Card>
    </motion.div>
  );
} 