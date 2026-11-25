import { useState } from 'react';
import { ArrowDown, ArrowRight, BookOpen, CheckCircle2, Sparkles } from 'lucide-react';
import { ButterflyMark, GoldFlourishDivider } from './components/ButterflyMark';
import { OrganizerDrawer } from './components/OrganizerDrawer';
import { RegistrationForm } from './components/RegistrationForm';
import {
  POSTER_IMAGE_PATH,
  SESSION_MODULES,
  SUMMARY_HIGHLIGHTS,
} from './constants/eventConfig';

export default function App() {
  const [posterError, setPosterError] = useState(false);
  const [organizerOpen, setOrganizerOpen] = useState(false);

  return (
    <div className="min-h-screen flex flex-col bg-[#FAF7FC] text-[#2E1639]">
      {/* Top Bar Contract: 3 zones separated by gap-8 */}
      <header className="border-b border-[#E4D5EC] bg-white/90 backdrop-blur-xs">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between gap-8">
          {/* Zone 1: Single-line Brand Wordmark */}
          <a
            href="#inicio"
            className="inline-flex items-center gap-2.5 text-[#2E1639] hover:text-[#5B236E] transition-colors whitespace-nowrap shrink-0"
          >
            <ButterflyMark className="w-7 h-5 shrink-0" />
            <span className="font-display text-xl font-semibold tracking-tight whitespace-nowrap shrink-0">
              Eliete Oliveira
            </span>
          </a>

          {/* Zone 2: 4 single-line nav links */}
          <nav
            aria-label="Navegação principal"
            className="hidden md:flex items-center gap-7 text-sm font-medium text-[#634B6F]"
          >
            <a
              href="#projeto"
              className="hover:text-[#5B236E] transition-colors whitespace-nowrap shrink-0"
            >
              O Projeto
            </a>
            <a
              href="#encontros"
              className="hover:text-[#5B236E] transition-colors whitespace-nowrap shrink-0"
            >
              4 Encontros
            </a>
            <a
              href="#ebook"
              className="hover:text-[#5B236E] transition-colors whitespace-nowrap shrink-0"
            >
              E-book
            </a>
            <a
              href="#inscricao"
              className="hover:text-[#5B236E] transition-colors whitespace-nowrap shrink-0"
            >
              Inscrição
            </a>
          </nav>

          {/* Zone 3: 1 Primary Action */}
          <div className="shrink-0">
            <a
              href="#inscricao"
              className="inline-flex items-center justify-center px-4 py-2 rounded-xl bg-[#5B236E] text-white text-sm font-medium hover:bg-[#4A1A5B] transition-colors whitespace-nowrap shrink-0"
            >
              Garantir Vaga
            </a>
          </div>
        </div>
      </header>

      <main id="inicio" className="flex-1">
        {/* Hero Split Section */}
        <section className="relative overflow-hidden border-b border-[#E4D5EC] bg-gradient-to-b from-white via-[#FAF7FC] to-[#F3ECF7]/60">
          <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-12 sm:py-16 lg:py-20">
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-10 lg:gap-12 items-stretch">
              {/* Left Narrative Column */}
              <div className="lg:col-span-7 flex flex-col justify-center">
                <div className="flex flex-wrap items-center gap-x-2.5 gap-y-1 text-xs sm:text-sm font-medium text-[#634B6F] mb-5">
                  <span className="text-[#5B236E] font-semibold">Imersão Online para Mulheres</span>
                  <span aria-hidden="true">·</span>
                  <span>Dias 07, 14, 21 e 28 de Dezembro</span>
                  <span aria-hidden="true">·</span>
                  <span>04 Encontros + E-book</span>
                </div>

                <h1
                  className="font-display font-bold tracking-tight text-[#5B236E] leading-[1.04] text-balance"
                  style={{ fontSize: 'clamp(2.5rem, 4.6vw, 4.25rem)' }}
                >
                  Meu 2027{' '}
                  <span className="italic font-semibold text-[#4A1A5B] block sm:inline">
                    com Propósito
                  </span>
                </h1>

                <div className="my-5">
                  <GoldFlourishDivider className="w-56 h-5" />
                </div>

                <p className="font-display italic text-xl sm:text-2xl text-[#2E1639] leading-snug max-w-xl mb-4">
                  “Cuidando das emoções, fortalecendo a fé e construindo novos caminhos.”
                </p>

                <p className="text-base text-[#634B6F] leading-relaxed max-w-xl mb-8">
                  Um caminho estruturado de autoconhecimento, renovação emocional e planejamento de
                  vida para mulheres que desejam iniciar 2027 com direção clara, leveza e
                  propósito.
                </p>

                <div className="flex flex-wrap items-center gap-4">
                  <a
                    href="#inscricao"
                    className="inline-flex items-center justify-center gap-2.5 px-7 py-3.5 rounded-xl bg-[#5B236E] text-white text-base font-semibold hover:bg-[#4A1A5B] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#5B236E] transition-colors shadow-sm whitespace-nowrap shrink-0"
                  >
                    <span>Fazer Minha Inscrição</span>
                    <ArrowRight className="w-4 h-4 shrink-0" aria-hidden="true" />
                  </a>

                  <a
                    href="#encontros"
                    className="inline-flex items-center gap-2 px-4 py-3 text-sm font-medium text-[#5B236E] hover:text-[#4A1A5B] transition-colors whitespace-nowrap shrink-0"
                  >
                    <span>Conhecer os 4 encontros</span>
                    <ArrowDown className="w-4 h-4 shrink-0" aria-hidden="true" />
                  </a>
                </div>

                <p className="mt-8 pt-6 border-t border-[#E4D5EC] text-sm text-[#634B6F]">
                  Conduzido por{' '}
                  <strong className="font-semibold text-[#2E1639]">Eliete Oliveira</strong>
                  <span className="mx-2 text-[#C69D53]" aria-hidden="true">
                    ·
                  </span>
                  Psicóloga | Pastora | Escritora
                </p>
              </div>

              {/* Right Visual Identity Poster */}
              <div className="lg:col-span-5 flex items-center justify-center">
                <div className="w-full max-w-md lg:max-w-none lg:h-full rounded-2xl overflow-hidden border border-[#D6B575]/60 bg-white shadow-sm flex items-center justify-center">
                  {!posterError ? (
                    <img
                      src={POSTER_IMAGE_PATH}
                      alt="Cartaz oficial Meu 2027 com Propósito — Eliete Oliveira Psicóloga, Pastora, Escritora"
                      referrerPolicy="no-referrer"
                      onError={() => setPosterError(true)}
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    <div className="w-full aspect-[3/4] bg-gradient-to-b from-[#FAF7FC] via-[#F3ECF7] to-[#5B236E] p-8 flex flex-col items-center justify-between text-center">
                      <ButterflyMark className="w-16 h-12" />
                      <div className="space-y-3">
                        <p className="text-xs tracking-widest uppercase text-[#5B236E] font-semibold">
                          Eliete Oliveira · Psicóloga
                        </p>
                        <p className="font-display text-4xl font-bold text-[#5B236E]">
                          MEU 2027
                        </p>
                        <p className="inline-block px-5 py-1.5 rounded-full bg-[#5B236E] text-[#D6B575] font-display text-lg font-semibold">
                          COM PROPÓSITO
                        </p>
                      </div>
                      <p className="text-sm text-white/90 italic font-display">
                        Um caminho de autoconhecimento, renovação emocional e planejamento de vida.
                      </p>
                    </div>
                  )}
                </div>
              </div>
            </div>

            {/* Full-width 4-column Summary Strip below Hero Split */}
            <div className="mt-10 lg:mt-12 bg-white border border-[#E4D5EC] rounded-2xl grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 divide-y sm:divide-y-0 sm:divide-x divide-[#E4D5EC]">
              {SUMMARY_HIGHLIGHTS.map((item) => (
                <div key={item.label} className="px-6 py-5">
                  <p className="text-xs font-medium text-[#634B6F]">{item.label}</p>
                  <p className="font-display text-xl font-semibold text-[#2E1639] mt-1">
                    {item.value}
                  </p>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* Section 2: Os 4 Encontros Online */}
        <section id="encontros" className="py-16 lg:py-20 bg-[#4A1A5B]">
          <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="max-w-2xl mb-12">
              <p className="text-sm font-medium text-[#D6B575] mb-2">
                Programação dos Encontros
              </p>
              <h2 className="font-display text-3xl sm:text-4xl font-semibold text-white text-balance">
                Quatro aulas online para alinhar emoções, fé e planejamento
              </h2>
              <p className="text-base text-[#E4D5EC] mt-3 leading-relaxed">
                Cada encontro foi estruturado para conduzir você da reflexão emocional à prática
                concreta, com encontros nos dias{' '}
                <strong className="text-white">07, 14, 21 e 28 de dezembro</strong>.
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {SESSION_MODULES.map((module) => (
                <article
                  key={module.number}
                  className="bg-white border border-[#D6B575]/40 rounded-2xl p-7 sm:p-8 flex flex-col justify-between shadow-sm"
                >
                  <div>
                    <div className="flex items-baseline justify-between gap-4 mb-4 pb-4 border-b border-[#F3ECF7]">
                      <span className="font-display text-3xl font-semibold text-[#5B236E] tabular-nums">
                        {module.number}
                      </span>
                      <span className="text-xs font-medium text-[#634B6F]">
                        {module.focus}
                      </span>
                    </div>
                    <h3 className="font-display text-2xl font-semibold text-[#2E1639] mb-2.5">
                      {module.title}
                    </h3>
                    <p className="text-sm sm:text-base text-[#634B6F] leading-relaxed">
                      {module.description}
                    </p>
                  </div>
                </article>
              ))}
            </div>
          </div>
        </section>

        {/* Section 3: E-book & Sobre Eliete Oliveira */}
        <section
          id="projeto"
          className="py-16 lg:py-20 bg-white border-y border-[#E4D5EC]"
        >
          <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-10 lg:gap-12 items-start">
              {/* E-book Material Card */}
              <div
                id="ebook"
                className="lg:col-span-6 bg-[#FAF7FC] border border-[#E4D5EC] rounded-2xl p-8 space-y-5"
              >
                <div className="w-11 h-11 rounded-xl bg-[#F3ECF7] text-[#5B236E] flex items-center justify-center">
                  <BookOpen className="w-5 h-5" aria-hidden="true" />
                </div>
                <div>
                  <p className="text-sm font-medium text-[#A8803B] mb-1.5">
                    Material Pronto e Incluso
                  </p>
                  <h2 className="font-display text-3xl font-semibold text-[#2E1639]">
                    E-book de Planejamento dos 4 Encontros
                  </h2>
                </div>
                <p className="text-base text-[#634B6F] leading-relaxed">
                  Todo o material de apoio já está preparado para acompanhar as quatro aulas. Assim
                  que entrar no grupo oficial pelo link após sua inscrição, você receberá as
                  orientações e o e-book completo para registrar suas metas e reflexões.
                </p>
                <ul className="space-y-3 pt-2 text-sm text-[#2E1639]">
                  <li className="flex items-start gap-2.5">
                    <CheckCircle2 className="w-4 h-4 text-[#5B236E] mt-0.5 shrink-0" aria-hidden="true" />
                    <span>Roteiro completo alinhado com cada uma das 4 aulas online</span>
                  </li>
                  <li className="flex items-start gap-2.5">
                    <CheckCircle2 className="w-4 h-4 text-[#5B236E] mt-0.5 shrink-0" aria-hidden="true" />
                    <span>Exercícios de autoconhecimento e organização emocional</span>
                  </li>
                  <li className="flex items-start gap-2.5">
                    <CheckCircle2 className="w-4 h-4 text-[#5B236E] mt-0.5 shrink-0" aria-hidden="true" />
                    <span>Ferramenta prática para construir seu plano de vida 2027</span>
                  </li>
                </ul>
              </div>

              {/* About Eliete Oliveira */}
              <div className="lg:col-span-6 p-2 sm:p-4 lg:py-6 space-y-5">
                <div className="flex items-center gap-3">
                  <ButterflyMark className="w-9 h-7" />
                  <span className="text-sm font-medium text-[#A8803B]">
                    Sobre a Condutora
                  </span>
                </div>

                <h2 className="font-display text-3xl sm:text-4xl font-semibold text-[#2E1639]">
                  Eliete Oliveira
                </h2>
                <p className="text-sm font-medium text-[#5B236E]">
                  Psicóloga · Pastora · Escritora
                </p>

                <p className="text-base text-[#634B6F] leading-relaxed">
                  Com olhar clínico acolhedor e sensibilidade espiritual, Eliete Oliveira acompanha
                  mulheres na travessia de ciclos emocionais desafiadores para uma vida mais
                  intencional, equilibrada e alinhada ao propósito.
                </p>

                <p className="text-base text-[#634B6F] leading-relaxed">
                  No projeto <strong className="text-[#2E1639]">Meu 2027 com Propósito</strong>, ela
                  reúne psicologia prática, fé e escrita terapêutica em quatro encontros pensados
                  para transformar intenção em caminho concreto.
                </p>

                <div className="pt-4 border-t border-[#E4D5EC] flex items-center gap-3 text-sm text-[#2E1639]">
                  <Sparkles className="w-4 h-4 text-[#A8803B] shrink-0" aria-hidden="true" />
                  <span>Encontros pensados especialmente para mulheres · Formato 100% online</span>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* Section 3.5: Oferta e Investimento */}
        <section id="investimento" className="py-14 lg:py-16 bg-[#F3ECF7]/75 border-b border-[#E4D5EC]">
          <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="bg-white border border-[#D6B575]/60 rounded-2xl p-8 sm:p-10 shadow-sm grid grid-cols-1 md:grid-cols-12 gap-8 items-center">
              <div className="md:col-span-7 space-y-4">
                <div>
                  <p className="text-sm font-medium text-[#A8803B] mb-1.5">
                    Investimento da Imersão
                  </p>
                  <h2 className="font-display text-3xl sm:text-4xl font-semibold text-[#2E1639] text-balance">
                    Imersão Meu 2027 com Propósito
                  </h2>
                </div>

                <ul className="space-y-2.5 text-sm text-[#2E1639]">
                  <li className="flex items-start gap-2.5">
                    <CheckCircle2 className="w-4 h-4 text-[#5B236E] mt-0.5 shrink-0" aria-hidden="true" />
                    <span className="tabular-nums">04 encontros online (dias 07, 14, 21 e 28 de dezembro)</span>
                  </li>
                  <li className="flex items-start gap-2.5">
                    <CheckCircle2 className="w-4 h-4 text-[#5B236E] mt-0.5 shrink-0" aria-hidden="true" />
                    <span>E-book completo de Planejamento Meu 2027</span>
                  </li>
                  <li className="flex items-start gap-2.5">
                    <CheckCircle2 className="w-4 h-4 text-[#5B236E] mt-0.5 shrink-0" aria-hidden="true" />
                    <span>Condução com Eliete Oliveira (Psicóloga, Pastora e Escritora)</span>
                  </li>
                </ul>
              </div>

              <div className="md:col-span-5 md:border-l md:border-[#E4D5EC] md:pl-8 pt-6 md:pt-0 border-t md:border-t-0 border-[#E4D5EC] flex flex-col items-start md:items-center md:text-center space-y-3">
                <p className="text-sm font-medium text-[#634B6F]">
                  Valor único de participação
                </p>
                <div className="flex items-baseline gap-1 text-[#5B236E] tabular-nums">
                  <span className="text-xl font-semibold">R$</span>
                  <span className="font-display text-5xl sm:text-6xl font-bold leading-none">97</span>
                  <span className="text-xl font-semibold">,00</span>
                </div>
                <p className="text-xs text-[#634B6F]">
                  Pix (QR Code ou Chave) ou Cartão via InfinitePay
                </p>
                <a
                  href="#inscricao"
                  className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-6 py-3.5 rounded-xl bg-[#5B236E] text-white text-sm font-semibold hover:bg-[#4A1A5B] transition-colors shadow-sm whitespace-nowrap shrink-0 mt-1"
                >
                  <span>Preencher Inscrição</span>
                  <ArrowRight className="w-4 h-4 shrink-0" aria-hidden="true" />
                </a>
              </div>
            </div>
          </div>
        </section>

        {/* Section 4: Lead Capture Form -> Direct Redirect to InfinitePay */}
        <section id="inscricao" className="py-16 lg:py-24 bg-[#FAF7FC]">
          <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-10 lg:gap-12 items-start">
              <div className="lg:col-span-5 space-y-6 lg:pt-4">
                <div>
                  <p className="text-sm font-medium text-[#A8803B] mb-2">
                    Garanta sua Participação
                  </p>
                  <h2 className="font-display text-3xl sm:text-4xl font-semibold text-[#2E1639] text-balance">
                    Inscreva-se e conclua sua participação
                  </h2>
                </div>

                <p className="text-base text-[#634B6F] leading-relaxed">
                  Para participar dos encontros nos dias{' '}
                  <strong className="text-[#2E1639]">07, 14, 21 e 28 de dezembro</strong> e receber o
                  e-book de planejamento, complete sua inscrição ao lado.
                </p>

                <div className="space-y-4 pt-2 border-t border-[#E4D5EC]">
                  <div className="flex items-start gap-3.5">
                    <span className="font-display text-lg font-semibold text-[#5B236E] tabular-nums shrink-0">
                      01.
                    </span>
                    <div>
                      <p className="text-sm font-semibold text-[#2E1639]">
                        Preencha seus dados de contato
                      </p>
                      <p className="text-sm text-[#634B6F]">
                        Informe nome completo, WhatsApp e e-mail em menos de um minuto.
                      </p>
                    </div>
                  </div>
                  <div className="flex items-start gap-3.5">
                    <span className="font-display text-lg font-semibold text-[#5B236E] tabular-nums shrink-0">
                      02.
                    </span>
                    <div>
                      <p className="text-sm font-semibold text-[#2E1639]">
                        Escolha como deseja pagar (R$ 97,00)
                      </p>
                      <p className="text-sm text-[#634B6F]">
                        Após enviar o formulário, pague com QR Code Pix, Chave Pix ou Link de
                        Pagamento no Cartão (InfinitePay).
                      </p>
                    </div>
                  </div>
                </div>
              </div>

              <div className="lg:col-span-7">
                <RegistrationForm />
              </div>
            </div>
          </div>
        </section>
      </main>

      {/* Quiet Footer */}
      <footer className="bg-[#4A1A5B] text-white">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-10 flex flex-col sm:flex-row items-center justify-between gap-6">
          <div className="text-center sm:text-left space-y-1">
            <p className="font-display text-xl font-semibold tracking-wide text-white">
              ELIETE OLIVEIRA
            </p>
            <p className="text-xs text-[#DFC5EA]">
              Psicóloga | Pastora | Escritora · Projeto Meu 2027 com Propósito
            </p>
          </div>

          <div className="flex flex-wrap items-center justify-center gap-6 text-xs text-[#DFC5EA]">
            <a href="#encontros" className="hover:text-white transition-colors">
              4 Encontros
            </a>
            <a href="#ebook" className="hover:text-white transition-colors">
              E-book
            </a>
            <a href="#inscricao" className="hover:text-white transition-colors">
              Inscrição
            </a>
            <button
              type="button"
              onClick={() => setOrganizerOpen(true)}
              className="text-[#D6B575] hover:text-white underline underline-offset-4 transition-colors cursor-pointer"
            >
              Área da Organizadora
            </button>
          </div>
        </div>
      </footer>

      <OrganizerDrawer
        isOpen={organizerOpen}
        onClose={() => setOrganizerOpen(false)}
      />
    </div>
  );
}
