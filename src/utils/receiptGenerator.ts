import { jsPDF } from 'jspdf';
import { formatDate } from './dateHelpers';

export const generateDonationReceipt = (data: {
  committeeName: string,
  donorName: string,
  donorPhone: string,
  amount: number,
  receiptNumber: string,
  date: any,
  pujaType: string,
  year: number,
  collectedBy: string
}) => {
  const doc = new jsPDF();
  
  // Header
  doc.setFontSize(22);
  doc.setTextColor(255, 107, 53); // Saffron
  doc.text('Pooja Samiti', 105, 20, { align: 'center' });
  
  doc.setFontSize(18);
  doc.setTextColor(139, 26, 26); // Deep Red
  doc.text(data.committeeName, 105, 30, { align: 'center' });
  
  doc.setFontSize(14);
  doc.setTextColor(0, 0, 0);
  doc.text('DONATION RECEIPT', 105, 45, { align: 'center' });
  
  doc.setLineWidth(0.5);
  doc.line(20, 50, 190, 50);
  
  // Content
  doc.setFontSize(12);
  doc.text(`Receipt No: ${data.receiptNumber}`, 20, 65);
  doc.text(`Date: ${formatDate(data.date)}`, 140, 65);
  
  doc.text(`Received with thanks from: ${data.donorName}`, 20, 80);
  doc.text(`Contact: ${data.donorPhone}`, 20, 90);
  
  doc.setFontSize(16);
  doc.text(`Amount: Rs. ${data.amount.toLocaleString()}`, 20, 110);
  
  doc.setFontSize(12);
  doc.text(`Towards ${data.pujaType} Puja ${data.year}`, 20, 125);
  doc.text(`Collected By: ${data.collectedBy}`, 20, 135);
  
  // Footer
  doc.setLineWidth(0.5);
  doc.line(20, 160, 190, 160);
  doc.setFontSize(10);
  doc.text(`Thank you for your contribution to ${data.committeeName} ${data.year} ${data.pujaType}`, 105, 175, { align: 'center' });
  doc.text('Generated via Pooja Samiti', 105, 185, { align: 'center' });
  
  return doc;
};
