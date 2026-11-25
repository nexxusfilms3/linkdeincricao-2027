import React, { useEffect, useState } from 'react';
import { doc, serverTimestamp, setDoc } from 'firebase/firestore';
import {
  AlertCircle,
  ArrowRight,
  Check,
  CheckCircle2,
  Copy,
  CreditCard,
  ExternalLink,
  Loader2,
  QrCode,
} from 'lucide-react';
import { db, handleFirestoreError, OperationType } from '../firebase';
import {
  LEAD_NOTIFICATION_EMAIL,
  LEAD_NOTIFICATION_RECIPIENT_NAME,
  PAYMENT_CHECKOUT_URL,
  PIX_KEY,
  PIX_QR_IMAGE_PATH,
  PIX_RECIPIENT_NAME,
  VALIDATION_RULES,
} from '../constants/eventConfig';

interface FormErrors {
  fullName?: string;
  whatsapp?: string;
  email?: string;
  cityState?: string;
  expectation?: string;
}

function formatBrazilianPhone(input: string): string {
  const digits = input.replace(/\D/g, '').slice(0, 11);
  if (digits.length === 0) return '';
  if (digits.length <= 2) return `(${digits}`;
  if (digits.length <= 6) return `(${digits.slice(0, 2)}) ${digits.slice(2)}`;
  if (digits.length <= 10) {
    return `(${digits.slice(0, 2)}) ${digits.slice(2, 6)}-${digits.slice(6)}`;
  }
  return `(${digits.slice(0, 2)}) ${digits.slice(2, 7)}-${digits.slice(7)}`;
}

function generateSafeRegistrationId(): string {
  const rand = Math.random().toString(36).slice(2, 10);
  return `reg-${Date.now()}-${rand}`;
}

async function notifyLeadByEmail(data: {
  registrationId: string;
  fullName: string;
  whatsapp: string;
  email: string;
  cityState?: string;
  expectation?: string;
  paymentMethod: 'pix' | 'card';
}): Promise<void> {
  try {
    await fetch(
      `https://formsubmit.co/ajax/${encodeURIComponent(LEAD_NOTIFICATION_EMAIL)}`,
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Accept: 'application/json',
        },
        keepalive: true,
        body: JSON.stringify({
          _subject: `Nova inscrição: ${data.fullName} — Meu 2027 com Propósito`,
          _template: 'table',
          _captcha: 'false',
          _replyto: data.email,
          Destinatario: LEAD_NOTIFICATION_RECIPIENT_NAME,
          'Nome completo': data.fullName,
          WhatsApp: data.whatsapp,
          'E-mail': data.email,
          'Cidade / Estado': data.cityState || 'Não informado',
          'Expectativa para 2027': data.expectation || 'Não informado',
          'Forma de pagamento':
            data.paymentMethod === 'pix'
              ? 'Pix (QR Code ou Chave)'
              : 'Cartão (Link InfinitePay)',
          'ID Firebase': data.registrationId,
        }),
      },
    );
  } catch {
    // Email notification is best-effort and must never block the participant flow.
  }
}

export function RegistrationForm() {
  const [fullName, setFullName] = useState('');
  const [whatsapp, setWhatsapp] = useState('');
  const [email, setEmail] = useState('');
  const [cityState, setCityState] = useState('');
  const [expectation, setExpectation] = useState('');
  const [errors, setErrors] = useState<FormErrors>({});
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const [paymentMethod, setPaymentMethod] = useState<'pix' | 'card'>('pix');
  const [activePaymentTab, setActivePaymentTab] = useState<'pix' | 'card'>('pix');
  const [qrError, setQrError] = useState(false);

  const [submittedName, setSubmittedName] = useState<string | null>(null);
  const [countdown, setCountdown] = useState<number>(3);
  const [autoRedirectActive, setAutoRedirectActive] = useState(false);
  const [copiedKey, setCopiedKey] = useState(false);
  const [copiedLink, setCopiedLink] = useState(false);

  const isInsideIframe = typeof window !== 'undefined' && window.self !== window.top;

  useEffect(() => {
    if (!submittedName || !autoRedirectActive || activePaymentTab !== 'card') return;
    if (countdown <= 0) {
      if (!isInsideIframe) {
        window.location.assign(PAYMENT_CHECKOUT_URL);
      }
      return;
    }

    const timer = window.setTimeout(() => {
      setCountdown((prev) => prev - 1);
    }, 1000);

    return () => window.clearTimeout(timer);
  }, [submittedName, countdown, autoRedirectActive, activePaymentTab, isInsideIframe]);

  function validate(): boolean {
    const nextErrors: FormErrors = {};
    const trimmedName = fullName.trim();
    const trimmedWhatsapp = whatsapp.trim();
    const trimmedEmail = email.trim();
    const trimmedCity = cityState.trim();
    const trimmedExpectation = expectation.trim();

    if (
      trimmedName.length < VALIDATION_RULES.fullName.minLength ||
      trimmedName.length > VALIDATION_RULES.fullName.maxLength
    ) {
      nextErrors.fullName = 'Informe seu nome completo (mínimo de 2 caracteres).';
    }

    const numericDigits = trimmedWhatsapp.replace(/\D/g, '');
    if (
      trimmedWhatsapp.length < VALIDATION_RULES.whatsapp.minLength ||
      trimmedWhatsapp.length > VALIDATION_RULES.whatsapp.maxLength ||
      !VALIDATION_RULES.whatsapp.pattern.test(trimmedWhatsapp) ||
      numericDigits.length < 10
    ) {
      nextErrors.whatsapp = 'Informe um WhatsApp válido com DDD (ex: (11) 99999-9999).';
    }

    if (
      trimmedEmail.length < VALIDATION_RULES.email.minLength ||
      trimmedEmail.length > VALIDATION_RULES.email.maxLength ||
      !VALIDATION_RULES.email.pattern.test(trimmedEmail)
    ) {
      nextErrors.email = 'Informe um endereço de e-mail válido.';
    }

    if (trimmedCity.length > VALIDATION_RULES.cityState.maxLength) {
      nextErrors.cityState = 'Máximo de 100 caracteres para cidade e estado.';
    }

    if (trimmedExpectation.length > VALIDATION_RULES.expectation.maxLength) {
      nextErrors.expectation = 'Máximo de 500 caracteres para sua resposta.';
    }

    setErrors(nextErrors);
    return Object.keys(nextErrors).length === 0;
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setSubmitError(null);

    if (!validate()) return;

    setIsSubmitting(true);
    const registrationId = generateSafeRegistrationId();
    const docPath = `registrations/${registrationId}`;

    const payload: Record<string, unknown> = {
      fullName: fullName.trim().slice(0, VALIDATION_RULES.fullName.maxLength),
      whatsapp: whatsapp.trim().slice(0, VALIDATION_RULES.whatsapp.maxLength),
      email: email.trim().toLowerCase().slice(0, VALIDATION_RULES.email.maxLength),
      status: 'confirmada',
      createdAt: serverTimestamp(),
    };

    const trimmedCity = cityState.trim();
    if (trimmedCity) {
      payload.cityState = trimmedCity.slice(0, VALIDATION_RULES.cityState.maxLength);
    }

    const trimmedExpectation = expectation.trim();
    if (trimmedExpectation) {
      payload.expectation = trimmedExpectation.slice(
        0,
        VALIDATION_RULES.expectation.maxLength,
      );
    }

    try {
      const writePromise = setDoc(doc(db, 'registrations', registrationId), payload);
      const timeoutPromise = new Promise<never>((_, reject) => {
        window.setTimeout(() => reject(new Error('FIRESTORE_TIMEOUT')), 12000);
      });

      await Promise.race([writePromise, timeoutPromise]);

      void notifyLeadByEmail({
        registrationId,
        fullName: String(payload.fullName),
        whatsapp: String(payload.whatsapp),
        email: String(payload.email),
        cityState: trimmedCity || undefined,
        expectation: trimmedExpectation || undefined,
        paymentMethod,
      });

      const firstName = fullName.trim().split(/\s+/)[0] || 'Participante';
      setSubmittedName(firstName);
      setActivePaymentTab(paymentMethod);
      setCountdown(3);
      setAutoRedirectActive(paymentMethod === 'card');
    } catch (error) {
      setSubmitError(
        'Não foi possível salvar sua inscrição agora. Tente novamente ou escolha uma das formas de pagamento abaixo.',
      );
      if (
        error instanceof Error &&
        (error.message.includes('Missing or insufficient permissions') ||
          error.message.includes('PERMISSION_DENIED'))
      ) {
        try {
          handleFirestoreError(error, OperationType.CREATE, docPath);
        } catch {
          // Structured error already logged by handleFirestoreError; UI fallback remains visible.
        }
      }
    } finally {
      setIsSubmitting(false);
    }
  }

  async function handleCopyPixKey() {
    try {
      await navigator.clipboard.writeText(PIX_KEY);
      setCopiedKey(true);
      window.setTimeout(() => setCopiedKey(false), 2500);
    } catch {
      setCopiedKey(false);
    }
  }

  async function handleCopyPaymentLink() {
    try {
      await navigator.clipboard.writeText(PAYMENT_CHECKOUT_URL);
      setCopiedLink(true);
      window.setTimeout(() => setCopiedLink(false), 2500);
    } catch {
      setCopiedLink(false);
    }
  }

  function handleResetForm() {
    setSubmittedName(null);
    setFullName('');
    setWhatsapp('');
    setEmail('');
    setCityState('');
    setExpectation('');
    setErrors({});
    setSubmitError(null);
  }

  if (submittedName) {
    return (
      <div className="bg-white border border-[#E4D5EC] rounded-2xl p-6 sm:p-10 shadow-sm">
        <div className="flex flex-col items-center text-center max-w-lg mx-auto">
          <div className="w-14 h-14 rounded-full bg-[#F3ECF7] border border-[#D6B575]/40 text-[#5B236E] flex items-center justify-center mb-5">
            <CheckCircle2 className="w-7 h-7" aria-hidden="true" />
          </div>

          <p className="text-sm font-semibold text-[#A8803B] mb-2">
            Pré-inscrição Registrada · R$ 97,00
          </p>
          <h3 className="font-display text-3xl sm:text-4xl font-semibold text-[#2E1639] mb-3 text-balance">
            Seja muito bem-vinda, {submittedName}!
          </h3>
          <p className="text-base text-[#634B6F] leading-relaxed mb-6">
            Seus dados para a imersão <strong className="text-[#2E1639]">Meu 2027 com Propósito</strong>{' '}
            foram registrados. Escolha abaixo como deseja concluir o pagamento:
          </p>

          {/* Segmented Switcher between Pix (QR + Key) and Card (InfinitePay) */}
          <div
            role="tablist"
            aria-label="Opções de pagamento"
            className="w-full grid grid-cols-2 gap-1.5 p-1.5 bg-[#F3ECF7] rounded-xl mb-6"
          >
            <button
              type="button"
              role="tab"
              aria-selected={activePaymentTab === 'pix'}
              onClick={() => {
                setActivePaymentTab('pix');
                setAutoRedirectActive(false);
              }}
              className={`inline-flex items-center justify-center gap-2 px-3 py-2.5 rounded-lg text-sm font-semibold transition-colors cursor-pointer whitespace-nowrap ${
                activePaymentTab === 'pix'
                  ? 'bg-white text-[#5B236E] shadow-xs'
                  : 'text-[#634B6F] hover:text-[#2E1639]'
              }`}
            >
              <QrCode className="w-4 h-4 shrink-0" aria-hidden="true" />
              <span>Pix (QR Code e Chave)</span>
            </button>
            <button
              type="button"
              role="tab"
              aria-selected={activePaymentTab === 'card'}
              onClick={() => setActivePaymentTab('card')}
              className={`inline-flex items-center justify-center gap-2 px-3 py-2.5 rounded-lg text-sm font-semibold transition-colors cursor-pointer whitespace-nowrap ${
                activePaymentTab === 'card'
                  ? 'bg-white text-[#5B236E] shadow-xs'
                  : 'text-[#634B6F] hover:text-[#2E1639]'
              }`}
            >
              <CreditCard className="w-4 h-4 shrink-0" aria-hidden="true" />
              <span>Cartão (InfinitePay)</span>
            </button>
          </div>

          {activePaymentTab === 'pix' ? (
            <div className="w-full space-y-5">
              {!qrError && (
                <div className="mx-auto w-52 h-52 rounded-xl border border-[#E4D5EC] bg-white p-2.5 flex items-center justify-center">
                  <img
                    src={PIX_QR_IMAGE_PATH}
                    alt={`QR Code Pix InfinitePay para ${PIX_RECIPIENT_NAME}`}
                    referrerPolicy="no-referrer"
                    onError={() => setQrError(true)}
                    className="w-full h-full object-contain"
                  />
                </div>
              )}

              <div className="text-xs text-[#634B6F] space-y-1">
                <p>
                  Valor: <strong className="text-[#2E1639] tabular-nums">R$ 97,00</strong> ·
                  Favorecida: <strong className="text-[#2E1639]">{PIX_RECIPIENT_NAME}</strong>
                </p>
                <p>Abra o aplicativo do seu banco, escaneie o QR Code ou copie a chave Pix abaixo.</p>
              </div>

              <div className="rounded-xl border border-[#E4D5EC] bg-[#FAF7FC] p-3.5 text-left space-y-2">
                <p className="text-xs font-medium text-[#634B6F]">Chave Pix (aleatória · InfinitePay)</p>
                <p className="font-mono text-xs sm:text-sm text-[#2E1639] break-all select-all tabular-nums">
                  {PIX_KEY}
                </p>
              </div>

              <button
                type="button"
                onClick={handleCopyPixKey}
                className="w-full inline-flex items-center justify-center gap-2.5 px-6 py-4 rounded-xl bg-[#5B236E] text-white text-base font-semibold hover:bg-[#4A1A5B] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#5B236E] transition-colors shadow-sm cursor-pointer"
              >
                {copiedKey ? (
                  <>
                    <Check className="w-5 h-5 shrink-0" aria-hidden="true" />
                    <span>Chave Pix Copiada!</span>
                  </>
                ) : (
                  <>
                    <Copy className="w-5 h-5 shrink-0" aria-hidden="true" />
                    <span>Copiar Chave Pix</span>
                  </>
                )}
              </button>
            </div>
          ) : (
            <div className="w-full space-y-4">
              {!isInsideIframe && autoRedirectActive && countdown > 0 && (
                <div className="w-full rounded-xl bg-[#FAF7FC] border border-[#E4D5EC] px-4 py-3 text-sm text-[#4A1A5B] flex items-center justify-between gap-3">
                  <span className="tabular-nums font-medium">
                    Redirecionando para o cartão em {countdown}s...
                  </span>
                  <button
                    type="button"
                    onClick={() => setAutoRedirectActive(false)}
                    className="text-xs font-medium text-[#634B6F] underline hover:text-[#2E1639] whitespace-nowrap shrink-0 cursor-pointer"
                  >
                    Pausar
                  </button>
                </div>
              )}

              <a
                href={PAYMENT_CHECKOUT_URL}
                target="_blank"
                rel="noopener noreferrer"
                className="w-full inline-flex items-center justify-center gap-2.5 px-6 py-4 rounded-xl bg-[#5B236E] text-white text-base font-semibold hover:bg-[#4A1A5B] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#5B236E] transition-colors shadow-sm"
              >
                <CreditCard className="w-5 h-5 shrink-0" aria-hidden="true" />
                <span>Pagar com Cartão (InfinitePay)</span>
                <ExternalLink className="w-4 h-4 shrink-0" aria-hidden="true" />
              </a>

              <button
                type="button"
                onClick={handleCopyPaymentLink}
                className="inline-flex items-center gap-1.5 text-sm text-[#5B236E] hover:text-[#4A1A5B] font-medium cursor-pointer py-1.5 px-2"
              >
                {copiedLink ? (
                  <>
                    <Check className="w-4 h-4" aria-hidden="true" />
                    <span>Link de pagamento copiado</span>
                  </>
                ) : (
                  <>
                    <Copy className="w-4 h-4" aria-hidden="true" />
                    <span>Copiar link de pagamento</span>
                  </>
                )}
              </button>
            </div>
          )}

          <div className="mt-6 pt-5 border-t border-[#E4D5EC] w-full flex justify-center">
            <button
              type="button"
              onClick={handleResetForm}
              className="text-sm text-[#634B6F] hover:text-[#2E1639] font-medium cursor-pointer py-1.5 px-2"
            >
              Inscrever outra participante
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <form
      onSubmit={handleSubmit}
      noValidate
      className="bg-white border border-[#E4D5EC] rounded-2xl p-6 sm:p-8 lg:p-10 shadow-sm"
    >
      <div className="mb-7">
        <p className="text-sm font-medium text-[#A8803B] mb-1">
          Inscrição · R$ 97,00 · Dias 07, 14, 21 e 28 de Dezembro
        </p>
        <h3 className="font-display text-2xl sm:text-3xl font-semibold text-[#2E1639]">
          Reserve seu lugar e finalize sua inscrição
        </h3>
        <p className="text-sm text-[#634B6F] mt-1.5 leading-relaxed">
          Preencha seus dados abaixo e escolha se deseja pagar via Pix (QR Code ou Chave) ou Cartão
          pelo link da InfinitePay.
        </p>
      </div>

      {submitError && (
        <div
          role="alert"
          className="mb-6 rounded-xl bg-rose-50 border border-rose-200 p-4 text-sm text-rose-900 flex flex-col gap-3"
        >
          <div className="flex items-start gap-2.5">
            <AlertCircle className="w-4 h-4 mt-0.5 shrink-0 text-rose-700" aria-hidden="true" />
            <span>{submitError}</span>
          </div>
          <div className="flex flex-wrap items-center gap-4">
            <a
              href={PAYMENT_CHECKOUT_URL}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-1.5 font-semibold text-[#5B236E] underline"
            >
              Pagar no Cartão (InfinitePay)
              <ExternalLink className="w-3.5 h-3.5" aria-hidden="true" />
            </a>
            <button
              type="button"
              onClick={handleCopyPixKey}
              className="inline-flex items-center gap-1.5 font-semibold text-[#5B236E] underline cursor-pointer"
            >
              {copiedKey ? 'Chave Pix copiada!' : 'Copiar Chave Pix'}
            </button>
          </div>
        </div>
      )}

      <div className="space-y-5">
        <div>
          <label htmlFor="fullName" className="block text-sm font-medium text-[#2E1639] mb-1.5">
            Nome completo <span className="text-[#5B236E]">*</span>
          </label>
          <input
            id="fullName"
            name="fullName"
            type="text"
            autoComplete="name"
            required
            maxLength={VALIDATION_RULES.fullName.maxLength}
            value={fullName}
            onChange={(e) => {
              setFullName(e.target.value);
              if (errors.fullName) setErrors((prev) => ({ ...prev, fullName: undefined }));
            }}
            placeholder="Como você gostaria de ser chamada"
            className={`w-full rounded-xl border px-4 py-3 text-base text-[#2E1639] placeholder:text-[#9882A3] bg-[#FAF7FC]/60 focus:bg-white focus:outline-none focus:ring-2 transition-colors ${
              errors.fullName
                ? 'border-rose-400 focus:ring-rose-200'
                : 'border-[#E4D5EC] focus:border-[#5B236E] focus:ring-[#5B236E]/15'
            }`}
          />
          {errors.fullName && (
            <p className="mt-1.5 text-xs text-rose-700 flex items-center gap-1.5">
              <AlertCircle className="w-3.5 h-3.5 shrink-0" aria-hidden="true" />
              <span>{errors.fullName}</span>
            </p>
          )}
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
          <div>
            <label htmlFor="whatsapp" className="block text-sm font-medium text-[#2E1639] mb-1.5">
              WhatsApp com DDD <span className="text-[#5B236E]">*</span>
            </label>
            <input
              id="whatsapp"
              name="whatsapp"
              type="tel"
              autoComplete="tel"
              required
              maxLength={VALIDATION_RULES.whatsapp.maxLength}
              value={whatsapp}
              onChange={(e) => {
                setWhatsapp(formatBrazilianPhone(e.target.value));
                if (errors.whatsapp) setErrors((prev) => ({ ...prev, whatsapp: undefined }));
              }}
              placeholder="(11) 99999-9999"
              className={`w-full rounded-xl border px-4 py-3 text-base text-[#2E1639] placeholder:text-[#9882A3] bg-[#FAF7FC]/60 focus:bg-white focus:outline-none focus:ring-2 transition-colors tabular-nums ${
                errors.whatsapp
                  ? 'border-rose-400 focus:ring-rose-200'
                  : 'border-[#E4D5EC] focus:border-[#5B236E] focus:ring-[#5B236E]/15'
              }`}
            />
            {errors.whatsapp && (
              <p className="mt-1.5 text-xs text-rose-700 flex items-center gap-1.5">
                <AlertCircle className="w-3.5 h-3.5 shrink-0" aria-hidden="true" />
                <span>{errors.whatsapp}</span>
              </p>
            )}
          </div>

          <div>
            <label htmlFor="email" className="block text-sm font-medium text-[#2E1639] mb-1.5">
              E-mail <span className="text-[#5B236E]">*</span>
            </label>
            <input
              id="email"
              name="email"
              type="email"
              autoComplete="email"
              required
              maxLength={VALIDATION_RULES.email.maxLength}
              value={email}
              onChange={(e) => {
                setEmail(e.target.value);
                if (errors.email) setErrors((prev) => ({ ...prev, email: undefined }));
              }}
              placeholder="seuemail@exemplo.com"
              className={`w-full rounded-xl border px-4 py-3 text-base text-[#2E1639] placeholder:text-[#9882A3] bg-[#FAF7FC]/60 focus:bg-white focus:outline-none focus:ring-2 transition-colors ${
                errors.email
                  ? 'border-rose-400 focus:ring-rose-200'
                  : 'border-[#E4D5EC] focus:border-[#5B236E] focus:ring-[#5B236E]/15'
              }`}
            />
            {errors.email && (
              <p className="mt-1.5 text-xs text-rose-700 flex items-center gap-1.5">
                <AlertCircle className="w-3.5 h-3.5 shrink-0" aria-hidden="true" />
                <span>{errors.email}</span>
              </p>
            )}
          </div>
        </div>

        <div>
          <label htmlFor="cityState" className="block text-sm font-medium text-[#2E1639] mb-1.5">
            Cidade e Estado <span className="text-[#634B6F] font-normal">(opcional)</span>
          </label>
          <input
            id="cityState"
            name="cityState"
            type="text"
            maxLength={VALIDATION_RULES.cityState.maxLength}
            value={cityState}
            onChange={(e) => setCityState(e.target.value)}
            placeholder="Ex: São Paulo, SP"
            className="w-full rounded-xl border border-[#E4D5EC] px-4 py-3 text-base text-[#2E1639] placeholder:text-[#9882A3] bg-[#FAF7FC]/60 focus:bg-white focus:border-[#5B236E] focus:outline-none focus:ring-2 focus:ring-[#5B236E]/15 transition-colors"
          />
        </div>

        <div>
          <label htmlFor="expectation" className="block text-sm font-medium text-[#2E1639] mb-1.5">
            O que você mais deseja cuidar ou planejar para 2027?{' '}
            <span className="text-[#634B6F] font-normal">(opcional)</span>
          </label>
          <textarea
            id="expectation"
            name="expectation"
            rows={3}
            maxLength={VALIDATION_RULES.expectation.maxLength}
            value={expectation}
            onChange={(e) => setExpectation(e.target.value)}
            placeholder="Compartilhe brevemente uma meta, área emocional ou expectativa para os encontros..."
            className="w-full rounded-xl border border-[#E4D5EC] px-4 py-3 text-base text-[#2E1639] placeholder:text-[#9882A3] bg-[#FAF7FC]/60 focus:bg-white focus:border-[#5B236E] focus:outline-none focus:ring-2 focus:ring-[#5B236E]/15 transition-colors resize-y"
          />
        </div>

        <div>
          <span className="block text-sm font-medium text-[#2E1639] mb-2">
            Como você prefere pagar? (R$ 97,00)
          </span>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
            <button
              type="button"
              onClick={() => setPaymentMethod('pix')}
              className={`flex items-center justify-center gap-2 px-4 py-3 rounded-xl border text-sm font-semibold transition-colors cursor-pointer whitespace-nowrap ${
                paymentMethod === 'pix'
                  ? 'border-[#5B236E] bg-[#F3ECF7] text-[#5B236E]'
                  : 'border-[#E4D5EC] bg-[#FAF7FC]/60 text-[#634B6F] hover:text-[#2E1639]'
              }`}
            >
              <QrCode className="w-4 h-4 shrink-0" aria-hidden="true" />
              <span>Pix (QR Code ou Chave)</span>
            </button>
            <button
              type="button"
              onClick={() => setPaymentMethod('card')}
              className={`flex items-center justify-center gap-2 px-4 py-3 rounded-xl border text-sm font-semibold transition-colors cursor-pointer whitespace-nowrap ${
                paymentMethod === 'card'
                  ? 'border-[#5B236E] bg-[#F3ECF7] text-[#5B236E]'
                  : 'border-[#E4D5EC] bg-[#FAF7FC]/60 text-[#634B6F] hover:text-[#2E1639]'
              }`}
            >
              <CreditCard className="w-4 h-4 shrink-0" aria-hidden="true" />
              <span>Cartão (Link InfinitePay)</span>
            </button>
          </div>
        </div>

        <button
          type="submit"
          disabled={isSubmitting}
          className="w-full inline-flex items-center justify-center gap-2.5 px-6 py-4 rounded-xl bg-[#5B236E] text-white text-base font-semibold hover:bg-[#4A1A5B] disabled:opacity-70 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#5B236E] transition-colors cursor-pointer shadow-sm"
        >
          {isSubmitting ? (
            <>
              <Loader2 className="w-5 h-5 animate-spin shrink-0" aria-hidden="true" />
              <span>Registrando sua inscrição...</span>
            </>
          ) : paymentMethod === 'pix' ? (
            <>
              <span>Confirmar e Pagar com Pix</span>
              <ArrowRight className="w-5 h-5 shrink-0" aria-hidden="true" />
            </>
          ) : (
            <>
              <span>Confirmar e Ir para o Cartão</span>
              <ArrowRight className="w-5 h-5 shrink-0" aria-hidden="true" />
            </>
          )}
        </button>

        <p className="text-xs text-center text-[#634B6F] leading-relaxed">
          Ao confirmar, seus dados ficam protegidos com a organização e você escolhe pagar via Pix
          (QR Code/Chave) ou Cartão pela InfinitePay.
        </p>
      </div>
    </form>
  );
}
