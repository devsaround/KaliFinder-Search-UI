import { cn } from '@/lib/utils';

function Skeleton({ className, ...props }: React.HTMLAttributes<HTMLDivElement>) {
  return <div className={cn('kf:bg-muted kf:animate-pulse kf:rounded-md', className)} {...props} />;
}

export { Skeleton };
