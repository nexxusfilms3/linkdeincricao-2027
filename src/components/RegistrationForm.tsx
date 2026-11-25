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
} from 'lucide-react';
import { db, handleFirestoreError, OperationType } from '../firebase';
import {
  LEAD_NOTIFICATION_EMAIL,
  LEAD_NOTIFICATION_RECIPIENT_NAME,
  PAYMENT_CHECKOUT_URL,
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
          'ID Firebase': data.registrationId,
        }),
      },
    );
  } catch {
    // Email notification is best-effort and must never block the WhatsApp group redirect.
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

  const [submittedName, setSubmittedName] = useState<string | null>(null);
  const [countdown, setCountdown] = useState<number>(4);
  const [autoRedirectActive, setAutoRedirectActive] = useState(true);
  const [copiedLink, setCopiedLink] = useState(false);

  const isInsideIframe = typeof window !== 'undefined' && window.self !== window.top;

  useEffect(() => {
    if (!submittedName || !autoRedirectActive) return;
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
  }, [submittedName, countdown, autoRedirectActive, isInsideIframe]);

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
      });

      const firstName = fullName.trim().split(/\s+/)[0] || 'Participante';
      setSubmittedName(firstName);
      setCountdown(3);
      setAutoRedirectActive(true);
    } catch (error) {
      setSubmitError(
        'Não foi possível salvar sua inscrição agora. Tente novamente ou acesse diretamente o pagamento abaixo.',
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
            Pré-inscrição Registrada
          </p>
          <h3 className="font-display text-3xl sm:text-4xl font-semibold text-[#2E1639] mb-3 text-balance">
            Seja muito bem-vinda, {submittedName}!
          </h3>
          <p className="text-base text-[#634B6F] leading-relaxed mb-6">
            Seus dados para os <strong className="text-[#2E1639]">4 encontros online</strong> do
            projeto <strong className="text-[#2E1639]">Meu 2027 com Propósito</strong> foram
            registrados. Conclua agora o pagamento para garantir sua vaga.
          </p>

          {!isInsideIframe && autoRedirectActive && countdown > 0 && (
            <div className="w-full rounded-xl bg-[#FAF7FC] border border-[#E4D5EC] px-4 py-3 mb-6 text-sm text-[#4A1A5B] flex items-center justify-between gap-3">
              <span className="tabular-nums font-medium">
                Redirecionando para o pagamento em {countdown}s...
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
            <span>Ir para o Pagamento Agora</span>
            <ExternalLink className="w-4 h-4 shrink-0" aria-hidden="true" />
          </a>

          <div className="mt-5 flex flex-wrap items-center justify-center gap-4 text-sm">
            <button
              type="button"
              onClick={handleCopyPaymentLink}
              className="inline-flex items-center gap-1.5 text-[#5B236E] hover:text-[#4A1A5B] font-medium cursor-pointer py-1.5 px-2"
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
            <span className="text-[#E4D5EC]" aria-hidden="true">
              ·
            </span>
            <button
              type="button"
              onClick={handleResetForm}
              className="text-[#634B6F] hover:text-[#2E1639] font-medium cursor-pointer py-1.5 px-2"
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
          Inscrição · Dias 07, 14, 21 e 28 de Dezembro
        </p>
        <h3 className="font-display text-2xl sm:text-3xl font-semibold text-[#2E1639]">
          Reserve seu lugar e finalize sua inscrição
        </h3>
        <p className="text-sm text-[#634B6F] mt-1.5 leading-relaxed">
          Preencha seus dados abaixo para seguir diretamente para a página de pagamento e confirmar
          sua participação nas 4 aulas online com e-book incluso.
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
          <a
            href={PAYMENT_CHECKOUT_URL}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-1.5 font-semibold text-[#5B236E] underline"
          >
            Acessar link de pagamento diretamente
            <ExternalLink className="w-3.5 h-3.5" aria-hidden="true" />
          </a>
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
          ) : (
            <>
              <span>Confirmar Inscrição e Ir para o Pagamento</span>
              <ArrowRight className="w-5 h-5 shrink-0" aria-hidden="true" />
            </>
          )}
        </button>

        <p className="text-xs text-center text-[#634B6F] leading-relaxed">
          Ao confirmar, seus dados ficam protegidos com a organização do projeto e você segue
          direto para o pagamento seguro via InfinitePay.
        </p>
      </div>
    </form>
  );
}
