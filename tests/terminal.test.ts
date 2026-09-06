import { describe, it, expect, beforeEach } from 'vitest';
import { terminalShell } from '../src/core/terminal-shell';
import { vfs } from '../src/core/vfs';
import { gitVcs } from '../src/core/git-vcs';

describe('TerminalShell (POSIX VFS & Git CLI)', () => {
  beforeEach(() => {
    if (typeof localStorage !== 'undefined') {
      localStorage.clear();
    }
    vfs.writeFile('/index.html', '<h1>Test</h1>');
    gitVcs.init();
    terminalShell.setCwd('/');
  });

  describe('Lexer and Tokenizer', () => {
    it('debe tokenizar cadenas simples respetando espacios', () => {
      const tokens = terminalShell.tokenizeLine('ls -la /src');
      expect(tokens).toEqual(['ls', '-la', '/src']);
    });

    it('debe preservar comillas simples y dobles con espacios interiores', () => {
      const tokens = terminalShell.tokenizeLine('echo "hola mundo desde terminal" \'segundo arg\'');
      expect(tokens).toEqual(['echo', 'hola mundo desde terminal', 'segundo arg']);
    });

    it('debe parsear tuberias y redirecciones correctamente', () => {
      const parsed = terminalShell.parseCommandLine('cat /data.txt | grep "activo" > /result.txt');
      expect(parsed.commands.length).toBe(2);
      expect(parsed.commands[0].command).toBe('cat');
      expect(parsed.commands[0].args).toEqual(['/data.txt']);
      expect(parsed.commands[1].command).toBe('grep');
      expect(parsed.commands[1].args).toEqual(['activo']);
      expect(parsed.redirection).toEqual({
        type: 'overwrite',
        targetPath: '/result.txt',
      });
    });
  });

  describe('Comandos POSIX de Navegacion y VFS', () => {
    it('pwd debe retornar el directorio actual', async () => {
      const res = await terminalShell.execute('pwd');
      expect(res.exitCode).toBe(0);
      expect(res.stdout.trim()).toBe('/');
    });

    it('cd y navegacion relativa y absoluta', async () => {
      vfs.createDirectory('/workspace');
      vfs.createDirectory('/workspace/docs');

      const cdRes = await terminalShell.execute('cd /workspace');
      expect(cdRes.exitCode).toBe(0);
      expect(terminalShell.getCwd()).toBe('/workspace');

      await terminalShell.execute('cd docs');
      expect(terminalShell.getCwd()).toBe('/workspace/docs');

      await terminalShell.execute('cd ..');
      expect(terminalShell.getCwd()).toBe('/workspace');

      const failRes = await terminalShell.execute('cd no_existe');
      expect(failRes.exitCode).toBe(1);
      expect(failRes.stderr).toContain('No such file or directory');
    });

    it('mkdir, touch, cat y rm', async () => {
      await terminalShell.execute('mkdir -p /app/src');
      expect(vfs.exists('/app/src')).toBe(true);

      await terminalShell.execute('touch /app/src/main.js');
      expect(vfs.exists('/app/src/main.js')).toBe(true);

      vfs.writeFile('/app/src/main.js', 'console.log("hello");');
      const catRes = await terminalShell.execute('cat /app/src/main.js');
      expect(catRes.exitCode).toBe(0);
      expect(catRes.stdout).toContain('console.log("hello");');

      await terminalShell.execute('rm /app/src/main.js');
      expect(vfs.exists('/app/src/main.js')).toBe(false);
    });

    it('cp y mv', async () => {
      vfs.writeFile('/origin.txt', 'contenido original');
      await terminalShell.execute('cp /origin.txt /copy.txt');
      expect(vfs.exists('/copy.txt')).toBe(true);
      expect(vfs.readFile('/copy.txt')).toBe('contenido original');

      await terminalShell.execute('mv /copy.txt /renamed.txt');
      expect(vfs.exists('/copy.txt')).toBe(false);
      expect(vfs.exists('/renamed.txt')).toBe(true);
      expect(vfs.readFile('/renamed.txt')).toBe('contenido original');
    });

    it('ls lista archivos y directorios ordenados', async () => {
      vfs.writeFile('/b.txt', 'b');
      vfs.writeFile('/a.txt', 'a');
      vfs.createDirectory('/folder');

      const res = await terminalShell.execute('ls /');
      expect(res.exitCode).toBe(0);
      expect(res.stdout).toContain('a.txt');
      expect(res.stdout).toContain('b.txt');
      expect(res.stdout).toContain('folder/');
    });
  });

  describe('Redirecciones y Tuberias (Pipes)', () => {
    it('echo con redireccion > y >>', async () => {
      await terminalShell.execute('echo "linea 1" > /salida.txt');
      expect(vfs.exists('/salida.txt')).toBe(true);
      expect(vfs.readFile('/salida.txt')?.trim()).toBe('linea 1');

      await terminalShell.execute('echo "linea 2" >> /salida.txt');
      const content = vfs.readFile('/salida.txt');
      expect(content).toContain('linea 1');
      expect(content).toContain('linea 2');
    });

    it('grep con pipes desde cat', async () => {
      const data = 'manzana\npera\nplatano\nmanzana dorada\n';
      vfs.writeFile('/frutas.txt', data);

      const res = await terminalShell.execute('cat /frutas.txt | grep manzana');
      expect(res.exitCode).toBe(0);
      expect(res.stdout).toContain('manzana');
      expect(res.stdout).toContain('manzana dorada');
      expect(res.stdout).not.toContain('pera');
    });

    it('head y tail con pipes', async () => {
      const lines = Array.from({ length: 20 }, (_, i) => `linea ${i + 1}`).join('\n');
      vfs.writeFile('/numeros.txt', lines);

      const headRes = await terminalShell.execute('cat /numeros.txt | head -n 3');
      expect(headRes.exitCode).toBe(0);
      expect(headRes.stdout.trim()).toBe('linea 1\nlinea 2\nlinea 3');

      const tailRes = await terminalShell.execute('cat /numeros.txt | tail -n 2');
      expect(tailRes.exitCode).toBe(0);
      expect(tailRes.stdout.trim()).toBe('linea 19\nlinea 20');
    });

    it('wc cuenta lineas, palabras y bytes', async () => {
      vfs.writeFile('/words.txt', 'hola mundo webmcp');
      const res = await terminalShell.execute('wc /words.txt');
      expect(res.exitCode).toBe(0);
      expect(res.stdout).toContain('3'); // 3 words
      expect(res.stdout).toContain('/words.txt');
    });
  });

  describe('Integracion Git CLI', () => {
    it('git status reporta el estado del repositorio', async () => {
      vfs.writeFile('/app.js', 'console.log("git cli");');
      const res = await terminalShell.execute('git status');
      expect(res.exitCode).toBe(0);
      expect(res.stdout).toContain('En la rama');
    });

    it('git branch lista y crea ramas', async () => {
      const listRes = await terminalShell.execute('git branch');
      expect(listRes.exitCode).toBe(0);
      expect(listRes.stdout).toContain('main');

      const createRes = await terminalShell.execute('git branch test-cli-branch');
      expect(createRes.exitCode).toBe(0);
      expect(gitVcs.getBranches()).toContain('test-cli-branch');
    });

    it('git add y git commit crean commits atomicos', async () => {
      vfs.writeFile('/archivo_nuevo.txt', 'contenido prueba');
      const addRes = await terminalShell.execute('git add .');
      expect(addRes.exitCode).toBe(0);

      const commitRes = await terminalShell.execute('git commit -m "feat: prueba desde cli"');
      expect(commitRes.exitCode).toBe(0);
      expect(commitRes.stdout).toContain('feat: prueba desde cli');

      const logRes = await terminalShell.execute('git log -n 1');
      expect(logRes.exitCode).toBe(0);
      expect(logRes.stdout).toContain('feat: prueba desde cli');
    });
  });

  describe('Manejo de Errores y Comando Desconocido', () => {
    it('retorna exitCode 127 para comandos inexistentes', async () => {
      const res = await terminalShell.execute('comando_fantasma_123');
      expect(res.exitCode).toBe(127);
      expect(res.stderr).toContain('command not found');
    });

    it('help muestra el manual de comandos soportados', async () => {
      const res = await terminalShell.execute('help');
      expect(res.exitCode).toBe(0);
      expect(res.stdout).toContain('WebMCP Shell');
      expect(res.stdout).toContain('pwd');
      expect(res.stdout).toContain('git');
    });
  });
});
