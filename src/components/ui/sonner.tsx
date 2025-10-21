import { useTheme } from 'next-themes';
import { Toaster as Sonner, toast } from 'sonner';

type ToasterProps = React.ComponentProps<typeof Sonner>;

const Toaster = ({ ...props }: ToasterProps) => {
  const { theme = 'system' } = useTheme();

  return (
    <Sonner
      theme={theme as ToasterProps['theme']}
      className="kf:toaster kf:group"
      toastOptions={{
        classNames: {
          toast:
            'kf:group kf:toast kf:group-[.toaster]:bg-background kf:group-[.toaster]:text-foreground kf:group-[.toaster]:border-border kf:group-[.toaster]:shadow-lg',
          description: 'kf:group-[.toast]:text-muted-foreground',
          actionButton: 'kf:group-[.toast]:bg-primary kf:group-[.toast]:text-primary-foreground',
          cancelButton: 'kf:group-[.toast]:bg-muted kf:group-[.toast]:text-muted-foreground',
        },
      }}
      {...props}
    />
  );
};

// eslint-disable-next-line react-refresh/only-export-components
export { Toaster, toast };
