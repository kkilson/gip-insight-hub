import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Input } from '@/components/ui/input';
import { Plus, Handshake, Tag, Ticket, Copy, Check, Search, Send, CheckCircle2, Loader2 } from 'lucide-react';
import { usePartners, usePartnerServices, useDiscountCodes, useUpdateCodeStatus, type Partner, type PartnerService } from '@/hooks/usePartnerships';
import { PartnerFormDialog } from '@/components/partnerships/PartnerFormDialog';
import { ServiceFormDialog } from '@/components/partnerships/ServiceFormDialog';
import { GenerateCodeDialog } from '@/components/partnerships/GenerateCodeDialog';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';
import { useToast } from '@/hooks/use-toast';

const statusConfig: Record<string, { label: string; variant: 'default' | 'secondary' | 'destructive' | 'outline' }> = {
  generado: { label: 'Generado', variant: 'secondary' },
  enviado: { label: 'Enviado', variant: 'default' },
  utilizado: { label: 'Utilizado', variant: 'outline' },
  expirado: { label: 'Expirado', variant: 'destructive' },
};

export default function Partnerships() {
  const [partnerDialog, setPartnerDialog] = useState(false);
  const [serviceDialog, setServiceDialog] = useState(false);
  const [codeDialog, setCodeDialog] = useState(false);
  const [editPartner, setEditPartner] = useState<Partner | null>(null);
  const [editService, setEditService] = useState<PartnerService | null>(null);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [partnerFilter, setPartnerFilter] = useState('all');
  const [copiedId, setCopiedId] = useState<string | null>(null);

  const { data: partners, isLoading: loadingPartners } = usePartners();
  const { data: services, isLoading: loadingServices } = usePartnerServices();
  const { data: codes, isLoading: loadingCodes } = useDiscountCodes();
  const updateStatus = useUpdateCodeStatus();
  const { toast } = useToast();

  const filteredCodes = codes?.filter(c => {
    if (statusFilter !== 'all' && c.status !== statusFilter) return false;
    if (partnerFilter !== 'all' && (c.service as any)?.partner?.id !== partnerFilter) return false;
    if (search) {
      const s = search.toLowerCase();
      const clientName = c.client ? `${c.client.first_name} ${c.client.last_name}`.toLowerCase() : '';
      if (!c.code.toLowerCase().includes(s) && !clientName.includes(s) && !(c.service as any)?.name?.toLowerCase().includes(s)) return false;
    }
    return true;
  });

  const copyCode = (id: string, code: string) => {
    navigator.clipboard.writeText(code);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 2000);
  };

  const markSent = (id: string) => updateStatus.mutate({ id, status: 'enviado' });
  const markUsed = (id: string) => updateStatus.mutate({ id, status: 'utilizado' });

  // Stats
  const totalCodes = codes?.length || 0;
  const sentCodes = codes?.filter(c => c.status === 'enviado').length || 0;
  const usedCodes = codes?.filter(c => c.status === 'utilizado').length || 0;
  const activePartners = partners?.filter(p => p.is_active).length || 0;

  const isLoading = loadingPartners || loadingServices || loadingCodes;

  return (
    <div className="p-6 space-y-6">
      <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
        <div>
          <h1 className="text-2xl font-bold text-foreground">Alianzas</h1>
          <p className="text-muted-foreground">Gestiona aliados, servicios y códigos de descuento</p>
        </div>
        <div className="flex gap-2 flex-wrap">
          <Button variant="outline" onClick={() => { setEditPartner(null); setPartnerDialog(true); }}><Plus className="h-4 w-4 mr-2" />Nuevo Aliado</Button>
          <Button variant="outline" onClick={() => { setEditService(null); setServiceDialog(true); }}><Tag className="h-4 w-4 mr-2" />Nuevo Servicio</Button>
          <Button onClick={() => setCodeDialog(true)}><Ticket className="h-4 w-4 mr-2" />Generar Código</Button>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <Card><CardContent className="p-4 text-center"><Handshake className="h-5 w-5 mx-auto text-muted-foreground mb-1" /><p className="text-2xl font-bold">{activePartners}</p><p className="text-xs text-muted-foreground">Aliados activos</p></CardContent></Card>
        <Card><CardContent className="p-4 text-center"><Ticket className="h-5 w-5 mx-auto text-muted-foreground mb-1" /><p className="text-2xl font-bold">{totalCodes}</p><p className="text-xs text-muted-foreground">Códigos generados</p></CardContent></Card>
        <Card><CardContent className="p-4 text-center"><Send className="h-5 w-5 mx-auto text-muted-foreground mb-1" /><p className="text-2xl font-bold">{sentCodes}</p><p className="text-xs text-muted-foreground">Enviados</p></CardContent></Card>
        <Card><CardContent className="p-4 text-center"><CheckCircle2 className="h-5 w-5 mx-auto text-muted-foreground mb-1" /><p className="text-2xl font-bold">{usedCodes}</p><p className="text-xs text-muted-foreground">Utilizados</p></CardContent></Card>
      </div>

      <Tabs defaultValue="codes" className="space-y-4">
        <TabsList>
          <TabsTrigger value="codes">Códigos</TabsTrigger>
          <TabsTrigger value="partners">Aliados</TabsTrigger>
          <TabsTrigger value="services">Servicios</TabsTrigger>
        </TabsList>

        {/* Codes Tab */}
        <TabsContent value="codes" className="space-y-4">
          <div className="flex flex-wrap gap-3">
            <div className="relative flex-1 min-w-[200px]">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input className="pl-9" placeholder="Buscar código, cliente o servicio..." value={search} onChange={e => setSearch(e.target.value)} />
            </div>
            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger className="w-[160px]"><SelectValue placeholder="Estado" /></SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todos</SelectItem>
                <SelectItem value="generado">Generado</SelectItem>
                <SelectItem value="enviado">Enviado</SelectItem>
                <SelectItem value="utilizado">Utilizado</SelectItem>
                <SelectItem value="expirado">Expirado</SelectItem>
              </SelectContent>
            </Select>
            <Select value={partnerFilter} onValueChange={setPartnerFilter}>
              <SelectTrigger className="w-[180px]"><SelectValue placeholder="Aliado" /></SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todos los aliados</SelectItem>
                {partners?.map(p => <SelectItem key={p.id} value={p.id}>{p.name}</SelectItem>)}
              </SelectContent>
            </Select>
          </div>

          {isLoading ? (
            <Card><CardContent className="flex justify-center py-12"><Loader2 className="h-8 w-8 animate-spin text-muted-foreground" /></CardContent></Card>
          ) : filteredCodes && filteredCodes.length > 0 ? (
            <Card>
              <CardContent className="p-0">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Código</TableHead>
                      <TableHead>Aliado / Servicio</TableHead>
                      <TableHead>Cliente</TableHead>
                      <TableHead>Descuento</TableHead>
                      <TableHead>Usos</TableHead>
                      <TableHead>Estado</TableHead>
                      <TableHead>Fecha</TableHead>
                      <TableHead className="w-[120px]"></TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {filteredCodes.map(code => {
                      const svc = code.service as any;
                      const st = statusConfig[code.status] || statusConfig.generado;
                      return (
                        <TableRow key={code.id}>
                          <TableCell>
                            <div className="flex items-center gap-1">
                              <span className="font-mono font-semibold text-sm">{code.code}</span>
                              <Button variant="ghost" size="icon" className="h-6 w-6" onClick={() => copyCode(code.id, code.code)}>
                                {copiedId === code.id ? <Check className="h-3 w-3 text-primary" /> : <Copy className="h-3 w-3" />}
                              </Button>
                            </div>
                          </TableCell>
                          <TableCell>
                            <div className="text-sm font-medium">{svc?.partner?.name}</div>
                            <div className="text-xs text-muted-foreground">{svc?.name}</div>
                          </TableCell>
                          <TableCell>
                            {code.client ? (
                              <div className="text-sm">{code.client.first_name} {code.client.last_name}</div>
                            ) : <span className="text-xs text-muted-foreground">Sin asignar</span>}
                          </TableCell>
                          <TableCell>
                            <span className="text-sm font-medium">
                              {svc?.discount_type === 'porcentaje' ? `${svc?.discount_value}%` : `$${svc?.discount_value}`}
                            </span>
                          </TableCell>
                          <TableCell><span className="text-sm">{code.current_uses}/{code.max_uses}</span></TableCell>
                          <TableCell><Badge variant={st.variant}>{st.label}</Badge></TableCell>
                          <TableCell className="text-sm text-muted-foreground">{format(new Date(code.created_at), 'dd MMM yy', { locale: es })}</TableCell>
                          <TableCell>
                            <div className="flex gap-1">
                              {code.status === 'generado' && (
                                <Button variant="ghost" size="sm" onClick={() => markSent(code.id)} title="Marcar como enviado">
                                  <Send className="h-3.5 w-3.5" />
                                </Button>
                              )}
                              {(code.status === 'generado' || code.status === 'enviado') && (
                                <Button variant="ghost" size="sm" onClick={() => markUsed(code.id)} title="Marcar como utilizado">
                                  <CheckCircle2 className="h-3.5 w-3.5" />
                                </Button>
                              )}
                            </div>
                          </TableCell>
                        </TableRow>
                      );
                    })}
                  </TableBody>
                </Table>
              </CardContent>
            </Card>
          ) : (
            <Card><CardContent className="flex flex-col items-center py-12 text-center">
              <Ticket className="h-12 w-12 text-muted-foreground/50 mb-4" />
              <h3 className="text-lg font-medium">Sin códigos</h3>
              <p className="text-muted-foreground">Genera tu primer código de descuento.</p>
              <Button className="mt-4" onClick={() => setCodeDialog(true)}><Plus className="h-4 w-4 mr-2" />Generar Código</Button>
            </CardContent></Card>
          )}
        </TabsContent>

        {/* Partners Tab */}
        <TabsContent value="partners" className="space-y-4">
          {partners && partners.length > 0 ? (
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
              {partners.map(p => (
                <Card key={p.id} className="cursor-pointer hover:shadow-md transition-shadow" onClick={() => { setEditPartner(p); setPartnerDialog(true); }}>
                  <CardHeader className="pb-2">
                    <div className="flex items-center justify-between">
                      <CardTitle className="text-base">{p.name}</CardTitle>
                      <Badge variant={p.is_active ? 'default' : 'secondary'}>{p.is_active ? 'Activo' : 'Inactivo'}</Badge>
                    </div>
                  </CardHeader>
                  <CardContent className="space-y-1 text-sm text-muted-foreground">
                    {p.category && <p><span className="font-medium text-foreground">Categoría:</span> {p.category}</p>}
                    {p.contact_name && <p><span className="font-medium text-foreground">Contacto:</span> {p.contact_name}</p>}
                    {p.email && <p>{p.email}</p>}
                    {p.phone && <p>{p.phone}</p>}
                    <p className="text-xs">{p.services?.length || 0} servicio(s)</p>
                  </CardContent>
                </Card>
              ))}
            </div>
          ) : (
            <Card><CardContent className="flex flex-col items-center py-12 text-center">
              <Handshake className="h-12 w-12 text-muted-foreground/50 mb-4" />
              <h3 className="text-lg font-medium">Sin aliados</h3>
              <p className="text-muted-foreground">Registra tu primer aliado comercial.</p>
              <Button className="mt-4" onClick={() => { setEditPartner(null); setPartnerDialog(true); }}><Plus className="h-4 w-4 mr-2" />Nuevo Aliado</Button>
            </CardContent></Card>
          )}
        </TabsContent>

        {/* Services Tab */}
        <TabsContent value="services" className="space-y-4">
          {services && services.length > 0 ? (
            <Card>
              <CardContent className="p-0">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Servicio</TableHead>
                      <TableHead>Aliado</TableHead>
                      <TableHead>Descuento</TableHead>
                      <TableHead>Estado</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {services.map(s => (
                      <TableRow key={s.id} className="cursor-pointer" onClick={() => { setEditService(s); setServiceDialog(true); }}>
                        <TableCell>
                          <div className="font-medium">{s.name}</div>
                          {s.description && <div className="text-xs text-muted-foreground">{s.description}</div>}
                        </TableCell>
                        <TableCell className="text-sm">{(s.partner as any)?.name}</TableCell>
                        <TableCell className="font-medium">{s.discount_type === 'porcentaje' ? `${s.discount_value}%` : `$${s.discount_value}`}</TableCell>
                        <TableCell><Badge variant={s.is_active ? 'default' : 'secondary'}>{s.is_active ? 'Activo' : 'Inactivo'}</Badge></TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </CardContent>
            </Card>
          ) : (
            <Card><CardContent className="flex flex-col items-center py-12 text-center">
              <Tag className="h-12 w-12 text-muted-foreground/50 mb-4" />
              <h3 className="text-lg font-medium">Sin servicios</h3>
              <p className="text-muted-foreground">Agrega servicios a tus aliados.</p>
              <Button className="mt-4" onClick={() => { setEditService(null); setServiceDialog(true); }}><Plus className="h-4 w-4 mr-2" />Nuevo Servicio</Button>
            </CardContent></Card>
          )}
        </TabsContent>
      </Tabs>

      <PartnerFormDialog open={partnerDialog} onOpenChange={setPartnerDialog} partner={editPartner} />
      <ServiceFormDialog open={serviceDialog} onOpenChange={setServiceDialog} service={editService} />
      <GenerateCodeDialog open={codeDialog} onOpenChange={setCodeDialog} />
    </div>
  );
}
