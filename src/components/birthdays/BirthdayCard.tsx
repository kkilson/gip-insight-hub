import { forwardRef } from 'react';
import { Cake, Gift, Sparkles } from 'lucide-react';

interface BirthdayCardProps {
  clientName: string;
  advisorName: string | null;
  brokerName?: string;
}

export const BirthdayCard = forwardRef<HTMLDivElement, BirthdayCardProps>(
  ({ clientName, advisorName, brokerName }, ref) => {
    return (
      <div
        ref={ref}
        className="relative w-[600px] h-[400px] bg-gradient-to-br from-primary/20 via-accent/30 to-secondary/40 rounded-2xl overflow-hidden shadow-xl"
      >
        {/* Background decorations */}
        <div className="absolute inset-0 overflow-hidden">
          <div className="absolute -top-10 -right-10 w-40 h-40 bg-primary/20 rounded-full blur-3xl" />
          <div className="absolute -bottom-10 -left-10 w-32 h-32 bg-accent/30 rounded-full blur-2xl" />
          <div className="absolute top-1/4 right-1/4 w-20 h-20 bg-secondary/20 rounded-full blur-xl" />
        </div>

        {/* Confetti/sparkles decorations */}
        <div className="absolute inset-0 pointer-events-none">
          <Sparkles className="absolute top-8 left-8 h-6 w-6 text-primary/60" />
          <Sparkles className="absolute top-12 right-16 h-5 w-5 text-accent/70" />
          <Gift className="absolute bottom-16 left-12 h-8 w-8 text-primary/50" />
          <Sparkles className="absolute bottom-20 right-20 h-4 w-4 text-secondary/60" />
        </div>

        {/* Content */}
        <div className="relative z-10 flex flex-col items-center justify-center h-full px-8 text-center">
          {/* Cake icon */}
          <div className="mb-4 p-4 bg-primary/10 rounded-full backdrop-blur-sm">
            <Cake className="h-12 w-12 text-primary" />
          </div>

          {/* Title */}
          <h1 className="text-3xl font-bold text-foreground mb-2">
            ¡Feliz Cumpleaños!
          </h1>

          {/* Client name */}
          <p className="text-4xl font-extrabold text-primary mb-6">
            {clientName}
          </p>

          {/* Message */}
          <p className="text-muted-foreground text-lg max-w-md leading-relaxed">
            Te deseamos un día lleno de alegría y bendiciones.
            ¡Que todos tus sueños se hagan realidad!
          </p>

          {/* Signature */}
          <div className="absolute bottom-6 right-8 text-right">
            {advisorName && (
              <p className="text-sm text-muted-foreground">
                Con cariño, <span className="font-medium text-foreground">{advisorName}</span>
              </p>
            )}
            {brokerName && (
              <p className="text-xs text-muted-foreground mt-1">
                {brokerName}
              </p>
            )}
          </div>
        </div>
      </div>
    );
  }
);

BirthdayCard.displayName = 'BirthdayCard';
