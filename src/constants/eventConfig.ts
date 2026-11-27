export const WHATSAPP_GROUP_URL =
  'https://chat.whatsapp.com/C34kCxQFuJqGgoichE9HWg?s=cl&p=i&mlu=4&ilr=4&iam';

export const PAYMENT_CHECKOUT_URL = 'https://pay.kiwify.com.br/TDp9ipt';

export const POSTER_IMAGE_PATH =
  '/assets/aistudio/WhatsApp_Image_2026-11-19_at_09.16.17_c2f6f9f1.jpeg';

export const ADMIN_EMAIL = 'contato.yadastudio@gmail.com';
export const LEAD_NOTIFICATION_EMAIL = 'nexxussocialmedia3@gmail.com';
export const LEAD_NOTIFICATION_RECIPIENT_NAME = 'Gustavo Social 3';

// Synchronized verbatim with firebase-blueprint.json & firestore.rules
export const VALIDATION_RULES = {
  fullName: {
    minLength: 2,
    maxLength: 120,
  },
  whatsapp: {
    minLength: 8,
    maxLength: 25,
    pattern: /^[0-9+()\s\-]+$/,
  },
  email: {
    minLength: 5,
    maxLength: 160,
    pattern: /^[^\s@]+@[^\s@]+\.[^\s@]+$/,
  },
  cityState: {
    maxLength: 100,
  },
  expectation: {
    maxLength: 500,
  },
} as const;

export interface SessionModule {
  number: string;
  title: string;
  focus: string;
  description: string;
}

export const SESSION_MODULES: SessionModule[] = [
  {
    number: '01',
    title: 'O que 2026 deixou em mim',
    focus: '1ª Aula · Dia 07/12',
    description:
      'Um olhar acolhedor para as vivências de 2026, reconhecendo sentimentos, aprendizados e marcas emocionais do ano que está se encerrando.',
  },
  {
    number: '02',
    title: 'O que preciso encerrar e deixar para trás',
    focus: '2ª Aula · Dia 14/12',
    description:
      'Identificação de pesos, ciclos, culpas e padrões que não precisam continuar com você, abrindo espaço para alívio emocional e renovação.',
  },
  {
    number: '03',
    title: 'Quem desejo me tornar em 2027',
    focus: '3ª Aula · Dia 21/12',
    description:
      'Reconexão com sua essência, fé, valores inegociáveis e identidade para enxergar com clareza a mulher que você deseja construir no novo ano.',
  },
  {
    number: '04',
    title: 'Minhas metas, meus limites e meu plano de ação',
    focus: '4ª Aula · Dia 28/12',
    description:
      'Estruturação passo a passo de metas possíveis, limites saudáveis e ações práticas para 2027 com o apoio do E-book de Planejamento.',
  },
];

export const SUMMARY_HIGHLIGHTS = [
  { label: 'Datas dos Encontros', value: '07, 14, 21 e 28/12' },
  { label: 'Formato', value: '04 Encontros Online' },
  { label: 'Material Incluso', value: 'E-book de Planejamento' },
  { label: 'Investimento', value: 'R$ 97,00 (Pix ou Cartão)' },
];
