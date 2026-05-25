import { PujaType } from '../types';

export const generateCommitteeId = (pujaType: PujaType, year: number, city: string, sequence: number) => {
  const typeCode = (pujaType.slice(0, 3)).toUpperCase();
  const cityCode = (city.slice(0, 3)).toUpperCase();
  const seq = sequence.toString().padStart(4, '0');
  return `${typeCode}-${year}-${cityCode}-${seq}`;
};

export const generateReceiptNumber = (committeeId: string, year: number, type: 'DON' | 'CHANDA', sequence: number) => {
  const seq = sequence.toString().padStart(5, '0');
  return `${committeeId}/${year}/${type}/${seq}`;
};
