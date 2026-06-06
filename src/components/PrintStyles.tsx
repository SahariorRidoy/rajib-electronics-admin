import { PrintSize } from "./PrintSettings";

export function getPrintStyles(size: PrintSize) {
  const baseStyles = `
    @media print {
      * {
        -webkit-print-color-adjust: exact !important;
        color-adjust: exact !important;
      }
      body {
        font-family: 'Arial', sans-serif !important;
        color: #000 !important;
      }
      .print-hide { display: none !important; }
    }
  `;

  const sizeStyles = {
    a4: `
      @media print {
        @page { margin: 0.5in; size: A4; }
        body { font-size: 12px !important; line-height: 1.4 !important; }
        .print-container { max-width: none !important; margin: 0 !important; padding: 0 !important; }
        .print-content { padding: 20px !important; }
        .print-logo { width: 50px !important; height: 50px !important; }
        .print-brand { font-size: 24px !important; }
        .print-header { border-bottom: 2px solid #167389 !important; padding-bottom: 15px !important; margin-bottom: 20px !important; }
        .print-section-title { font-size: 11px !important; font-weight: bold !important; margin-bottom: 8px !important; }
        .print-table th { padding: 8px 6px !important; font-size: 10px !important; }
        .print-table td { padding: 6px !important; font-size: 10px !important; }
        .print-item-image { width: 30px !important; height: 30px !important; }
        .print-item-color { font-size: 10px !important; color: #000 !important; }
        .print-grand-total { font-size: 16px !important; }
      }
    `,
    pos: `
      @media print {
        @page { margin: 0; size: 80mm auto; }
        body { font-size: 8px !important; line-height: 1.2 !important; margin: 0 !important; padding: 0 !important; }
        .print-container { max-width: 80mm !important; width: 80mm !important; margin: 0 !important; padding: 0 !important; box-shadow: none !important; }
        .print-content { padding: 2.5mm !important; }
        .print-header { flex-direction: row !important; align-items: flex-start !important; justify-content: space-between !important; border-bottom: 1px dashed #000 !important; padding-bottom: 1.5mm !important; margin-bottom: 2mm !important; }
        .print-logo { width: 14px !important; height: 14px !important; margin: 0 !important; }
        .print-brand { font-size: 10px !important; margin: 0 !important; font-weight: bold !important; color: #000 !important; line-height: 1.1 !important; }
        .print-invoice-label { font-size: 6px !important; color: #000 !important; margin: 0 !important; }
        .print-order-info { text-align: right !important; font-size: 6px !important; margin: 0 !important; color: #000 !important; line-height: 1.2 !important; }
        .print-order-info p { margin: 0 !important; }
        .print-customer-grid { display: block !important; margin-bottom: 2mm !important; border-bottom: 1px dashed #000 !important; padding-bottom: 2mm !important; }
        .print-customer-grid > div { margin-bottom: 1mm !important; }
        .print-customer-grid > div:last-child { margin-bottom: 0 !important; }
        .print-section-title { font-size: 6px !important; margin: 0 !important; font-weight: bold !important; color: #000 !important; text-transform: uppercase !important; display: inline !important; line-height: 1.2 !important; }
        .print-section-content { font-size: 6px !important; line-height: 1.3 !important; color: #000 !important; margin: 0 !important; display: block !important; }
        .print-section-content p { margin: 0 !important; line-height: 1.3 !important; font-size: 6px !important; }
        .print-status { display: inline !important; padding: 0 !important; font-size: 6px !important; font-weight: bold !important; border: none !important; background: transparent !important; color: #000 !important; margin: 0 0 0 1mm !important; text-transform: uppercase !important; }
        .print-table { margin: 0 0 1mm 0 !important; width: 100% !important; border-collapse: collapse !important; border-bottom: none !important; border-top: none !important; }
        .print-table-header { background: white !important; border-bottom: 1px dashed #000 !important; }
        .print-table th { padding: 0.8mm 0.5mm !important; font-size: 6px !important; font-weight: bold !important; color: #000 !important; text-align: left !important; }
        .print-table th:nth-child(2) { text-align: center !important; }
        .print-table th:nth-child(3), .print-table th:nth-child(4) { text-align: right !important; }
        .print-table td { padding: 0.8mm 0.5mm !important; font-size: 7px !important; color: #000 !important; line-height: 1.2 !important; }
        .print-table-row { border-bottom: 1px dashed #000 !important; }
        .print-item-image { display: none !important; }
        .print-item-name { font-size: 7px !important; color: #000 !important; }
        .print-item-color { font-size: 7px !important; color: #000 !important; }
        .print-totals-section { border-top: none !important; padding-top: 0.5mm !important; margin-top: 0 !important; }
        .print-footer-left { width: 100% !important; text-align: center !important; margin-top: 0.5mm !important; border-top: none !important; padding-top: 0 !important; }
        .print-totals-right { width: 100% !important; }
        .print-total-row { font-size: 7px !important; margin-bottom: 0.5mm !important; display: flex !important; justify-content: space-between !important; color: #000 !important; }
        .print-grand-total { font-size: 9px !important; border-top: 1px dashed #000 !important; padding-top: 1mm !important; margin-top: 1mm !important; font-weight: bold !important; display: flex !important; justify-content: space-between !important; color: #000 !important; }
        .print-grand-total span { color: #000 !important; }
        .print-thank-you { font-size: 6px !important; margin: 0 0 0.5mm 0 !important; color: #000 !important; text-align: center !important; }
        .print-contact { font-size: 6px !important; color: #000 !important; text-align: center !important; }
        .min-h-screen { min-height: auto !important; }
        .bg-gray-50, .bg-gray-100 { background: white !important; }
        .py-8 { padding: 0 !important; }
        .shadow-lg { box-shadow: none !important; }
        .mt-16 { margin-top: 0 !important; }
        .flex.justify-between.items-start { display: block !important; }
        .border-b-2, .border-t-2, .border-b { border-style: dashed !important; }
        .inline-block { display: inline !important; }
        .px-3, .py-1 { padding: 0 !important; }
        .rounded-full { border-radius: 0 !important; }
        .text-sm { font-size: 6px !important; }
      }
    `,
    mini: `
      @media print {
        @page { margin: 0; size: 58mm auto; }
        body { font-size: 7px !important; line-height: 1.2 !important; margin: 0 !important; padding: 0 !important; }
        .print-container { max-width: 58mm !important; width: 58mm !important; margin: 0 !important; padding: 0 !important; box-shadow: none !important; }
        .print-content { padding: 2mm !important; }
        .print-header { flex-direction: row !important; align-items: flex-start !important; justify-content: space-between !important; border-bottom: 1px dashed #000 !important; padding-bottom: 1mm !important; margin-bottom: 1.5mm !important; }
        .print-logo { width: 12px !important; height: 12px !important; margin: 0 !important; }
        .print-brand { font-size: 9px !important; margin: 0 !important; font-weight: bold !important; color: #000 !important; line-height: 1.1 !important; }
        .print-invoice-label { font-size: 5px !important; color: #000 !important; margin: 0 !important; }
        .print-order-info { text-align: right !important; font-size: 5px !important; margin: 0 !important; color: #000 !important; line-height: 1.2 !important; }
        .print-order-info p { margin: 0 !important; }
        .print-customer-grid { display: block !important; margin-bottom: 1.5mm !important; border-bottom: 1px dashed #000 !important; padding-bottom: 1.5mm !important; }
        .print-customer-grid > div { margin-bottom: 1mm !important; }
        .print-customer-grid > div:last-child { margin-bottom: 0 !important; }
        .print-section-title { font-size: 5px !important; margin: 0 !important; font-weight: bold !important; color: #000 !important; text-transform: uppercase !important; display: inline !important; line-height: 1.2 !important; }
        .print-section-content { font-size: 5px !important; line-height: 1.3 !important; color: #000 !important; margin: 0 !important; display: block !important; }
        .print-section-content p { margin: 0 !important; line-height: 1.3 !important; font-size: 5px !important; }
        .print-status { display: inline !important; padding: 0 !important; font-size: 5px !important; font-weight: bold !important; border: none !important; background: transparent !important; color: #000 !important; margin: 0 0 0 1mm !important; text-transform: uppercase !important; }
        .print-table { margin: 0 0 1mm 0 !important; width: 100% !important; border-collapse: collapse !important; border-bottom: none !important; border-top: none !important; }
        .print-table-header { background: white !important; border-bottom: 1px dashed #000 !important; }
        .print-table th { padding: 0.5mm 0.3mm !important; font-size: 5px !important; font-weight: bold !important; color: #000 !important; text-align: left !important; }
        .print-table th:nth-child(2) { text-align: center !important; }
        .print-table th:nth-child(3), .print-table th:nth-child(4) { text-align: right !important; }
        .print-table td { padding: 0.5mm 0.3mm !important; font-size: 6px !important; color: #000 !important; line-height: 1.2 !important; }
        .print-table-row { border-bottom: 1px dashed #000 !important; }
        .print-item-image { display: none !important; }
        .print-item-name { font-size: 6px !important; color: #000 !important; }
        .print-item-color { font-size: 6px !important; color: #000 !important; }
        .print-totals-section { border-top: none !important; padding-top: 0.5mm !important; margin-top: 0 !important; }
        .print-footer-left { width: 100% !important; text-align: center !important; margin-top: 0.5mm !important; border-top: none !important; padding-top: 0 !important; }
        .print-totals-right { width: 100% !important; }
        .print-total-row { font-size: 6px !important; margin-bottom: 0.3mm !important; display: flex !important; justify-content: space-between !important; color: #000 !important; }
        .print-grand-total { font-size: 8px !important; border-top: 1px dashed #000 !important; padding-top: 0.5mm !important; margin-top: 0.5mm !important; font-weight: bold !important; display: flex !important; justify-content: space-between !important; color: #000 !important; }
        .print-grand-total span { color: #000 !important; }
        .print-thank-you { font-size: 5px !important; margin: 1mm 0 0.3mm 0 !important; color: #000 !important; text-align: center !important; }
        .print-contact { font-size: 5px !important; color: #000 !important; text-align: center !important; }
        .min-h-screen { min-height: auto !important; }
        .bg-gray-50, .bg-gray-100 { background: white !important; }
        .py-8 { padding: 0 !important; }
        .shadow-lg { box-shadow: none !important; }
        .mt-16 { margin-top: 0 !important; }
        .flex.justify-between.items-start { display: block !important; }
        .border-b-2, .border-t-2, .border-b { border-style: dashed !important; }
        .inline-block { display: inline !important; }
        .px-3, .py-1 { padding: 0 !important; }
        .rounded-full { border-radius: 0 !important; }
        .text-sm { font-size: 5px !important; }
      }
    `,
    thermal: `
      @media print {
        @page { margin: 0; size: 80mm auto; }
        body { font-size: 9px !important; line-height: 1.2 !important; margin: 0 !important; padding: 0 !important; }
        .print-container { max-width: 80mm !important; width: 80mm !important; margin: 0 !important; padding: 0 !important; background: white !important; box-shadow: none !important; }
        .print-content { padding: 2.5mm !important; }
        .print-header { flex-direction: row !important; align-items: flex-start !important; justify-content: space-between !important; border-bottom: 1px dashed #000 !important; padding-bottom: 1.5mm !important; margin-bottom: 2mm !important; }
        .print-logo { width: 16px !important; height: 16px !important; margin: 0 !important; }
        .print-brand { font-size: 12px !important; margin: 0 !important; font-weight: bold !important; color: #000 !important; line-height: 1.1 !important; }
        .print-invoice-label { font-size: 7px !important; color: #000 !important; margin: 0 !important; }
        .print-order-info { text-align: right !important; font-size: 7px !important; margin: 0 !important; color: #000 !important; line-height: 1.2 !important; }
        .print-order-info p { margin: 0 !important; }
        .print-customer-grid { display: block !important; margin-bottom: 2mm !important; border-bottom: 1px dashed #000 !important; padding-bottom: 2mm !important; }
        .print-customer-grid > div { margin-bottom: 1.5mm !important; }
        .print-customer-grid > div:last-child { margin-bottom: 0 !important; }
        .print-section-title { font-size: 7px !important; margin: 0 !important; font-weight: bold !important; color: #000 !important; text-transform: uppercase !important; display: inline !important; line-height: 1.2 !important; }
        .print-section-content { font-size: 6px !important; line-height: 1.3 !important; color: #000 !important; margin: 0 !important; display: block !important; }
        .print-section-content p { margin: 0 !important; line-height: 1.3 !important; font-size: 6px !important; }
        .print-status { display: inline !important; padding: 0 !important; font-size: 7px !important; font-weight: bold !important; border: none !important; background: transparent !important; color: #000 !important; margin: 0 0 0 1mm !important; text-transform: uppercase !important; }
        .print-table { margin: 0 0 1mm 0 !important; width: 100% !important; border-collapse: collapse !important; border-top: none !important; border-bottom: none !important; }
        .print-table-header { background: white !important; }
        .print-table th { padding: 0.8mm 0.5mm !important; font-size: 7px !important; font-weight: bold !important; color: #000 !important; text-align: left !important; border-bottom: 1px dashed #000 !important; }
        .print-table th:nth-child(2) { text-align: center !important; }
        .print-table th:nth-child(3), .print-table th:nth-child(4) { text-align: right !important; }
        .print-table td { padding: 0.8mm 0.5mm !important; font-size: 7px !important; color: #000 !important; line-height: 1.2 !important; }
        .print-table-row { border-bottom: 1px dashed #000 !important; }
        .print-item-image { display: none !important; }
        .print-item-name { font-size: 7px !important; color: #000 !important; }
        .print-item-color { font-size: 7px !important; color: #000 !important; }
        .print-totals-section { border-top: none !important; padding-top: 0.5mm !important; margin-top: 0 !important; }
        .print-footer-left { width: 100% !important; text-align: center !important; margin-top: 0.5mm !important; border-top: none !important; padding-top: 0 !important; }
        .print-totals-right { width: 100% !important; }
        .print-total-row { font-size: 8px !important; margin-bottom: 0.5mm !important; display: flex !important; justify-content: space-between !important; color: #000 !important; }
        .print-grand-total { font-size: 11px !important; border-top: 1px dashed #000 !important; padding-top: 1mm !important; margin-top: 1mm !important; font-weight: bold !important; display: flex !important; justify-content: space-between !important; color: #000 !important; }
        .print-grand-total span { color: #000 !important; }
        .print-thank-you { font-size: 7px !important; margin: 0 0 0.5mm 0 !important; color: #000 !important; text-align: center !important; font-weight: bold !important; }
        .print-contact { font-size: 7px !important; color: #000 !important; text-align: center !important; }
        .min-h-screen { min-height: auto !important; }
        .bg-gray-50, .bg-gray-100 { background: white !important; }
        .py-8 { padding: 0 !important; }
        .shadow-lg { box-shadow: none !important; }
        .mt-16 { margin-top: 0 !important; }
        .flex.justify-between.items-start { display: block !important; }
        .border-b-2, .border-t-2, .border-b { border-style: dashed !important; }
        .inline-block { display: inline !important; }
        .px-3, .py-1 { padding: 0 !important; }
        .rounded-full { border-radius: 0 !important; }
        .text-sm { font-size: 6px !important; }
      }
    `,
  };

  return baseStyles + sizeStyles[size];
}
