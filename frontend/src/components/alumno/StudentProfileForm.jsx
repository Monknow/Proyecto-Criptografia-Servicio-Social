import { useState, useRef, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Button } from "@/components/ui/button";
import { Calendar, Mail, Phone, FileText, ArrowLeft, Loader2, ChevronDown } from "lucide-react";
import { apiUrl } from "@/lib/api";

// ─── Opciones estáticas ────────────────────────────────────────────

// ─── Componente ────────────────────────────────────────────────────
export function StudentProfileForm({ initialData, onSubmit, onCancel }) {
  const [eventos, setEventos] = useState([]);
  const [cargandoEventos, setCargandoEventos] = useState(true);
  const [formData, setFormData] = useState({
  eventos_seleccionados: initialData?.eventos_seleccionados || [],
  correo_alterno: initialData?.correo_alterno || "",
  celular: initialData?.celular || "",
  descripcion_personal: initialData?.descripcion_personal || "",
  });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError]               = useState(null);
  const [periodoOpen, setPeriodoOpen]   = useState(false);
  const periodoRef = useRef(null);
  useEffect(() => {
  const cargarEventos = async () => {
    try {
      const res = await fetch(apiUrl("/api/v1/auth/eventos"), {
        credentials: "include",
      });

      if (!res.ok) {
        throw new Error("No se pudieron cargar los periodos activos.");
      }

      const data = await res.json();
      setEventos(data);
    } catch (err) {
      setError(err.message || "Error al cargar los periodos.");
    } finally {
      setCargandoEventos(false);
    }
  };

  cargarEventos();
  }, []);
  useEffect(() => {
    const handleClickOutside = (e) => {
      if (periodoRef.current && !periodoRef.current.contains(e.target)) {
        setPeriodoOpen(false);
      }
    };
    if (periodoOpen) document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [periodoOpen]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (formData.eventos_seleccionados.length === 0) {
      setError("Selecciona al menos un periodo de servicio social.");
      return;
    }

    const celular = formData.celular.trim();
    if (!celular) {
      setError("Ingresa tu número celular para continuar.");
      return;
    }
    if (!/^55\d{8}$/.test(celular)) {
      setError("El número celular debe tener 10 dígitos y empezar con 55.");
      return;
    }

    const correoAlterno = formData.correo_alterno.trim();
    if (correoAlterno && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(correoAlterno)) {
      setError("Ingresa un correo alternativo válido.");
      return;
    }

    setIsSubmitting(true);
    setError(null);

    try {
      // 1. Registrar periodo (registra el evento)
      const profileRes = await fetch(apiUrl("/api/v1/auth/complete-profile"), {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          eventos_seleccionados: formData.eventos_seleccionados,
          }),
        credentials: "include",
      });
  

      if (!profileRes.ok) {
        const d = await profileRes.json();
        throw new Error(d.detail || "Error al guardar perfil académico.");
      }

      // 2. Guardar datos de contacto (si alguno fue llenado)
      const contactPayload = {};
      if (formData.correo_alterno)       contactPayload.correo_alterno       = formData.correo_alterno;
      if (formData.celular)              contactPayload.celular              = formData.celular;
      if (formData.descripcion_personal) contactPayload.descripcion_personal = formData.descripcion_personal;

      if (Object.keys(contactPayload).length > 0) {
        const contactRes = await fetch(apiUrl("/api/v1/alumno/perfil"), {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(contactPayload),
          credentials: "include",
        });
        if (!contactRes.ok) {
          const d = await contactRes.json();
          throw new Error(d.detail || "Error al guardar datos de contacto.");
        }
      }

      onSubmit();
    } catch (err) {
      setError(err.message || "Error de conexión. Intenta de nuevo.");
    } finally {
      setIsSubmitting(false);
    }
  };

  const field   = (key, val) => setFormData(prev => ({ ...prev, [key]: val }));
  const togglePeriodo = (idEvento) => {
  setFormData((prev) => {
    const seleccionados = prev.eventos_seleccionados;

    if (seleccionados.includes(idEvento)) {
      return {
        ...prev,
        eventos_seleccionados: seleccionados.filter((id) => id !== idEvento),
      };
    }

    if (seleccionados.length >= 2) {
      return prev;
    }

    return {
      ...prev,
      eventos_seleccionados: [...seleccionados, idEvento],
    };
  });
};
  const inputCls = "h-11 rounded-xl bg-white/[0.08] border-white/15 text-white placeholder:text-white/25 text-sm px-4 focus:ring-2 focus:ring-blue-400/30 focus:border-blue-400/40 hover:border-white/20 transition-all duration-200 w-full border outline-none";
  const selectCls = "w-full h-11 rounded-xl bg-white/[0.08] border border-white/15 text-white text-sm px-4 appearance-none focus:outline-none focus:ring-2 focus:ring-blue-400/30 focus:border-blue-400/40 hover:border-white/20 transition-all duration-200";
  const labelCls  = "text-[11px] text-white/45 uppercase tracking-[0.15em] font-medium flex items-center gap-1.5 ml-0.5";

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4 }}
      className="w-full max-w-2xl mx-auto"
    >
      <div className="relative overflow-hidden rounded-3xl bg-black/60 border border-white/15 backdrop-blur-xl shadow-[0_8px_30px_rgba(0,0,0,0.4)]">
        <div className="absolute -top-24 -right-24 w-48 h-48 bg-blue-500/15 rounded-full blur-[60px] pointer-events-none" />
        <div className="absolute -bottom-20 -left-20 w-40 h-40 bg-indigo-500/10 rounded-full blur-[50px] pointer-events-none" />

        <div className="relative z-10 p-8 sm:p-10">
          <div className="mb-6">
            <h2 className="text-xl font-normal text-white tracking-tight">Completa tu perfil</h2>
            <p className="text-[10px] text-white/35 uppercase tracking-[0.3em] font-medium mt-1">Información académica y de contacto</p>
          </div>

          {error && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: "auto" }}
              className="mb-5 p-3.5 rounded-xl bg-red-600 border border-red-700 text-white text-xs text-center font-medium shadow-md"
            >
              {error}
            </motion.div>
          )}

          <form onSubmit={handleSubmit} className="space-y-5">

            
            {/* Periodos */}
            <p className="text-[10px] text-white/30 uppercase tracking-[0.2em] mb-1">
              Inscripción a los periodos
            </p>

            <div className="space-y-2">
              <label className={labelCls}>
                <Calendar className="w-3 h-3 text-blue-400/70" />
                Periodos de Servicio Social (máximo 2)
              </label>

              <div className="relative" ref={periodoRef}>
                <button
                  type="button"
                  onClick={() => setPeriodoOpen((o) => !o)}
                  className={`${selectCls} flex items-center justify-between text-left cursor-pointer`}
                >
                  <span className="truncate text-white">
                    {formData.eventos_seleccionados.length
                      ? eventos
                        .filter((ev) => formData.eventos_seleccionados.includes(ev.id_evento))
                        .map((ev) => ev.nombre)
                        .join(", ")
                      : "Selecciona uno o dos periodos"}
                  </span>

                  <ChevronDown
                    className={`w-4 h-4 text-white/40 transition-transform duration-200 ${
                      periodoOpen ? "rotate-180" : ""
                    }`}
                  />
                </button>

                <AnimatePresence>
                  {periodoOpen && (
                    <motion.ul
                      initial={{ opacity: 0, y: -6 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: -6 }}
                      transition={{ duration: 0.15 }}
                      className="absolute z-50 mt-2 w-full rounded-xl bg-zinc-900 border border-white/15 shadow-xl overflow-hidden"
                    >
                      {eventos.map((ev) => {
                        const selected = formData.eventos_seleccionados.includes(ev.id_evento);
                        const maxReached =
                          formData.eventos_seleccionados.length >= 2 && !selected;

                        return (
                          <li
                            key={ev.id_evento}
                            onClick={() => {
                              if (!maxReached) {
                                togglePeriodo(ev.id_evento);
                              }
                            }}
                            className={`px-4 py-3 text-sm flex items-center gap-3 transition-colors ${
                              maxReached
                                ? "text-white/25 cursor-not-allowed"
                                : "cursor-pointer hover:bg-white/10"
                            } ${selected ? "bg-blue-500/20 text-white" : "text-white/80"}`}
                          >
                            <input
                              type="checkbox"
                              checked={selected}
                              readOnly
                              className="accent-blue-500"
                            />
                            {ev.nombre}
                          </li>
                        );
                      })}

                      <li className="border-t border-white/10 px-4 py-2">
                        <button
                          type="button"
                          onClick={() => setPeriodoOpen(false)}
                          className="text-xs text-blue-300 hover:text-blue-200"
                        >
                          Listo
                        </button>
                      </li>
                    </motion.ul>
                  )}
                </AnimatePresence>
              </div>
            </div>


            {/* ── Separador ── */}
            <div className="border-t border-white/10 pt-5">
              <p className="text-[10px] text-white/30 uppercase tracking-[0.2em] mb-4">Datos de contacto</p>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
                {/* Correo alterno */}
                <div className="space-y-2">
                  <label className={labelCls}><Mail className="w-3 h-3 text-blue-400/70" />Email alternativo</label>
                  <input
                    type="email"
                    pattern="^[^\s@]+@[^\s@]+\.[^\s@]+$"
                    placeholder="tu@correo.com"
                    value={formData.correo_alterno}
                    onChange={e => field("correo_alterno", e.target.value)}
                    className={inputCls}
                  />
                </div>

                {/* Celular */}
                <div className="space-y-2">
                  <label className={labelCls}><Phone className="w-3 h-3 text-blue-400/70" />Número celular *</label>
                  <input
                    type="tel"
                    required
                    inputMode="numeric"
                    maxLength={10}
                    pattern="^55\d{8}$"
                    title="10 dígitos empezando con 55"
                    placeholder="55XXXXXXXX"
                    value={formData.celular}
                    onChange={e => field("celular", e.target.value.replace(/\D/g, "").slice(0, 10))}
                    className={inputCls}
                  />
                </div>
              </div>

              {/* Descripción */}
              <div className="space-y-2 mt-5">
                <label className={labelCls}><FileText className="w-3 h-3 text-blue-400/70" />Sobre ti / Habilidades</label>
                <textarea
                  placeholder="Cuéntanos brevemente sobre tus habilidades y lo que puedes aportar..."
                  value={formData.descripcion_personal}
                  onChange={e => field("descripcion_personal", e.target.value)}
                  rows={3}
                  className="w-full rounded-xl bg-white/[0.08] border border-white/15 text-white placeholder:text-white/25 text-sm p-4 resize-none leading-relaxed focus:ring-2 focus:ring-blue-400/30 focus:border-blue-400/40 hover:border-white/20 transition-all duration-200 outline-none"
                />
              </div>
            </div>

            {/* Actions */}
            <div className="flex items-center justify-between gap-4 pt-2">
              {onCancel ? (
                <Button type="button" variant="ghost" onClick={onCancel}
                  className="text-white/40 hover:text-white/70 hover:bg-white/5 text-xs gap-1.5 cursor-pointer">
                  <ArrowLeft className="w-3.5 h-3.5" />Regresar
                </Button>
              ) : <div />}

              <Button type="submit" disabled={isSubmitting}
                className="h-11 px-8 rounded-xl bg-white/10 border border-white/15 text-white hover:bg-white/15 hover:border-white/25 transition-all text-[11px] uppercase tracking-[0.2em] font-medium shadow-none disabled:opacity-50 cursor-pointer gap-2">
                {isSubmitting ? <><Loader2 className="w-4 h-4 animate-spin" />Guardando...</> : "Guardar y Continuar"}
              </Button>
            </div>
          </form>
        </div>
      </div>
    </motion.div>
  );
}
