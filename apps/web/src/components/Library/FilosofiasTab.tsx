import { Link } from "react-router-dom";
import type { LibrarySchool } from "../../api/library";
import { AREA_OF_CATEGORY, BRAIN_AREA_COLOR } from "../NeuralCore/brainTokens";
import { NEURAL_FONT_BODY, NEURAL_FONT_DISPLAY, NEURAL_TEXT_SECONDARY } from "../NeuralCore/tokens";

function schoolStateLabel(currentDay: number): string {
  if (currentDay === 0) return "Sin empezar";
  if (currentDay >= 7) return "Completado";
  return `Día ${currentDay} de 7`;
}

function SchoolRow({ school }: { school: LibrarySchool }) {
  const color = school.area ? BRAIN_AREA_COLOR[AREA_OF_CATEGORY[school.area]] : "#C4B5FD";
  return (
    <Link
      to={`/library/escuela/${school.id}`}
      className="flex items-center gap-4 rounded-r-xl py-4 pr-4 no-underline"
      style={{ borderLeft: `4px solid ${color}`, paddingLeft: 16, background: "rgba(255,255,255,0.03)" }}
    >
      <div className="flex min-w-0 flex-1 flex-col gap-1">
        <span style={{ fontFamily: NEURAL_FONT_DISPLAY, fontSize: 18, fontWeight: 700, color: "#FFFFFF" }}>{school.name}</span>
        <span style={{ fontFamily: NEURAL_FONT_BODY, fontSize: 13, color: NEURAL_TEXT_SECONDARY }}>
          {school.entryCount} {school.entryCount === 1 ? "pieza" : "piezas"}
        </span>
      </div>
      <div className="flex flex-shrink-0 flex-col items-end gap-2">
        <div className="flex gap-1">
          {Array.from({ length: 7 }, (_, i) => (
            <span key={i} style={{ width: 16, height: 5, borderRadius: 2.5, background: i < school.currentDay ? color : "rgba(255,255,255,0.1)" }} />
          ))}
        </div>
        <span style={{ fontFamily: NEURAL_FONT_BODY, fontSize: 12, color: NEURAL_TEXT_SECONDARY }}>{schoolStateLabel(school.currentDay)}</span>
      </div>
    </Link>
  );
}

/** Pestaña "Filosofías" (Fase 1, punto 6). */
export function FilosofiasTab({ schools }: { schools: LibrarySchool[] }) {
  return (
    <div className="flex flex-col gap-5">
      <p className="m-0" style={{ fontFamily: NEURAL_FONT_BODY, fontSize: 14, lineHeight: 1.6, color: NEURAL_TEXT_SECONDARY, maxWidth: 640 }}>
        Formas de ver la vida para practicar. Cada una trae un reto de 7 días.
      </p>
      <div className="flex flex-col gap-3">
        {schools.map((school) => (
          <SchoolRow key={school.id} school={school} />
        ))}
      </div>
    </div>
  );
}
