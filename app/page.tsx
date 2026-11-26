'use client';

import React, { useState, useMemo } from 'react';
import {
  generateProcesses,
  simulateAllAlgorithms,
  ProcessInput,
} from '@/lib/scheduler';

export default function SchedulingSimulatorPage() {
  const [processCount, setProcessCount] = useState<number>(5);
  const [quantum, setQuantum] = useState<number>(2);
  const [processes, setProcesses] = useState<ProcessInput[]>(() => [
    { id: 'P1', arrivalTime: 0, burstTime: 6, priority: 3, color: '#3B82F6' },
    { id: 'P2', arrivalTime: 1, burstTime: 3, priority: 1, color: '#10B981' },
    { id: 'P3', arrivalTime: 2, burstTime: 8, priority: 4, color: '#F59E0B' },
    { id: 'P4', arrivalTime: 3, burstTime: 2, priority: 2, color: '#EF4444' },
    { id: 'P5', arrivalTime: 4, burstTime: 4, priority: 5, color: '#8B5CF6' },
  ]);
  const [selectedAlgoIndex, setSelectedAlgoIndex] = useState<number>(0);

  const handleGenerate = (count: number) => {
    const validCount = Math.min(12, Math.max(2, count));
    setProcessCount(validCount);
    setProcesses(generateProcesses(validCount));
  };

  const handleFieldChange = (
    index: number,
    field: 'arrivalTime' | 'burstTime' | 'priority',
    value: number
  ) => {
    const updated = [...processes];
    const minVal = field === 'burstTime' || field === 'priority' ? 1 : 0;
    updated[index] = {
      ...updated[index],
      [field]: Math.max(minVal, isNaN(value) ? minVal : value),
    };
    setProcesses(updated);
  };

  const results = useMemo(
    () => simulateAllAlgorithms(processes, quantum),
    [processes, quantum]
  );

  // Menentukan algoritma paling efisien (Average Waiting Time terkecil, tie-break ATAT)
  const bestAlgorithm = useMemo(() => {
    if (results.length === 0) return null;
    return [...results].sort((a, b) => {
      if (a.avgWaitingTime !== b.avgWaitingTime) {
        return a.avgWaitingTime - b.avgWaitingTime;
      }
      return a.avgTurnaroundTime - b.avgTurnaroundTime;
    })[0];
  }, [results]);

  const maxAWT = Math.max(...results.map((r) => r.avgWaitingTime), 1);
  const maxATAT = Math.max(...results.map((r) => r.avgTurnaroundTime), 1);
  const activeResult = results[selectedAlgoIndex] || results[0];

  return (
    <main className="min-h-screen bg-slate-950 text-slate-100 py-8 px-4 sm:px-6 lg:px-8">
      <div className="max-w-6xl mx-auto space-y-8">
        {/* Header */}
        <header className="border-b border-slate-800 pb-6 flex flex-col md:flex-row md:items-center md:justify-between gap-4">
          <div>
            <span className="inline-block text-xs font-semibold uppercase tracking-wider px-3 py-1 rounded-full bg-indigo-500/20 text-indigo-300 border border-indigo-500/30 mb-2">
              Tugas Akhir Sistem Operasi
            </span>
            <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-white">
              Simulasi & Perbandingan CPU Scheduling
            </h1>
            <p className="text-slate-400 text-sm mt-1">
              Analisis efisiensi algoritma <strong className="text-slate-200">Non-Preemptive</strong> vs{' '}
              <strong className="text-slate-200">Preemptive</strong> berdasarkan dataset proses.
            </p>
          </div>
        </header>

        {/* TAHAP 1: INPUT DATA */}
        <section className="bg-slate-900 border border-slate-800 rounded-2xl p-6 shadow-xl">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
            <div>
              <h2 className="text-lg font-semibold text-white flex items-center gap-2">
                <span className="w-6 h-6 rounded-md bg-blue-600 text-xs flex items-center justify-center font-bold">
                  1
                </span>
                Input Data Proses
              </h2>
              <p className="text-xs text-slate-400 mt-0.5">
                Atur jumlah proses, nilai Time Quantum, atau ubah parameter langsung pada tabel.
              </p>
            </div>

            <div className="flex flex-wrap items-center gap-3">
              <div className="flex items-center gap-2 bg-slate-950 border border-slate-800 px-3 py-1.5 rounded-lg">
                <label className="text-xs text-slate-400">Jumlah Data:</label>
                <input
                  type="number"
                  min={2}
                  max={12}
                  value={processCount}
                  onChange={(e) => handleGenerate(Number(e.target.value))}
                  className="w-14 bg-slate-800 text-white text-sm font-semibold px-2 py-1 rounded border border-slate-700 focus:outline-none focus:border-blue-500"
                />
              </div>

              <div className="flex items-center gap-2 bg-slate-950 border border-slate-800 px-3 py-1.5 rounded-lg">
                <label className="text-xs text-slate-400">Quantum (RR):</label>
                <input
                  type="number"
                  min={1}
                  max={20}
                  value={quantum}
                  onChange={(e) =>
                    setQuantum(Math.max(1, Number(e.target.value) || 1))
                  }
                  className="w-14 bg-slate-800 text-white text-sm font-semibold px-2 py-1 rounded border border-slate-700 focus:outline-none focus:border-cyan-500"
                />
              </div>

              <button
                onClick={() => handleGenerate(processCount)}
                className="px-4 py-2 rounded-lg bg-blue-600 hover:bg-blue-500 text-sm font-medium text-white transition cursor-pointer"
              >
                Acak Data Baru
              </button>
            </div>
          </div>

          {/* Tabel Input Proses */}
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="border-b border-slate-800 text-xs uppercase text-slate-400">
                  <th className="py-3 px-4">Proses</th>
                  <th className="py-3 px-4">Arrival Time (ms)</th>
                  <th className="py-3 px-4">Burst Time (ms)</th>
                  <th className="py-3 px-4">Priority (1 = Tertinggi)</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/60 text-sm">
                {processes.map((proc, idx) => (
                  <tr key={proc.id} className="hover:bg-slate-800/30">
                    <td className="py-2.5 px-4 font-semibold flex items-center gap-2.5">
                      <span
                        className="w-3.5 h-3.5 rounded-full inline-block"
                        style={{ backgroundColor: proc.color }}
                      />
                      {proc.id}
                    </td>
                    <td className="py-2.5 px-4">
                      <input
                        type="number"
                        min={0}
                        value={proc.arrivalTime}
                        onChange={(e) =>
                          handleFieldChange(
                            idx,
                            'arrivalTime',
                            Number(e.target.value)
                          )
                        }
                        className="w-24 bg-slate-950 border border-slate-700 rounded px-2.5 py-1 text-white focus:border-blue-500 focus:outline-none"
                      />
                    </td>
                    <td className="py-2.5 px-4">
                      <input
                        type="number"
                        min={1}
                        value={proc.burstTime}
                        onChange={(e) =>
                          handleFieldChange(
                            idx,
                            'burstTime',
                            Number(e.target.value)
                          )
                        }
                        className="w-24 bg-slate-950 border border-slate-700 rounded px-2.5 py-1 text-white focus:border-blue-500 focus:outline-none"
                      />
                    </td>
                    <td className="py-2.5 px-4">
                      <input
                        type="number"
                        min={1}
                        value={proc.priority}
                        onChange={(e) =>
                          handleFieldChange(
                            idx,
                            'priority',
                            Number(e.target.value)
                          )
                        }
                        className="w-24 bg-slate-950 border border-slate-700 rounded px-2.5 py-1 text-white focus:border-blue-500 focus:outline-none"
                      />
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>

        {/* TAHAP 2: KESIMPULAN EFISIENSI */}
        {bestAlgorithm && (
          <section className="bg-gradient-to-r from-emerald-950/70 via-slate-900 to-slate-900 border border-emerald-500/40 rounded-2xl p-6 shadow-xl">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
              <div>
                <span className="text-xs font-bold uppercase tracking-wider text-emerald-400">
                  Hasil Analisis Efisiensi Tertinggi
                </span>
                <h2 className="text-xl sm:text-2xl font-bold text-white mt-1">
                  {bestAlgorithm.name}
                </h2>
                <p className="text-sm text-slate-300 mt-1">
                  Kategori:{' '}
                  <span className="font-semibold text-emerald-300">
                    {bestAlgorithm.type}
                  </span>{' '}
                  — Menghasilkan waktu tunggu rata-rata terendah untuk{' '}
                  <strong>{processes.length} proses</strong> yang diuji.
                </p>
              </div>
              <div className="grid grid-cols-3 gap-3 text-center">
                <div className="bg-slate-950/80 border border-slate-800 px-4 py-3 rounded-xl">
                  <div className="text-xs text-slate-400">Avg Waiting</div>
                  <div className="text-lg font-bold text-emerald-400">
                    {bestAlgorithm.avgWaitingTime} ms
                  </div>
                </div>
                <div className="bg-slate-950/80 border border-slate-800 px-4 py-3 rounded-xl">
                  <div className="text-xs text-slate-400">Avg Turnaround</div>
                  <div className="text-lg font-bold text-blue-400">
                    {bestAlgorithm.avgTurnaroundTime} ms
                  </div>
                </div>
                <div className="bg-slate-950/80 border border-slate-800 px-4 py-3 rounded-xl">
                  <div className="text-xs text-slate-400">CPU Util.</div>
                  <div className="text-lg font-bold text-amber-400">
                    {bestAlgorithm.cpuUtilization}%
                  </div>
                </div>
              </div>
            </div>
          </section>
        )}

        {/* TAHAP 3: OUTPUT PERBANDINGAN BAR BERWARNA */}
        <section className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Bar Chart 1: Average Waiting Time */}
          <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 shadow-xl">
            <h3 className="text-base font-semibold text-white">
              Perbandingan Average Waiting Time (AWT)
            </h3>
            <p className="text-xs text-slate-400 mb-5">
              Semakin pendek bar berwarna, semakin cepat antrean proses dilayani (lebih efisien).
            </p>
            <div className="space-y-4">
              {results.map((res) => {
                const widthPct = Math.max(
                  8,
                  Math.round((res.avgWaitingTime / maxAWT) * 100)
                );
                const isWinner = bestAlgorithm?.name === res.name;
                return (
                  <div key={res.name} className="space-y-1.5">
                    <div className="flex justify-between items-center text-xs">
                      <div className="flex items-center gap-2">
                        <span className="font-semibold text-slate-200">
                          {res.shortName}
                        </span>
                        <span
                          className={`px-2 py-0.5 rounded text-[10px] font-medium ${res.type === 'Preemptive'
                              ? 'bg-amber-500/20 text-amber-300'
                              : 'bg-blue-500/20 text-blue-300'
                            }`}
                        >
                          {res.type}
                        </span>
                        {isWinner && (
                          <span className="px-2 py-0.5 rounded bg-emerald-500/20 text-emerald-300 text-[10px] font-bold">
                            Paling Efisien
                          </span>
                        )}
                      </div>
                      <span className="font-mono font-bold text-white">
                        {res.avgWaitingTime} ms
                      </span>
                    </div>
                    <div className="w-full bg-slate-950 rounded-full h-4 p-0.5 border border-slate-800">
                      <div
                        className={`${res.barColor} h-full rounded-full transition-all duration-500`}
                        style={{ width: `${widthPct}%` }}
                      />
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Bar Chart 2: Average Turnaround Time */}
          <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 shadow-xl">
            <h3 className="text-base font-semibold text-white">
              Perbandingan Average Turnaround Time (ATAT)
            </h3>
            <p className="text-xs text-slate-400 mb-5">
              Total waktu rata-rata sejak proses datang hingga selesai dieksekusi (lebih pendek = lebih baik).
            </p>
            <div className="space-y-4">
              {results.map((res) => {
                const widthPct = Math.max(
                  8,
                  Math.round((res.avgTurnaroundTime / maxATAT) * 100)
                );
                return (
                  <div key={res.name} className="space-y-1.5">
                    <div className="flex justify-between items-center text-xs">
                      <div className="flex items-center gap-2">
                        <span className="font-semibold text-slate-200">
                          {res.shortName}
                        </span>
                        <span className="text-slate-500 text-[11px]">
                          (RT: {res.avgResponseTime} ms)
                        </span>
                      </div>
                      <span className="font-mono font-bold text-white">
                        {res.avgTurnaroundTime} ms
                      </span>
                    </div>
                    <div className="w-full bg-slate-950 rounded-full h-4 p-0.5 border border-slate-800">
                      <div
                        className={`${res.barColor} h-full rounded-full opacity-90 transition-all duration-500`}
                        style={{ width: `${widthPct}%` }}
                      />
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </section>

        {/* GANTT CHART BERWARNA & DETAIL PER ALGORITMA */}
        {activeResult && (
          <section className="bg-slate-900 border border-slate-800 rounded-2xl p-6 shadow-xl space-y-6">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div>
                <h3 className="text-lg font-semibold text-white">
                  Visualisasi Gantt Chart Berwarna & Detail Eksekusi
                </h3>
                <p className="text-xs text-slate-400">
                  Pilih algoritma untuk melihat urutan eksekusi blok proses pada CPU.
                </p>
              </div>
              <div className="flex flex-wrap gap-2">
                {results.map((res, idx) => (
                  <button
                    key={res.name}
                    onClick={() => setSelectedAlgoIndex(idx)}
                    className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition cursor-pointer ${selectedAlgoIndex === idx
                        ? 'bg-white text-slate-950'
                        : 'bg-slate-800 text-slate-300 hover:bg-slate-700'
                      }`}
                  >
                    {res.shortName}
                  </button>
                ))}
              </div>
            </div>

            {/* Gantt Chart Bar */}
            <div>
              <div className="text-xs font-medium text-slate-300 mb-2">
                {activeResult.name} ({activeResult.type})
              </div>
              <div className="w-full flex rounded-xl overflow-hidden border border-slate-700 bg-slate-950 h-14">
                {activeResult.gantt.map((block, i) => {
                  const duration = block.end - block.start;
                  const widthPercent = (duration / activeResult.totalTime) * 100;
                  return (
                    <div
                      key={`${block.id}-${i}`}
                      style={{
                        width: `${widthPercent}%`,
                        backgroundColor: block.isIdle ? '#334155' : block.color,
                      }}
                      title={`${block.id}: ${block.start}ms - ${block.end}ms`}
                      className="flex flex-col items-center justify-center border-r border-slate-950/60 text-white font-bold text-xs px-1 overflow-hidden"
                    >
                      <span>{block.id}</span>
                      <span className="text-[10px] font-normal opacity-90">
                        {block.start}-{block.end}
                      </span>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Tabel Hasil Metrik */}
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse text-sm">
                <thead>
                  <tr className="border-b border-slate-800 text-xs uppercase text-slate-400">
                    <th className="py-2.5 px-3">Proses</th>
                    <th className="py-2.5 px-3">Arrival</th>
                    <th className="py-2.5 px-3">Burst</th>
                    <th className="py-2.5 px-3">Completion</th>
                    <th className="py-2.5 px-3">Turnaround (TAT)</th>
                    <th className="py-2.5 px-3">Waiting (WT)</th>
                    <th className="py-2.5 px-3">Response (RT)</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800/60">
                  {activeResult.metrics.map((m) => (
                    <tr key={m.id}>
                      <td className="py-2 px-3 font-semibold flex items-center gap-2">
                        <span
                          className="w-3 h-3 rounded-full"
                          style={{ backgroundColor: m.color }}
                        />
                        {m.id}
                      </td>
                      <td className="py-2 px-3 text-slate-300">{m.arrivalTime}</td>
                      <td className="py-2 px-3 text-slate-300">{m.burstTime}</td>
                      <td className="py-2 px-3 text-slate-300">{m.completionTime}</td>
                      <td className="py-2 px-3 font-medium text-blue-300">
                        {m.turnaroundTime}
                      </td>
                      <td className="py-2 px-3 font-medium text-emerald-300">
                        {m.waitingTime}
                      </td>
                      <td className="py-2 px-3 text-slate-300">{m.responseTime}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </section>
        )}
      </div>
    </main>
  );
}