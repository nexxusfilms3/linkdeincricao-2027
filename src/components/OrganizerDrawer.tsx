import { useEffect, useMemo, useState } from 'react';
import { onAuthStateChanged, signInWithPopup, signOut, User } from 'firebase/auth';
import {
  collection,
  deleteDoc,
  doc,
  getDoc,
  onSnapshot,
  orderBy,
  query,
  Timestamp,
  updateDoc,
} from 'firebase/firestore';
import {
  Check,
  Copy,
  Download,
  Lock,
  LogOut,
  Search,
  ShieldAlert,
  Trash2,
  Users,
  X,
} from 'lucide-react';
import {
  auth,
  db,
  googleProvider,
  handleFirestoreError,
  OperationType,
} from '../firebase';
import { ADMIN_EMAIL, WHATSAPP_GROUP_URL } from '../constants/eventConfig';

interface RegistrationRecord {
  id: string;
  fullName: string;
  whatsapp: string;
  email: string;
  cityState?: string;
  expectation?: string;
  status: 'confirmada' | 'no_grupo';
  createdAt?: Timestamp | null;
}

interface OrganizerDrawerProps {
  isOpen: boolean;
  onClose: () => void;
}

export function OrganizerDrawer({ isOpen, onClose }: OrganizerDrawerProps) {
  const [user, setUser] = useState<User | null>(auth.currentUser);
  const [isAuthorizedAdmin, setIsAuthorizedAdmin] = useState(false);
  const [authLoading, setAuthLoading] = useState(true);
  const [authError, setAuthError] = useState<string | null>(null);

  const [registrations, setRegistrations] = useState<RegistrationRecord[]>([]);
  const [loadingData, setLoadingData] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<'all' | 'confirmada' | 'no_grupo'>('all');
  const [confirmDeleteId, setConfirmDeleteId] = useState<string | null>(null);
  const [copiedUrl, setCopiedUrl] = useState<'page' | 'whatsapp' | null>(null);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (nextUser) => {
      setUser(nextUser);
      setAuthError(null);
      if (!nextUser || !nextUser.emailVerified) {
        setIsAuthorizedAdmin(false);
        setAuthLoading(false);
        return;
      }

      if (nextUser.email === ADMIN_EMAIL) {
        setIsAuthorizedAdmin(true);
        setAuthLoading(false);
        return;
      }

      try {
        const adminSnap = await getDoc(doc(db, 'admins', nextUser.uid));
        setIsAuthorizedAdmin(adminSnap.exists());
      } catch {
        setIsAuthorizedAdmin(false);
      } finally {
        setAuthLoading(false);
      }
    });

    return () => unsubscribe();
  }, []);

  useEffect(() => {
    if (!isOpen || !user || !isAuthorizedAdmin) {
      return;
    }

    setLoadingData(true);
    const registrationsRef = collection(db, 'registrations');
    const q = query(registrationsRef, orderBy('createdAt', 'desc'));

    const unsubscribe = onSnapshot(
      q,
      (snapshot) => {
        const items: RegistrationRecord[] = snapshot.docs.map((docSnap) => {
          const data = docSnap.data();
          return {
            id: docSnap.id,
            fullName: String(data.fullName ?? ''),
            whatsapp: String(data.whatsapp ?? ''),
            email: String(data.email ?? ''),
            cityState: data.cityState ? String(data.cityState) : undefined,
            expectation: data.expectation ? String(data.expectation) : undefined,
            status: data.status === 'no_grupo' ? 'no_grupo' : 'confirmada',
            createdAt: data.createdAt instanceof Timestamp ? data.createdAt : null,
          };
        });
        setRegistrations(items);
        setLoadingData(false);
      },
      (error) => {
        setLoadingData(false);
        handleFirestoreError(error, OperationType.LIST, 'registrations');
      },
    );

    return () => unsubscribe();
  }, [isOpen, user, isAuthorizedAdmin]);

  const filteredRegistrations = useMemo(() => {
    const q = searchQuery.trim().toLowerCase();
    return registrations.filter((item) => {
      const matchesStatus = statusFilter === 'all' || item.status === statusFilter;
      if (!matchesStatus) return false;
      if (!q) return true;
      return (
        item.fullName.toLowerCase().includes(q) ||
        item.email.toLowerCase().includes(q) ||
        item.whatsapp.toLowerCase().includes(q) ||
        (item.cityState || '').toLowerCase().includes(q)
      );
    });
  }, [registrations, searchQuery, statusFilter]);

  const counts = useMemo(() => {
    const total = registrations.length;
    const inGroup = registrations.filter((r) => r.status === 'no_grupo').length;
    return {
      total,
      confirmed: total - inGroup,
      inGroup,
    };
  }, [registrations]);

  async function handleSignIn() {
    setAuthError(null);
    try {
      await signInWithPopup(auth, googleProvider);
    } catch (err) {
      setAuthError(
        err instanceof Error
          ? 'Não foi possível concluir o login com o Google.'
          : 'Erro ao autenticar.',
      );
    }
  }

  async function handleSignOut() {
    await signOut(auth);
    setRegistrations([]);
  }

  async function handleToggleStatus(item: RegistrationRecord) {
    const nextStatus = item.status === 'confirmada' ? 'no_grupo' : 'confirmada';
    const path = `registrations/${item.id}`;
    try {
      await updateDoc(doc(db, 'registrations', item.id), { status: nextStatus });
    } catch (error) {
      handleFirestoreError(error, OperationType.UPDATE, path);
    }
  }

  async function handleDelete(id: string) {
    const path = `registrations/${id}`;
    try {
      await deleteDoc(doc(db, 'registrations', id));
      setConfirmDeleteId(null);
    } catch (error) {
      handleFirestoreError(error, OperationType.DELETE, path);
    }
  }

  function handleExportCsv() {
    const headers = ['Nome Completo', 'WhatsApp', 'E-mail', 'Cidade/Estado', 'Status', 'Objetivo 2027', 'Data'];
    const escapeCell = (val: string) => `"${val.replace(/"/g, '""')}"`;
    const rows = registrations.map((r) => [
      escapeCell(r.fullName),
      escapeCell(r.whatsapp),
      escapeCell(r.email),
      escapeCell(r.cityState || ''),
      escapeCell(r.status === 'no_grupo' ? 'No grupo' : 'Confirmada'),
      escapeCell(r.expectation || ''),
      escapeCell(
        r.createdAt ? r.createdAt.toDate().toLocaleString('pt-BR') : '',
      ),
    ]);
    const csvContent = '\uFEFF' + [headers.map(escapeCell).join(';'), ...rows.map((r) => r.join(';'))].join('\n');
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = 'inscritas-meu-2027-com-proposito.csv';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  }

  async function handleCopyUrl(type: 'page' | 'whatsapp') {
    const text = type === 'page' ? window.location.origin : WHATSAPP_GROUP_URL;
    try {
      await navigator.clipboard.writeText(text);
      setCopiedUrl(type);
      window.setTimeout(() => setCopiedUrl(null), 2200);
    } catch {
      setCopiedUrl(null);
    }
  }

  if (!isOpen) return null;

  return (
    <div
      className="fixed inset-0 z-50 flex justify-end bg-[#2E1639]/40 backdrop-blur-[2px]"
      role="dialog"
      aria-modal="true"
      aria-labelledby="organizer-title"
    >
      <div className="w-full max-w-2xl bg-[#FAF7FC] h-full overflow-y-auto border-l border-[#E4D5EC] shadow-xl flex flex-col">
        <div className="sticky top-0 z-10 bg-white border-b border-[#E4D5EC] px-6 py-4 flex items-center justify-between gap-4">
          <div>
            <h2 id="organizer-title" className="font-display text-2xl font-semibold text-[#2E1639]">
              Painel da Organizadora
            </h2>
            <p className="text-xs text-[#634B6F]">
              Meu 2027 com Propósito · Eliete Oliveira
            </p>
          </div>
          <button
            type="button"
            onClick={onClose}
            aria-label="Fechar painel"
            className="p-2 rounded-lg text-[#634B6F] hover:text-[#2E1639] hover:bg-[#F3ECF7] transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" aria-hidden="true" />
          </button>
        </div>

        <div className="p-6 flex-1 space-y-6">
          {/* Quick Share Links */}
          <div className="bg-white border border-[#E4D5EC] rounded-xl p-4 space-y-3">
            <p className="text-xs font-semibold text-[#2E1639]">
              Links para Divulgação
            </p>
            <div className="flex flex-wrap gap-2">
              <button
                type="button"
                onClick={() => handleCopyUrl('page')}
                className="inline-flex items-center gap-2 px-3.5 py-2 rounded-lg bg-[#F3ECF7] text-[#5B236E] text-xs font-medium hover:bg-[#E4D5EC]/60 transition-colors cursor-pointer whitespace-nowrap"
              >
                {copiedUrl === 'page' ? (
                  <Check className="w-3.5 h-3.5" aria-hidden="true" />
                ) : (
                  <Copy className="w-3.5 h-3.5" aria-hidden="true" />
                )}
                <span>
                  {copiedUrl === 'page'
                    ? 'Link de inscrição copiado'
                    : 'Copiar link de inscrição'}
                </span>
              </button>
              <button
                type="button"
                onClick={() => handleCopyUrl('whatsapp')}
                className="inline-flex items-center gap-2 px-3.5 py-2 rounded-lg border border-[#E4D5EC] bg-white text-[#2E1639] text-xs font-medium hover:bg-[#FAF7FC] transition-colors cursor-pointer whitespace-nowrap"
              >
                {copiedUrl === 'whatsapp' ? (
                  <Check className="w-3.5 h-3.5" aria-hidden="true" />
                ) : (
                  <Copy className="w-3.5 h-3.5" aria-hidden="true" />
                )}
                <span>
                  {copiedUrl === 'whatsapp'
                    ? 'Link do grupo copiado'
                    : 'Copiar link do grupo WhatsApp'}
                </span>
              </button>
            </div>
          </div>

          {authLoading ? (
            <div className="bg-white border border-[#E4D5EC] rounded-xl p-8 text-center text-sm text-[#634B6F]">
              Verificando sessão...
            </div>
          ) : !user ? (
            <div className="bg-white border border-[#E4D5EC] rounded-xl p-8 text-center space-y-4">
              <div className="w-11 h-11 rounded-full bg-[#F3ECF7] text-[#5B236E] flex items-center justify-center mx-auto">
                <Lock className="w-5 h-5" aria-hidden="true" />
              </div>
              <div className="space-y-1">
                <h3 className="font-display text-xl font-semibold text-[#2E1639]">
                  Acesso restrito à organização
                </h3>
                <p className="text-sm text-[#634B6F] max-w-sm mx-auto">
                  Entre com a conta Google autorizada para visualizar a lista de mulheres inscritas
                  e exportar os contatos.
                </p>
              </div>
              {authError && (
                <p className="text-xs text-rose-700">{authError}</p>
              )}
              <button
                type="button"
                onClick={handleSignIn}
                className="inline-flex items-center justify-center gap-2 px-5 py-2.5 rounded-xl bg-[#5B236E] text-white text-sm font-semibold hover:bg-[#4A1A5B] transition-colors cursor-pointer"
              >
                Entrar com Google
              </button>
            </div>
          ) : !isAuthorizedAdmin ? (
            <div className="bg-white border border-[#E4D5EC] rounded-xl p-8 text-center space-y-4">
              <div className="w-11 h-11 rounded-full bg-amber-50 text-amber-700 flex items-center justify-center mx-auto">
                <ShieldAlert className="w-5 h-5" aria-hidden="true" />
              </div>
              <div className="space-y-1">
                <h3 className="font-display text-xl font-semibold text-[#2E1639]">
                  Conta sem permissão de organizadora
                </h3>
                <p className="text-sm text-[#634B6F]">
                  Você entrou como <strong className="text-[#2E1639]">{user.email}</strong>. Use a
                  conta administradora configurada para acessar os dados das inscritas.
                </p>
              </div>
              <button
                type="button"
                onClick={handleSignOut}
                className="inline-flex items-center gap-2 px-4 py-2 rounded-lg border border-[#E4D5EC] text-sm font-medium text-[#2E1639] hover:bg-[#F3ECF7] transition-colors cursor-pointer"
              >
                <LogOut className="w-4 h-4" aria-hidden="true" />
                Sair desta conta
              </button>
            </div>
          ) : (
            <>
              <div className="flex flex-wrap items-center justify-between gap-3">
                <div className="text-xs text-[#634B6F]">
                  Conectada como <strong className="text-[#2E1639]">{user.email}</strong>
                </div>
                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={handleExportCsv}
                    disabled={registrations.length === 0}
                    className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-lg bg-[#5B236E] text-white text-xs font-medium hover:bg-[#4A1A5B] disabled:opacity-50 transition-colors cursor-pointer whitespace-nowrap"
                  >
                    <Download className="w-3.5 h-3.5" aria-hidden="true" />
                    Exportar CSV
                  </button>
                  <button
                    type="button"
                    onClick={handleSignOut}
                    className="inline-flex items-center gap-1.5 px-3 py-2 rounded-lg border border-[#E4D5EC] bg-white text-[#2E1639] text-xs font-medium hover:bg-[#F3ECF7] transition-colors cursor-pointer whitespace-nowrap"
                  >
                    <LogOut className="w-3.5 h-3.5" aria-hidden="true" />
                    Sair
                  </button>
                </div>
              </div>

              {/* Metrics */}
              <div className="grid grid-cols-3 gap-3">
                <div className="bg-white border border-[#E4D5EC] rounded-xl p-4">
                  <p className="text-xs text-[#634B6F]">Total de Inscritas</p>
                  <p className="text-2xl font-semibold text-[#2E1639] tabular-nums mt-1">
                    {counts.total}
                  </p>
                </div>
                <div className="bg-white border border-[#E4D5EC] rounded-xl p-4">
                  <p className="text-xs text-[#634B6F]">Confirmadas</p>
                  <p className="text-2xl font-semibold text-[#5B236E] tabular-nums mt-1">
                    {counts.confirmed}
                  </p>
                </div>
                <div className="bg-white border border-[#E4D5EC] rounded-xl p-4">
                  <p className="text-xs text-[#634B6F]">Já no Grupo</p>
                  <p className="text-2xl font-semibold text-[#A8803B] tabular-nums mt-1">
                    {counts.inGroup}
                  </p>
                </div>
              </div>

              {/* Search & Filter */}
              <div className="flex flex-col sm:flex-row gap-3">
                <div className="relative flex-1">
                  <Search
                    className="w-4 h-4 text-[#634B6F] absolute left-3.5 top-1/2 -translate-y-1/2"
                    aria-hidden="true"
                  />
                  <input
                    type="text"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    placeholder="Buscar por nome, WhatsApp, e-mail ou cidade..."
                    className="w-full rounded-xl border border-[#E4D5EC] bg-white pl-10 pr-4 py-2.5 text-sm text-[#2E1639] placeholder:text-[#9882A3] focus:border-[#5B236E] focus:outline-none"
                  />
                </div>
                <div className="flex items-center gap-1 p-1 bg-[#F3ECF7] rounded-xl shrink-0">
                  <button
                    type="button"
                    onClick={() => setStatusFilter('all')}
                    className={`px-3 py-1.5 text-xs font-medium rounded-lg transition-colors cursor-pointer whitespace-nowrap ${
                      statusFilter === 'all'
                        ? 'bg-white text-[#2E1639] shadow-xs'
                        : 'text-[#634B6F] hover:text-[#2E1639]'
                    }`}
                  >
                    Todas
                  </button>
                  <button
                    type="button"
                    onClick={() => setStatusFilter('confirmada')}
                    className={`px-3 py-1.5 text-xs font-medium rounded-lg transition-colors cursor-pointer whitespace-nowrap ${
                      statusFilter === 'confirmada'
                        ? 'bg-white text-[#2E1639] shadow-xs'
                        : 'text-[#634B6F] hover:text-[#2E1639]'
                    }`}
                  >
                    Confirmadas
                  </button>
                  <button
                    type="button"
                    onClick={() => setStatusFilter('no_grupo')}
                    className={`px-3 py-1.5 text-xs font-medium rounded-lg transition-colors cursor-pointer whitespace-nowrap ${
                      statusFilter === 'no_grupo'
                        ? 'bg-white text-[#2E1639] shadow-xs'
                        : 'text-[#634B6F] hover:text-[#2E1639]'
                    }`}
                  >
                    No grupo
                  </button>
                </div>
              </div>

              {/* List */}
              {loadingData ? (
                <div className="bg-white border border-[#E4D5EC] rounded-xl p-8 text-center text-sm text-[#634B6F]">
                  Carregando inscrições...
                </div>
              ) : filteredRegistrations.length === 0 ? (
                <div className="bg-white border border-[#E4D5EC] rounded-xl p-8 text-center space-y-2">
                  <Users className="w-6 h-6 text-[#9882A3] mx-auto" aria-hidden="true" />
                  <p className="text-sm font-medium text-[#2E1639]">
                    Nenhuma inscrição encontrada
                  </p>
                  <p className="text-xs text-[#634B6F]">
                    Compartilhe o link da página para começar a receber as participantes.
                  </p>
                </div>
              ) : (
                <div className="space-y-3">
                  {filteredRegistrations.map((item) => (
                    <div
                      key={item.id}
                      className="bg-white border border-[#E4D5EC] rounded-xl p-4 space-y-2.5"
                    >
                      <div className="flex items-start justify-between gap-3">
                        <div>
                          <h4 className="font-semibold text-sm text-[#2E1639]">
                            {item.fullName}
                          </h4>
                          <div className="text-xs text-[#634B6F] flex flex-wrap items-center gap-x-2 gap-y-0.5 mt-0.5 tabular-nums">
                            <span>{item.whatsapp}</span>
                            <span aria-hidden="true">·</span>
                            <span>{item.email}</span>
                            {item.cityState && (
                              <>
                                <span aria-hidden="true">·</span>
                                <span>{item.cityState}</span>
                              </>
                            )}
                          </div>
                        </div>

                        <div className="flex items-center gap-2 shrink-0">
                          <button
                            type="button"
                            onClick={() => handleToggleStatus(item)}
                            className={`px-2.5 py-1 rounded-lg text-xs font-medium transition-colors cursor-pointer whitespace-nowrap ${
                              item.status === 'no_grupo'
                                ? 'bg-[#F3ECF7] text-[#5B236E]'
                                : 'bg-[#FAF7FC] border border-[#E4D5EC] text-[#634B6F] hover:text-[#2E1639]'
                            }`}
                          >
                            {item.status === 'no_grupo' ? 'No grupo' : 'Marcar no grupo'}
                          </button>

                          {confirmDeleteId === item.id ? (
                            <div className="flex items-center gap-1">
                              <button
                                type="button"
                                onClick={() => handleDelete(item.id)}
                                className="px-2 py-1 rounded-lg bg-rose-600 text-white text-xs font-medium hover:bg-rose-700 cursor-pointer"
                              >
                                Confirmar
                              </button>
                              <button
                                type="button"
                                onClick={() => setConfirmDeleteId(null)}
                                className="px-2 py-1 rounded-lg border border-[#E4D5EC] text-xs text-[#634B6F] cursor-pointer"
                              >
                                Não
                              </button>
                            </div>
                          ) : (
                            <button
                              type="button"
                              onClick={() => setConfirmDeleteId(item.id)}
                              aria-label={`Remover inscrição de ${item.fullName}`}
                              className="p-1.5 rounded-lg text-[#9882A3] hover:text-rose-700 hover:bg-rose-50 transition-colors cursor-pointer"
                            >
                              <Trash2 className="w-4 h-4" aria-hidden="true" />
                            </button>
                          )}
                        </div>
                      </div>

                      {item.expectation && (
                        <p className="text-xs text-[#634B6F] bg-[#FAF7FC] rounded-lg px-3 py-2 leading-relaxed">
                          “{item.expectation}”
                        </p>
                      )}

                      {item.createdAt && (
                        <p className="text-[11px] text-[#9882A3] tabular-nums">
                          Inscrita em {item.createdAt.toDate().toLocaleString('pt-BR')}
                        </p>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </>
          )}
        </div>
      </div>
    </div>
  );
}
