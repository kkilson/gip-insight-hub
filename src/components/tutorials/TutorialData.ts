import {
  LayoutDashboard,
  Users,
  DollarSign,
  RefreshCw,
  FileText,
  Cake,
  PiggyBank,
  Target,
  Handshake,
  UserCog,
  ScrollText,
  Settings,
} from 'lucide-react';

export interface TutorialStep {
  title: string;
  description: string;
}

export interface Tutorial {
  id: string;
  title: string;
  description: string;
  steps: TutorialStep[];
}

export interface TutorialModule {
  id: string;
  title: string;
  description: string;
  icon: React.ComponentType<{ className?: string }>;
  tutorials: Tutorial[];
}

export const tutorialModules: TutorialModule[] = [
  {
    id: 'dashboard',
    title: 'Dashboard',
    description: 'Panel principal con métricas y resúmenes en tiempo real.',
    icon: LayoutDashboard,
    tutorials: [
      {
        id: 'dashboard-overview',
        title: 'Entender el Dashboard',
        description: 'Cómo interpretar las métricas y estadísticas principales.',
        steps: [
          { title: 'Acceder al Dashboard', description: 'Al iniciar sesión serás redirigido automáticamente al Dashboard. También puedes hacer clic en "Dashboard" en el menú lateral.' },
          { title: 'Revisar las tarjetas de resumen', description: 'En la parte superior verás tarjetas con métricas clave: total de clientes, pólizas activas, cobranzas pendientes y renovaciones próximas.' },
          { title: 'Interpretar las gráficas', description: 'Las gráficas muestran tendencias de cobranza y distribución de pólizas por aseguradora y estado.' },
          { title: 'Acciones rápidas', description: 'Desde el Dashboard puedes navegar directamente a las secciones que requieren atención inmediata haciendo clic en las tarjetas.' },
        ],
      },
    ],
  },
  {
    id: 'clients',
    title: 'Clientes',
    description: 'Gestión completa de clientes, pólizas y beneficiarios.',
    icon: Users,
    tutorials: [
      {
        id: 'client-create',
        title: 'Registrar un nuevo cliente',
        description: 'Proceso paso a paso para crear un cliente con sus pólizas y beneficiarios.',
        steps: [
          { title: 'Ir a Clientes', description: 'Navega a la sección "Clientes" desde el menú lateral.' },
          { title: 'Hacer clic en "Nuevo Cliente"', description: 'Presiona el botón "Nuevo Cliente" en la esquina superior derecha.' },
          { title: 'Completar datos del cliente', description: 'Llena el formulario con: tipo y número de identificación, nombres, apellidos, fecha de nacimiento, email, teléfonos, dirección y datos laborales.' },
          { title: 'Agregar póliza', description: 'En el siguiente paso, selecciona la aseguradora, producto, ingresa el número de póliza, fechas de vigencia, prima, frecuencia de pago y monto de cobertura.' },
          { title: 'Registrar beneficiarios', description: 'Agrega los beneficiarios de la póliza con sus datos personales, parentesco y porcentaje de participación.' },
          { title: 'Revisar y guardar', description: 'Revisa toda la información en el paso final y presiona "Guardar" para confirmar el registro.' },
        ],
      },
      {
        id: 'client-edit',
        title: 'Editar información de un cliente',
        description: 'Cómo modificar los datos de un cliente existente.',
        steps: [
          { title: 'Buscar el cliente', description: 'Usa la barra de búsqueda en la página de Clientes para encontrar al cliente por nombre o cédula.' },
          { title: 'Abrir el detalle', description: 'Haz clic en el ícono de "ojo" o en la fila del cliente para ver su información completa.' },
          { title: 'Presionar "Editar"', description: 'Dentro del diálogo de detalle, haz clic en el botón "Editar" para abrir el asistente de edición.' },
          { title: 'Modificar los campos necesarios', description: 'Navega entre las pestañas (Cliente, Póliza, Beneficiarios) para actualizar la información requerida.' },
          { title: 'Guardar cambios', description: 'Presiona "Guardar" para confirmar las modificaciones.' },
        ],
      },
      {
        id: 'client-import',
        title: 'Importar clientes desde Excel',
        description: 'Cómo realizar una carga masiva de clientes.',
        steps: [
          { title: 'Preparar el archivo', description: 'Prepara un archivo Excel (.xlsx) con las columnas requeridas: nombre, apellido, cédula, etc. Puedes descargar la plantilla desde el botón correspondiente.' },
          { title: 'Abrir el importador', description: 'En la página de Clientes, haz clic en "Importar" para abrir el asistente de importación.' },
          { title: 'Cargar el archivo', description: 'Arrastra o selecciona tu archivo Excel en el área indicada.' },
          { title: 'Mapear columnas', description: 'Asocia cada columna de tu archivo con el campo correspondiente del sistema. El sistema intentará hacer el mapeo automáticamente.' },
          { title: 'Revisar y confirmar', description: 'Revisa la vista previa de los datos a importar, corrige errores si los hay, y confirma la importación.' },
        ],
      },
      {
        id: 'client-export',
        title: 'Exportar clientes a Excel',
        description: 'Cómo descargar la base de clientes.',
        steps: [
          { title: 'Ir a Clientes', description: 'Navega a la sección de Clientes.' },
          { title: 'Aplicar filtros (opcional)', description: 'Si deseas exportar solo un subconjunto, utiliza los filtros disponibles primero.' },
          { title: 'Hacer clic en "Exportar"', description: 'Presiona el botón "Exportar" para descargar un archivo Excel con todos los clientes y sus pólizas.' },
        ],
      },
    ],
  },
  {
    id: 'collections',
    title: 'Cobranzas',
    description: 'Seguimiento y gestión de cobros de primas.',
    icon: DollarSign,
    tutorials: [
      {
        id: 'collections-overview',
        title: 'Gestionar cobranzas',
        description: 'Cómo revisar, filtrar y actualizar el estado de las cobranzas.',
        steps: [
          { title: 'Acceder a Cobranzas', description: 'Navega a "Cobranzas" desde el menú lateral. Verás las estadísticas generales y la tabla de cobros.' },
          { title: 'Revisar estadísticas', description: 'Las tarjetas superiores muestran: total pendiente, cobrado del mes, vencidas y próximas a vencer.' },
          { title: 'Filtrar cobranzas', description: 'Usa los filtros por estado (pendiente, prometida, pagada, vencida), fecha de vencimiento, aseguradora y frecuencia de pago.' },
          { title: 'Cambiar estado de una cobranza', description: 'Haz clic en el botón de estado o en los íconos de acción para cambiar una cobranza a "Prometida", "Pagada" o contactar al asesor.' },
          { title: 'Registrar pago', description: 'Al marcar como pagada, se registrará automáticamente la fecha de pago y el usuario que realizó la acción.' },
        ],
      },
      {
        id: 'collections-sync',
        title: 'Sincronizar cobranzas',
        description: 'Cómo generar automáticamente las cobranzas desde las pólizas.',
        steps: [
          { title: 'Presionar "Sincronizar"', description: 'En la página de Cobranzas, haz clic en el botón "Sincronizar" para generar los registros de cobro basados en las pólizas activas.' },
          { title: 'Esperar el proceso', description: 'El sistema calculará las fechas de vencimiento según la frecuencia de pago de cada póliza y creará los registros faltantes.' },
          { title: 'Verificar resultados', description: 'Revisa que las nuevas cobranzas aparezcan en la tabla con el estado "Pendiente".' },
        ],
      },
      {
        id: 'collections-notice',
        title: 'Generar aviso de cobro (PDF)',
        description: 'Cómo crear y enviar un aviso de prima.',
        steps: [
          { title: 'Seleccionar la cobranza', description: 'En la tabla de cobranzas, haz clic en el ícono de PDF o en las acciones de la cobranza que deseas notificar.' },
          { title: 'Generar el PDF', description: 'El sistema creará un PDF con los datos del cliente, póliza, monto y fecha de vencimiento usando la información de tu empresa configurada en Ajustes.' },
          { title: 'Descargar o enviar', description: 'Descarga el PDF para enviarlo manualmente o utiliza la opción de envío por email si está habilitada.' },
        ],
      },
    ],
  },
  {
    id: 'renewals',
    title: 'Renovaciones',
    description: 'Gestión del proceso de renovación de pólizas.',
    icon: RefreshCw,
    tutorials: [
      {
        id: 'renewals-configure',
        title: 'Configurar una renovación',
        description: 'Cómo preparar la renovación de una póliza próxima a vencer.',
        steps: [
          { title: 'Ir a Renovaciones', description: 'Navega a "Renovaciones" desde el menú lateral.' },
          { title: 'Identificar pólizas por renovar', description: 'La tabla muestra las pólizas próximas a vencer con su fecha de renovación y estado actual.' },
          { title: 'Configurar renovación', description: 'Haz clic en "Configurar" para establecer el nuevo monto de prima, calcular el porcentaje de variación y programar la fecha de envío.' },
          { title: 'Generar PDF comparativo', description: 'El sistema genera un PDF que compara la prima actual con la nueva, mostrando la diferencia en monto y porcentaje.' },
          { title: 'Enviar al cliente', description: 'Puedes enviar el PDF por email directamente desde el sistema o descargarlo para enviarlo manualmente.' },
          { title: 'Actualizar estado', description: 'Marca la renovación como "Enviada", "Aceptada", "Rechazada" o "Renovada" según avance el proceso.' },
        ],
      },
    ],
  },
  {
    id: 'templates',
    title: 'Plantillas',
    description: 'Gestión de plantillas de documentos y comunicaciones.',
    icon: FileText,
    tutorials: [
      {
        id: 'templates-manage',
        title: 'Gestionar plantillas',
        description: 'Cómo crear y editar plantillas de documentos.',
        steps: [
          { title: 'Acceder a Plantillas', description: 'Navega a "Plantillas" desde el menú lateral.' },
          { title: 'Crear nueva plantilla', description: 'Haz clic en "Nueva Plantilla" y selecciona el tipo de documento (aviso de cobro, renovación, etc.).' },
          { title: 'Editar contenido', description: 'Usa las variables disponibles como {nombre_cliente}, {numero_poliza}, {monto}, etc. para personalizar el contenido.' },
          { title: 'Guardar y activar', description: 'Guarda la plantilla y márcala como activa para que sea utilizada en los procesos automáticos.' },
        ],
      },
    ],
  },
  {
    id: 'birthdays',
    title: 'Cumpleaños',
    description: 'Seguimiento y envío de felicitaciones a clientes.',
    icon: Cake,
    tutorials: [
      {
        id: 'birthdays-send',
        title: 'Enviar felicitaciones de cumpleaños',
        description: 'Cómo gestionar y enviar tarjetas de cumpleaños.',
        steps: [
          { title: 'Ir a Cumpleaños', description: 'Navega a "Cumpleaños" desde el menú lateral para ver los clientes que cumplen años.' },
          { title: 'Revisar cumpleaños del mes', description: 'La vista principal muestra los clientes con cumpleaños en el mes actual, indicando si ya fueron felicitados o no.' },
          { title: 'Filtrar por periodo', description: 'Usa los filtros para ver cumpleaños de hoy, esta semana, este mes o un rango personalizado.' },
          { title: 'Generar tarjeta', description: 'Haz clic en "Generar Tarjeta" para crear una imagen de felicitación personalizada con el nombre del cliente.' },
          { title: 'Enviar felicitación', description: 'Selecciona el canal (Email o WhatsApp) y envía la tarjeta. El sistema registrará el envío automáticamente.' },
          { title: 'Verificar estado', description: 'La columna de estado mostrará si la felicitación fue "Enviada" o si hubo algún error.' },
        ],
      },
    ],
  },
  {
    id: 'finances',
    title: 'Finanzas',
    description: 'Control financiero: presupuestos, ingresos, egresos, facturas y más.',
    icon: PiggyBank,
    tutorials: [
      {
        id: 'finance-dashboard',
        title: 'Usar el Dashboard Financiero',
        description: 'Cómo interpretar el resumen financiero.',
        steps: [
          { title: 'Acceder a Finanzas', description: 'Navega a "Finanzas" desde el menú lateral. Solo disponible para roles con acceso financiero.' },
          { title: 'Revisar el resumen', description: 'El dashboard muestra: ingresos totales, egresos totales, balance neto y deudas/préstamos pendientes.' },
          { title: 'Seleccionar el mes', description: 'Usa el selector de mes para ver las finanzas de un periodo específico.' },
        ],
      },
      {
        id: 'finance-budget',
        title: 'Crear y gestionar presupuestos',
        description: 'Cómo crear un presupuesto con sus líneas de gastos planificados.',
        steps: [
          { title: 'Ir a la pestaña Presupuestos', description: 'Dentro de Finanzas, selecciona la pestaña "Presupuestos".' },
          { title: 'Crear nuevo presupuesto', description: 'Haz clic en "Nuevo Presupuesto" y completa: nombre, período (mensual, trimestral, etc.), fechas de inicio y fin, y moneda.' },
          { title: 'Agregar líneas', description: 'Dentro del presupuesto, agrega líneas de gasto con: descripción, monto planificado, fecha planificada, categoría y si puede pagarse en Bs.' },
          { title: 'Seguimiento de ejecución', description: 'A medida que se registran pagos, la barra de progreso mostrará el porcentaje de ejecución. Si supera el 100%, se marcará en rojo.' },
          { title: 'Acciones sobre líneas', description: 'Puedes marcar líneas como pagadas, postergarlas con motivo y fecha, o eliminarlas.' },
        ],
      },
      {
        id: 'finance-income',
        title: 'Registrar ingresos',
        description: 'Cómo registrar entradas de dinero.',
        steps: [
          { title: 'Ir a la pestaña Ingresos', description: 'Dentro de Finanzas, selecciona la pestaña "Ingresos".' },
          { title: 'Nuevo ingreso', description: 'Haz clic en "Nuevo Ingreso" y completa: descripción, fecha, monto en USD y/o Bs, tasa de cambio y banco receptor.' },
          { title: 'Guardar', description: 'Presiona "Guardar" para registrar el ingreso. Aparecerá en la tabla y se sumará al resumen del mes.' },
        ],
      },
      {
        id: 'finance-expenses',
        title: 'Registrar egresos',
        description: 'Cómo registrar salidas de dinero.',
        steps: [
          { title: 'Ir a la pestaña Egresos', description: 'Dentro de Finanzas, selecciona la pestaña "Egresos".' },
          { title: 'Nuevo egreso', description: 'Haz clic en "Nuevo Egreso" y completa: descripción, beneficiario, fecha, monto en USD y/o Bs, tasa de cambio.' },
          { title: 'Estado de pago', description: 'Indica si el egreso ya fue pagado o si está pendiente. Puedes actualizarlo después.' },
        ],
      },
      {
        id: 'finance-invoices',
        title: 'Gestionar facturas',
        description: 'Cómo registrar y dar seguimiento a facturas.',
        steps: [
          { title: 'Ir a la pestaña Facturas', description: 'Dentro de Finanzas, selecciona la pestaña "Facturas".' },
          { title: 'Nueva factura', description: 'Haz clic en "Nueva Factura" y completa: número de factura, número de control, descripción, fecha, montos en USD y Bs.' },
          { title: 'Marcar como cobrada', description: 'Cuando recibas el pago, marca la factura como cobrada. Se registrará la fecha de cobro automáticamente.' },
        ],
      },
      {
        id: 'finance-exchange',
        title: 'Registrar tasas de cambio',
        description: 'Cómo mantener actualizadas las tasas de cambio.',
        steps: [
          { title: 'Ir a la pestaña Tasas de Cambio', description: 'Dentro de Finanzas, selecciona la pestaña "Tasas de Cambio".' },
          { title: 'Nueva tasa', description: 'Haz clic en "Nueva Tasa" y selecciona la fuente (BCV, Paralelo, etc.), ingresa el valor y la fecha.' },
          { title: 'Uso automático', description: 'Las tasas registradas se utilizarán como referencia en los formularios de ingresos y egresos para las conversiones automáticas.' },
        ],
      },
      {
        id: 'finance-debts-loans',
        title: 'Gestionar deudas y préstamos',
        description: 'Cómo registrar deudas por pagar y préstamos por cobrar.',
        steps: [
          { title: 'Ir a la pestaña Deudas o Préstamos', description: 'Dentro de Finanzas, selecciona la pestaña correspondiente.' },
          { title: 'Registrar nueva deuda/préstamo', description: 'Haz clic en "Nuevo" y completa: beneficiario, descripción, fecha, montos y notas.' },
          { title: 'Actualizar estado', description: 'Cuando se pague la deuda o se cobre el préstamo, marca el registro como pagado/cobrado.' },
        ],
      },
      {
        id: 'finance-payroll',
        title: 'Gestionar nómina',
        description: 'Cómo administrar empleados y sus salarios.',
        steps: [
          { title: 'Ir a la pestaña Nómina', description: 'Dentro de Finanzas, selecciona la pestaña "Nómina".' },
          { title: 'Registrar empleado', description: 'Haz clic en "Nuevo Empleado" e ingresa: nombre completo, salario base en USD, estado activo/inactivo y notas.' },
          { title: 'Gestionar empleados', description: 'Puedes editar salarios, desactivar empleados que ya no están y ver el total de nómina mensual.' },
        ],
      },
    ],
  },
  {
    id: 'sales',
    title: 'Ventas (CRM)',
    description: 'Pipeline de ventas y seguimiento de oportunidades comerciales.',
    icon: Target,
    tutorials: [
      {
        id: 'sales-create',
        title: 'Crear una oportunidad de venta',
        description: 'Cómo registrar un nuevo prospecto o negocio.',
        steps: [
          { title: 'Ir a Ventas', description: 'Navega a "Ventas" desde el menú lateral.' },
          { title: 'Nueva oportunidad', description: 'Haz clic en "Nueva Oportunidad" y completa: nombre del prospecto, empresa, teléfono, email, fecha esperada de cierre y notas.' },
          { title: 'Asignar asesor', description: 'Selecciona el asesor responsable del seguimiento de esta oportunidad.' },
          { title: 'Guardar', description: 'La oportunidad se creará en la etapa "Identificación" del pipeline.' },
        ],
      },
      {
        id: 'sales-pipeline',
        title: 'Mover oportunidades en el pipeline',
        description: 'Cómo avanzar negocios a través de las etapas.',
        steps: [
          { title: 'Vista Kanban', description: 'En la vista Kanban, verás las oportunidades organizadas en columnas por etapa: Identificación → Reunión → Propuesta → Envío → Seguimientos → Aceptada → Ganado.' },
          { title: 'Cambiar etapa', description: 'Haz clic en la oportunidad para abrir el detalle, luego selecciona la nueva etapa desde el selector de estado.' },
          { title: 'Agregar notas', description: 'En el detalle, agrega notas de seguimiento para documentar cada interacción con el prospecto.' },
          { title: 'Registrar inversión', description: 'Si hubo gastos asociados (almuerzos, viajes), regístralos en la sección de inversiones para calcular el ROI.' },
        ],
      },
      {
        id: 'sales-products',
        title: 'Asociar productos a una oportunidad',
        description: 'Cómo vincular aseguradoras y productos para calcular comisiones.',
        steps: [
          { title: 'Abrir detalle de oportunidad', description: 'Haz clic en una oportunidad para ver su detalle completo.' },
          { title: 'Ir a la pestaña Productos', description: 'Selecciona la pestaña "Pólizas" dentro del diálogo de detalle.' },
          { title: 'Agregar producto', description: 'Haz clic en "Agregar Póliza", selecciona aseguradora, producto, prima anual, frecuencia de pago y tasa de comisión.' },
          { title: 'Seleccionar producto ganador', description: 'Marca con el checkbox cuál producto fue el seleccionado/ganador para el cálculo final de comisiones.' },
          { title: 'Revisar comisiones', description: 'El sistema calculará automáticamente la comisión anual y por cuota según la frecuencia de pago.' },
        ],
      },
      {
        id: 'sales-filter',
        title: 'Filtrar oportunidades por asesor',
        description: 'Cómo ver las oportunidades asignadas a cada vendedor.',
        steps: [
          { title: 'Usar el filtro de asesor', description: 'En la parte superior de la página de Ventas, usa el selector "Filtrar por asesor" para ver solo las oportunidades de un vendedor específico.' },
          { title: 'Ver todas', description: 'Selecciona "Todos los asesores" para volver a ver todas las oportunidades.' },
          { title: 'Métricas filtradas', description: 'Las estadísticas superiores (total oportunidades, prima potencial, comisión esperada) se actualizan según el filtro aplicado.' },
        ],
      },
    ],
  },
  {
    id: 'partnerships',
    title: 'Alianzas',
    description: 'Red de aliados, servicios con descuentos y códigos promocionales.',
    icon: Handshake,
    tutorials: [
      {
        id: 'partner-register',
        title: 'Registrar un aliado comercial',
        description: 'Cómo agregar una empresa aliada al sistema.',
        steps: [
          { title: 'Ir a Alianzas', description: 'Navega a "Alianzas" desde el menú lateral.' },
          { title: 'Ir a pestaña Aliados', description: 'Selecciona la pestaña "Aliados" para ver y gestionar las empresas registradas.' },
          { title: 'Nuevo aliado', description: 'Haz clic en "Nuevo Aliado" y completa: nombre de empresa, RIF, categoría, persona de contacto, teléfono, email, dirección y notas.' },
          { title: 'Guardar', description: 'El aliado quedará registrado como activo y podrás agregarle servicios.' },
        ],
      },
      {
        id: 'partner-service',
        title: 'Crear un servicio con descuento',
        description: 'Cómo registrar los servicios que ofrecen los aliados.',
        steps: [
          { title: 'Ir a pestaña Servicios', description: 'Dentro de Alianzas, selecciona la pestaña "Servicios".' },
          { title: 'Nuevo servicio', description: 'Haz clic en "Nuevo Servicio" y selecciona el aliado, nombre del servicio, descripción, tipo de descuento (porcentaje o monto fijo) y valor del descuento.' },
          { title: 'Activar/desactivar', description: 'Puedes activar o desactivar servicios según la disponibilidad del aliado.' },
        ],
      },
      {
        id: 'partner-codes',
        title: 'Generar y gestionar códigos de descuento',
        description: 'Cómo crear códigos únicos para clientes.',
        steps: [
          { title: 'Ir a pestaña Códigos', description: 'Dentro de Alianzas, selecciona la pestaña "Códigos de Descuento".' },
          { title: 'Generar código', description: 'Haz clic en "Generar Código", selecciona el servicio, el cliente destinatario (opcional), número máximo de usos y fecha de vencimiento.' },
          { title: 'Copiar código', description: 'El código generado (formato KVR-XXXXXXXX) se puede copiar al portapapeles para compartirlo con el cliente.' },
          { title: 'Marcar como enviado', description: 'Cuando compartas el código con el cliente, actualiza su estado a "Enviado" para llevar el seguimiento.' },
          { title: 'Marcar como utilizado', description: 'Cuando el aliado confirme que el cliente usó el código, actualízalo a "Utilizado". El contador de usos se incrementará automáticamente.' },
          { title: 'Verificar estados', description: 'Los códigos tienen 4 estados: Generado → Enviado → Utilizado → Expirado. Puedes filtrar por estado para gestionar los pendientes.' },
        ],
      },
    ],
  },
  {
    id: 'advisors',
    title: 'Asesores',
    description: 'Gestión del equipo de asesores y vendedores.',
    icon: UserCog,
    tutorials: [
      {
        id: 'advisor-manage',
        title: 'Gestionar asesores',
        description: 'Cómo agregar, editar y administrar asesores.',
        steps: [
          { title: 'Ir a Asesores', description: 'Navega a "Asesores" desde el menú lateral. Solo disponible para el rol "Acceso Total".' },
          { title: 'Nuevo asesor', description: 'Haz clic en "Nuevo Asesor" y completa: nombre completo, email, teléfono y tasa de comisión.' },
          { title: 'Activar/desactivar', description: 'Puedes marcar asesores como activos o inactivos. Los inactivos no aparecerán en los selectores de asignación.' },
          { title: 'Editar información', description: 'Haz clic en el ícono de edición para modificar los datos de un asesor existente.' },
        ],
      },
    ],
  },
  {
    id: 'audit',
    title: 'Auditoría',
    description: 'Registro de todas las acciones realizadas en el sistema.',
    icon: ScrollText,
    tutorials: [
      {
        id: 'audit-review',
        title: 'Revisar registros de auditoría',
        description: 'Cómo consultar el historial de acciones.',
        steps: [
          { title: 'Ir a Auditoría', description: 'Navega a "Auditoría" desde el menú lateral. Disponible para roles con acceso financiero o total.' },
          { title: 'Filtrar por módulo', description: 'Usa el filtro de módulo para ver acciones específicas: Clientes, Pólizas, Cobranzas, Finanzas, etc.' },
          { title: 'Filtrar por usuario', description: 'Filtra por el email del usuario que realizó la acción.' },
          { title: 'Ver detalles', description: 'Haz clic en un registro para ver los detalles completos de la acción, incluyendo los datos antes y después del cambio.' },
        ],
      },
    ],
  },
  {
    id: 'settings',
    title: 'Configuración',
    description: 'Ajustes generales del sistema y datos de la empresa.',
    icon: Settings,
    tutorials: [
      {
        id: 'settings-broker',
        title: 'Configurar datos de la empresa',
        description: 'Cómo establecer la información de tu correduría.',
        steps: [
          { title: 'Ir a Configuración', description: 'Navega a "Configuración" desde el menú lateral (solo rol "Acceso Total").' },
          { title: 'Completar datos', description: 'Ingresa: nombre de la empresa, RIF/identificación, dirección, teléfono, email y logo.' },
          { title: 'Subir logo', description: 'Sube el logo de tu empresa. Se utilizará en los PDFs de avisos de cobro y renovaciones.' },
          { title: 'Guardar', description: 'Presiona "Guardar" para aplicar los cambios. Estos datos se reflejarán en todos los documentos generados.' },
        ],
      },
      {
        id: 'settings-roles',
        title: 'Gestionar roles de usuario',
        description: 'Cómo asignar permisos a los usuarios del sistema.',
        steps: [
          { title: 'Ir a la sección de Roles', description: 'Dentro de Configuración, busca la sección de gestión de usuarios y roles.' },
          { title: 'Entender los roles', description: 'El sistema tiene 4 roles: Acceso Total (administrador), Revisión y Edición 1 (finanzas + edición), Revisión y Edición 2 (edición básica) y Solo Lectura (consulta).' },
          { title: 'Asignar rol', description: 'Selecciona el usuario y asígnale el rol correspondiente según sus responsabilidades.' },
          { title: 'Verificar acceso', description: 'Cada rol determina qué secciones del menú son visibles y qué acciones puede realizar el usuario.' },
        ],
      },
    ],
  },
];
