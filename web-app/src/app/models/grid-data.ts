export interface CellData {
    char: string;
    color: { r: number, g: number, b: number };
    bgColor: { r: number, g: number, b: number };
    yScale: number;
}
  
export type GridData = CellData[][];