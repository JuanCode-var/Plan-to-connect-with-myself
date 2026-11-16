import type { ReactNode } from "react";
import { useJournalEntries } from "../api/journal";
import { DIARIO_SECTION_COLORS, EMOTION_COLORS, EMOTION_FALLBACK_COLOR, type DiarioSection } from "../domain";
import { todayISO } from "../lib/date";
import { formatShortDate } from "../lib/journalDate";
import { DIARIO_WEEKDAY_LABELS, mondayOfWeek, weekDaysISO } from "../lib/journalWeek";
import {
  closestMemoryEntries,
  dominantEmotionByDay,
  emotionWeekSummaryText,
  entryDateStreak,
  flowMinutesByDay,
  formatHoursMinutes,
  longestFlowSessions,
} from "../lib/journalSummary";
import { NEURAL_CARD_BG, NEURAL_CARD_BORDER, NEURAL_CYAN, NEURAL_GOLD, NEURAL_LAVENDER, NEURAL_TEXT, NEURAL_TEXT_SECONDARY } from "./NeuralCore/tokens";

function emotionColor(emotion: string | null): string {
  return (emotion && (EMOTION_COLORS as Record<string, string>)[emotion]) || EMOTION_FALLBACK_COLOR;
}

function weekdayLong(dateISO: string): string {
  const d = new Date(`${dateISO}T00:00:00`);
  const label = d.toLocaleDateString("es-CO", { weekday: "long" });
  return label.charAt(0).toUpperCase() + label.slice(1);
}

function PanelCard({ title, link, children }: { title: string; link?: { label: string; onClick: () => void }; children: ReactNode }) {
  return (
    <div className="flex flex-col gap-3 rounded-2xl border p-5" style={{ background: NEURAL_CARD_BG, borderColor: NEURAL_CARD_BORDER }}>
      <div className="flex items-center justify-between gap-2">
        <span className="text-xs font-bold tracking-[0.1em] uppercase" style={{ color: NEURAL_LAVENDER }}>
          {title}
        </span>
        {link && (
          <button type="button" onClick={link.onClick} className="shrink-0 text-xs font-semibold" style={{ color: NEURAL_CYAN }}>
            {link.label}
          </button>
        )}
      </div>
      {children}
    </div>
  );
}

function WeekStrip({ weekDays, renderDay }: { weekDays: string[]; renderDay: (day: string, index: number) => ReactNode }) {
  return (
    <div className="flex justify-between gap-1">
      {weekDays.map((day, i) => (
        <div key={day} className="flex flex-col items-center gap-1.5">
          {renderDay(day, i)}
          <span className="text-[11px]" style={{ color: NEURAL_TEXT_SECONDARY }}>
            {DIARIO_WEEKDAY_LABELS[i]}
          </span>
        </div>
      ))}
    </div>
  );
}

function dayCircleStyle(day: string, today: string, filledBg?: string): React.CSSProperties {
  const isFuture = day > today;
  const isToday = day === today;
  return {
    background: filledBg ?? "transparent",
    border: isToday ? "2px solid #FFFFFF" : isFuture ? "1px dashed rgba(255,255,255,.22)" : "1px solid rgba(255,255,255,.12)",
  };
}

function EmptyNote({ text }: { text: string }) {
  return (
    <p className="m-0 text-sm italic" style={{ color: NEURAL_TEXT_SECONDARY }}>
      {text}
    </p>
  );
}

function EmotionSidePanel({ onOpenHistory }: { onOpenHistory: () => void }) {
  const today = todayISO();
  const weekDays = weekDaysISO(mondayOfWeek(today));
  const { data: weekEntries } = useJournalEntries({ kind: "emotion", from: weekDays[0], to: weekDays[6] });
  const { data: recentEntries } = useJournalEntries({ kind: "emotion" });

  const byDay = dominantEmotionByDay(weekEntries ?? [], weekDays);
  const summary = emotionWeekSummaryText(byDay);
  const recent = (recentEntries ?? []).slice(0, 3);

  return (
    <div className="flex flex-col gap-4">
      <PanelCard title="Tu semana emocional">
        <WeekStrip
          weekDays={weekDays}
          renderDay={(day, i) => {
            const dominant = byDay[i];
            return <span className="h-9 w-9 rounded-full" style={dayCircleStyle(day, today, dominant?.color)} />;
          }}
        />
        {summary && (
          <p className="m-0 text-sm" style={{ color: NEURAL_TEXT_SECONDARY }}>
            {summary}
          </p>
        )}
      </PanelCard>

      <PanelCard title="Últimos registros" link={{ label: "Ver todos →", onClick: onOpenHistory }}>
        {recent.length === 0 ? (
          <EmptyNote text="Todavía no tienes registros emocionales." />
        ) : (
          <ul className="flex flex-col gap-3">
            {recent.map((entry) => {
              const color = emotionColor(entry.emotion);
              return (
                <li key={entry.id} className="border-l-2 pl-3" style={{ borderColor: color }}>
                  <span className="text-xs" style={{ color }}>
                    {formatShortDate(entry.date)} · {entry.emotion}
                  </span>
                  <p className="font-reading m-0 line-clamp-2 text-sm" style={{ fontFamily: "'Lora', Georgia, serif", color: NEURAL_TEXT }}>
                    {entry.situation ?? entry.feeling ?? entry.decision ?? entry.learning}
                  </p>
                </li>
              );
            })}
          </ul>
        )}
      </PanelCard>
    </div>
  );
}

function KnowledgeSidePanel({ onOpenHistory }: { onOpenHistory: () => void }) {
  const today = todayISO();
  const weekDays = weekDaysISO(mondayOfWeek(today));
  const { data: weekEntries } = useJournalEntries({ kind: "knowledge", from: weekDays[0], to: weekDays[6] });
  const { data: recentEntries } = useJournalEntries({ kind: "knowledge" });

  const weekList = weekEntries ?? [];
  const reflectionsCount = weekList.length;
  const learningsCount = weekList.filter((e) => e.learningId).length;
  const summary =
    reflectionsCount === 0
      ? null
      : `Escribiste ${reflectionsCount} ${reflectionsCount === 1 ? "reflexión" : "reflexiones"} esta semana.${
          learningsCount > 0 ? ` ${learningsCount} ya ${learningsCount === 1 ? "es un aprendizaje" : "son aprendizajes"} en Micro acciones.` : ""
        }`;

  const recent = (recentEntries ?? []).slice(0, 3);

  return (
    <div className="flex flex-col gap-4">
      <PanelCard title="Tu semana de aprendizaje">
        <WeekStrip
          weekDays={weekDays}
          renderDay={(day) => {
            const has = weekList.some((e) => e.date.slice(0, 10) === day);
            return <span className="h-9 w-9 rounded-full" style={dayCircleStyle(day, today, has ? DIARIO_SECTION_COLORS.knowledge : undefined)} />;
          }}
        />
        {summary && (
          <p className="m-0 text-sm" style={{ color: NEURAL_TEXT_SECONDARY }}>
            {summary}
          </p>
        )}
      </PanelCard>

      <PanelCard title="Últimas reflexiones" link={{ label: "Ver todos →", onClick: onOpenHistory }}>
        {recent.length === 0 ? (
          <EmptyNote text="Todavía no tienes reflexiones." />
        ) : (
          <ul className="flex flex-col gap-3">
            {recent.map((entry) => (
              <li key={entry.id} className="border-l-2 pl-3" style={{ borderColor: DIARIO_SECTION_COLORS.knowledge }}>
                <span className="text-xs" style={{ color: NEURAL_TEXT_SECONDARY }}>
                  {formatShortDate(entry.date)}
                  {entry.source && ` · ${entry.source}`}
                </span>
                <p className="font-reading m-0 line-clamp-2 text-sm" style={{ fontFamily: "'Lora', Georgia, serif", color: NEURAL_TEXT }}>
                  {entry.knowledge}
                </p>
              </li>
            ))}
          </ul>
        )}
      </PanelCard>
    </div>
  );
}

function GratitudeSidePanel({ onOpenHistory }: { onOpenHistory: () => void }) {
  const today = todayISO();
  const weekDays = weekDaysISO(mondayOfWeek(today));
  const { data: allEntries } = useJournalEntries({ kind: "gratitude" });

  const list = allEntries ?? [];
  const dates = list.map((e) => e.date.slice(0, 10));
  const streak = entryDateStreak(dates, today);
  const memories = closestMemoryEntries(list, today);

  return (
    <div className="flex flex-col gap-4">
      <PanelCard title={`${streak} ${streak === 1 ? "día seguido" : "días seguidos"} agradeciendo`}>
        <WeekStrip
          weekDays={weekDays}
          renderDay={(day) => {
            const has = dates.includes(day);
            return (
              <span
                className="flex h-9 w-9 items-center justify-center rounded-full text-xs font-bold"
                style={{ ...dayCircleStyle(day, today, has ? NEURAL_GOLD : undefined), color: has ? "#3A2E05" : NEURAL_TEXT_SECONDARY }}
              >
                {has && "✓"}
              </span>
            );
          }}
        />
        <p className="m-0 text-sm" style={{ color: NEURAL_TEXT_SECONDARY }}>
          La gratitud diaria entrena tu atención para notar lo que sí funciona.
        </p>
      </PanelCard>

      <PanelCard title="Un recuerdo de gratitud" link={{ label: "Ver todos →", onClick: onOpenHistory }}>
        {memories.length === 0 ? (
          <EmptyNote text="Todavía no tienes suficiente historial para un recuerdo." />
        ) : (
          <ul className="flex flex-col gap-3">
            {memories.map(({ label, entry }) => (
              <li key={entry.id} className="border-l-2 pl-3" style={{ borderColor: NEURAL_GOLD }}>
                <span className="text-xs" style={{ color: NEURAL_TEXT_SECONDARY }}>
                  {label}
                </span>
                <p className="font-reading m-0 line-clamp-2 text-sm" style={{ fontFamily: "'Lora', Georgia, serif", color: NEURAL_TEXT }}>
                  {entry.gratitude}
                </p>
              </li>
            ))}
          </ul>
        )}
      </PanelCard>
    </div>
  );
}

function FlowSidePanel({ onOpenHistory }: { onOpenHistory: () => void }) {
  const today = todayISO();
  const weekDays = weekDaysISO(mondayOfWeek(today));
  const { data: allEntries } = useJournalEntries({ kind: "flow" });

  const list = allEntries ?? [];
  const minutesByDay = flowMinutesByDay(list, weekDays);
  const weekTotal = minutesByDay.reduce((a, b) => a + b, 0);
  const maxMinutes = Math.max(...minutesByDay, 1);
  const longest = longestFlowSessions(list, 3);

  return (
    <div className="flex flex-col gap-4">
      <PanelCard title="Tu flow esta semana">
        <div className="flex items-end justify-between gap-1" style={{ height: 96 }}>
          {weekDays.map((day, i) => {
            const minutes = minutesByDay[i];
            const isFuture = day > today;
            const heightPct = minutes > 0 ? Math.max((minutes / maxMinutes) * 100, 8) : 0;
            return (
              <div key={day} className="flex flex-1 flex-col items-center justify-end gap-1">
                {minutes > 0 && (
                  <span className="text-[11px] font-semibold" style={{ color: NEURAL_TEXT_SECONDARY }}>
                    {minutes}
                  </span>
                )}
                <div
                  className="w-full rounded-t-md transition-[height] duration-300"
                  style={{
                    height: `${heightPct}%`,
                    minHeight: minutes > 0 ? 4 : isFuture ? 0 : 2,
                    background: minutes > 0 ? DIARIO_SECTION_COLORS.flow : "rgba(255,255,255,.08)",
                  }}
                />
                <span className="text-[11px]" style={{ color: NEURAL_TEXT_SECONDARY }}>
                  {DIARIO_WEEKDAY_LABELS[i]}
                </span>
              </div>
            );
          })}
        </div>
        {weekTotal > 0 && (
          <p className="m-0 text-sm" style={{ color: NEURAL_TEXT_SECONDARY }}>
            Esta semana: {formatHoursMinutes(weekTotal)} de enfoque profundo.
          </p>
        )}
      </PanelCard>

      <PanelCard title="Dónde encuentras tu flow" link={{ label: "Ver todos →", onClick: onOpenHistory }}>
        {longest.length === 0 ? (
          <EmptyNote text="Todavía no tienes sesiones registradas." />
        ) : (
          <ul className="flex flex-col gap-3">
            {longest.map((entry) => (
              <li key={entry.id} className="border-l-2 pl-3" style={{ borderColor: DIARIO_SECTION_COLORS.flow }}>
                <span className="text-xs" style={{ color: NEURAL_TEXT_SECONDARY }}>
                  {weekdayLong(entry.date.slice(0, 10))} · {entry.flowMinutes} min
                </span>
                {entry.flowActivity && (
                  <p className="m-0 text-sm font-semibold" style={{ color: NEURAL_TEXT }}>
                    {entry.flowActivity}
                  </p>
                )}
              </li>
            ))}
          </ul>
        )}
      </PanelCard>
    </div>
  );
}

export function JournalSidePanel({ section, onOpenHistory }: { section: DiarioSection; onOpenHistory: () => void }) {
  if (section === "emotion") return <EmotionSidePanel onOpenHistory={onOpenHistory} />;
  if (section === "knowledge") return <KnowledgeSidePanel onOpenHistory={onOpenHistory} />;
  if (section === "gratitude") return <GratitudeSidePanel onOpenHistory={onOpenHistory} />;
  return <FlowSidePanel onOpenHistory={onOpenHistory} />;
}
