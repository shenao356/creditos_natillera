# 💰 Sistema de Control de Créditos - Natillera

Aplicación web moderna y responsiva para la administración, control y liquidación en tiempo real de los créditos, intereses diarios y abonos de los socios de la **Natillera**.

🌐 **Acceso a la Aplicación Web en Vivo:**  
👉 **[https://shenao356.github.io/creditos_natillera/](https://shenao356.github.io/creditos_natillera/)**

---

## 📋 Características Principales

1. **📊 Dashboard Consolidado en Tiempo Real**
   - Panel de control idéntico a la pestaña `Dashboard` de Excel.
   - Indicadores clave (KPIs): Total Prestado, Capital en la Calle, Intereses Liquidados, Intereses por Cobrar, Total por Cobrar Hoy y Total Recaudado en Abonos.
   - Gráficas interactivas de cartera por socio y distribución de saldos.
   - Tabla general consolidada con filtros por estado (*Paz y Salvo*, *Con Deuda*, *Al Día*) y buscador en vivo.

2. **👥 Ficha Individual por Socio**
   - **Tabla de Créditos y Liquidación:** Muestra fechas, días transcurridos, capital, tasa, intereses calculados al día de hoy, intereses congelados a fecha de pago, abonos aplicados y saldo definitivo.
   - **Registro de Abonos:** Historial detallado de pagos con fecha, abono a interés, abono a capital, total y medio de pago (Nequi, Bancolombia, efectivo, etc.).
   - Congelación de intereses a la fecha exacta de liquidación con 1 solo clic.

3. **🧮 Simulador de Créditos Integrado**
   - Calcula antes de desembolsar: monto, días de plazo, tasa y fecha estimada.
   - Muestra el interés diario generado y el valor total a liquidar.
   - Botón directo para convertir una simulación en un crédito real para un socio.

4. **📲 Generador de Comprobantes para WhatsApp**
   - Genera recibos de abono formateados con emojis y saldos restantes.
   - Botones rápidos para copiar al portapapeles o abrir directamente en **WhatsApp**.
   - Generación de **Certificados de Paz y Salvo** para socios que hayan saldado todas sus obligaciones.

5. **📥 Respaldo y Compatibilidad 100% con Excel**
   - **Exportación a Excel (`.xlsx`):** Genera un libro idéntico a la plantilla original, con pestaña Dashboard y una pestaña independiente para cada socio.
   - **Exportación/Importación JSON:** Copias de seguridad completas para migrar o respaldar información entre computadores o celulares.
   - Almacenamiento local automático en el navegador (`localStorage`).

---

## 📐 Reglas y Fórmulas Financieras

### 1. Intereses Diarios en Vivo (Créditos Abiertos)
Para créditos activos sin fecha de pago registrada:
$$\text{Intereses a Hoy} = \text{Capital} \times \left(\frac{\text{Tasa Mensual}}{30}\right) \times (\text{Fecha Hoy} - \text{Fecha Crédito})$$

*Por ejemplo:* Un crédito de $\$500.000$ al $0.5\%$ mensual ($0.005$) por $146$ días genera:
$$\$500.000 \times \left(\frac{0.005}{30}\right) \times 146 = \$12.167\text{ COP}$$

### 2. Congelación de Intereses a Fecha de Pago
Al registrar la fecha de pago o liquidación definitiva:
$$\text{Intereses a Fecha Pago} = \text{Capital} \times \left(\frac{\text{Tasa Mensual}}{30}\right) \times (\text{Fecha Pago} - \text{Fecha Crédito})$$
Los intereses se **congelan permanentemente** en esa fecha y dejan de acumular días.

### 3. Saldos y Liquidación
- **Saldo Interés:** $\max(0, \text{Intereses Aplicables} - \text{Abonos a Interés})$
- **Saldo Capital:** $\max(0, \text{Capital} - \text{Abonos a Capital})$
- **Total a Pagar:** $\text{Saldo Interés} + \text{Saldo Capital}$

---

## 🚀 Cómo Activar GitHub Pages en el Repositorio

Si aún no está activo en GitHub, sigue estos 3 pasos:

1. Ingresa a tu repositorio en GitHub: [https://github.com/shenao356/creditos_natillera](https://github.com/shenao356/creditos_natillera)
2. Ve a la pestaña **Settings** (Configuración) ➔ en el menú lateral izquierdo haz clic en **Pages**.
3. En la sección **Build and deployment**:
   - **Source:** Selecciona `Deploy from a branch`.
   - **Branch:** Selecciona `main` y en la carpeta elige `/ (root)`.
   - Haz clic en **Save** (Guardar).

¡En un minuto tu página web estará disponible públicamente en:  
👉 **`https://shenao356.github.io/creditos_natillera/`**!

---

## 🛠️ Tecnologías Utilizadas

- **HTML5 Semántico y CSS3**
- **Tailwind CSS CDN** (Diseño moderno, adaptable a celulares y computadores)
- **Vanilla JavaScript (ES6+)** (Sin compilación ni dependencias complejas, compatible con GitHub Pages)
- **SheetJS (xlsx.full.min.js)** (Lectura y generación de archivos Excel)
- **Chart.js** (Gráficas interactivas financieras)
- **FontAwesome Icons**
