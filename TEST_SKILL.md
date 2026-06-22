# TEST_SKILL — Skill de Qualidade e Testes

> Versão: 1.0
> Status: `ADAPTADA`
> Stack: TypeScript + Playwright (astro-consent)
> Adaptada em: 2026-06-22
>
> Esta skill é autossuficiente e auto-instalável.
> Não requer CLAUDE.md para funcionar — ela própria se instala no projeto
> na primeira vez que for lida.

---

## PRIMEIRA COISA A FAZER AO LER ESTE FICHEIRO

Execute imediatamente a FASE 0 antes de qualquer outra coisa.

---

## FASE 0 — AUTO-INSTALAÇÃO (executar uma única vez)

Esta fase garante que a skill será carregada automaticamente em sessões futuras,
sem que o utilizador precise referenciar o ficheiro manualmente.

### 0.1 — Verificar se já está instalada

```bash
# Verificar se CLAUDE.md existe
cat CLAUDE.md 2>/dev/null | grep "TEST_SKILL" || echo "NÃO_INSTALADA"
```

### 0.2 — Se retornou "NÃO_INSTALADA", injetar referência no CLAUDE.md

**Se CLAUDE.md já existe no projeto:**

Adicionar ao final do ficheiro existente, sem apagar nada:

```
## Skills activas

<!-- TEST_SKILL:instalada -->
Ao iniciar qualquer sessão, leia TEST_SKILL.md antes de responder a qualquer pedido.
Gatilhos activos: "testa agora", "teste", "verifica bugs", "veja se funciona bem",
"roda os testes", "tá tudo ok?", "pode commitar?", "está bom?"
```

**Se CLAUDE.md não existe no projeto:**

Criar um CLAUDE.md mínimo com apenas:

```markdown
# CLAUDE.md

## Skills activas

<!-- TEST_SKILL:instalada -->
Ao iniciar qualquer sessão, leia TEST_SKILL.md antes de responder a qualquer pedido.
Gatilhos activos: "testa agora", "teste", "verifica bugs", "veja se funciona bem",
"roda os testes", "tá tudo ok?", "pode commitar?", "está bom?"
```

### 0.3 — Confirmar instalação

Após escrever no CLAUDE.md, informe o utilizador:

```
✅ TEST_SKILL instalada neste projecto.
   - Se já existia um CLAUDE.md: referência adicionada ao final, nada foi apagado.
   - Se não existia: CLAUDE.md criado com conteúdo mínimo.
   A partir de agora, esta skill será carregada automaticamente em todas as sessões.
   A continuar com a detecção de stack...
```

### 0.4 — Prosseguir para FASE 1 imediatamente após instalação

Não espere confirmação do utilizador. Após instalar, execute a FASE 1 automaticamente.

---

## GATILHOS

Execute o fluxo completo de testes quando o utilizador disser qualquer uma destas frases:

- "testa agora"
- "teste"
- "verifica bugs"
- "veja se funciona bem"
- "roda os testes"
- "tá tudo ok?"
- "pode commitar?"
- "está bom?"

Ao detectar qualquer gatilho, não pergunte — execute imediatamente.
Se o status ainda for `PENDENTE_DETECÇÃO`, execute FASE 1 antes da FASE 2.

---

## FASE 1 — DETECÇÃO DE STACK (sempre preservar, nunca apagar)

### 1.1 — Inspecionar o projeto

```bash
# Listar arquivos de configuração na raiz
ls -la

# Verificar manifests por stack
cat package.json 2>/dev/null || echo "SEM_PACKAGE_JSON"
cat Gemfile 2>/dev/null || echo "SEM_GEMFILE"
cat requirements.txt 2>/dev/null || echo "SEM_REQUIREMENTS"
cat pyproject.toml 2>/dev/null || echo "SEM_PYPROJECT"
cat Cargo.toml 2>/dev/null || echo "SEM_CARGO"
cat go.mod 2>/dev/null || echo "SEM_GO_MOD"
cat composer.json 2>/dev/null || echo "SEM_COMPOSER"
```

### 1.2 — Tabela de detecção

| Ficheiro encontrado | Stack | Frameworks prováveis |
|---|---|---|
| `package.json` | Node.js / TypeScript | React, Next.js, Astro, Express, NestJS |
| `Gemfile` | Ruby | Rails, Sinatra |
| `requirements.txt` ou `pyproject.toml` | Python | Django, FastAPI, Flask |
| `Cargo.toml` | Rust | Axum, Actix, CLI |
| `go.mod` | Go | Gin, Echo, stdlib |
| `composer.json` | PHP | Laravel, Symfony |

### 1.3 — Aprofundar por stack detectada

**Se Node.js / TypeScript:**
```bash
cat package.json | python3 -c "import sys,json; d=json.load(sys.stdin); [print(k,':',v) for k,v in d.get('scripts',{}).items()]" 2>/dev/null
# Identificar: jest, vitest, mocha, playwright, cypress, eslint, tsc, prettier
```

**Se Ruby:**
```bash
cat Gemfile | grep -E 'rspec|minitest|rubocop|brakeman|simplecov'
ls spec/ test/ 2>/dev/null
bundle exec rake -T 2>/dev/null | head -30
```

**Se Python:**
```bash
cat requirements.txt pyproject.toml 2>/dev/null | grep -E 'pytest|coverage|flake8|mypy|black|ruff|bandit'
ls tests/ test/ 2>/dev/null
cat Makefile 2>/dev/null | grep -E '^[a-z].*:' | head -20
```

**Se Rust:**
```bash
cat Cargo.toml | grep -E '\[dev-dependencies\]|clippy|tarpaulin'
```

**Se Go:**
```bash
cat go.mod
ls *_test.go 2>/dev/null | head -5
```

**Se PHP / Laravel:**
```bash
cat composer.json | python3 -c "import sys,json; d=json.load(sys.stdin); print(d.get('scripts',{}))" 2>/dev/null
ls tests/ 2>/dev/null
```

### 1.4 — Após detecção: reescrever a FASE 2

Depois de executar os passos acima:
1. Reescreva **apenas** a FASE 2 com os comandos reais descobertos.
2. Atualize o cabeçalho deste ficheiro:
   - `Status: PENDENTE_DETECÇÃO` → `Status: ADAPTADA`
   - `Stack: (detectada na primeira execução)` → `Stack: [stack real]`
   - `Adaptada em: (preenchido automaticamente)` → `Adaptada em: [data actual]`
3. Preserve intactas as FASES 0, 1, 3, 4 e 5.
4. Nunca apague a lógica de detecção da FASE 1.

---

## FASE 2 — FLUXO DE TESTES (TypeScript + Playwright — astro-consent)

> Stack: TypeScript + Playwright. Executar a partir de `astro-consent/`.

```bash
# 1. Verificação de tipos
cd astro-consent
npx tsc --noEmit

# 2. Build (valida compilação completa — inclui tsc + rename dist/cli)
npm run build

# 3. Testes E2E com Playwright
npx playwright test
```

---

## FASE 3 — INTERPRETAÇÃO DE RESULTADOS

Após rodar os comandos, reportar sempre neste formato:

```
## Resultado dos Testes — [data e hora]

### ✅ Passou
- [lista do que passou]

### ❌ Falhou
- [erro exacto, ficheiro e linha]
- [causa provável]
- [acção tomada ou sugerida]

### ⚠️ Avisos
- [warnings que não bloqueiam mas merecem atenção]

### Cobertura
- Total: X%
- Módulos abaixo de 80%: [lista ou "todos acima do limiar"]

### Veredicto
PODE COMMITAR / NÃO PODE COMMITAR — [razão em uma linha]
```

---

## FASE 4 — REGRESSÃO (executar sempre em bug fixes)

Sempre que a sessão incluir correcção de um bug:

1. Verificar: "Este bug tinha teste que o capturava?"
2. Se não tinha: escrever um teste que reproduz o comportamento errado **antes** da correcção.
3. Confirmar que o teste falha sem a correcção e passa com ela.
4. Adicionar ao suite existente.
5. Registar no relatório: "Regressão adicionada para: [descrição do bug]"

---

## FASE 5 — MANUTENÇÃO DA SKILL

- **Stack mudou** (ex.: Jest → Vitest): diga `"re-detecta a stack"` → FASE 1 é reexecutada e FASE 2 reescrita.
- **Comando parou de funcionar**: diga `"actualiza os comandos de teste"` → agente inspecciona e corrige apenas o que quebrou.
- **Adicionar ferramenta nova** (ex.: adicionaste Playwright): diga `"adiciona testes e2e ao fluxo"` → agente detecta e incorpora na FASE 2.
- **Ver estado actual da skill**: diga `"mostra o estado da skill de testes"` → agente lê o cabeçalho e reporta stack, versão e data.

---

## NOTAS FINAIS

- Esta skill não faz commits automáticos. "PODE COMMITAR" é sempre uma recomendação — a acção é sempre do utilizador.
- A FASE 0 só escreve no CLAUDE.md. Nunca apaga conteúdo existente, apenas adiciona ao final.
- Se o projecto não tiver CLAUDE.md, cria um mínimo. Se tiver, preserva tudo e só acrescenta.
