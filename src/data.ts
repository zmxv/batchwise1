import { Matrix, CellBase } from "react-spreadsheet";

export type CellMatrix = Matrix<CellBase>;

export function emptyCellMatrix(rows: number, cols: number): CellMatrix {
  const ret: CellMatrix = [];
  while (rows--) {
    ret.push(new Array<CellBase>(cols).fill({value: ""}));
  }
  return ret;
}

export type Strings = string[];
export type StringMatrix = Strings[];

export function cellsToStrings(cs: (CellBase | undefined)[]): Strings {
  return cs.map(c => c ? c.value : "");
}

export function stringMatrixToCellMatrix(sm: StringMatrix): CellMatrix {
  return sm.map(ss => ss.map(s => ({value: s})));
}

export function cellMatrixToStringMatrix(cm: CellMatrix): StringMatrix {
  return cm.map(cs => cs.map(c => c!.value));
}

export type Indexes = number[];

export function findNonemptyRows(cm: CellMatrix): Indexes {
  const ret: Indexes = [];
  for (let i = 0; i < cm.length; i++) {
    if (cm[i].some(c => c!.value)) {
      ret.push(i);
    }
  }
  return ret;
}

export function appendColumn(cm: CellMatrix): CellMatrix {
  return cm.map(cs => {
    const row = cs.slice();
    row.push({value: "", className: "pending"});
    return row;
  });
}

export function setCell(cm: CellMatrix, row: number, col: number, value: string): CellMatrix {
  return cm.map((cs, i) => {
    if (i === row) {
      const n = cs.slice();
      n[col] = { value };
      return n;
    }
    return cs;
  });
}

export function getColLabels(n: number): Strings {
  const ret: Strings = [];
  for (let i = 0; i < n; i++) {
    ret.push(`{${i + 1}}`);
  }
  return ret;
}