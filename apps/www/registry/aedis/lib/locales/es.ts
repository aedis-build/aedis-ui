import type { Messages } from "@/registry/aedis/lib/locale";

/** Español. */
export const es: Messages = {
  approvalCard: {
    requests: "pide aprobación",
    approve: "Aprobar",
    requestChanges: "Pedir cambios",
    confirmTitle: "¿Aprobar y enviar?",
    confirmDescription: "El agente continúa y lo envía de inmediato.",
    confirm: "Aprobar",
    cancel: "Cancelar",
    reason: "Qué debe cambiar",
    reasonPlaceholder: "¿Qué debe cambiar?",
    sendRequest: "Pedir cambios",
    back: "Volver",
    error: "Algo salió mal. Inténtalo de nuevo.",
  },
  handRaise: {
    raised: "levantó la mano",
    tried: "Ya intentó:",
    answer: "Tu respuesta",
    answerPlaceholder: "Tu respuesta",
    scope: "Se aplica a",
    once: "Solo este caso",
    always: "Siempre",
    alwaysHint: "Se convierte en una regla permanente que el agente sigue en todas las conversaciones.",
    submit: "Responder",
    error: "Algo salió mal. Inténtalo de nuevo.",
  },
  chat: {
    placeholder: "Escribe un mensaje",
    send: "Enviar",
    message: "Mensaje",
    log: "Conversación",
    sendError: "No se pudo enviar el mensaje. Inténtalo de nuevo.",
  },
  appShell: { menuLabel: "Menú" },
  sidebar: { label: "Navegación principal" },
  localeSwitcher: { label: "Idioma" },
  codeBlock: {
    copy: "Copiar código",
    copied: "Copiado",
    copyFailed: "No se pudo copiar. Selecciona el código y cópialo.",
    hidden: "Carácter oculto",
  },
  link: {
    external: "(sitio externo)",
  },
  navigationMenu: {
    label: "Navegación del sitio",
  },
  sheet: {
    close: "Cerrar",
  },
  dropdownMenu: {
    confirmTitle: "¿Seguro?",
    confirmDescription: "No se puede deshacer.",
    confirm: "Continuar",
    cancel: "Cancelar",
  },
  spinner: {
    label: "Cargando",
  },
  breadcrumb: {
    label: "Ruta de navegación",
    more: "Más",
  },
  pagination: {
    label: "Paginación",
    previous: "Anterior",
    next: "Siguiente",
    goPrevious: "Ir a la página anterior",
    goNext: "Ir a la página siguiente",
    more: "Más páginas",
  },
  toast: {
    region: "Notificaciones",
    close: "Cerrar notificación",
    failed: "Algo salió mal. Inténtalo de nuevo.",
  },
  toolCall: {
    running: "Ejecutando",
    done: "Listo",
    error: "Falló",
    awaiting: "Esperando aprobación",
    arguments: "Argumentos",
    result: "Resultado",
    external: "actúa fuera",
    wantsToRun: "quiere ejecutarse con estos argumentos.",
    waiting: "Esperando que una persona apruebe.",
  },
  reasoning: {
    thinking: "Pensando…",
    thought: "Razonamiento",
    thoughtFor: "Pensó durante {seconds} s",
  },
};
