import { useEffect, useMemo, useRef, useState } from "react";
import {
  useCreateLibraryEntry,
  useDeleteLibraryEntry,
  useLibrary,
  usePinLibraryEntry,
  useUnpinLibraryEntry,
  type LibraryEntry,
} from "../api/library";
import {
  LIBRARY_SECTION_COLORS,
  LIBRARY_SECTIONS,
  LIBRARY_SECTION_LABELS,
  PIN_DURATIONS,
  PIN_DURATION_LABELS,
  type LibrarySection,
  type PinDuration,
} from "../domain";
import { SectionPager } from "../components/SectionPager";

function isCurrentlyPinned(entry: LibraryEntry): boolean {
  return !!entry.pinnedUntil && new Date(entry.pinnedUntil) > new Date();
}

const SECTION_HINT: Record<LibrarySection, string> = {
  LIBRO: "Libros recomendados — los curados por la app y los que quieras agregar vos.",
  FRASE: "Frases que aparecen al entrar cada día y cuando marcás un hábito como cumplido.",
  FILOSOFIA: "Formas de ver la vida para practicar, no solo leer.",
};

const SECTION_ICON: Record<LibrarySection, string> = {
  LIBRO: "📖",
  FRASE: "💬",
  FILOSOFIA: "🧭",
};

const SECTION_FORM_FIELDS: Record<LibrarySection, { title: boolean; author: boolean; contentLabel: string }> = {
  LIBRO: { title: true, author: true, contentLabel: "Por qué lo recomendás" },
  FRASE: { title: false, author: true, contentLabel: "Frase" },
  FILOSOFIA: { title: true, author: false, contentLabel: "En qué consiste / cómo practicarla" },
};

// Las entradas sin título (frases) no tienen un nombre corto propio: en la
// lista se muestra un recorte de su contenido a modo de "título", y el texto
// completo solo aparece al abrir la vista de lectura.
const LIST_LABEL_TRUNCATE_AT = 90;

function entryListLabel(entry: LibraryEntry): string {
  if (entry.title) return entry.title;
  return entry.content.length > LIST_LABEL_TRUNCATE_AT
    ? `${entry.content.slice(0, LIST_LABEL_TRUNCATE_AT).trimEnd()}…`
    : entry.content;
}

// Recorte para el cuerpo de la tarjeta (distinto del "título" de
// entryListLabel): solo se muestra cuando la entrada SÍ tiene título propio,
// para no repetir dos veces el mismo texto en una frase sin título.
const CARD_PREVIEW_TRUNCATE_AT = 160;

function cardPreview(entry: LibraryEntry): string | null {
  if (!entry.title) return null;
  return entry.content.length > CARD_PREVIEW_TRUNCATE_AT
    ? `${entry.content.slice(0, CARD_PREVIEW_TRUNCATE_AT).trimEnd()}…`
    : entry.content;
}

/**
 * Anclar una frase en /tracker: sin window.confirm (convención del proyecto,
 * ver DeleteCycleButton.tsx), un panel propio para elegir cuánto tiempo se
 * queda ahí. En flujo normal (no `absolute`): `.mosaic-card` tiene
 * `overflow: hidden` (para recortar la franja de color de arriba) y un
 * overlay absoluto quedaría cortado — este panel empuja la tarjeta más alta
 * en vez de superponerse. No es una acción destructiva, por eso ancla al
 * toque sin paso de confirmación extra; "Desanclar" da marcha atrás.
 */
function PinQuoteButton({
  entry,
  onPin,
  onUnpin,
  isPending,
}: {
  entry: LibraryEntry;
  onPin: (id: string, duration: PinDuration) => void;
  onUnpin: (id: string) => void;
  isPending: boolean;
}) {
  const [open, setOpen] = useState(false);
  const pinned = isCurrentlyPinned(entry);

  return (
    <div onClick={(e) => e.stopPropagation()}>
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        className="text-xs font-semibold"
        style={{ color: pinned ? "var(--accent)" : "var(--text-2)" }}
      >
        {pinned ? "📌 Anclada en Seguimiento" : "📌 Anclar en Seguimiento"}
      </button>

      {open && (
        <div
          className="panel-expand-in mt-2 rounded-xl border p-3"
          style={{ background: "var(--surface)", borderColor: "var(--border)" }}
        >
          <p className="text-xs font-semibold" style={{ color: "var(--text)" }}>
            Ver en Seguimiento durante…
          </p>
          <div className="mt-2 flex flex-col gap-1">
            {PIN_DURATIONS.map((duration) => (
              <button
                key={duration}
                type="button"
                disabled={isPending}
                onClick={() => {
                  onPin(entry.id, duration);
                  setOpen(false);
                }}
                className="rounded-lg px-2 py-1.5 text-left text-xs disabled:opacity-60"
                style={{ background: "var(--bg)", color: "var(--text)" }}
              >
                {PIN_DURATION_LABELS[duration]}
              </button>
            ))}
          </div>
          {pinned && (
            <button
              type="button"
              disabled={isPending}
              onClick={() => {
                onUnpin(entry.id);
                setOpen(false);
              }}
              className="mt-2 text-xs underline disabled:opacity-60"
              style={{ color: "var(--text-2)" }}
            >
              Desanclar
            </button>
          )}
        </div>
      )}
    </div>
  );
}

function EntryTile({
  entry,
  onOpen,
  onDelete,
  onPin,
  onUnpin,
  pinPending,
}: {
  entry: LibraryEntry;
  onOpen: (entry: LibraryEntry) => void;
  onDelete: (id: string) => void;
  onPin: (id: string, duration: PinDuration) => void;
  onUnpin: (id: string) => void;
  pinPending: boolean;
}) {
  const label = entryListLabel(entry);
  const preview = cardPreview(entry);

  return (
    <li
      className="mosaic-card panel-card rounded-2xl border pt-5"
      style={
        {
          // --bg, no --surface (igual que la columna que la contiene): así
          // cada tarjeta se distingue del panel, no se funde con él (mismo
          // criterio que HabitCard.tsx).
          background: "var(--bg)",
          borderColor: "var(--border)",
          "--tile-accent": LIBRARY_SECTION_COLORS[entry.section],
        } as React.CSSProperties
      }
    >
      <button type="button" onClick={() => onOpen(entry)} className="block w-full px-4 pb-3 text-left">
        <div className="flex items-center gap-2">
          <span className="text-base" aria-hidden>
            {SECTION_ICON[entry.section]}
          </span>
          <p
            className={`font-display min-w-0 flex-1 font-semibold ${entry.title ? "" : "font-reading italic"}`}
            style={{ color: "var(--text)" }}
          >
            {entry.title ? label : `"${label}"`}
          </p>
        </div>
        {entry.author && (
          <p className="mt-1 text-xs" style={{ color: "var(--text-2)" }}>
            — {entry.author}
          </p>
        )}
        {preview && (
          <p className="mt-2 line-clamp-3 text-sm" style={{ color: "var(--text-2)" }}>
            {preview}
          </p>
        )}
        <p className="mt-2.5 text-xs font-semibold" style={{ color: "var(--accent)" }}>
          Leer →
        </p>
      </button>

      {entry.section === "FRASE" && (
        <div className="px-4 pb-4">
          <PinQuoteButton entry={entry} onPin={onPin} onUnpin={onUnpin} isPending={pinPending} />
        </div>
      )}

      {entry.source === "USER" && (
        <button
          type="button"
          onClick={() => onDelete(entry.id)}
          aria-label="Eliminar entrada"
          title="Eliminar"
          className="absolute top-2 right-2 rounded-lg px-1.5 py-1 text-xs"
          style={{ color: "var(--text-2)" }}
        >
          ✕
        </button>
      )}
    </li>
  );
}

const READING_WORDS_PER_MINUTE = 200;

function estimateReadingMinutes(content: string): number {
  const words = content.trim().split(/\s+/).filter(Boolean).length;
  return Math.max(1, Math.round(words / READING_WORDS_PER_MINUTE));
}

// Separa en párrafos por línea en blanco (como vienen los textos largos) y
// adentro de cada párrafo respeta los saltos de línea simples — así una
// cita de 59 000 caracteres no se convierte en un único bloque gigante.
function toParagraphs(content: string): string[] {
  return content
    .split(/\n{2,}/)
    .map((p) => p.trim())
    .filter(Boolean);
}

type ReaderFontSize = "sm" | "md" | "lg";

const READER_FONT_SIZE: Record<ReaderFontSize, { fontSize: string; lineHeight: number }> = {
  sm: { fontSize: "1rem", lineHeight: 1.85 },
  md: { fontSize: "1.125rem", lineHeight: 1.9 },
  lg: { fontSize: "1.3rem", lineHeight: 1.95 },
};

/**
 * Vista aparte para leer con calma: se abre al tocar una entrada y reemplaza
 * la lista de títulos por el contenido completo. Pensada para que dé gusto
 * quedarse leyendo: tipografía serif, columna angosta, progreso de lectura y
 * control de tamaño de letra — no es un modal genérico con texto adentro.
 */
function LibraryReader({ entry, onClose }: { entry: LibraryEntry; onClose: () => void }) {
  const [fontSize, setFontSize] = useState<ReaderFontSize>("md");
  const [progress, setProgress] = useState(0);
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function onKeyDown(e: KeyboardEvent) {
      if (e.key === "Escape") onClose();
    }
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [onClose]);

  function handleScroll() {
    const el = scrollRef.current;
    if (!el) return;
    const max = el.scrollHeight - el.clientHeight;
    setProgress(max > 0 ? Math.min(100, Math.round((el.scrollTop / max) * 100)) : 100);
  }

  const paragraphs = useMemo(() => toParagraphs(entry.content), [entry.content]);
  const readingMinutes = useMemo(() => estimateReadingMinutes(entry.content), [entry.content]);
  const isQuote = entry.section === "FRASE";
  const { fontSize: fontSizePx, lineHeight } = READER_FONT_SIZE[fontSize];

  return (
    <div className="fixed inset-0 z-50">
      <div className="reader-progress-track">
        <div className="reader-progress-fill" style={{ width: `${progress}%` }} />
      </div>
      <div
        ref={scrollRef}
        onScroll={handleScroll}
        className="reader-backdrop reader-scroll absolute inset-0 overflow-y-auto p-4 pt-8 sm:p-8 sm:pt-12"
        onClick={onClose}
      >
        <article
          className="reader-card-in mx-auto mb-10 max-w-2xl overflow-hidden rounded-2xl border shadow-2xl"
          style={{ background: "var(--reading-surface)", borderColor: "var(--border)", color: "var(--text)" }}
          onClick={(e) => e.stopPropagation()}
        >
          <header
            className="sticky top-0 z-10 flex items-start justify-between gap-4 border-b px-6 py-4 sm:px-10"
            style={{ background: "var(--reading-surface)", borderColor: "var(--border)" }}
          >
            <div className="flex items-center gap-2 text-xs font-semibold tracking-wide uppercase" style={{ color: "var(--accent)" }}>
              <span aria-hidden>{SECTION_ICON[entry.section]}</span>
              {LIBRARY_SECTION_LABELS[entry.section]}
              {!isQuote && (
                <span className="font-mono-num normal-case" style={{ color: "var(--text-2)" }}>
                  · {readingMinutes} min de lectura
                </span>
              )}
            </div>
            <div className="flex shrink-0 items-center gap-1">
              <div
                className="mr-1 flex items-center gap-0.5 rounded-lg border p-0.5"
                style={{ borderColor: "var(--border)" }}
                role="group"
                aria-label="Tamaño de letra"
              >
                {(["sm", "md", "lg"] as const).map((size) => (
                  <button
                    key={size}
                    type="button"
                    onClick={() => setFontSize(size)}
                    aria-label={`Letra ${size === "sm" ? "pequeña" : size === "md" ? "media" : "grande"}`}
                    aria-pressed={fontSize === size}
                    className="rounded-md px-1.5 py-1 text-xs font-bold"
                    style={{
                      color: fontSize === size ? "var(--accent-ink)" : "var(--text-2)",
                      background: fontSize === size ? "var(--accent)" : "transparent",
                    }}
                  >
                    A
                  </button>
                ))}
              </div>
              <button
                type="button"
                onClick={onClose}
                aria-label="Cerrar"
                className="shrink-0 rounded-lg px-2.5 py-1.5 text-sm font-semibold"
                style={{ background: "var(--accent-soft)", color: "var(--accent)" }}
              >
                Cerrar
              </button>
            </div>
          </header>

          <div className="px-6 py-8 sm:px-10 sm:py-10">
            {!isQuote && (entry.title || entry.author) && (
              <div className="mb-8">
                {entry.title && (
                  <h2 className="font-display text-2xl leading-tight font-bold sm:text-3xl" style={{ color: "var(--text)" }}>
                    {entry.title}
                  </h2>
                )}
                {entry.author && (
                  <p className="mt-2 text-sm" style={{ color: "var(--text-2)" }}>
                    {entry.author}
                  </p>
                )}
              </div>
            )}

            {isQuote ? (
              <blockquote className="flex flex-col items-center gap-5 py-6 text-center">
                <span className="font-display text-5xl leading-none select-none" style={{ color: "var(--accent)" }} aria-hidden>
                  “
                </span>
                <p className="font-reading text-2xl font-medium italic sm:text-3xl" style={{ color: "var(--text)", lineHeight: 1.5 }}>
                  {entry.content}
                </p>
                {entry.author && (
                  <footer className="font-display text-sm font-semibold tracking-wide uppercase" style={{ color: "var(--accent)" }}>
                    — {entry.author}
                  </footer>
                )}
              </blockquote>
            ) : (
              <div
                className="font-reading"
                style={{ color: "var(--text)", fontSize: fontSizePx, lineHeight }}
              >
                {paragraphs.map((paragraph, i) => (
                  <p key={i} className="mb-5 whitespace-pre-line last:mb-0">
                    {paragraph}
                  </p>
                ))}
              </div>
            )}
          </div>
        </article>
      </div>
    </div>
  );
}

function AddEntryForm({ section, onDone }: { section: LibrarySection; onDone: () => void }) {
  const fields = SECTION_FORM_FIELDS[section];
  const [title, setTitle] = useState("");
  const [author, setAuthor] = useState("");
  const [content, setContent] = useState("");
  const createEntry = useCreateLibraryEntry();

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!content.trim()) return;
    createEntry.mutate(
      {
        section,
        title: fields.title && title.trim() ? title.trim() : undefined,
        author: fields.author && author.trim() ? author.trim() : undefined,
        content: content.trim(),
      },
      { onSuccess: onDone },
    );
  }

  return (
    <form
      onSubmit={handleSubmit}
      className="flex flex-col gap-2.5 rounded-xl border p-3.5"
      style={{ background: "var(--surface)", borderColor: "var(--border)" }}
    >
      {fields.title && (
        <input
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          placeholder="Título"
          className="rounded-lg border p-2 text-sm"
          style={{ background: "var(--bg)", borderColor: "var(--border)", color: "var(--text)" }}
        />
      )}
      {fields.author && (
        <input
          value={author}
          onChange={(e) => setAuthor(e.target.value)}
          placeholder="Autor (opcional)"
          className="rounded-lg border p-2 text-sm"
          style={{ background: "var(--bg)", borderColor: "var(--border)", color: "var(--text)" }}
        />
      )}
      <textarea
        value={content}
        onChange={(e) => setContent(e.target.value)}
        placeholder={fields.contentLabel}
        rows={3}
        className="rounded-lg border p-2 text-sm"
        style={{ background: "var(--bg)", borderColor: "var(--border)", color: "var(--text)" }}
      />
      <div className="flex justify-end gap-2">
        <button
          type="button"
          onClick={onDone}
          className="rounded-lg border px-3 py-1.5 text-xs"
          style={{ borderColor: "var(--border)", color: "var(--text-2)" }}
        >
          Cancelar
        </button>
        <button
          type="submit"
          disabled={createEntry.isPending || !content.trim()}
          className="rounded-lg px-3 py-1.5 text-xs font-semibold disabled:opacity-60"
          style={{ background: "var(--accent)", color: "var(--accent-ink)" }}
        >
          {createEntry.isPending ? "Guardando…" : "Agregar"}
        </button>
      </div>
    </form>
  );
}

/**
 * Antes: las 3 secciones en columnas lado a lado (cada una a 1/3 del ancho).
 * Ahora: una sola sección a todo el ancho por vez, con pestañas + flechas
 * para pasar a la otra (ver SectionPager.tsx) — el mosaico de tarjetas
 * aprovecha todo el ancho en vez de competir por 1/3 de la pantalla.
 */
const VISIBLE_ENTRIES_COLLAPSED = 12;

function LibrarySectionPanel({
  section,
  onOpenEntry,
}: {
  section: LibrarySection;
  onOpenEntry: (entry: LibraryEntry) => void;
}) {
  const { data: entries, isLoading, isError } = useLibrary(section);
  const deleteEntry = useDeleteLibraryEntry();
  const pinEntry = usePinLibraryEntry();
  const unpinEntry = useUnpinLibraryEntry();
  const [showForm, setShowForm] = useState(false);
  // Cada sección arranca mostrando solo algunas entradas (ver "Ver más"
  // abajo): con las 63 frases de entrada, mostrar la biblioteca curada
  // completa hacía la página larguísima de nuevo.
  const [expanded, setExpanded] = useState(false);
  const visibleEntries = expanded ? entries : entries?.slice(0, VISIBLE_ENTRIES_COLLAPSED);
  const hiddenCount = entries ? entries.length - VISIBLE_ENTRIES_COLLAPSED : 0;

  return (
    <section
      className="flex flex-col gap-3 rounded-2xl border p-4"
      style={{ background: "var(--surface)", borderColor: "var(--border)" }}
    >
      <div className="flex items-start justify-between gap-2">
        <h2 className="font-display font-semibold" style={{ color: "var(--text)" }}>
          {LIBRARY_SECTION_LABELS[section]}
        </h2>
        <button
          type="button"
          onClick={() => setShowForm((v) => !v)}
          className="shrink-0 rounded-lg px-2.5 py-1 text-xs font-semibold"
          style={{ background: "var(--accent)", color: "var(--accent-ink)" }}
        >
          {showForm ? "Cerrar" : "+ Agregar"}
        </button>
      </div>

      <p className="text-xs" style={{ color: "var(--text-2)" }}>
        {SECTION_HINT[section]}
      </p>

      {showForm && <AddEntryForm section={section} onDone={() => setShowForm(false)} />}

      {isLoading && <p style={{ color: "var(--text-2)" }}>Cargando…</p>}
      {isError && <p className="text-red-500">No se pudo cargar la biblioteca.</p>}

      {entries && entries.length === 0 && (
        <p className="text-sm" style={{ color: "var(--text-2)" }}>
          Todavía no hay nada acá.
        </p>
      )}

      <ul className="mosaic-wall columns-1 sm:columns-2 lg:columns-3 xl:columns-4">
        {visibleEntries?.map((entry) => (
          <EntryTile
            key={entry.id}
            entry={entry}
            onOpen={onOpenEntry}
            onDelete={(id) => deleteEntry.mutate(id)}
            onPin={(id, duration) => pinEntry.mutate({ id, duration })}
            onUnpin={(id) => unpinEntry.mutate(id)}
            pinPending={pinEntry.isPending || unpinEntry.isPending}
          />
        ))}
      </ul>

      {hiddenCount > 0 && (
        <button
          type="button"
          onClick={() => setExpanded((v) => !v)}
          className="self-center rounded-lg px-3 py-1.5 text-xs font-semibold"
          style={{ color: "var(--accent)" }}
        >
          {expanded ? "Ver menos" : `Ver ${hiddenCount} más`}
        </button>
      )}
    </section>
  );
}

export function Library() {
  const [openEntry, setOpenEntry] = useState<LibraryEntry | null>(null);
  const [section, setSection] = useState<LibrarySection>(LIBRARY_SECTIONS[0]);

  return (
    <div className="min-h-full px-4 py-6 sm:px-8 sm:py-8" style={{ color: "var(--text)" }}>
      <div className="mx-auto flex max-w-6xl flex-col gap-6">
        <h1 className="font-display text-2xl font-bold sm:text-3xl">Biblioteca</h1>

        <SectionPager
          sections={LIBRARY_SECTIONS}
          labels={LIBRARY_SECTION_LABELS}
          active={section}
          onChange={setSection}
          panels={Object.fromEntries(
            LIBRARY_SECTIONS.map((s) => [s, <LibrarySectionPanel key={s} section={s} onOpenEntry={setOpenEntry} />]),
          ) as Record<LibrarySection, React.ReactNode>}
        />
      </div>

      {openEntry && <LibraryReader entry={openEntry} onClose={() => setOpenEntry(null)} />}
    </div>
  );
}
