
# Plan: Aviso de Prima con Formato VUMI y Logo Configurable

## Resumen

Rediseñar el documento "Aviso de Prima" siguiendo el formato profesional de VUMI, permitiendo cargar el logo del corretaje y configurar sus datos (nombre, identidad, teléfono, correo, dirección) desde la sección de Configuración.

---

## Diseño del PDF

El nuevo formato seguirá la estructura del PDF de VUMI:

```text
┌─────────────────────────────────────────────────────────────┐
│  [LOGO]                              AVISO DE PRIMA         │
│  ───────────────────────────────────────────────────────────│
│                                    22 de diciembre de 2025  │
│                                                             │
│  Estimado (a) NOMBRE DEL CLIENTE                            │
│                                                             │
│  Texto introductorio...                                     │
│                                                             │
│  ┌──────────────────────────────────────────────────────┐  │
│  │  Datos de la póliza                                   │  │
│  ├──────────────────────────────────────────────────────┤  │
│  │  Número de póliza:      8000035927                    │  │
│  │  Aseguradora:           VUMI                          │  │
│  │  Plan y producto:       ACCESS VIP VZLA               │  │
│  │  Frecuencia de pago:    TRIMESTRAL                    │  │
│  │  Monto de la prima:     $ 872.00                      │  │
│  │  Fecha del próximo pago: 1 de enero de 2026           │  │
│  └──────────────────────────────────────────────────────┘  │
│                                                             │
│  Saludos cordiales,                                         │
│  [Nombre del Corretaje]                                     │
│                                                             │
│  ───────────────────────────────────────────────────────────│
│  [Email] · [Teléfono] · [Dirección]                         │
└─────────────────────────────────────────────────────────────┘
```

**Colores aplicados:**
- Título "AVISO DE PRIMA": #182746 (azul oscuro primary)
- Líneas divisorias: #27abe3 (azul claro accent)
- Encabezados de tabla: #40588c (azul medio secondary)
- Texto principal: #1a1a1a (negro)

---

## Implementación

### Paso 1: Crear tabla de configuración del corretaje

Se creará la tabla `broker_settings` en la base de datos con los siguientes campos:

| Campo | Tipo | Descripción |
|-------|------|-------------|
| id | uuid | Identificador único |
| name | text | Nombre del corretaje |
| identification | text | RIF/Cédula Jurídica |
| phone | text | Teléfono de contacto |
| email | text | Correo electrónico |
| address | text | Dirección física |
| logo_url | text | URL del logo en storage |
| created_at | timestamp | Fecha de creación |
| updated_at | timestamp | Última actualización |

**Nota**: Solo existirá un registro en esta tabla (configuración única del sistema).

### Paso 2: Crear bucket de storage para el logo

Se creará el bucket `broker-assets` para almacenar el logo del corretaje, con acceso público para que pueda ser incluido en el PDF.

### Paso 3: Añadir sección de configuración del corretaje

En la página de **Configuración** (`Settings.tsx`) se agregará una nueva tarjeta antes de la gestión de usuarios con:

- Campo para subir/cambiar el logo (vista previa del logo actual)
- Campos de texto para: Nombre, Identidad, Teléfono, Correo, Dirección
- Botón "Guardar cambios"

### Paso 4: Rediseñar el generador de PDF

El archivo `generatePremiumNoticePdf.ts` se actualizará para:

1. Recibir los datos del corretaje como parámetro
2. Aplicar el nuevo diseño tipo VUMI con:
   - Header con logo a la izquierda y "AVISO DE PRIMA" a la derecha
   - Línea divisoria con color accent (#27abe3)
   - Fecha alineada a la derecha
   - Saludo con nombre del cliente en negritas
   - Tabla de datos con estilo limpio
   - Firma con nombre del corretaje
   - Footer con datos de contacto
3. Usar los colores corporativos de GIP

### Paso 5: Integrar datos del corretaje al generar PDF

Los componentes `CollectionTable.tsx` y `CollectionDetailDialog.tsx` cargarán los datos del corretaje desde Supabase antes de generar el PDF.

---

## Archivos a Modificar

| Archivo | Cambio |
|---------|--------|
| **Nueva migración SQL** | Crear tabla `broker_settings` y bucket de storage |
| `src/pages/Settings.tsx` | Añadir sección de configuración del corretaje con carga de logo |
| `src/components/collections/generatePremiumNoticePdf.ts` | Rediseñar con formato VUMI y colores GIP |
| `src/components/collections/CollectionTable.tsx` | Cargar datos del corretaje antes de generar PDF |
| `src/components/collections/CollectionDetailDialog.tsx` | Cargar datos del corretaje antes de generar PDF |

---

## Riesgos y Mitigaciones

| Riesgo | Mitigación |
|--------|------------|
| Logo no carga en el PDF | Se usará `data:` URI para convertir la imagen a base64 antes de generar el PDF |
| Datos del corretaje no configurados | Se mostrarán valores por defecto mientras no se configuren |
| Bucket de storage no público | Se configurará con políticas RLS que permitan lectura pública |

---

## Detalles Técnicos

### Conversión de logo a base64 para PDF

Para que el logo aparezca correctamente en el PDF al imprimir, la imagen se convertirá a formato base64:

```typescript
async function getLogoBase64(url: string): Promise<string> {
  const response = await fetch(url);
  const blob = await response.blob();
  return new Promise((resolve) => {
    const reader = new FileReader();
    reader.onloadend = () => resolve(reader.result as string);
    reader.readAsDataURL(blob);
  });
}
```

### Hook personalizado para datos del corretaje

Se creará un hook `useBrokerSettings` que:
- Cargue la configuración del corretaje desde la base de datos
- Proporcione función para actualizar los datos
- Maneje el estado de carga

### Estructura CSS del PDF

El PDF usará CSS inline con los colores definidos:

```css
:root {
  --gip-primary: #182746;
  --gip-accent: #27abe3;
  --gip-secondary: #40588c;
}
```

---

## Resultado Esperado

Un documento PDF profesional que:
- Muestra el logo del corretaje en la esquina superior izquierda
- Presenta los datos de la cobranza en un formato limpio y corporativo
- Usa los colores de la marca GIP consistentemente
- Se configura fácilmente desde la sección de Ajustes
