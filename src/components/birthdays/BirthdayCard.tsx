import { forwardRef } from 'react';
import birthdayTemplate from '@/assets/birthday-card-template.png';

interface BirthdayCardProps {
  clientName: string;
  advisorName: string | null;
}

export const BirthdayCard = forwardRef<HTMLDivElement, BirthdayCardProps>(
  ({ clientName, advisorName }, ref) => {
    return (
      <div
        ref={ref}
        className="relative w-[600px] h-[750px]"
        style={{
          backgroundImage: `url(${birthdayTemplate})`,
          backgroundSize: 'cover',
          backgroundPosition: 'center',
        }}
      >
        {/* Client name overlay - positioned after "¡Feliz Cumpleaños!" greeting */}
        <div 
          className="absolute left-1/2 -translate-x-1/2 text-white font-bold text-2xl text-center"
          style={{ top: '355px' }}
        >
          {clientName}
        </div>

        {/* Advisor name overlay - positioned below "Cordialmente:" on the signature line */}
        <div 
          className="absolute left-1/2 -translate-x-1/2 text-white font-medium text-lg"
          style={{ top: '665px' }}
        >
          {advisorName || ''}
        </div>
      </div>
    );
  }
);

BirthdayCard.displayName = 'BirthdayCard';
