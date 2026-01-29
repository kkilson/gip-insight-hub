import { useState, useMemo } from 'react';
import { Cake } from 'lucide-react';
import { useBirthdays, getMonthName, type BirthdayClient } from '@/hooks/useBirthdays';
import { BirthdayStats } from '@/components/birthdays/BirthdayStats';
import { BirthdayFilters } from '@/components/birthdays/BirthdayFilters';
import { BirthdayTable } from '@/components/birthdays/BirthdayTable';
import { BirthdayDetailDialog } from '@/components/birthdays/BirthdayDetailDialog';
import { BirthdaySendDialog } from '@/components/birthdays/BirthdaySendDialog';
import { BirthdayCardGenerator } from '@/components/birthdays/BirthdayCardGenerator';
import { Skeleton } from '@/components/ui/skeleton';
import { format, subMonths, addMonths } from 'date-fns';
import { es } from 'date-fns/locale';

type MonthFilter = 'previous' | 'current' | 'next';

export default function Birthdays() {
  const [monthFilter, setMonthFilter] = useState<MonthFilter>('current');
  const [search, setSearch] = useState('');
  const [selectedBirthday, setSelectedBirthday] = useState<BirthdayClient | null>(null);
  const [detailDialogOpen, setDetailDialogOpen] = useState(false);
  const [sendDialogOpen, setSendDialogOpen] = useState(false);
  const [cardDialogOpen, setCardDialogOpen] = useState(false);

  const { data, isLoading, refetch, isRefetching } = useBirthdays(monthFilter);

  // Get current month name for display
  const today = new Date();
  const targetDate = monthFilter === 'previous' 
    ? subMonths(today, 1) 
    : monthFilter === 'next' 
    ? addMonths(today, 1) 
    : today;
  const monthName = format(targetDate, 'MMMM yyyy', { locale: es });

  // Filter birthdays by search
  const filteredBirthdays = useMemo(() => {
    if (!data?.birthdays) return [];
    if (!search.trim()) return data.birthdays;

    const searchLower = search.toLowerCase();
    return data.birthdays.filter(
      (b) =>
        b.fullName.toLowerCase().includes(searchLower) ||
        b.advisorName?.toLowerCase().includes(searchLower)
    );
  }, [data?.birthdays, search]);

  const handleViewDetails = (birthday: BirthdayClient) => {
    setSelectedBirthday(birthday);
    setDetailDialogOpen(true);
  };

  const handleSend = (birthday: BirthdayClient) => {
    setSelectedBirthday(birthday);
    setSendDialogOpen(true);
  };

  const handleGenerateCard = (birthday: BirthdayClient) => {
    setSelectedBirthday(birthday);
    setCardDialogOpen(true);
  };

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center gap-3">
        <div className="p-2 bg-primary/10 rounded-lg">
          <Cake className="h-6 w-6 text-primary" />
        </div>
        <div>
          <h1 className="text-2xl font-bold">Cumpleaños</h1>
          <p className="text-muted-foreground">
            Gestiona las felicitaciones de cumpleaños de tus clientes
          </p>
        </div>
      </div>

      {/* Filters */}
      <BirthdayFilters
        monthFilter={monthFilter}
        onMonthFilterChange={setMonthFilter}
        search={search}
        onSearchChange={setSearch}
        onRefresh={() => refetch()}
        isRefreshing={isRefetching}
      />

      {/* Stats */}
      {isLoading ? (
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-4">
          {[...Array(5)].map((_, i) => (
            <Skeleton key={i} className="h-24" />
          ))}
        </div>
      ) : data?.stats ? (
        <BirthdayStats stats={data.stats} monthName={monthName} />
      ) : null}

      {/* Table */}
      {isLoading ? (
        <div className="space-y-2">
          <Skeleton className="h-12" />
          {[...Array(5)].map((_, i) => (
            <Skeleton key={i} className="h-16" />
          ))}
        </div>
      ) : (
        <BirthdayTable
          birthdays={filteredBirthdays}
          onViewDetails={handleViewDetails}
          onSend={handleSend}
          onGenerateCard={handleGenerateCard}
        />
      )}

      {/* Dialogs */}
      <BirthdayDetailDialog
        birthday={selectedBirthday}
        open={detailDialogOpen}
        onOpenChange={setDetailDialogOpen}
        onSend={handleSend}
      />

      <BirthdaySendDialog
        birthday={selectedBirthday}
        open={sendDialogOpen}
        onOpenChange={setSendDialogOpen}
      />

      <BirthdayCardGenerator
        birthday={selectedBirthday}
        open={cardDialogOpen}
        onOpenChange={setCardDialogOpen}
      />
    </div>
  );
}
