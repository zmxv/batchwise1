import { useState, useEffect, useRef, useCallback } from "react";
import { parse } from "csv-parse/browser/esm/sync";
import { stringify } from "csv-stringify/browser/esm/sync";
import Spreadsheet from "react-spreadsheet";
import { Strings, CellMatrix, emptyCellMatrix, stringMatrixToCellMatrix, cellMatrixToStringMatrix, findNonemptyRows, appendColumn, cellsToStrings, setCell, getColLabels } from "./data";
import "./App.css";

let llm: AILanguageModel | null = null;

const enum LSKey {
  Rows = "rows",
  Prompt = "prompt"
}

function getProgressStyle(progress: number): React.CSSProperties {
  const pct = (progress * 100).toFixed(1);
  return {
    backgroundImage: `linear-gradient(to right, var(--progress-fg-color) 0%, var(--progress-fg-color) ${pct}%, var(--progress-bg-color) ${pct}%, var(--progress-bg-color) 100%)`
  };
}

interface Status {
  message: string;
  type: "info" | "error" | "pending";
}

function loadData(): {cellMatrix: CellMatrix, prompt: string} {
  const ret: {cellMatrix: CellMatrix, prompt: string} = {cellMatrix: [], prompt: ""};
  try {
    ret.cellMatrix = stringMatrixToCellMatrix(JSON.parse(localStorage.getItem(LSKey.Rows) || "[]"));
  } catch (e) {
  }
  ret.prompt = localStorage.getItem(LSKey.Prompt) || "";
  return ret;
}

function saveData(rows: Strings[], prompt: string): void {
  localStorage.setItem(LSKey.Rows, JSON.stringify(rows));
  localStorage.setItem(LSKey.Prompt, prompt);
}

function rewritePrompt(prompt: string, row: Strings, index: number): string {
  return prompt.replace(/{(\d+)}/g, (_, digits: string) => {
    const i = parseInt(digits, 10);
    if (i === 0) {
      return index.toString();
    }
    return row[i - 1] || "";
  });
}

export function App() {
  const defaultRows = 20;
  const defaultCols = 2;
  
  const localData = loadData();
  const [prompt, setPrompt] = useState<string>(localData.prompt);
  const [data, setData] = useState<CellMatrix>(localData.cellMatrix.length ? localData.cellMatrix : emptyCellMatrix(defaultRows, defaultCols));
  const [colLabels, setColLabels] = useState<Strings>(getColLabels(localData.cellMatrix.length ? localData.cellMatrix[0].length : defaultCols));

  const [status, setStatus] = useState<Status>({ message: "Initializing", type: "info" });
  const [progress, setProgress] = useState<number>(1);
  const [filename, setFilename] = useState<string>("batchwise.csv");

  const fileRef = useRef<HTMLInputElement>(null);


  async function initAI() {
    if (!window.ai) {
      setStatus({ message: "AI API not detected", type: "error" });
      return;
    }
    const available = (await window.ai.languageModel.capabilities()).available;
    if (available !== "readily") {
      setStatus({ message: "AI API not ready", type: "error" });
      return;
    }
    llm = await window.ai.languageModel.create();
    setStatus({ message: "Ready", type: "info" });
  }

  useEffect(() => { initAI() }, []);

  const onLoadFile = useCallback(async () => {
    fileRef.current!.click();
  }, []);

  const onSelectFile = useCallback(async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.currentTarget.files;
    if (!files || files.length !== 1) {
      return;
    }
    const file = files[0];
    setFilename(file.name);
    const reader = new FileReader();
    reader.onload = () => {
      try {
        const text = reader.result as string;
        const cm = stringMatrixToCellMatrix(parse(text));
        if (Array.isArray(cm) && cm.length) {
          setData(cm);
          setColLabels(getColLabels(cm[0].length));
          setStatus({ message: `Loaded ${cm.length} rows from ${file.name}`, type: "info"});
        } else {
          throw new Error("missing data");
        }
      } catch (e) {
        setStatus({ message: "Failed to parse csv: " + e, type: "error"});
      }
    };
    reader.readAsText(file);
    e.currentTarget.value = "";
  }, []);

  const onSaveFile = useCallback(async () => {
    const body = stringify(cellMatrixToStringMatrix(data));
    const el = document.createElement("a");
    el.setAttribute("href", "data:text/csv;charset=utf-8," + encodeURIComponent(body));
    el.setAttribute("download", filename);
    el.click();
  }, [data, filename]);

  const onRun = useCallback(async () => {
    if (!llm || progress !== 1) {
      return;
    }
    if (!prompt.trim()) {
      setStatus({ message: "No instructions to follow", type: "error"});
      return;
    }
    const indexes = findNonemptyRows(data);
    if (!indexes.length) {
      setStatus({ message: "No data to process", type: "error" });
      return;
    }

    const lastCol = data[indexes[0]].length;
    let d = appendColumn(data);
    setData(d);
    setColLabels(getColLabels(d[0].length));
    for (let i = 0; i < indexes.length; i++) {
      const row = d[indexes[i]];
      const rewritten = rewritePrompt(prompt, cellsToStrings(row), indexes[i] + 1);
      setProgress(i / indexes.length);
      setStatus({ message: `Processing ${i + 1} of ${indexes.length}`, type: "pending" });
      try {
        const res = await llm!.prompt(rewritten);
        setData(d = setCell(d, indexes[i], lastCol, res));
      } catch (e) {
        setData(d = setCell(d, indexes[i], lastCol, String(e)));
      }
    }
    setProgress(1);
    setStatus({ message: `Processed ${indexes.length} rows`, type: "info" });
  }, [data, prompt]);

  const onPromptChange = useCallback((e: React.ChangeEvent<HTMLTextAreaElement>) => {
    setPrompt(e.target.value);
  }, []);

  document.addEventListener("visibilitychange", () => {
    if (document.visibilityState === "hidden") {
      saveData(cellMatrixToStringMatrix(data), prompt);
    }
  });

  return (
    <>
    <header>
      <div><img src="/batchwise.svg" className="logo" title="Batchwise"/></div>
      <div className="stretch">
        <input type="file" id="input" className="hidden" accept=".csv" ref={fileRef} onChange={onSelectFile}/>
      </div>
      <button className="btn" onClick={onLoadFile}>Load</button>
      <button className="btn" onClick={onSaveFile}>Save</button>
      <button className="btn" onClick={onRun}>Run</button>
    </header>
    <section>
      <div className="instruction">Instruction:</div>
      <div className="prompt-row">
        <textarea className="prompt" onChange={onPromptChange} value={prompt}></textarea>
      </div>
    </section>
    <section className="stretch scroll">
      <Spreadsheet data={data} columnLabels={colLabels} onChange={setData}/>
    </section>
    <footer className={status.type} style={getProgressStyle(progress)}>
      {status.message}
    </footer>
    </>
  )
}
