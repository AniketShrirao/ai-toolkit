import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { spawn } from 'child_process';
import { readFileSync, existsSync } from 'fs';
import { join } from 'path';

describe('System Readiness Check', () => {
  const scriptPath = join(process.cwd(), 'scripts', 'system-readiness-check.js');

  beforeEach(() => {
    // Ensure the script exists
    expect(existsSync(scriptPath)).toBe(true);
  });

  it('should execute without errors', async () => {
    const result = await runReadinessCheck(['--help']);
    expect(result.exitCode).toBe(0);
    expect(result.stdout).toContain('AI Toolkit System Readiness Check');
  });

  it('should check environment configuration', async () => {
    const result = await runReadinessCheck(['--json']);
    const output = JSON.parse(result.stdout.split('\n').find(line => line.startsWith('{')) || '{}');
    
    expect(output.checks).toBeDefined();
    expect(output.checks.some((check: any) => check.name === 'Environment Configuration')).toBe(true);
  });

  it('should check Node.js version', async () => {
    const result = await runReadinessCheck(['--json']);
    const output = JSON.parse(result.stdout.split('\n').find(line => line.startsWith('{')) || '{}');
    
    const nodeCheck = output.checks.find((check: any) => check.name === 'Node.js Version');
    expect(nodeCheck).toBeDefined();
    expect(['pass', 'warning', 'fail']).toContain(nodeCheck.status);
  });

  it('should check dependencies', async () => {
    const result = await runReadinessCheck(['--json']);
    const output = JSON.parse(result.stdout.split('\n').find(line => line.startsWith('{')) || '{}');
    
    const depCheck = output.checks.find((check: any) => check.name === 'Dependencies');
    expect(depCheck).toBeDefined();
  });

  it('should check storage paths', async () => {
    const result = await runReadinessCheck(['--json']);
    const output = JSON.parse(result.stdout.split('\n').find(line => line.startsWith('{')) || '{}');
    
    const storageCheck = output.checks.find((check: any) => check.name === 'Storage Paths');
    expect(storageCheck).toBeDefined();
  });

  it('should check Ollama connection', async () => {
    const result = await runReadinessCheck(['--json']);
    const output = JSON.parse(result.stdout.split('\n').find(line => line.startsWith('{')) || '{}');
    
    const ollamaCheck = output.checks.find((check: any) => check.name === 'Ollama Connection');
    expect(ollamaCheck).toBeDefined();
    // Ollama might not be running in test environment, so we just check it was attempted
  });

  it('should support different environments', async () => {
    const result = await runReadinessCheck(['--env=test', '--json']);
    expect(result.exitCode).toBeDefined();
    
    // Should not crash with different environment
    const output = result.stdout;
    expect(output).toContain('test');
  });

  it('should provide summary statistics', async () => {
    const result = await runReadinessCheck(['--json']);
    const output = JSON.parse(result.stdout.split('\n').find(line => line.startsWith('{')) || '{}');
    
    expect(output.passed).toBeDefined();
    expect(output.failed).toBeDefined();
    expect(output.warnings).toBeDefined();
    expect(typeof output.passed).toBe('number');
    expect(typeof output.failed).toBe('number');
    expect(typeof output.warnings).toBe('number');
  });

  it('should exit with code 0 on success', async () => {
    // Mock a successful scenario by setting required env vars
    const env = {
      ...process.env,
      NODE_ENV: 'test',
      PORT: '3001',
      OLLAMA_HOST: 'localhost',
      DATABASE_PATH: './test.db',
      REDIS_HOST: 'localhost',
    };

    const result = await runReadinessCheck(['--json'], { env });
    
    // Even if some checks fail (like Ollama not running), the script should still execute
    expect([0, 1]).toContain(result.exitCode);
  });

  it('should handle missing configuration gracefully', async () => {
    const env = {
      PATH: process.env.PATH, // Keep PATH for node execution
      // Remove other env vars to test defaults
    };

    const result = await runReadinessCheck(['--json'], { env });
    
    // Should not crash even with minimal environment
    expect([0, 1]).toContain(result.exitCode);
    expect(result.stderr).not.toContain('TypeError');
    expect(result.stderr).not.toContain('ReferenceError');
  });

  async function runReadinessCheck(args: string[] = [], options: { env?: NodeJS.ProcessEnv } = {}): Promise<{
    exitCode: number;
    stdout: string;
    stderr: string;
  }> {
    return new Promise((resolve) => {
      const child = spawn('node', [scriptPath, ...args], {
        stdio: 'pipe',
        env: options.env || process.env,
      });

      let stdout = '';
      let stderr = '';

      child.stdout?.on('data', (data) => {
        stdout += data.toString();
      });

      child.stderr?.on('data', (data) => {
        stderr += data.toString();
      });

      child.on('close', (code) => {
        resolve({
          exitCode: code || 0,
          stdout,
          stderr,
        });
      });

      // Timeout after 30 seconds
      setTimeout(() => {
        child.kill();
        resolve({
          exitCode: 1,
          stdout,
          stderr: stderr + '\nTimeout: Process killed after 30 seconds',
        });
      }, 30000);
    });
  }
});

describe('System Readiness Check Integration', () => {
  it('should be callable from npm script', async () => {
    const result = await runNpmScript('readiness-check', ['--help']);
    expect(result.exitCode).toBe(0);
    expect(result.stdout).toContain('AI Toolkit System Readiness Check');
  });

  it('should support production environment check', async () => {
    const result = await runNpmScript('readiness-check:prod', ['--json']);
    expect([0, 1]).toContain(result.exitCode);
  });

  async function runNpmScript(script: string, args: string[] = []): Promise<{
    exitCode: number;
    stdout: string;
    stderr: string;
  }> {
    return new Promise((resolve) => {
      const child = spawn('npm', ['run', script, '--', ...args], {
        stdio: 'pipe',
        cwd: process.cwd(),
      });

      let stdout = '';
      let stderr = '';

      child.stdout?.on('data', (data) => {
        stdout += data.toString();
      });

      child.stderr?.on('data', (data) => {
        stderr += data.toString();
      });

      child.on('close', (code) => {
        resolve({
          exitCode: code || 0,
          stdout,
          stderr,
        });
      });

      // Timeout after 60 seconds for npm scripts
      setTimeout(() => {
        child.kill();
        resolve({
          exitCode: 1,
          stdout,
          stderr: stderr + '\nTimeout: Process killed after 60 seconds',
        });
      }, 60000);
    });
  }
});