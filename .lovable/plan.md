
# Plan: Rediseño Elegante del Aviso de Prima + Logo

## Resumen

Rediseñar el PDF de "Aviso de Prima" con un estilo más minimalista y profesional inspirado en el formato VUMI, además de asegurar que el logo se cargue correctamente desde la configuración del corretaje.

---

## Diseño Propuesto

Basándome en el formato elegante del PDF de VUMI, el nuevo diseño será más limpio y sofisticado:

```text
┌─────────────────────────────────────────────────────────────────┐
│                                                                 │
│  [LOGO GIP]                              AVISO DE PRIMA         │
│  ─────────────────────────────────────────────────────────────  │
│                                                                 │
│                                    29 de enero de 2026          │
│                                                                 │
│  Estimado (a) NOMBRE DEL CLIENTE                                │
│                                                                 │
│  Le informamos que se acerca la fecha de vencimiento de la      │
│  prima correspondiente a su póliza de seguro. A continuación,   │
│  encontrará los detalles de su próximo pago.                    │
│                                                                 │
│  ┌────────────────────────────────────────────────────────────┐ │
│  │  Datos de la póliza                                         │ │
│  ├────────────────────────────────────────────────────────────┤ │
│  │  Número de póliza:         8000035927                       │ │
│  │  Aseguradora:              VUMI                             │ │
│  │  Plan / Producto:          ACCESS VIP VZLA                  │ │
│  │  Frecuencia de pago:       TRIMESTRAL                       │ │
│  │  Monto de la prima:        $ 872.00                         │ │
│  │  Fecha del próximo pago:   1 de enero de 2026               │ │
│  └────────────────────────────────────────────────────────────┘ │
│                                                                 │
│  Le sugerimos realizar el pago de su prima antes de la fecha    │
│  de vencimiento para mantener la vigencia de su póliza.         │
│                                                                 │
│  Saludos cordiales,                                             │
│  GIP - Global Integral Protection                               │
│  J-12345678-9                                                   │
│                                                                 │
│  ─────────────────────────────────────────────────────────────  │
│  info@gip.com · +58 212 123 4567                                │
│  Av. Principal, Torre GIP, Caracas                              │
└─────────────────────────────────────────────────────────────────┘
```

---

## Mejoras de Diseño

| Aspecto | Antes | Después |
|---------|-------|---------|
| **Tipografía** | Segoe UI estándar | Sistema moderno con pesos variados para jerarquía |
| **Espaciado** | Compacto | Más aire, márgenes generosos |
| **Línea divisoria** | Gruesa (3px) | Fina y elegante (1px) |
| **Tabla de datos** | Con bordes pesados | Estilo limpio sin bordes laterales (tipo VUMI) |
| **Logo** | Max 80px altura | 60px altura, mejor proporcionado |
| **Colores** | Uso intensivo del azul | Uso más sutil y elegante |
| **Footer** | Separado visualmente | Integrado sutilmente |

---

## Sobre el Logo

El sistema ya está preparado para mostrar el logo del corretaje:

1. **Para subir el logo**: Ve a **Configuración** en el menú lateral
2. Busca la sección **"Datos del Corretaje"**  
3. Haz clic en **"Subir logo"** y selecciona el archivo del logo GIP
4. Guarda los cambios

Una vez subido, el logo aparecerá automáticamente en todos los Avisos de Prima generados.

---

## Implementación

### Archivo a modificar

| Archivo | Cambio |
|---------|--------|
| `src/components/collections/generatePremiumNoticePdf.ts` | Rediseño completo del template HTML/CSS |

### Cambios específicos en el template

1. **Header más elegante**
   - Logo con tamaño optimizado (60px altura máx)
   - Título "AVISO DE PRIMA" con tipografía más refinada
   - Línea divisoria fina color accent

2. **Tabla de datos estilo VUMI**
   - Sin bordes laterales
   - Encabezado con fondo azul secundario
   - Filas alternadas con fondo sutil
   - Tipografía con mejor jerarquía

3. **Sección de monto destacado**
   - El monto de la prima tendrá mayor prominencia visual
   - Badge o caja resaltada para el monto

4. **Footer minimalista**
   - Una sola línea divisoria fina
   - Información de contacto en formato compacto
   - Iconos sutiles para email/teléfono (opcionales)

5. **Mejoras de impresión**
   - Optimización para impresión en blanco y negro
   - Preservación de colores con `print-color-adjust`

---

## Resultado Esperado

Un documento PDF profesional y elegante que:

- Refleja la identidad corporativa de GIP
- Sigue el estándar de calidad de aseguradoras como VUMI
- Es fácil de leer e imprimir
- Incluye el logo del corretaje de forma prominente
- Transmite profesionalismo y confianza al cliente
