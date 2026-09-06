import { describe, it, expect, beforeEach } from 'vitest';
import { VirtualFileSystem } from '../src/core/vfs';

describe('VirtualFileSystem (VFS)', () => {
  let fs: VirtualFileSystem;

  beforeEach(() => {
    fs = new VirtualFileSystem();
  });

  it('normalizes paths correctly with leading slash', () => {
    expect(fs.normalizePath('src/main.js')).toBe('/src/main.js');
    expect(fs.normalizePath('/src//utils///math.js')).toBe('/src/utils/math.js');
    expect(fs.normalizePath('/docs/')).toBe('/docs');
    expect(fs.normalizePath('/')).toBe('/');
  });

  it('calculates parent path and node name', () => {
    expect(fs.getParentPath('/src/core/vfs.ts')).toBe('/src/core');
    expect(fs.getParentPath('/index.html')).toBe('/');
    expect(fs.getNodeName('/src/core/vfs.ts')).toBe('vfs.ts');
    expect(fs.getNodeName('/index.html')).toBe('index.html');
  });

  it('creates and reads files in directories', () => {
    const file = fs.createFile('/src/test.js', 'console.log("hello");');
    expect(file.name).toBe('test.js');
    expect(file.content).toBe('console.log("hello");');
    expect(fs.exists('/src/test.js')).toBe(true);
    expect(fs.exists('/src')).toBe(true);

    const content = fs.readFile('/src/test.js');
    expect(content).toBe('console.log("hello");');
  });

  it('rejects empty, whitespace-only or forbidden path names (TC-VFS-02 & TC-VFS-04)', () => {
    expect(() => fs.createFile('', 'content')).toThrow();
    expect(() => fs.createFile('   ', 'content')).toThrow();
    expect(() => fs.createFile('/test<script>.js', 'content')).toThrow();
    expect(() => fs.createFile('/bad:name.js', 'content')).toThrow();
    expect(() => fs.createFile('/../../outside.js', 'content')).toThrow();
  });

  it('rejects duplicate file collisions unless overwrite is explicit (TC-VFS-03)', () => {
    fs.createFile('/app.js', 'Original');
    expect(() => fs.createFile('/app.js', 'Duplicate')).toThrow();
    expect(fs.readFile('/app.js')).toBe('Original');

    // Overwrite works when explicitly enabled
    const overwritten = fs.createFile('/app.js', 'Overwritten', true);
    expect(overwritten.content).toBe('Overwritten');
    expect(fs.readFile('/app.js')).toBe('Overwritten');
  });

  it('updates existing file content with writeFile', () => {
    fs.createFile('/notes.txt', 'Version 1');
    const updated = fs.writeFile('/notes.txt', 'Version 2');
    expect(updated).toBe(true);
    expect(fs.readFile('/notes.txt')).toBe('Version 2');
  });

  it('lists directory contents sorted with folders first', () => {
    fs.createFile('/fileB.txt', 'B');
    fs.createFile('/fileA.txt', 'A');
    fs.createDirectory('/assets');

    const rootNodes = fs.listDirectory('/');
    expect(rootNodes.length).toBe(3);
    expect(rootNodes[0].name).toBe('assets');
    expect(rootNodes[0].type).toBe('directory');
    expect(rootNodes[1].name).toBe('fileA.txt');
    expect(rootNodes[2].name).toBe('fileB.txt');
  });

  it('deletes files and recursively deletes directories (TC-VFS-05)', () => {
    fs.createFile('/src/a.js', 'a');
    fs.createFile('/src/sub/b.js', 'b');

    expect(fs.exists('/src/sub/b.js')).toBe(true);

    const deleted = fs.deleteNode('/src/sub');
    expect(deleted).toBe(true);
    expect(fs.exists('/src/sub')).toBe(false);
    expect(fs.exists('/src/sub/b.js')).toBe(false);
    expect(fs.exists('/src/a.js')).toBe(true);

    // Root directory cannot be deleted
    expect(() => fs.deleteNode('/')).toThrow();
  });

  it('renames a file and moves it in VFS', () => {
    fs.createFile('/old.txt', 'Content');
    const renamed = fs.renameNode('/old.txt', '/new.txt');
    expect(renamed).toBe(true);
    expect(fs.exists('/old.txt')).toBe(false);
    expect(fs.readFile('/new.txt')).toBe('Content');
  });

  it('searches files by query and regex', () => {
    fs.createFile('/file1.js', 'function calculateTotal() { return 100; }');
    fs.createFile('/file2.js', 'const total = 50;');

    const textMatches = fs.searchFiles('total');
    expect(textMatches.length).toBe(2);

    const regexMatches = fs.searchFiles('calculate[A-Z]\\w+', true);
    expect(regexMatches.length).toBe(1);
    expect(regexMatches[0].file).toBe('/file1.js');
  });
});
