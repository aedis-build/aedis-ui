import type { Messages } from "@/registry/aedis/lib/locale";

/** Português (Brasil). */
export const ptBR: Messages = {
  approvalCard: {
    requests: "pede aprovação",
    approve: "Aprovar",
    requestChanges: "Pedir ajustes",
    confirmTitle: "Aprovar e enviar?",
    confirmDescription: "O agente segue e envia na hora.",
    confirm: "Aprovar",
    cancel: "Cancelar",
    reason: "O que precisa mudar",
    reasonPlaceholder: "O que precisa mudar?",
    sendRequest: "Pedir ajustes",
    back: "Voltar",
    error: "Algo deu errado. Tente de novo.",
  },
  handRaise: {
    raised: "levantou a mão",
    tried: "Já tentou:",
    answer: "Sua resposta",
    answerPlaceholder: "Sua resposta",
    scope: "Vale para",
    once: "Só este caso",
    always: "Sempre",
    alwaysHint: "Vira uma regra fixa que o agente segue em todas as conversas.",
    submit: "Responder",
    error: "Algo deu errado. Tente de novo.",
  },
  chat: {
    placeholder: "Escreva uma mensagem",
    send: "Enviar",
    message: "Mensagem",
    log: "Conversa",
    sendError: "Não deu para enviar a mensagem. Tente de novo.",
  },
  appShell: { menuLabel: "Menu" },
  sidebar: { label: "Navegação principal" },
  localeSwitcher: { label: "Idioma" },
};
