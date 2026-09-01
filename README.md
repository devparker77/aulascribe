# 🎓 AulaScribe

> **Assistente de Estudos & Transcrição de Aulas Universitárias com IA (Gemini 3.7 Flash)**

Uma aplicação Web & PWA desenvolvida especialmente para estudantes gravarem suas aulas da faculdade e obterem automaticamente transcrições com timestamps, resumos estruturados, tópicos de prova, flashcards interativos, simulados de múltipla escolha e um tutor interativo com IA.

---

## ✨ Principais Funcionalidades

- **Transcrição de Longa Duração**: Capacidade de processar gravações de até 3 a 5 horas contínuas de aula graças à janela de 1 milhão de tokens do **Gemini 3.7 Flash**.
- **Resumos Executivos & Destaques de Prova**: Identifica o que o professor enfatizou como fundamental para os exames.
- **Flashcards 3D Interativos**: Memorização com cards viráveis, acompanhamento de progresso e comemoração.
- **Simulado de Questões**: Questões de múltipla escolha com gabarito imediato e justificativa.
- **Monitor IA da Aula**: Chat contextualizado para tirar qualquer dúvida sobre a gravação.
- **Player de Áudio Sincronizado**: Ouça a aula saltando instantaneamente para os trechos transcritos com velocidade ajustável (até 2x).
- **Compatível com iPhone & PWA**: Adicione à tela de início no iOS como aplicativo nativo.
- **Histórico Offline**: Armazenamento local (IndexedDB) para consultar todas as aulas salvas a qualquer momento.
- **Exportação em 1 Clique**: Baixe em PDF diagramado, Markdown ou copie diretamente para WhatsApp e Notion.

---

## 🛠️ Tecnologias Utilizadas

- **Frontend**: Next.js 16 (App Router), TypeScript, Tailwind CSS, Lucide Icons.
- **Inteligência Artificial**: Google Gen AI SDK (`@google/genai`) com modelo `gemini-3.7-flash`.
- **Armazenamento no Cliente**: Dexie.js (IndexedDB).
- **Exportação**: jsPDF, Canvas Confetti.

---

## 🚀 Como Executar Localmente

1. Clone o repositório:
   ```bash
   git clone https://github.com/devparker77/aulascribe.git
   cd aulascribe
   ```

2. Instale as dependências:
   ```bash
   npm install
   ```

3. Crie um arquivo `.env.local` na raiz com sua chave gratuita do Google AI Studio:
   ```env
   GEMINI_API_KEY=sua_chave_aqui
   GEMINI_MODEL=gemini-3.7-flash
   ```

4. Inicie o servidor de desenvolvimento:
   ```bash
   npm run dev
   ```

5. Abra no navegador: `http://localhost:3000` (ou porta configurada).

---

## 🌐 Deploy Gratuito na Vercel

1. Crie uma conta na [Vercel](https://vercel.com).
2. Importe o repositório `aulascribe`.
3. Adicione a variável de ambiente `GEMINI_API_KEY`.
4. Clique em **Deploy**.
