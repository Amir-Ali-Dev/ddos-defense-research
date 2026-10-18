"""Standalone figures from real complete comparison output; no synthetic fallback."""
import json
import sys
from pathlib import Path
import matplotlib
matplotlib.use("Agg")
import matplotlib.pyplot as plt

directory = Path(sys.argv[1] if len(sys.argv) > 1 else "experiments/results/latest")
raw = json.loads((directory / "raw.json").read_text(encoding="utf-8"))
summary = json.loads((directory / "summary.json").read_text(encoding="utf-8"))
assert raw["status"] == "complete" and raw["runId"] == summary["runId"]
modes = ["none", "memory-one", "memory-two", "redis-two"]
labels = ["No limit", "Memory / 1", "Memory / 2", "Redis / 2"]
colors = ["#64748b", "#0891b2", "#ea580c", "#0f766e"]
plt.rcParams.update({"font.size": 10, "svg.fonttype": "none"})

fig, axes = plt.subplots(1, 2, figsize=(10, 4.5))
for index, mode in enumerate(modes):
    trials = [r for r in summary["trials"] if r["mode"] == mode and r["scenario"] == "excess"]
    counts = [r["accepted"] for r in trials]
    axes[0].bar(index, sum(counts) / 3, color=colors[index], alpha=.75)
    axes[0].scatter([index-.12, index, index+.12], counts, color="black", s=18, zorder=3)
    normal = [r for r in summary["trials"] if r["mode"] == mode and r["scenario"] == "normal"]
    axes[1].scatter([index-.12, index, index+.12], [r["p50Ms"] for r in normal], marker="o", color=colors[index], label="p50" if index == 0 else None)
    axes[1].scatter([index-.12, index, index+.12], [r["p95Ms"] for r in normal], marker="x", color=colors[index], label="p95" if index == 0 else None)
axes[0].axhline(6, color="black", linestyle="--", label="Logical budget = 6")
axes[0].set(title="Accepted from 16 requests / trial", ylabel="HTTP 200 count", ylim=(0, 18))
axes[0].legend()
axes[1].set(title="Normal traffic: 4 requests / trial", ylabel="Complete-body HTTP elapsed time (ms)")
axes[1].legend()
for ax in axes:
    ax.set_xticks(range(4), labels, rotation=15)
    ax.grid(axis="y", alpha=.2)
fig.suptitle("Bounded functional comparison — 3 independent repetitions")
fig.text(.5, .015, "Dots show individual trials. p95 of n=4 equals the maximum. Not a throughput or DDoS-capacity benchmark.", ha="center", fontsize=9)
fig.tight_layout(rect=(0, .05, 1, .93))
fig.savefig(directory / "comparison.svg")
# Matplotlib emits trailing whitespace in SVG path attributes; normalize formatting only.
svg = directory / "comparison.svg"
svg.write_text("\n".join(line.rstrip() for line in svg.read_text(encoding="utf-8").splitlines()) + "\n", encoding="utf-8")
fig.savefig(directory / "comparison.png", dpi=140)
plt.close(fig)
print("Generated comparison.svg and comparison.png from run", raw["runId"])
