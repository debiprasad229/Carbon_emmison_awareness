/**
 * Unit Tests for scannerEngine.js
 */
import { describe, it, expect } from 'vitest';
import { parseDocumentLocally } from '../scannerEngine';

describe('scannerEngine - parseDocumentLocally', () => {
  it('identifies and parses electricity bill with kWh keywords', () => {
    const text = 'Metropolitan Grid Invoice \nUsage: 450 kWh \nBilling Period: June';
    const result = parseDocumentLocally(text, 'bill.txt');

    expect(result.documentType).toBe('electricity_bill');
    expect(result.parsedData.unit).toBe('kWh');
    expect(result.parsedData.usageValue).toBe(450);
    expect(result.calculatedCarbon).toBe(Math.round(450 * 0.38));
    expect(result.confidence).toBe(95);
  });

  it('identifies and parses fuel receipts with liter keywords', () => {
    const text = 'Shell Fuel Station \nPremium Gasoline \nQuantity: 52.5 L \nTotal: $80.00';
    const result = parseDocumentLocally(text, 'receipt.png');

    expect(result.documentType).toBe('fuel_receipt');
    expect(result.parsedData.unit).toBe('Liters');
    expect(result.parsedData.usageValue).toBe(52.5);
    expect(result.calculatedCarbon).toBe(Math.round(52.5 * 2.31));
    expect(result.confidence).toBe(92);
  });

  it('identifies and parses shopping receipts with cost keywords', () => {
    const text = 'Target Store \nTotal: $125.50 \nThank you for shopping!';
    const result = parseDocumentLocally(text, 'shopping_receipt.pdf');

    expect(result.documentType).toBe('shopping_receipt');
    expect(result.parsedData.unit).toBe('USD');
    expect(result.parsedData.usageValue).toBe(125.5);
    expect(result.calculatedCarbon).toBe(Math.round(125.5 * 0.12));
    expect(result.confidence).toBe(90);
  });

  it('uses filename as fallback clue if text does not contain keywords', () => {
    const result = parseDocumentLocally('Generic text 400', 'electricity-bill-june.pdf');
    expect(result.documentType).toBe('electricity_bill');
    expect(result.parsedData.usageValue).toBe(400);
  });

  it('provides sensible default fallbacks when keywords and numbers are missing', () => {
    const result = parseDocumentLocally('some empty garbage', 'unnamed.bin');
    expect(result.documentType).toBe('shopping_receipt'); // default
    expect(result.parsedData.usageValue).toBe(85); // fallback default
    expect(result.confidence).toBe(70);
  });
});
