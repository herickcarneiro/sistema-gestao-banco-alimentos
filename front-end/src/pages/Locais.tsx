import { useEffect, useState } from "react";
import { Building2, User, Plus, X, Trash2, Edit2 } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { toast } from "sonner";
import PageHeader from "@/components/shared/PageHeader";
import CommandSearch from "@/components/shared/CommandSearch";
import { api } from "@/lib/api";

function formatDocumento(value: string): string {
  const digits = value.replace(/\D/g, "");
  if (digits.length <= 11) {
    return digits
      .replace(/(\d{3})(\d)/, "$1.$2")
      .replace(/(\d{3})(\d)/, "$1.$2")
      .replace(/(\d{3})(\d{1,2})$/, "$1-$2");
  }
  return digits
    .replace(/(\d{2})(\d)/, "$1.$2")
    .replace(/(\d{3})(\d)/, "$1.$2")
    .replace(/(\d{3})(\d)/, "$1/$2")
    .replace(/(\d{4})(\d{1,2})$/, "$1-$2");
}

function getDocRaw(value: string): string {
  return value.replace(/\D/g, "").slice(0, 14);
}

type LocalTipo = "doador" | "beneficiario";

interface LocalApi {
  id_local: string;
  nome_local: string;
  cpf_local: string | null;
  cnpj_local: string | null;
  is_owner: boolean;
}

interface LocalItem {
  id: string;
  nome: string;
  tipo: LocalTipo;
  documento: string;
  is_owner: boolean;
}

function toLocalItem(local: LocalApi): LocalItem | null {
  if (local.is_owner) {
    return null;
  }

  const rawDocumento = local.cnpj_local ?? local.cpf_local ?? "";

  return {
    id: local.id_local,
    nome: local.nome_local,
    tipo: local.cnpj_local ? "doador" : "beneficiario",
    documento: formatDocumento(rawDocumento),
    is_owner: local.is_owner,
  };
}

function buildPayload(nome: string, tipo: LocalTipo, documentoRaw: string) {
  return {
    nome_local: nome,
    cpf_local: tipo === "beneficiario" ? documentoRaw : null,
    cnpj_local: tipo === "doador" ? documentoRaw : null,
  };
}

function getApiErrorMessage(error: unknown, fallback: string) {
  if (typeof error === "object" && error !== null && "response" in error) {
    const response = error as { response?: { data?: { detail?: string } } };
    return response.response?.data?.detail || fallback;
  }

  return fallback;
}

export default function Locais() {
  const [search, setSearch] = useState("");
  const [tipoFilter, setTipoFilter] = useState<"todos" | LocalTipo>("todos");
  const [allLocais, setAllLocais] = useState<LocalItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);

  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [formNome, setFormNome] = useState("");
  const [formTipo, setFormTipo] = useState<LocalTipo>("doador");
  const [formDoc, setFormDoc] = useState("");

  useEffect(() => {
    let isMounted = true;

    const loadLocais = async () => {
      try {
        setIsLoading(true);
        const response = await api.get("/demand/places/");
        const locaisApi: LocalApi[] = response.data.locais || [];
        const locaisNormalizados = locaisApi
          .map(toLocalItem)
          .filter((local): local is LocalItem => local !== null);

        if (isMounted) {
          setAllLocais(locaisNormalizados);
        }
      } catch {
        toast.error("Erro ao carregar locais.");
      } finally {
        if (isMounted) {
          setIsLoading(false);
        }
      }
    };

    loadLocais();

    return () => {
      isMounted = false;
    };
  }, []);

  const filtered = allLocais.filter((l) => {
    const matchSearch = l.nome.toLowerCase().includes(search.toLowerCase());
    const matchTipo = tipoFilter === "todos" || l.tipo === tipoFilter;
    return matchSearch && matchTipo;
  });

  const openNew = () => {
    setEditingId(null);
    setFormNome("");
    setFormDoc("");
    setShowForm(true);
  };

  const openEdit = (local: LocalItem) => {
    setEditingId(local.id);
    setFormNome(local.nome);
    setFormTipo(local.tipo);
    setFormDoc(local.documento);
    setShowForm(true);
  };

  const handleDocChange = (value: string) => {
    const raw = getDocRaw(value);
    setFormDoc(formatDocumento(raw));

    if (raw.length === 11) {
      setFormTipo("beneficiario");
    } else if (raw.length === 14) {
      setFormTipo("doador");
    }
  };

  const handleSave = async () => {
    const rawDoc = formDoc.replace(/\D/g, "");
    if (!formNome.trim()) {
      toast.error("Preencha o nome do local.");
      return;
    }
    if (rawDoc.length !== 11 && rawDoc.length !== 14) {
      toast.error("Informe um CPF (11 dígitos) ou CNPJ (14 dígitos) válido.");
      return;
    }

    const inferredTipo: LocalTipo = rawDoc.length === 11 ? "beneficiario" : "doador";
    const payload = buildPayload(formNome.trim(), inferredTipo, rawDoc);

    try {
      setIsSaving(true);

      if (editingId) {
        const response = await api.put(`/demand/places/${editingId}`, payload);
        const updated = toLocalItem(response.data as LocalApi);

        if (updated) {
          setAllLocais((prev) => prev.map((local) => (local.id === editingId ? updated : local)));
        }

        toast.success("Local atualizado.");
      } else {
        const response = await api.post("/demand/places/", payload);
        const created = toLocalItem(response.data as LocalApi);

        if (created) {
          setAllLocais((prev) => [created, ...prev]);
        }

        toast.success("Local cadastrado.");
      }

      setShowForm(false);
    } catch (error: unknown) {
      toast.error(getApiErrorMessage(error, "Erro ao salvar local."));
    } finally {
      setIsSaving(false);
    }
  };

  const handleDelete = async (id: string) => {
    try {
      await api.delete(`/demand/places/${id}`);
      setAllLocais((prev) => prev.filter((local) => local.id !== id));
      toast.success("Local removido.");
    } catch (error: unknown) {
      toast.error(getApiErrorMessage(error, "Erro ao remover local."));
    }
  };

  return (
    <div className="p-4 md:p-8 max-w-2xl mx-auto">
      <PageHeader
        title="Locais"
        subtitle="Cadastro de locais e documentos"
        action={
          <button
            onClick={openNew}
            className="h-9 px-3 rounded-lg bg-primary text-primary-foreground text-sm font-medium flex items-center gap-1.5"
          >
            <Plus size={14} />
            Novo Local
          </button>
        }
      />

      <div className="mb-4">
        <CommandSearch value={search} onChange={setSearch} placeholder="Buscar local..." />
      </div>

      <AnimatePresence>
        {showForm && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: "auto" }}
            exit={{ opacity: 0, height: 0 }}
            className="mb-5 overflow-hidden"
          >
            <div className="p-4 rounded-lg border border-primary/20 bg-primary/5 space-y-3">
              <div className="flex items-center justify-between">
                <p className="text-xs font-medium uppercase tracking-widest text-primary">
                  {editingId ? "Editar Local" : "Novo Local"}
                </p>
                <button onClick={() => setShowForm(false)} className="text-muted-foreground hover:text-foreground">
                  <X size={14} />
                </button>
              </div>

              <input
                value={formNome}
                onChange={(e) => setFormNome(e.target.value)}
                placeholder="Nome do local"
                className="w-full h-10 px-3 rounded-md bg-surface text-sm text-foreground outline-none ring-1 ring-transparent focus:ring-primary/30"
              />

              <div>
                <label className="text-[10px] text-muted-foreground uppercase tracking-wider block mb-1">
                  CPF ou CNPJ
                </label>
                <input
                  value={formDoc}
                  onChange={(e) => handleDocChange(e.target.value)}
                  placeholder="000.000.000-00"
                  maxLength={18}
                  className="w-full h-10 px-3 rounded-md bg-surface text-sm text-foreground tabular-nums outline-none ring-1 ring-transparent focus:ring-primary/30"
                />
              </div>

              <div className="flex gap-2 pt-1">
                <button
                  onClick={handleSave}
                  disabled={isSaving}
                  className="flex-1 h-9 rounded-md bg-primary text-primary-foreground text-sm font-medium disabled:opacity-60"
                >
                  {isSaving ? "Salvando..." : editingId ? "Salvar" : "Cadastrar"}
                </button>
                <button onClick={() => setShowForm(false)} className="h-9 px-4 rounded-md bg-secondary text-muted-foreground text-sm">
                  Cancelar
                </button>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {isLoading && (
        <div className="py-12 text-center">
          <p className="text-sm text-muted-foreground">Carregando locais...</p>
        </div>
      )}

      {!isLoading && (
        <div className="space-y-1">
        {filtered.map((local) => (
          <div
            key={local.id}
            className="flex items-center gap-3 py-3 px-4 rounded-lg bg-surface border border-border group"
          >
            <div className={`h-8 w-8 rounded-full flex items-center justify-center shrink-0 ${
              local.tipo === "doador" ? "bg-primary/10" : "bg-muted"
            }`}>
              {local.tipo === "doador" ? (
                <Building2 size={14} className="text-primary" />
              ) : (
                <User size={14} className="text-muted-foreground" />
              )}
            </div>
            <div className="flex-1 min-w-0">
              <span className="text-sm font-medium text-foreground block truncate">{local.nome}</span>
              <span className="text-[11px] text-muted-foreground">
                {local.tipo === "doador" ? "Doador" : "Beneficiário"} · {local.documento}
              </span>
            </div>
          </div>
        ))}
        {filtered.length === 0 && (
          <div className="py-12 text-center">
            <p className="text-sm text-muted-foreground">Nenhum local encontrado.</p>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
