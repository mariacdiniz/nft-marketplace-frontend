import { useForm } from "react-hook-form";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import { Link, useNavigate, useSearch } from "@tanstack/react-router";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { Eye, EyeOff, X } from "lucide-react";
import { useState, type FormEvent } from "react";
import { api, apiError } from "@/shared/api/client";
import { Button } from "@/shared/ui/button";
import { FieldError, Input } from "@/shared/ui/input";
import { HomePage } from "@/routes/index";

const loginSchema = z.object({
  email: z.string().email("Informe um e-mail válido"),
  password: z.string().min(1, "Informe a senha"),
});

const registerSchema = z
  .object({
    username: z.string().min(3, "Informe um nome de usuário (mínimo 3 caracteres)"),
    email: z.string().email("Digite um e-mail válido"),
    password: z.string().min(8, "A senha deve ter ao menos 8 caracteres"),
    confirmPassword: z.string().min(1, "Confirme a senha"),
  })
  .refine((d) => d.password === d.confirmPassword, { message: "As senhas não coincidem", path: ["confirmPassword"] });

export function LoginPage() {
  return <AuthShell mode="login" />;
}

export function RegisterPage() {
  return <AuthShell mode="register" />;
}

function usernameFrom(value: string, email: string) {
  const raw = value.trim() || email.split("@")[0] || "";
  return raw.includes("@") ? (raw.split("@")[0] ?? raw) : raw;
}

function AuthShell({ mode }: { mode: "login" | "register" }) {
  const navigate = useNavigate();
  const search = useSearch({ strict: false }) as { redirect?: string };
  const close = () => navigate({ to: search.redirect || "/" });

  return (
    <div>
      <div className="hidden md:block">
        <HomePage />
      </div>
      <div className="fixed inset-0 z-50 grid place-items-center bg-black/70 p-4">
        <div
          role="dialog"
          aria-modal="true"
          aria-labelledby="auth-title"
          className="relative w-full max-w-md rounded-2xl bg-[#1c1511] p-6 shadow-2xl md:border md:border-line"
        >
          <button type="button" aria-label="Fechar" className="absolute right-4 top-4 hidden text-kurio-muted md:block" onClick={close}>
            <X size={16} />
          </button>
          <p className="text-center font-display text-4xl tracking-[0.28em] md:hidden">KURIO</p>
          {mode === "login" ? <LoginForm redirect={search.redirect} /> : <RegisterForm redirect={search.redirect} />}
          <SocialButtons redirect={search.redirect} />
        </div>
      </div>
    </div>
  );
}

function SocialButtons({ redirect }: { redirect?: string }) {
  const navigate = useNavigate();
  const qc = useQueryClient();
  const [message, setMessage] = useState<string | null>(null);
  const social = useMutation({
    mutationFn: async (provider: "google" | "facebook") => api.post("/auth/social", { provider }),
    onSuccess: async () => {
      qc.clear();
      await navigate({ to: redirect || "/" });
    },
    onError: (err) => setMessage(apiError(err).message),
  });
  return (
    <div className="mt-4">
      <p className="text-center text-xs text-kurio-dim">Ou continue com</p>
      <div className="mt-2 space-y-2">
        <button
          type="button"
          className="h-11 w-full rounded-md border border-line text-sm hover:border-kurio-orange"
          disabled={social.isPending}
          onClick={() => social.mutate("google")}
        >
          Continuar com Google
        </button>
        <button
          type="button"
          className="h-11 w-full rounded-md border border-line text-sm hover:border-kurio-orange"
          disabled={social.isPending}
          onClick={() => social.mutate("facebook")}
        >
          Continuar com Facebook
        </button>
      </div>
      {message ? (
        <p role="alert" className="mt-2 text-center text-sm text-red-400">
          {message}
        </p>
      ) : null}
    </div>
  );
}

function LoginForm({ redirect }: { redirect?: string }) {
  const navigate = useNavigate();
  const qc = useQueryClient();
  const [show, setShow] = useState(false);
  const form = useForm<z.infer<typeof loginSchema>>({
    resolver: zodResolver(loginSchema),
    defaultValues: { email: "", password: "" },
  });
  const mutation = useMutation({
    mutationFn: async (values: z.infer<typeof loginSchema>) => api.post("/auth/login", values),
    onSuccess: async () => {
      qc.clear();
      await navigate({ to: redirect || "/" });
    },
  });
  const err = mutation.error ? apiError(mutation.error) : undefined;

  const onSubmit = (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const fd = new FormData(e.currentTarget);
    const values = {
      email: String(fd.get("email") ?? "").trim(),
      password: String(fd.get("password") ?? ""),
    };
    form.clearErrors();
    const parsed = loginSchema.safeParse(values);
    if (!parsed.success) {
      for (const issue of parsed.error.issues) {
        const key = issue.path[0];
        if (key === "email" || key === "password") form.setError(key, { message: issue.message });
      }
      return;
    }
    mutation.mutate(parsed.data);
  };

  return (
    <form className="mt-6 space-y-3" noValidate onSubmit={onSubmit}>
      <div className="mb-4 hidden text-center md:block">
        <div className="flex justify-center gap-2 text-lg">
          <span id="auth-title" className="text-kurio-cream">
            Entrar
          </span>
          <span className="text-kurio-dim">|</span>
          <Link to="/register" search={{ redirect }} className="text-kurio-muted">
            Criar conta
          </Link>
        </div>
        <p className="mt-2 text-xs text-kurio-muted">Entre para gerenciar sua carteira, coleção e perfil de criador.</p>
      </div>
      <h1 id="auth-title" className="text-center text-xl md:hidden">
        Entrar
      </h1>
      <label className="sr-only" htmlFor="login-email">
        E-mail
      </label>
      <Input id="login-email" name="email" type="email" autoComplete="email" placeholder="E-mail" aria-describedby="email-err" />
      <FieldError id="email-err" message={form.formState.errors.email?.message} />
      <label className="sr-only" htmlFor="login-password">
        Senha
      </label>
      <div className="relative">
        <Input id="login-password" name="password" type={show ? "text" : "password"} autoComplete="current-password" placeholder="Senha" />
        <button type="button" className="absolute right-3 top-3 text-kurio-muted" aria-label={show ? "Ocultar senha" : "Mostrar senha"} onClick={() => setShow((s) => !s)}>
          {show ? <EyeOff size={16} /> : <Eye size={16} />}
        </button>
      </div>
      <FieldError id="password-err" message={form.formState.errors.password?.message} />
      <p className="text-right text-xs text-kurio-dim">Conta de teste: ana@kurio.dev · Colecionador@123</p>
      {err ? (
        <p role="alert" className="text-sm text-red-400">
          {err.message}
        </p>
      ) : null}
      <Button type="submit" className="h-12 w-full rounded-md" disabled={mutation.isPending}>
        Entrar
      </Button>
      <p className="text-center text-sm md:hidden">
        Novo na Kurio?{" "}
        <Link to="/register" className="text-kurio-orange">
          Crie uma conta
        </Link>
      </p>
    </form>
  );
}

function RegisterForm({ redirect }: { redirect?: string }) {
  const navigate = useNavigate();
  const qc = useQueryClient();
  const [show, setShow] = useState(false);
  const form = useForm<z.infer<typeof registerSchema>>({
    resolver: zodResolver(registerSchema),
    defaultValues: { username: "", email: "", password: "", confirmPassword: "" },
  });
  const mutation = useMutation({
    mutationFn: async (values: z.infer<typeof registerSchema>) => api.post("/auth/register", values),
    onSuccess: async () => {
      qc.clear();
      await navigate({ to: redirect || "/" });
    },
  });
  const err = mutation.error ? apiError(mutation.error) : undefined;
  const fieldMsg = (key: keyof z.infer<typeof registerSchema>) => {
    const msg = form.formState.errors[key]?.message;
    return typeof msg === "string" ? msg : undefined;
  };

  const onSubmit = (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const fd = new FormData(e.currentTarget);
    const email = String(fd.get("email") ?? "").trim();
    const values = {
      username: usernameFrom(String(fd.get("username") ?? ""), email),
      email,
      password: String(fd.get("password") ?? ""),
      confirmPassword: String(fd.get("confirmPassword") ?? ""),
    };
    form.clearErrors();
    const parsed = registerSchema.safeParse(values);
    if (!parsed.success) {
      for (const issue of parsed.error.issues) {
        const key = String(issue.path[0]) as keyof z.infer<typeof registerSchema>;
        form.setError(key, { message: issue.message });
      }
      return;
    }
    mutation.mutate(parsed.data);
  };

  return (
    <form className="mt-6 space-y-3" noValidate onSubmit={onSubmit}>
      <div className="mb-4 hidden text-center md:block">
        <div className="flex justify-center gap-2 text-lg">
          <Link to="/login" search={{ redirect }} className="text-kurio-muted">
            Entrar
          </Link>
          <span className="text-kurio-dim">|</span>
          <span id="auth-title" className="text-kurio-cream">
            Criar conta
          </span>
        </div>
        <p className="mt-2 text-xs text-kurio-muted">Crie seu perfil de colecionador e comece a usar a carteira quando quiser.</p>
      </div>
      <h1 id="auth-title" className="text-center text-lg md:hidden">
        Criar perfil de colecionador
      </h1>
      <label className="sr-only" htmlFor="reg-username">
        Nome de usuário
      </label>
      <Input id="reg-username" name="username" placeholder="Nome de usuário" autoComplete="username" aria-label="Nome de usuário" />
      <FieldError id="username-err" message={fieldMsg("username")} />
      <label className="sr-only" htmlFor="reg-email">
        Digite seu e-mail
      </label>
      <Input id="reg-email" name="email" placeholder="Digite seu e-mail" aria-label="Digite seu e-mail" type="email" autoComplete="email" />
      <FieldError id="email-err" message={fieldMsg("email")} />
      <div className="relative">
        <label className="sr-only" htmlFor="reg-password">
          Senha
        </label>
        <Input id="reg-password" name="password" placeholder="Senha (mínimo 8 caracteres)" aria-label="Senha" type={show ? "text" : "password"} autoComplete="new-password" />
        <button type="button" className="absolute right-3 top-3" aria-label="Mostrar senha" onClick={() => setShow((s) => !s)}>
          {show ? <EyeOff size={16} /> : <Eye size={16} />}
        </button>
      </div>
      <FieldError id="password-err" message={fieldMsg("password")} />
      <label className="sr-only" htmlFor="reg-confirm">
        Confirmar senha
      </label>
      <Input id="reg-confirm" name="confirmPassword" placeholder="Confirmar senha" aria-label="Confirmar senha" type="password" autoComplete="new-password" />
      <FieldError id="confirm-err" message={fieldMsg("confirmPassword")} />
      {err ? (
        <p role="alert" className="text-sm text-red-400">
          {err.message}
        </p>
      ) : null}
      <Button type="submit" className="h-12 w-full" disabled={mutation.isPending}>
        <span className="md:hidden">Criar perfil</span>
        <span className="hidden md:inline">Criar conta</span>
      </Button>
      <p className="text-center text-sm md:hidden">
        Já tem uma conta?{" "}
        <Link to="/login" className="text-kurio-orange">
          Entre
        </Link>
      </p>
    </form>
  );
}
