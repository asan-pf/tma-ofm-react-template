import { useState } from "react";

const DAYS = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"] as const;

type DayValue = typeof DAYS[number];

interface ScheduleEntry {
  day: DayValue;
  open: string;
  close: string;
  open24Hours: boolean;
  closed: boolean;
}

const defaultEntries: ScheduleEntry[] = DAYS.map((day) => ({
  day,
  open: "09:00",
  close: "18:00",
  open24Hours: false,
  closed: false,
}));

interface SchedulePickerProps {
  value: string;
  onChange: (scheduleString: string) => void;
}

export function SchedulePicker({ value, onChange }: SchedulePickerProps) {
  const [entries, setEntries] = useState<ScheduleEntry[]>(() => {
    try {
      if (!value) return defaultEntries;
      const parsed = JSON.parse(value);
      if (Array.isArray(parsed) && parsed.length > 0) {
        return DAYS.map((day, index) => ({
          day,
          open: parsed[index]?.open ?? "09:00",
          close: parsed[index]?.close ?? "18:00",
          open24Hours: Boolean(parsed[index]?.open24Hours),
          closed: Boolean(parsed[index]?.closed),
        }));
      }
    } catch (error) {
      console.warn("Failed to parse schedule JSON", error);
    }
    return defaultEntries;
  });

  const updateEntries = (next: ScheduleEntry[]) => {
    setEntries(next);
    onChange(JSON.stringify(next));
  };

  const toggleAllDays = (type: "open24Hours" | "closed", value: boolean) => {
    const next = entries.map((entry) => ({
      ...entry,
      [type]: value,
      ...(type === "open24Hours" && value
        ? { open: "00:00", close: "23:59" }
        : {}),
    }));
    updateEntries(next);
  };

  const handleEntryChange = (
    index: number,
    field: keyof Omit<ScheduleEntry, "day">
  ) =>
    (event: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
      const next = [...entries];
      const entry = { ...next[index] };

      if (field === "open24Hours" || field === "closed") {
        const checked = (event.target as HTMLInputElement).checked;
        entry[field] = checked;
        if (field === "open24Hours" && checked) {
          entry.open = "00:00";
          entry.close = "23:59";
          entry.closed = false;
        }
        if (field === "closed" && checked) {
          entry.open24Hours = false;
        }
      } else {
        entry[field] = event.target.value;
      }

      next[index] = entry;
      updateEntries(next);
    };

  return (
    <div
      style={{
        border: "1px solid #475569",
        borderRadius: 12,
        padding: 12,
        background: "#1f2937",
        display: "flex",
        flexDirection: "column",
        gap: 8,
      }}
    >
      <div
        style={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          marginBottom: 8,
        }}
      >
        <strong style={{ color: "#e2e8f0" }}>Weekly schedule</strong>
        <div style={{ display: "flex", gap: 8, fontSize: 12 }}>
          <label style={{ color: "#cbd5e1" }}>
            <input
              type="checkbox"
              onChange={(event) => toggleAllDays("open24Hours", event.target.checked)}
            />
            24/7
          </label>
          <label style={{ color: "#cbd5e1" }}>
            <input
              type="checkbox"
              onChange={(event) => toggleAllDays("closed", event.target.checked)}
            />
            Closed all week
          </label>
        </div>
      </div>

      {entries.map((entry, index) => (
        <div
          key={entry.day}
          style={{
            display: "grid",
            gridTemplateColumns: "80px minmax(0, 1fr) minmax(0, 1fr)",
            gap: 8,
            alignItems: "center",
            color: "#f1f5f9",
            fontSize: 14,
          }}
        >
          <div>{entry.day}</div>
          <div style={{ display: "flex", gap: 6, alignItems: "center" }}>
            <label style={{ display: "flex", gap: 4, alignItems: "center" }}>
              <input
                type="checkbox"
                checked={entry.open24Hours}
                onChange={handleEntryChange(index, "open24Hours")}
              />
              24h
            </label>
            <label style={{ display: "flex", gap: 4, alignItems: "center" }}>
              <input
                type="checkbox"
                checked={entry.closed}
                onChange={handleEntryChange(index, "closed")}
              />
              Closed
            </label>
          </div>
          <div style={{ display: "flex", gap: 6 }}>
            <input
              type="time"
              value={entry.open}
              disabled={entry.open24Hours || entry.closed}
              onChange={handleEntryChange(index, "open")}
              style={{ flex: 1, borderRadius: 8, border: "1px solid #475569" }}
            />
            <input
              type="time"
              value={entry.close}
              disabled={entry.open24Hours || entry.closed}
              onChange={handleEntryChange(index, "close")}
              style={{ flex: 1, borderRadius: 8, border: "1px solid #475569" }}
            />
          </div>
        </div>
      ))}
    </div>
  );
}
