

# Plan de Implementación: Plataforma GIP Asesores Integrales

## Visión General
Sistema interno de gestión para centralizar clientes, pólizas, cobranzas y renovaciones, con control de acceso por roles y auditoría completa.

---

## Fase 1: Fundamentos y Autenticación

### 1.1 Configuración de Backend (Supabase)
- Conexión con Supabase para base de datos, autenticación y almacenamiento
- Configuración de políticas de seguridad (RLS)

### 1.2 Sistema de Autenticación
- Página de login con diseño corporativo (colores #182746, #27abe3, #40588c)
- Autenticación por correo electrónico + contraseña
- Verificación de dos factores por código de correo
- Protección de rutas según estado de autenticación

### 1.3 Gestión de Roles y Usuarios
- 4 roles: Acceso total, Revisión y edición 1, Revisión y edición 2, Revisión (solo lectura)
- Tabla de usuarios con asignación de rol único
- Usuario sin rol = sin acceso operativo
- Panel de administración de usuarios (solo Acceso total)

### 1.4 Sistema de Auditoría
- Registro automático de todas las acciones: usuario, fecha, acción, módulo, registro afectado
- Visualización de logs de auditoría para roles autorizados

---

## Fase 2: Dashboard y Navegación

### 2.1 Layout Principal
- Menú lateral desplegable con hover
- Header con información del usuario y rol
- Diseño responsive (desktop-first)

### 2.2 Dashboard General
- Bloque de Cobranzas: cantidad pendiente + monto total
- Bloque de Renovaciones: próximas a vencer + monto total
- Bloque de Tareas internas
- Acceso rápido a Base de datos de clientes
- Gráficos de métricas clave

---

## Fase 3: Base de Datos de Clientes (Núcleo)

### 3.1 Catálogos Maestros (Precargados)
- Aseguradoras: BMI, BUPA, Seguros Caracas, La Internacional, Mercantil Venezuela, Redbridge, VUMI
- Productos por aseguradora
- Ramos y tipos de póliza
- Catálogo de Asesores (editable desde Configuración)

### 3.2 Gestión de Clientes - Formulario Guiado
- Datos del tomador de póliza (nombre, contacto, documentos)
- Beneficiarios (múltiples por póliza)
- Información de póliza:
  - Número de póliza
  - Empresa aseguradora y producto
  - Ramo
  - Fecha de venta y vigencia (cálculo automático)
  - Deducible: contratado, consumido, disponible
  - Frecuencia de pago
  - Prima anual y fraccionada (cálculo automático)
  - Fecha de pago y renovación
  - Asesor(es) asignados

### 3.3 Carga Masiva de Clientes
- Botón "Descargar plantilla Excel"
- Plantilla con encabezados, validaciones y catálogos desplegables
- Subida de archivo con vista previa
- Procesamiento: carga de filas válidas + reporte de errores

### 3.4 Exportación de Clientes
- Opciones: todos, filtrados, seleccionados
- Formato Excel

### 3.5 Vista de Clientes
- Tabla dinámica con filtros avanzados
- Búsqueda por nombre, póliza, aseguradora, asesor
- Ordenamiento por múltiples columnas
- Vista de detalle completo de cliente/póliza

---

## Fase 4: Cobranzas

### 4.1 Motor de Automatización
- Detección automática según fecha de pago
- Frecuencia mensual: alertas a 15, 7, 3 días antes; día de pago; 7-60 días después
- Otras frecuencias: 45, 30, 15, 7, 3 días antes; día de pago; 7-60 días después
- Estados: Pendiente, Notificado, Pagado, Vencido

### 4.2 Editor de Plantillas
- Editor visual de plantillas de mensajes
- Variables obligatorias (nombre, monto, fecha, póliza) - no eliminables
- Plantillas separadas para WhatsApp y correo

### 4.3 Vista de Cobranzas
- Lista de cobranzas pendientes con filtros por estado, fecha, monto
- Acciones manuales: marcar pagado, generar PDF, ver historial
- Alertas visuales según urgencia

### 4.4 Generación de PDFs
- Estados de cuenta individuales
- Descarga individual o grupal (ZIP)

---

## Fase 5: Renovaciones

### 5.1 Motor de Renovaciones
- Identificación automática 30 días antes del vencimiento
- Alertas internas 7 días antes
- Campo obligatorio: monto nuevo de la póliza

### 5.2 Resumen Anual de Consumo
- Número de póliza y beneficiario
- Listado de usos: tipo, fecha, descripción, monto (Bs/USD)
- Totales por beneficiario y póliza

### 5.3 PDF Comparativo de Renovación
- Comparativa año actual vs próximo
- Desglose completo de coberturas y primas
- Cambios destacados

### 5.4 Vista de Renovaciones
- Lista de renovaciones próximas con filtros
- Estados: Pendiente, En proceso, Renovada, No renovada
- Acciones: procesar renovación, generar PDF comparativo

---

## Fase 6: Funcionalidades Adicionales (Post-MVP)

### 6.1 Cumpleaños
- Cálculo automático por fecha de nacimiento
- Plantillas de felicitación
- Programación de envíos

### 6.2 Finanzas y Administración
- Registro de ingresos/gastos
- Presupuestos y planificación
- Acceso restringido a roles autorizados

### 6.3 Comisiones
- Desglose por póliza
- Cálculo de porcentajes: aseguradora, asesor, over agente, over gerente
- Reportes exportables

### 6.4 Integraciones de Envío
- WhatsApp Web (vinculación por QR)
- Outlook/Gmail (envío desde correo designado)

### 6.5 Otras Secciones
- Cotizaciones y emisiones
- Cambios administrativos
- Tutoriales y procesos
- Ventas y objetivos
- Alianzas y cupones
- Tareas internas

---

## Diseño UI/UX

### Paleta de Colores
- Primario: #182746 (azul oscuro)
- Acento: #27abe3 (azul claro)
- Secundario: #40588c (azul medio)
- Fondo: #ffffff

### Principios de Diseño
- Estilo corporativo, limpio y minimalista
- Tablas claras con filtros y búsqueda
- Alertas visuales por urgencia (cobranzas vencidas, renovaciones próximas)
- Formularios guiados paso a paso
- Responsive completo (desktop-first)

---

## Arquitectura de Datos (Supabase)

### Tablas Principales
- `users` - Usuarios del sistema
- `user_roles` - Roles asignados
- `audit_logs` - Registros de auditoría
- `clients` - Clientes/tomadores de póliza
- `policies` - Pólizas
- `beneficiaries` - Beneficiarios
- `insurers` - Aseguradoras (catálogo)
- `products` - Productos por aseguradora
- `advisors` - Asesores
- `collections` - Cobranzas
- `renewals` - Renovaciones
- `templates` - Plantillas de mensajes

### Seguridad
- Row Level Security (RLS) por rol
- Políticas de acceso diferenciadas
- Auditoría automática en triggers

---

## Entregables del MVP

1. ✅ Autenticación segura con verificación por correo
2. ✅ Sistema de roles (4 niveles) con RLS
3. ✅ Auditoría completa de acciones
4. ✅ Dashboard general con métricas
5. ✅ Base de datos de clientes completa
6. ✅ Carga masiva desde Excel
7. ✅ Exportación de datos
8. ✅ Sistema de cobranzas automatizado
9. ✅ Sistema de renovaciones
10. ✅ Generación de PDFs
11. ✅ Editor de plantillas

