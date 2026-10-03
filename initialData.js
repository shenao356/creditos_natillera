/**
 * Datos iniciales extraídos directamente de:
 * Plantilla_Control_Creditos_Natillera.xlsx
 */
const INITIAL_DATA = {
  config: {
    adminName: "Santiago",
    defaultInterestRate: 0.005, // 0.5% mensual (0.005)
    defaultInterestRateDisplay: "0.5%",
    currency: "COP",
    lastUpdated: "2026-10-02"
  },
  socios: [
    {
      id: "jorge_gaviria",
      name: "Jorge Gaviria",
      creditos: [
        { id: 1, socio: "Jorge Gaviria", fechaCredito: "2026-01-20", fechaPago: "2026-06-15", capital: 500000, tasa: 0.005 },
        { id: 2, socio: "Jorge Gaviria", fechaCredito: "2026-02-05", fechaPago: "2026-06-15", capital: 200000, tasa: 0.005 },
        { id: 3, socio: "Jorge Gaviria", fechaCredito: "2026-02-06", fechaPago: "2026-06-15", capital: 300000, tasa: 0.005 },
        { id: 4, socio: "Jorge Gaviria", fechaCredito: "2026-02-16", fechaPago: "2026-06-15", capital: 500000, tasa: 0.005 },
        { id: 5, socio: "Jorge Gaviria", fechaCredito: "2026-03-06", fechaPago: "2026-06-15", capital: 200000, tasa: 0.005 },
        { id: 6, socio: "Jorge Gaviria", fechaCredito: "2026-03-31", fechaPago: "2026-06-15", capital: 1000000, tasa: 0.005 },
        { id: 7, socio: "Jorge Gaviria", fechaCredito: "2026-04-26", fechaPago: "2026-06-15", capital: 100000, tasa: 0.005 },
        { id: 8, socio: "Jorge Gaviria", fechaCredito: "2026-05-01", fechaPago: "2026-07-28", capital: 1200000, tasa: 0.005 },
        { id: 9, socio: "Jorge Gaviria", fechaCredito: "2026-07-09", fechaPago: "2026-09-11", capital: 1000000, tasa: 0.005 },
        { id: 10, socio: "Jorge Gaviria", fechaCredito: "2026-07-09", fechaPago: "2026-09-11", capital: 700000, tasa: 0.005 },
        { id: 11, socio: "Jorge Gaviria", fechaCredito: "2026-07-16", fechaPago: "2026-09-11", capital: 1000000, tasa: 0.005 },
        { id: 12, socio: "Jorge Gaviria", fechaCredito: "2026-08-28", fechaPago: null, capital: 1000000, tasa: 0.005 },
        { id: 13, socio: "Jorge Gaviria", fechaCredito: "2026-09-30", fechaPago: null, capital: 1000000, tasa: 0.005 }
      ],
      abonos: [
        { id: "jorge_gaviria_abono_9", fechaPago: "2026-06-15", creditoId: 1, abonoInteres: 12167, abonoCapital: 500000, comprobante: "Consignacion de $3,000,000 se liquidan creditos viejos de capital e intereses" },
        { id: "jorge_gaviria_abono_10", fechaPago: "2026-06-15", creditoId: 2, abonoInteres: 4333, abonoCapital: 200000, comprobante: "" },
        { id: "jorge_gaviria_abono_11", fechaPago: "2026-06-15", creditoId: 3, abonoInteres: 6450, abonoCapital: 300000, comprobante: "" },
        { id: "jorge_gaviria_abono_12", fechaPago: "2026-06-15", creditoId: 4, abonoInteres: 9917, abonoCapital: 500000, comprobante: "" },
        { id: "jorge_gaviria_abono_13", fechaPago: "2026-06-15", creditoId: 5, abonoInteres: 3367, abonoCapital: 200000, comprobante: "" },
        { id: "jorge_gaviria_abono_14", fechaPago: "2026-06-15", creditoId: 6, abonoInteres: 12667, abonoCapital: 1000000, comprobante: "" },
        { id: "jorge_gaviria_abono_15", fechaPago: "2026-06-15", creditoId: 7, abonoInteres: 833, abonoCapital: 100000, comprobante: "" },
        { id: "jorge_gaviria_abono_16", fechaPago: "2026-06-15", creditoId: 8, abonoInteres: 0, abonoCapital: 150266, comprobante: "" },
        { id: "jorge_gaviria_abono_17", fechaPago: "2026-07-28", creditoId: 8, abonoInteres: 17600, abonoCapital: 1049734, comprobante: "Consignacion de $1,200,000 se liquidan creditos viejos de capital e interes" },
        { id: "jorge_gaviria_abono_18", fechaPago: "2026-07-28", creditoId: 9, abonoInteres: 0, abonoCapital: 132166, comprobante: "" },
        { id: "jorge_gaviria_abono_19", fechaPago: "2026-09-11", creditoId: 9, abonoInteres: 10667, abonoCapital: 867834, comprobante: "Consignacion de $3,500,000 se liquidan creditos viejos de capital e intereses" },
        { id: "jorge_gaviria_abono_20", fechaPago: "2026-09-11", creditoId: 10, abonoInteres: 7467, abonoCapital: 700000, comprobante: "" },
        { id: "jorge_gaviria_abono_21", fechaPago: "2026-09-11", creditoId: 11, abonoInteres: 9500, abonoCapital: 1000000, comprobante: "" },
        { id: "jorge_gaviria_abono_22", fechaPago: "2026-09-11", creditoId: 12, abonoInteres: 0, abonoCapital: 904532, comprobante: "" }
      ]
    },
    {
      id: "caro_rios",
      name: "Caro Rios",
      creditos: [
        { id: 1, socio: "Caro Rios", fechaCredito: "2026-02-19", fechaPago: "2026-03-17", capital: 400000, tasa: 0.005 },
        { id: 2, socio: "Caro Rios", fechaCredito: "2026-03-17", fechaPago: "2026-06-12", capital: 1000000, tasa: 0.005 },
        { id: 3, socio: "Caro Rios", fechaCredito: "2026-07-27", fechaPago: null, capital: 700000, tasa: 0.005 },
        { id: 4, socio: "Caro Rios", fechaCredito: "2026-09-12", fechaPago: null, capital: 300000, tasa: 0.005 }
      ],
      abonos: [
        { id: "caro_rios_abono_9", fechaPago: "2026-02-27", creditoId: 1, abonoInteres: 0, abonoCapital: 150000, comprobante: "WhatsApp" },
        { id: "caro_rios_abono_10", fechaPago: "2026-03-13", creditoId: 1, abonoInteres: 0, abonoCapital: 100000, comprobante: "" },
        { id: "caro_rios_abono_11", fechaPago: "2026-03-17", creditoId: 1, abonoInteres: 20000, abonoCapital: 150000, comprobante: "" },
        { id: "caro_rios_abono_12", fechaPago: "2026-03-30", creditoId: 2, abonoInteres: 10000, abonoCapital: 200000, comprobante: "" },
        { id: "caro_rios_abono_13", fechaPago: "2026-04-15", creditoId: 2, abonoInteres: 10000, abonoCapital: 200000, comprobante: "" },
        { id: "caro_rios_abono_14", fechaPago: "2026-04-30", creditoId: 2, abonoInteres: 10000, abonoCapital: 200000, comprobante: "" },
        { id: "caro_rios_abono_15", fechaPago: "2026-05-15", creditoId: 2, abonoInteres: 10000, abonoCapital: 100000, comprobante: "" },
        { id: "caro_rios_abono_16", fechaPago: "2026-05-29", creditoId: 2, abonoInteres: 10000, abonoCapital: 100000, comprobante: "" },
        { id: "caro_rios_abono_17", fechaPago: "2026-06-12", creditoId: 2, abonoInteres: 20000, abonoCapital: 200000, comprobante: "" },
        { id: "caro_rios_abono_18", fechaPago: "2026-08-02", creditoId: 3, abonoInteres: 0, abonoCapital: 100000, comprobante: "" },
        { id: "caro_rios_abono_19", fechaPago: "2026-08-18", creditoId: 3, abonoInteres: 0, abonoCapital: 100000, comprobante: "" },
        { id: "caro_rios_abono_20", fechaPago: "2026-09-03", creditoId: 3, abonoInteres: 0, abonoCapital: 100000, comprobante: "" },
        { id: "caro_rios_abono_21", fechaPago: "2026-09-15", creditoId: 4, abonoInteres: 0, abonoCapital: 100000, comprobante: "" },
        { id: "caro_rios_abono_22", fechaPago: "2026-10-01", creditoId: 4, abonoInteres: 0, abonoCapital: 100000, comprobante: "" },
        { id: "caro_rios_abono_23", fechaPago: "2026-10-01", creditoId: 3, abonoInteres: 0, abonoCapital: 73767, comprobante: "Reclasificacion intereses, se abona a credito 3" }
      ]
    },
    {
      id: "andres_castro",
      name: "Andres Castro",
      creditos: [
        { id: 1, socio: "Andres Castro", fechaCredito: "2026-08-05", fechaPago: null, capital: 2000000, tasa: 0.005 }
      ],
      abonos: []
    },
    {
      id: "wilson_alvarez",
      name: "Wilson Alvarez",
      creditos: [
        { id: 1, socio: "Wilson Alvarez", fechaCredito: "2026-08-05", fechaPago: null, capital: 2000000, tasa: 0.005 }
      ],
      abonos: []
    }
  ]
};
