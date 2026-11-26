export interface ProcessInput {
    id: string;
    arrivalTime: number;
    burstTime: number;
    priority: number;
    color: string;
}

export interface GanttBlock {
    id: string;
    start: number;
    end: number;
    color: string;
    isIdle?: boolean;
}

export interface ProcessMetric extends ProcessInput {
    completionTime: number;
    turnaroundTime: number;
    waitingTime: number;
    responseTime: number;
}

export interface AlgorithmResult {
    name: string;
    shortName: string;
    type: 'Non-Preemptive' | 'Preemptive';
    barColor: string;
    gantt: GanttBlock[];
    metrics: ProcessMetric[];
    avgWaitingTime: number;
    avgTurnaroundTime: number;
    avgResponseTime: number;
    cpuUtilization: number;
    totalTime: number;
}

const PROCESS_COLORS = [
    '#3B82F6', '#10B981', '#F59E0B', '#EF4444', '#8B5CF6',
    '#EC4899', '#06B6D4', '#84CC16', '#F97316', '#6366F1',
];

export function generateProcesses(count: number): ProcessInput[] {
    return Array.from({ length: count }, (_, i) => ({
        id: `P${i + 1}`,
        arrivalTime: i === 0 ? 0 : Math.floor(Math.random() * (count + 2)),
        burstTime: Math.floor(Math.random() * 8) + 2,
        priority: Math.floor(Math.random() * 5) + 1,
        color: PROCESS_COLORS[i % PROCESS_COLORS.length],
    }));
}

function finalizeResult(
    name: string,
    shortName: string,
    type: 'Non-Preemptive' | 'Preemptive',
    barColor: string,
    gantt: GanttBlock[],
    metrics: ProcessMetric[],
    totalTime: number
): AlgorithmResult {
    const n = metrics.length;
    const totalBurst = metrics.reduce((acc, m) => acc + m.burstTime, 0);
    const avgWaitingTime = Number(
        (metrics.reduce((acc, m) => acc + m.waitingTime, 0) / n).toFixed(2)
    );
    const avgTurnaroundTime = Number(
        (metrics.reduce((acc, m) => acc + m.turnaroundTime, 0) / n).toFixed(2)
    );
    const avgResponseTime = Number(
        (metrics.reduce((acc, m) => acc + m.responseTime, 0) / n).toFixed(2)
    );
    const cpuUtilization =
        totalTime > 0 ? Number(((totalBurst / totalTime) * 100).toFixed(1)) : 0;

    return {
        name,
        shortName,
        type,
        barColor,
        gantt,
        metrics: metrics.sort(
            (a, b) => Number(a.id.slice(1)) - Number(b.id.slice(1))
        ),
        avgWaitingTime,
        avgTurnaroundTime,
        avgResponseTime,
        cpuUtilization,
        totalTime,
    };
}

function appendGantt(gantt: GanttBlock[], block: GanttBlock) {
    const last = gantt[gantt.length - 1];
    if (last && last.id === block.id && last.end === block.start) {
        last.end = block.end;
    } else {
        gantt.push({ ...block });
    }
}

// 1. FCFS (Non-Preemptive)
function runFCFS(processes: ProcessInput[]): AlgorithmResult {
    const sorted = [...processes].sort((a, b) => a.arrivalTime - b.arrivalTime);
    const gantt: GanttBlock[] = [];
    const metrics: ProcessMetric[] = [];
    let currentTime = 0;

    for (const p of sorted) {
        if (currentTime < p.arrivalTime) {
            appendGantt(gantt, {
                id: 'IDLE',
                start: currentTime,
                end: p.arrivalTime,
                color: '#CBD5E1',
                isIdle: true,
            });
            currentTime = p.arrivalTime;
        }
        const start = currentTime;
        const end = start + p.burstTime;
        appendGantt(gantt, { id: p.id, start, end, color: p.color });

        const turnaroundTime = end - p.arrivalTime;
        const waitingTime = turnaroundTime - p.burstTime;
        const responseTime = start - p.arrivalTime;

        metrics.push({
            ...p,
            completionTime: end,
            turnaroundTime,
            waitingTime,
            responseTime,
        });
        currentTime = end;
    }

    return finalizeResult(
        'First-Come, First-Served (FCFS)',
        'FCFS',
        'Non-Preemptive',
        'bg-blue-500',
        gantt,
        metrics,
        currentTime
    );
}

// 2. SJF (Non-Preemptive)
function runSJFNonPreemptive(processes: ProcessInput[]): AlgorithmResult {
    const n = processes.length;
    const completed = new Array(n).fill(false);
    const gantt: GanttBlock[] = [];
    const metrics: ProcessMetric[] = [];
    let currentTime = 0;
    let completedCount = 0;

    while (completedCount < n) {
        let idx = -1;
        let minBurst = Infinity;

        for (let i = 0; i < n; i++) {
            if (!completed[i] && processes[i].arrivalTime <= currentTime) {
                if (
                    processes[i].burstTime < minBurst ||
                    (processes[i].burstTime === minBurst &&
                        processes[i].arrivalTime < processes[idx].arrivalTime)
                ) {
                    minBurst = processes[i].burstTime;
                    idx = i;
                }
            }
        }

        if (idx === -1) {
            const nextArrival = Math.min(
                ...processes.filter((_, i) => !completed[i]).map((p) => p.arrivalTime)
            );
            appendGantt(gantt, {
                id: 'IDLE',
                start: currentTime,
                end: nextArrival,
                color: '#CBD5E1',
                isIdle: true,
            });
            currentTime = nextArrival;
            continue;
        }

        const p = processes[idx];
        const start = currentTime;
        const end = start + p.burstTime;
        appendGantt(gantt, { id: p.id, start, end, color: p.color });

        const turnaroundTime = end - p.arrivalTime;
        metrics.push({
            ...p,
            completionTime: end,
            turnaroundTime,
            waitingTime: turnaroundTime - p.burstTime,
            responseTime: start - p.arrivalTime,
        });

        completed[idx] = true;
        completedCount++;
        currentTime = end;
    }

    return finalizeResult(
        'Shortest Job First (SJF)',
        'SJF',
        'Non-Preemptive',
        'bg-emerald-500',
        gantt,
        metrics,
        currentTime
    );
}

// 3. Priority (Non-Preemptive)
function runPriorityNonPreemptive(processes: ProcessInput[]): AlgorithmResult {
    const n = processes.length;
    const completed = new Array(n).fill(false);
    const gantt: GanttBlock[] = [];
    const metrics: ProcessMetric[] = [];
    let currentTime = 0;
    let completedCount = 0;

    while (completedCount < n) {
        let idx = -1;
        let bestPriority = Infinity;

        for (let i = 0; i < n; i++) {
            if (!completed[i] && processes[i].arrivalTime <= currentTime) {
                if (
                    processes[i].priority < bestPriority ||
                    (processes[i].priority === bestPriority &&
                        processes[i].arrivalTime < processes[idx].arrivalTime)
                ) {
                    bestPriority = processes[i].priority;
                    idx = i;
                }
            }
        }

        if (idx === -1) {
            const nextArrival = Math.min(
                ...processes.filter((_, i) => !completed[i]).map((p) => p.arrivalTime)
            );
            appendGantt(gantt, {
                id: 'IDLE',
                start: currentTime,
                end: nextArrival,
                color: '#CBD5E1',
                isIdle: true,
            });
            currentTime = nextArrival;
            continue;
        }

        const p = processes[idx];
        const start = currentTime;
        const end = start + p.burstTime;
        appendGantt(gantt, { id: p.id, start, end, color: p.color });

        const turnaroundTime = end - p.arrivalTime;
        metrics.push({
            ...p,
            completionTime: end,
            turnaroundTime,
            waitingTime: turnaroundTime - p.burstTime,
            responseTime: start - p.arrivalTime,
        });

        completed[idx] = true;
        completedCount++;
        currentTime = end;
    }

    return finalizeResult(
        'Priority Scheduling (Non-Preemptive)',
        'Priority (NP)',
        'Non-Preemptive',
        'bg-violet-500',
        gantt,
        metrics,
        currentTime
    );
}

// 4. SRTF (Preemptive SJF)
function runSRTF(processes: ProcessInput[]): AlgorithmResult {
    const n = processes.length;
    const remaining = processes.map((p) => p.burstTime);
    const firstStart = new Array(n).fill(-1);
    const gantt: GanttBlock[] = [];
    const metrics: ProcessMetric[] = [];
    let currentTime = 0;
    let completedCount = 0;

    while (completedCount < n) {
        let idx = -1;
        let minRem = Infinity;

        for (let i = 0; i < n; i++) {
            if (remaining[i] > 0 && processes[i].arrivalTime <= currentTime) {
                if (
                    remaining[i] < minRem ||
                    (remaining[i] === minRem &&
                        processes[i].arrivalTime < processes[idx].arrivalTime)
                ) {
                    minRem = remaining[i];
                    idx = i;
                }
            }
        }

        if (idx === -1) {
            appendGantt(gantt, {
                id: 'IDLE',
                start: currentTime,
                end: currentTime + 1,
                color: '#CBD5E1',
                isIdle: true,
            });
            currentTime++;
            continue;
        }

        if (firstStart[idx] === -1) firstStart[idx] = currentTime;
        const p = processes[idx];
        appendGantt(gantt, {
            id: p.id,
            start: currentTime,
            end: currentTime + 1,
            color: p.color,
        });

        remaining[idx]--;
        currentTime++;

        if (remaining[idx] === 0) {
            completedCount++;
            const turnaroundTime = currentTime - p.arrivalTime;
            metrics.push({
                ...p,
                completionTime: currentTime,
                turnaroundTime,
                waitingTime: turnaroundTime - p.burstTime,
                responseTime: firstStart[idx] - p.arrivalTime,
            });
        }
    }

    return finalizeResult(
        'Shortest Remaining Time First (SRTF)',
        'SRTF',
        'Preemptive',
        'bg-amber-500',
        gantt,
        metrics,
        currentTime
    );
}

// 5. Priority (Preemptive)
function runPriorityPreemptive(processes: ProcessInput[]): AlgorithmResult {
    const n = processes.length;
    const remaining = processes.map((p) => p.burstTime);
    const firstStart = new Array(n).fill(-1);
    const gantt: GanttBlock[] = [];
    const metrics: ProcessMetric[] = [];
    let currentTime = 0;
    let completedCount = 0;

    while (completedCount < n) {
        let idx = -1;
        let bestPriority = Infinity;

        for (let i = 0; i < n; i++) {
            if (remaining[i] > 0 && processes[i].arrivalTime <= currentTime) {
                if (
                    processes[i].priority < bestPriority ||
                    (processes[i].priority === bestPriority &&
                        processes[i].arrivalTime < processes[idx].arrivalTime)
                ) {
                    bestPriority = processes[i].priority;
                    idx = i;
                }
            }
        }

        if (idx === -1) {
            appendGantt(gantt, {
                id: 'IDLE',
                start: currentTime,
                end: currentTime + 1,
                color: '#CBD5E1',
                isIdle: true,
            });
            currentTime++;
            continue;
        }

        if (firstStart[idx] === -1) firstStart[idx] = currentTime;
        const p = processes[idx];
        appendGantt(gantt, {
            id: p.id,
            start: currentTime,
            end: currentTime + 1,
            color: p.color,
        });

        remaining[idx]--;
        currentTime++;

        if (remaining[idx] === 0) {
            completedCount++;
            const turnaroundTime = currentTime - p.arrivalTime;
            metrics.push({
                ...p,
                completionTime: currentTime,
                turnaroundTime,
                waitingTime: turnaroundTime - p.burstTime,
                responseTime: firstStart[idx] - p.arrivalTime,
            });
        }
    }

    return finalizeResult(
        'Priority Scheduling (Preemptive)',
        'Priority (P)',
        'Preemptive',
        'bg-rose-500',
        gantt,
        metrics,
        currentTime
    );
}

// 6. Round Robin (Preemptive)
function runRoundRobin(
    processes: ProcessInput[],
    quantum: number
): AlgorithmResult {
    const n = processes.length;
    const sortedIndices = processes
        .map((_, i) => i)
        .sort((a, b) => processes[a].arrivalTime - processes[b].arrivalTime);

    const remaining = processes.map((p) => p.burstTime);
    const firstStart = new Array(n).fill(-1);
    const inQueue = new Array(n).fill(false);
    const queue: number[] = [];
    const gantt: GanttBlock[] = [];
    const metrics: ProcessMetric[] = [];

    let currentTime = 0;
    let completedCount = 0;
    const safeQuantum = Math.max(1, quantum);

    const enqueueArrivals = (time: number) => {
        for (const idx of sortedIndices) {
            if (!inQueue[idx] && remaining[idx] > 0 && processes[idx].arrivalTime <= time) {
                queue.push(idx);
                inQueue[idx] = true;
            }
        }
    };

    enqueueArrivals(0);

    while (completedCount < n) {
        if (queue.length === 0) {
            const nextArrival = Math.min(
                ...processes.filter((_, i) => remaining[i] > 0).map((p) => p.arrivalTime)
            );
            appendGantt(gantt, {
                id: 'IDLE',
                start: currentTime,
                end: nextArrival,
                color: '#CBD5E1',
                isIdle: true,
            });
            currentTime = nextArrival;
            enqueueArrivals(currentTime);
            continue;
        }

        const idx = queue.shift()!;
        if (firstStart[idx] === -1) firstStart[idx] = currentTime;

        const execTime = Math.min(safeQuantum, remaining[idx]);
        const p = processes[idx];

        appendGantt(gantt, {
            id: p.id,
            start: currentTime,
            end: currentTime + execTime,
            color: p.color,
        });

        remaining[idx] -= execTime;
        currentTime += execTime;

        enqueueArrivals(currentTime);

        if (remaining[idx] > 0) {
            queue.push(idx);
        } else {
            completedCount++;
            const turnaroundTime = currentTime - p.arrivalTime;
            metrics.push({
                ...p,
                completionTime: currentTime,
                turnaroundTime,
                waitingTime: turnaroundTime - p.burstTime,
                responseTime: firstStart[idx] - p.arrivalTime,
            });
        }
    }

    return finalizeResult(
        `Round Robin (Quantum = ${safeQuantum})`,
        `RR (Q=${safeQuantum})`,
        'Preemptive',
        'bg-cyan-500',
        gantt,
        metrics,
        currentTime
    );
}

export function simulateAllAlgorithms(
    processes: ProcessInput[],
    quantum: number
): AlgorithmResult[] {
    if (processes.length === 0) return [];
    return [
        runFCFS(processes),
        runSJFNonPreemptive(processes),
        runPriorityNonPreemptive(processes),
        runSRTF(processes),
        runPriorityPreemptive(processes),
        runRoundRobin(processes, quantum),
    ];
}