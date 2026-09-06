import { vfs } from './vfs';
import { gitVcs } from './git-vcs';
import { remoteSync } from './remote-sync';
import { sandboxManager } from './sandbox';
import { eventBus } from './event-bus';

export interface TerminalExecutionResult {
  stdout: string;
  stderr: string;
  exitCode: number;
  cwd: string;
}

export interface ParsedCommand {
  command: string;
  args: string[];
  raw: string;
}

export interface ParsedPipeline {
  commands: ParsedCommand[];
  redirection?: {
    type: 'overwrite' | 'append';
    targetPath: string;
  };
}

export class TerminalShell {
  private cwd: string = '/';
  private env: Record<string, string> = {
    USER: 'dev',
    HOME: '/',
    SHELL: '/bin/webmcp-sh',
  };
  private lastExitCode: number = 0;

  constructor() {
    this.env.PWD = this.cwd;
  }

  public getCwd(): string {
    return this.cwd;
  }

  public setCwd(newCwd: string): void {
    const resolved = this.resolvePath(newCwd);
    const node = vfs.getNode(resolved);
    if (!node || node.type !== 'directory') {
      throw new Error(`cd: no such directory: ${newCwd}`);
    }
    this.cwd = resolved;
    this.env.PWD = this.cwd;
  }

  public resolvePath(rawPath: string): string {
    if (!rawPath || rawPath === '~') return '/';
    let p = rawPath.trim();
    if (p.startsWith('~/')) p = '/' + p.slice(2);
    if (!p.startsWith('/')) {
      p = this.cwd === '/' ? `/${p}` : `${this.cwd}/${p}`;
    }
    return vfs.normalizePath(p);
  }

  public tokenizeLine(line: string): string[] {
    const tokens: string[] = [];
    let current = '';
    let inSingleQuote = false;
    let inDoubleQuote = false;

    for (let i = 0; i < line.length; i++) {
      const char = line[i];

      if (char === "'" && !inDoubleQuote) {
        inSingleQuote = !inSingleQuote;
        continue;
      }

      if (char === '"' && !inSingleQuote) {
        inDoubleQuote = !inDoubleQuote;
        continue;
      }

      if (char === ' ' && !inSingleQuote && !inDoubleQuote) {
        if (current.length > 0) {
          tokens.push(current);
          current = '';
        }
        continue;
      }

      current += char;
    }

    if (current.length > 0) {
      tokens.push(current);
    }

    return tokens;
  }

  public parseCommandLine(line: string): ParsedPipeline {
    const rawTokens = this.tokenizeLine(line.trim());
    if (rawTokens.length === 0) {
      return { commands: [] };
    }

    let redirection: { type: 'overwrite' | 'append'; targetPath: string } | undefined;
    const filteredTokens: string[] = [];

    for (let i = 0; i < rawTokens.length; i++) {
      const t = rawTokens[i];
      if (t === '>' || t === '>>') {
        const next = rawTokens[i + 1];
        if (!next) {
          throw new Error(`Syntax error: target file missing for redirection '${t}'`);
        }
        redirection = {
          type: t === '>>' ? 'append' : 'overwrite',
          targetPath: next,
        };
        i++; // skip next
      } else {
        filteredTokens.push(t);
      }
    }

    const commandSegments: string[][] = [[]];
    for (const token of filteredTokens) {
      if (token === '|') {
        commandSegments.push([]);
      } else {
        commandSegments[commandSegments.length - 1].push(token);
      }
    }

    const commands: ParsedCommand[] = commandSegments
      .filter((seg) => seg.length > 0)
      .map((seg) => ({
        command: seg[0],
        args: seg.slice(1).map((arg) => this.expandVariables(arg)),
        raw: seg.join(' '),
      }));

    return { commands, redirection };
  }

  private expandVariables(token: string): string {
    return token
      .replace(/\$PWD/g, this.cwd)
      .replace(/\$USER/g, this.env.USER || 'dev')
      .replace(/\$\?/g, String(this.lastExitCode));
  }

  public async execute(commandLine: string, customCwd?: string): Promise<TerminalExecutionResult> {
    if (customCwd) {
      this.setCwd(customCwd);
    }

    const trimmed = commandLine.trim();
    if (!trimmed) {
      return { stdout: '', stderr: '', exitCode: 0, cwd: this.cwd };
    }

    try {
      const parsed = this.parseCommandLine(trimmed);
      if (parsed.commands.length === 0) {
        return { stdout: '', stderr: '', exitCode: 0, cwd: this.cwd };
      }

      let currentStdin = '';
      let lastStdout = '';
      let lastStderr = '';
      let lastCode = 0;

      for (let i = 0; i < parsed.commands.length; i++) {
        const cmd = parsed.commands[i];
        const res = await this.dispatchCommand(cmd.command, cmd.args, currentStdin);
        lastStdout = res.stdout;
        lastStderr = res.stderr;
        lastCode = res.exitCode;
        this.lastExitCode = lastCode;

        if (lastCode !== 0 && i < parsed.commands.length - 1) {
          break;
        }

        currentStdin = lastStdout;
      }

      // Handle file redirection
      if (parsed.redirection && lastCode === 0) {
        const targetPath = this.resolvePath(parsed.redirection.targetPath);
        if (parsed.redirection.type === 'append') {
          let existing = vfs.readFile(targetPath) || '';
          if (existing.length > 0 && !existing.endsWith('\n')) {
            existing += '\n';
          }
          vfs.writeFile(targetPath, existing + lastStdout);
        } else {
          vfs.writeFile(targetPath, lastStdout);
        }
        lastStdout = '';
      }

      return {
        stdout: lastStdout,
        stderr: lastStderr,
        exitCode: lastCode,
        cwd: this.cwd,
      };
    } catch (err: any) {
      const errorMsg = err.message || String(err);
      this.lastExitCode = 1;
      return {
        stdout: '',
        stderr: errorMsg + '\n',
        exitCode: 1,
        cwd: this.cwd,
      };
    }
  }

  private async dispatchCommand(
    command: string,
    args: string[],
    stdin: string
  ): Promise<{ stdout: string; stderr: string; exitCode: number }> {
    switch (command) {
      case 'pwd':
        return { stdout: this.cwd + '\n', stderr: '', exitCode: 0 };

      case 'cd':
        return this.builtinCd(args);

      case 'ls':
        return this.builtinLs(args);

      case 'cat':
        return this.builtinCat(args, stdin);

      case 'echo':
        return { stdout: args.join(' ') + '\n', stderr: '', exitCode: 0 };

      case 'touch':
        return this.builtinTouch(args);

      case 'mkdir':
        return this.builtinMkdir(args);

      case 'rm':
        return this.builtinRm(args);

      case 'cp':
        return this.builtinCp(args);

      case 'mv':
        return this.builtinMv(args);

      case 'grep':
        return this.builtinGrep(args, stdin);

      case 'head':
        return this.builtinHead(args, stdin);

      case 'tail':
        return this.builtinTail(args, stdin);

      case 'wc':
        return this.builtinWc(args, stdin);

      case 'clear':
        return { stdout: '\x1b[2J\x1b[H', stderr: '', exitCode: 0 };

      case 'help':
        return this.builtinHelp();

      case 'git':
        return await this.builtinGit(args);

      case 'node':
      case 'js':
        return await this.builtinJs(args);

      default:
        return {
          stdout: '',
          stderr: `webmcp-sh: ${command}: command not found\n`,
          exitCode: 127,
        };
    }
  }

  // --- POSIX Builtins ---

  private builtinCd(args: string[]): { stdout: string; stderr: string; exitCode: number } {
    const target = args[0] || '/';
    const resolved = this.resolvePath(target);
    const node = vfs.getNode(resolved);
    if (!node) {
      return { stdout: '', stderr: `cd: ${target}: No such file or directory\n`, exitCode: 1 };
    }
    if (node.type !== 'directory') {
      return { stdout: '', stderr: `cd: ${target}: Not a directory\n`, exitCode: 1 };
    }
    this.cwd = resolved;
    this.env.PWD = this.cwd;
    return { stdout: '', stderr: '', exitCode: 0 };
  }

  private builtinLs(args: string[]): { stdout: string; stderr: string; exitCode: number } {
    const showAll = args.includes('-a') || args.includes('-la') || args.includes('-al');
    const longFormat = args.includes('-l') || args.includes('-la') || args.includes('-al');
    const pathArg = args.find((a) => !a.startsWith('-')) || this.cwd;
    const resolved = this.resolvePath(pathArg);

    const node = vfs.getNode(resolved);
    if (!node) {
      return { stdout: '', stderr: `ls: cannot access '${pathArg}': No such file or directory\n`, exitCode: 1 };
    }

    if (node.type === 'file') {
      if (longFormat) {
        const d = new Date(node.updatedAt).toLocaleDateString();
        const size = node.content.length;
        return { stdout: `-rw-r--r-- 1 dev dev ${size} ${d} ${node.name}\n`, stderr: '', exitCode: 0 };
      }
      return { stdout: node.name + '\n', stderr: '', exitCode: 0 };
    }

    const children = vfs.listDirectory(resolved);
    const visible = showAll ? children : children.filter((c) => !c.name.startsWith('.'));

    if (visible.length === 0) {
      return { stdout: '', stderr: '', exitCode: 0 };
    }

    if (longFormat) {
      const lines = visible.map((c) => {
        const prefix = c.type === 'directory' ? 'd' : '-';
        const perms = prefix === 'd' ? 'rwxr-xr-x' : 'rw-r--r--';
        const size = c.type === 'file' ? c.content.length : 4096;
        const d = new Date(c.updatedAt).toLocaleDateString();
        return `${prefix}${perms} 1 dev dev ${String(size).padStart(6, ' ')} ${d} ${c.name}`;
      });
      return { stdout: lines.join('\n') + '\n', stderr: '', exitCode: 0 };
    }

    const names = visible.map((c) => (c.type === 'directory' ? c.name + '/' : c.name));
    return { stdout: names.join('  ') + '\n', stderr: '', exitCode: 0 };
  }

  private builtinCat(args: string[], stdin: string): { stdout: string; stderr: string; exitCode: number } {
    if (args.length === 0) {
      return { stdout: stdin, stderr: '', exitCode: 0 };
    }

    let out = '';
    let err = '';
    let exitCode = 0;

    for (const f of args) {
      const resolved = this.resolvePath(f);
      const node = vfs.getNode(resolved);
      if (!node) {
        err += `cat: ${f}: No such file or directory\n`;
        exitCode = 1;
        continue;
      }
      if (node.type === 'directory') {
        err += `cat: ${f}: Is a directory\n`;
        exitCode = 1;
        continue;
      }
      const content = vfs.readFile(resolved) || '';
      out += content;
      if (!out.endsWith('\n')) out += '\n';
    }

    return { stdout: out, stderr: err, exitCode };
  }

  private builtinTouch(args: string[]): { stdout: string; stderr: string; exitCode: number } {
    if (args.length === 0) {
      return { stdout: '', stderr: 'touch: missing file operand\n', exitCode: 1 };
    }
    for (const f of args) {
      const resolved = this.resolvePath(f);
      if (!vfs.exists(resolved)) {
        vfs.writeFile(resolved, '');
      }
    }
    return { stdout: '', stderr: '', exitCode: 0 };
  }

  private builtinMkdir(args: string[]): { stdout: string; stderr: string; exitCode: number } {
    const isRecursive = args.includes('-p');
    const paths = args.filter((a) => !a.startsWith('-'));
    if (paths.length === 0) {
      return { stdout: '', stderr: 'mkdir: missing operand\n', exitCode: 1 };
    }

    for (const p of paths) {
      const resolved = this.resolvePath(p);
      if (vfs.exists(resolved)) {
        if (!isRecursive) {
          return { stdout: '', stderr: `mkdir: cannot create directory '${p}': File exists\n`, exitCode: 1 };
        }
        continue;
      }
      vfs.createDirectory(resolved);
    }
    return { stdout: '', stderr: '', exitCode: 0 };
  }

  private builtinRm(args: string[]): { stdout: string; stderr: string; exitCode: number } {
    const isRecursive = args.includes('-r') || args.includes('-R') || args.includes('-rf');
    const isForced = args.includes('-f') || args.includes('-rf');
    const paths = args.filter((a) => !a.startsWith('-'));

    if (paths.length === 0) {
      return { stdout: '', stderr: 'rm: missing operand\n', exitCode: 1 };
    }

    for (const p of paths) {
      const resolved = this.resolvePath(p);
      const node = vfs.getNode(resolved);
      if (!node) {
        if (!isForced) {
          return { stdout: '', stderr: `rm: cannot remove '${p}': No such file or directory\n`, exitCode: 1 };
        }
        continue;
      }
      if (node.type === 'directory' && !isRecursive) {
        return { stdout: '', stderr: `rm: cannot remove '${p}': Is a directory\n`, exitCode: 1 };
      }
      vfs.deleteNode(resolved);
    }
    return { stdout: '', stderr: '', exitCode: 0 };
  }

  private builtinCp(args: string[]): { stdout: string; stderr: string; exitCode: number } {
    if (args.length < 2) {
      return { stdout: '', stderr: 'cp: missing destination file operand\n', exitCode: 1 };
    }
    const src = this.resolvePath(args[0]);
    const dst = this.resolvePath(args[1]);

    const node = vfs.getNode(src);
    if (!node || node.type !== 'file') {
      return { stdout: '', stderr: `cp: cannot stat '${args[0]}': No such file\n`, exitCode: 1 };
    }

    const content = vfs.readFile(src) || '';
    vfs.writeFile(dst, content);
    return { stdout: '', stderr: '', exitCode: 0 };
  }

  private builtinMv(args: string[]): { stdout: string; stderr: string; exitCode: number } {
    if (args.length < 2) {
      return { stdout: '', stderr: 'mv: missing destination file operand\n', exitCode: 1 };
    }
    const src = this.resolvePath(args[0]);
    const dst = this.resolvePath(args[1]);

    const success = vfs.renameNode(src, dst);
    if (!success) {
      return { stdout: '', stderr: `mv: cannot move '${args[0]}' to '${args[1]}'\n`, exitCode: 1 };
    }

    return { stdout: '', stderr: '', exitCode: 0 };
  }

  private builtinGrep(args: string[], stdin: string): { stdout: string; stderr: string; exitCode: number } {
    const caseInsensitive = args.includes('-i');
    const showLineNumber = args.includes('-n');
    const invertMatch = args.includes('-v');
    const nonFlagArgs = args.filter((a) => !a.startsWith('-'));

    if (nonFlagArgs.length === 0) {
      return { stdout: '', stderr: 'grep: missing pattern operand\n', exitCode: 2 };
    }

    const patternStr = nonFlagArgs[0];
    const fileArgs = nonFlagArgs.slice(1);

    let contentToSearch: { source: string; text: string }[] = [];

    if (fileArgs.length === 0) {
      contentToSearch = [{ source: '(standard input)', text: stdin }];
    } else {
      for (const f of fileArgs) {
        const resolved = this.resolvePath(f);
        if (!vfs.exists(resolved)) {
          return { stdout: '', stderr: `grep: ${f}: No such file or directory\n`, exitCode: 2 };
        }
        contentToSearch.push({ source: f, text: vfs.readFile(resolved) || '' });
      }
    }

    let regex: RegExp;
    try {
      regex = new RegExp(patternStr, caseInsensitive ? 'i' : '');
    } catch {
      regex = new RegExp(patternStr.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), caseInsensitive ? 'i' : '');
    }

    const matchedLines: string[] = [];

    for (const item of contentToSearch) {
      const lines = item.text.split('\n');
      for (let i = 0; i < lines.length; i++) {
        const line = lines[i];
        if (!line && i === lines.length - 1) continue;
        const matches = regex.test(line);
        if ((matches && !invertMatch) || (!matches && invertMatch)) {
          const prefix = showLineNumber ? `${i + 1}:` : '';
          const filePrefix = fileArgs.length > 1 ? `${item.source}:` : '';
          matchedLines.push(`${filePrefix}${prefix}${line}`);
        }
      }
    }

    if (matchedLines.length === 0) {
      return { stdout: '', stderr: '', exitCode: 1 };
    }

    return { stdout: matchedLines.join('\n') + '\n', stderr: '', exitCode: 0 };
  }

  private builtinHead(args: string[], stdin: string): { stdout: string; stderr: string; exitCode: number } {
    let count = 10;
    const nIndex = args.indexOf('-n');
    if (nIndex !== -1 && args[nIndex + 1]) {
      count = parseInt(args[nIndex + 1], 10) || 10;
    }

    const fileArg = args.filter((a, i) => !a.startsWith('-') && args[i - 1] !== '-n')[0];
    let content = stdin;
    if (fileArg) {
      const resolved = this.resolvePath(fileArg);
      if (!vfs.exists(resolved)) {
        return { stdout: '', stderr: `head: cannot open '${fileArg}': No such file\n`, exitCode: 1 };
      }
      content = vfs.readFile(resolved) || '';
    }

    const rawLines = content.split('\n');
    const lines = rawLines.length > 0 && rawLines[rawLines.length - 1] === '' ? rawLines.slice(0, -1) : rawLines;
    return { stdout: lines.slice(0, count).join('\n') + '\n', stderr: '', exitCode: 0 };
  }

  private builtinTail(args: string[], stdin: string): { stdout: string; stderr: string; exitCode: number } {
    let count = 10;
    const nIndex = args.indexOf('-n');
    if (nIndex !== -1 && args[nIndex + 1]) {
      count = parseInt(args[nIndex + 1], 10) || 10;
    }

    const fileArg = args.filter((a, i) => !a.startsWith('-') && args[i - 1] !== '-n')[0];
    let content = stdin;
    if (fileArg) {
      const resolved = this.resolvePath(fileArg);
      if (!vfs.exists(resolved)) {
        return { stdout: '', stderr: `tail: cannot open '${fileArg}': No such file\n`, exitCode: 1 };
      }
      content = vfs.readFile(resolved) || '';
    }

    const rawLines = content.split('\n');
    const lines = rawLines.length > 0 && rawLines[rawLines.length - 1] === '' ? rawLines.slice(0, -1) : rawLines;
    const start = Math.max(0, lines.length - count);
    return { stdout: lines.slice(start).join('\n') + '\n', stderr: '', exitCode: 0 };
  }

  private builtinWc(args: string[], stdin: string): { stdout: string; stderr: string; exitCode: number } {
    const fileArg = args.find((a) => !a.startsWith('-'));
    let content = stdin;
    let label = '';
    if (fileArg) {
      const resolved = this.resolvePath(fileArg);
      if (!vfs.exists(resolved)) {
        return { stdout: '', stderr: `wc: ${fileArg}: No such file\n`, exitCode: 1 };
      }
      content = vfs.readFile(resolved) || '';
      label = ` ${fileArg}`;
    }

    const lines = content.length > 0 ? content.split('\n').length - 1 : 0;
    const words = content.trim().length > 0 ? content.trim().split(/\s+/).length : 0;
    const bytes = content.length;

    return {
      stdout: `  ${lines}  ${words}  ${bytes}${label}\n`,
      stderr: '',
      exitCode: 0,
    };
  }

  private builtinHelp(): { stdout: string; stderr: string; exitCode: number } {
    const helpText = [
      'WebMCP Shell (POSIX VFS & Git CLI)',
      '------------------------------------',
      'Comandos POSIX soportados:',
      '  pwd                  Muestra el directorio de trabajo actual',
      '  cd <dir>             Cambia de directorio (., .., ~, ruta)',
      '  ls [-l] [-a] [path]  Lista contenidos de directorio',
      '  cat <file...>        Muestra el contenido de archivos',
      '  echo [texto]         Imprime texto en stdout',
      '  touch <file...>      Crea archivos vacios o actualiza timestamps',
      '  mkdir [-p] <dir...>  Crea directorios',
      '  rm [-r] [-f] <path>  Elimina archivos o carpetas',
      '  cp <src> <dst>       Copia un archivo',
      '  mv <src> <dst>       Mueve o renombra un archivo',
      '  grep [-i] [-n] <pat> Busca patrones en archivos o stdin',
      '  head [-n N] [file]   Muestra las primeras N lineas',
      '  tail [-n N] [file]   Muestra las ultimas N lineas',
      '  wc [file]            Cuenta lineas, palabras y bytes',
      '  clear                Limpia la pantalla de la terminal',
      '  help                 Muestra esta ayuda',
      '',
      'Comandos Git soportados:',
      '  git status           Estado del repositorio',
      '  git add <file|.>     Prepara archivos para commit',
      '  git commit -m "msg"  Crea commit atomico en rama actual',
      '  git branch [name]    Lista o crea ramas',
      '  git checkout <name>  Cambia de rama',
      '  git log [-n N]       Historial de commits',
      '  git diff [path]      Diff unificado frente a HEAD',
      '  git push / git pull  Sincronizacion remota GitHub/Codeberg',
      '',
      'Operadores soportados:',
      '  |                    Tuberia entre comandos (pipeline)',
      '  > <file>             Redireccion de salida (sobrescribe)',
      '  >> <file>            Redireccion de salida (agrega al final)',
      '  node -e "code"       Evalua JavaScript en sandbox Web Worker',
    ];
    return { stdout: helpText.join('\n') + '\n', stderr: '', exitCode: 0 };
  }

  // --- Git Builtin ---

  private async builtinGit(args: string[]): Promise<{ stdout: string; stderr: string; exitCode: number }> {
    if (args.length === 0) {
      return { stdout: 'Uso: git <status|add|commit|branch|checkout|diff|log|push|pull>\n', stderr: '', exitCode: 0 };
    }

    const sub = args[0];
    const subArgs = args.slice(1);

    switch (sub) {
      case 'status': {
        const s = gitVcs.getStatus();
        const lines = [
          `En la rama ${s.branch}`,
          s.totalChanges === 0 ? 'nada para confirmar, el arbol de trabajo esta limpio' : '',
        ];
        if (s.staged.length > 0) {
          lines.push('Cambios para ser confirmados:');
          for (const c of s.staged) {
            lines.push(`\t\x1b[32m${c.status}: ${c.path}\x1b[0m`);
          }
        }
        if (s.unstaged.length > 0) {
          lines.push('Cambios no preparados para la confirmacion:');
          for (const c of s.unstaged) {
            lines.push(`\t\x1b[31m${c.status}: ${c.path}\x1b[0m`);
          }
        }
        return { stdout: lines.filter(Boolean).join('\n') + '\n', stderr: '', exitCode: 0 };
      }

      case 'add': {
        if (subArgs.length === 0) {
          return { stdout: '', stderr: 'Nada especificado, nada anadido.\n', exitCode: 1 };
        }
        if (subArgs[0] === '.' || subArgs[0] === '-A') {
          gitVcs.stageAll();
        } else {
          for (const p of subArgs) {
            gitVcs.stageFile(this.resolvePath(p));
          }
        }
        return { stdout: '', stderr: '', exitCode: 0 };
      }

      case 'commit': {
        const mIndex = subArgs.indexOf('-m');
        if (mIndex === -1 || !subArgs[mIndex + 1]) {
          return { stdout: '', stderr: 'error: mensaje de commit requerido (-m "mensaje")\n', exitCode: 1 };
        }
        const msg = subArgs[mIndex + 1];
        try {
          const c = gitVcs.commit(msg, 'Terminal User <dev@webmcp.ai>');
          return {
            stdout: `[${c.branch} ${c.hash.slice(0, 7)}] ${c.message}\n`,
            stderr: '',
            exitCode: 0,
          };
        } catch (err: any) {
          return { stdout: '', stderr: `error: ${err.message}\n`, exitCode: 1 };
        }
      }

      case 'branch': {
        if (subArgs.length === 0 || subArgs[0] === '-a') {
          const curr = gitVcs.getCurrentBranch();
          const branches = gitVcs.getBranches();
          const lines = branches.map((b) => (b === curr ? `* \x1b[32m${b}\x1b[0m` : `  ${b}`));
          return { stdout: lines.join('\n') + '\n', stderr: '', exitCode: 0 };
        }
        const newBranch = subArgs[0];
        try {
          gitVcs.createBranch(newBranch);
          return { stdout: `Rama '${newBranch}' creada.\n`, stderr: '', exitCode: 0 };
        } catch (err: any) {
          return { stdout: '', stderr: `error: ${err.message}\n`, exitCode: 1 };
        }
      }

      case 'checkout':
      case 'switch': {
        if (subArgs.length === 0) {
          return { stdout: '', stderr: 'error: nombre de rama requerido\n', exitCode: 1 };
        }
        const isNew = subArgs[0] === '-b';
        const branchName = isNew ? subArgs[1] : subArgs[0];
        if (!branchName) {
          return { stdout: '', stderr: 'error: nombre de rama requerido\n', exitCode: 1 };
        }
        try {
          if (isNew) {
            gitVcs.createBranch(branchName);
          }
          gitVcs.checkoutBranch(branchName);
          return { stdout: `Cambiado a rama '${branchName}'\n`, stderr: '', exitCode: 0 };
        } catch (err: any) {
          return { stdout: '', stderr: `error: ${err.message}\n`, exitCode: 1 };
        }
      }

      case 'log': {
        let limit = 10;
        const nIndex = subArgs.indexOf('-n');
        if (nIndex !== -1 && subArgs[nIndex + 1]) {
          limit = parseInt(subArgs[nIndex + 1], 10) || 10;
        }
        const commits = gitVcs.getLog(limit);
        if (commits.length === 0) {
          return { stdout: 'No hay commits registrados aun.\n', stderr: '', exitCode: 0 };
        }
        const lines = commits.map((c) => {
          const date = new Date(c.timestamp).toLocaleString();
          return `commit ${c.hash}\nAutor: ${c.author}\nFecha: ${date}\n\n    ${c.message}\n`;
        });
        return { stdout: lines.join('\n'), stderr: '', exitCode: 0 };
      }

      case 'diff': {
        const pathArg = subArgs[0] ? this.resolvePath(subArgs[0]) : undefined;
        const diffText = gitVcs.getUnifiedDiff(pathArg);
        return { stdout: diffText ? diffText + '\n' : '', stderr: '', exitCode: 0 };
      }

      case 'push': {
        const res = await remoteSync.push();
        return {
          stdout: `✓ Push remoto exitoso: ${res.repo}@${res.branch} (${res.filesCount} archivos)\n`,
          stderr: '',
          exitCode: 0,
        };
      }

      case 'pull': {
        const res = await remoteSync.pull();
        return {
          stdout: `✓ Pull remoto exitoso: ${res.filesUpdated} archivos actualizados\n`,
          stderr: '',
          exitCode: 0,
        };
      }

      default:
        return { stdout: '', stderr: `git: '${sub}' no es un comando de git.\n`, exitCode: 1 };
    }
  }

  // --- JavaScript Sandbox Builtin ---

  private async builtinJs(args: string[]): Promise<{ stdout: string; stderr: string; exitCode: number }> {
    let code = '';
    const eIndex = args.indexOf('-e');
    if (eIndex !== -1 && args[eIndex + 1]) {
      code = args.slice(eIndex + 1).join(' ');
    } else {
      code = args.join(' ');
    }

    if (!code) {
      return { stdout: '', stderr: 'js: missing code to evaluate\n', exitCode: 1 };
    }

    const res = await sandboxManager.executeJs(code);
    let out = '';
    if (res.logs.length > 0) {
      out += res.logs.join('\n') + '\n';
    }
    if (res.result !== undefined) {
      out += (typeof res.result === 'object' ? JSON.stringify(res.result, null, 2) : String(res.result)) + '\n';
    }

    return {
      stdout: out,
      stderr: res.error ? res.error + '\n' : '',
      exitCode: res.success ? 0 : 1,
    };
  }
}

export const terminalShell = new TerminalShell();
