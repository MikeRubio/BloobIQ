import { mkdirSync, writeFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const root = dirname(dirname(fileURLToPath(import.meta.url)));
const output = join(root, 'assets', 'sounds');
mkdirSync(output, { recursive: true });

function wav(name, tones) {
  const sampleRate = 44100;
  const samples = tones.flatMap(({ frequency, seconds, volume = 0.28 }) => {
    const length = Math.floor(sampleRate * seconds);
    return Array.from({ length }, (_, index) => {
      const envelope = Math.min(1, index / 350) * Math.max(0, 1 - index / length);
      return Math.sin((2 * Math.PI * frequency * index) / sampleRate) * volume * envelope;
    });
  });
  const dataSize = samples.length * 2;
  const buffer = Buffer.alloc(44 + dataSize);
  buffer.write('RIFF', 0); buffer.writeUInt32LE(36 + dataSize, 4); buffer.write('WAVE', 8);
  buffer.write('fmt ', 12); buffer.writeUInt32LE(16, 16); buffer.writeUInt16LE(1, 20);
  buffer.writeUInt16LE(1, 22); buffer.writeUInt32LE(sampleRate, 24); buffer.writeUInt32LE(sampleRate * 2, 28);
  buffer.writeUInt16LE(2, 32); buffer.writeUInt16LE(16, 34); buffer.write('data', 36); buffer.writeUInt32LE(dataSize, 40);
  samples.forEach((sample, index) => buffer.writeInt16LE(Math.round(sample * 32767), 44 + index * 2));
  writeFileSync(join(output, name), buffer);
}

wav('correct.wav', [{ frequency: 523.25, seconds: 0.11 }, { frequency: 783.99, seconds: 0.18 }]);
wav('wrong.wav', [{ frequency: 246.94, seconds: 0.13 }, { frequency: 174.61, seconds: 0.2, volume: 0.22 }]);
