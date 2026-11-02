import { promises as fs } from 'fs';
import path from 'path';
import { inflateRawSync } from 'zlib';

type CentralFileHeader = {
  fileName: string;
  compressedSize: number;
  uncompressedSize: number;
  compressionMethod: number;
  localHeaderOffset: number;
};

export type ZipExtractionLimits = {
  maxEntries?: number;
  maxUncompressedBytes?: number;
  maxPathLength?: number;
};

const DEFAULT_LIMITS: Required<ZipExtractionLimits> = {
  maxEntries: 2_000,
  maxUncompressedBytes: 256 * 1024 * 1024,
  maxPathLength: 512,
};

export async function unzipToDirectory(
  zipBuffer: Buffer,
  outDir: string,
  limits: ZipExtractionLimits = {},
): Promise<void> {
  const resolvedLimits = { ...DEFAULT_LIMITS, ...limits };
  if (zipBuffer.length === 0) {
    throw new Error('invalid_zip: empty archive');
  }
  await fs.mkdir(outDir, { recursive: true });
  const entries = parseCentralDirectory(zipBuffer);
  if (entries.length > resolvedLimits.maxEntries) {
    throw new Error(`zip_limits: too many entries (max ${resolvedLimits.maxEntries})`);
  }

  let totalUncompressedBytes = 0;
  for (const entry of entries) {
    if (entry.fileName.length > resolvedLimits.maxPathLength) {
      throw new Error(`zip_limits: path is too long (max ${resolvedLimits.maxPathLength})`);
    }
    totalUncompressedBytes += entry.uncompressedSize;
    if (totalUncompressedBytes > resolvedLimits.maxUncompressedBytes) {
      throw new Error(`zip_limits: uncompressed data exceeds ${resolvedLimits.maxUncompressedBytes} bytes`);
    }

    const normalized = safeZipPath(entry.fileName);
    if (!normalized) {
      continue;
    }
    const targetPath = path.join(outDir, normalized);
    if (entry.fileName.endsWith('/')) {
      await fs.mkdir(targetPath, { recursive: true });
      continue;
    }
    await fs.mkdir(path.dirname(targetPath), { recursive: true });
    const fileData = extractFileData(zipBuffer, entry);
    if (fileData.length !== entry.uncompressedSize) {
      throw new Error('invalid_zip: uncompressed size mismatch');
    }
    await fs.writeFile(targetPath, fileData);
  }
}

function safeZipPath(p: string): string | null {
  const replaced = p.replaceAll('\\', '/');
  if (replaced.startsWith('/') || /^[a-zA-Z]:\//.test(replaced)) {
    return null;
  }
  const parts = replaced.split('/');
  const safeParts: string[] = [];
  for (const part of parts) {
    if (!part || part === '.') continue;
    if (part === '..') {
      if (safeParts.length === 0) return null;
      safeParts.pop();
      continue;
    }
    safeParts.push(part);
  }
  return safeParts.join('/') || null;
}

function parseCentralDirectory(buf: Buffer): CentralFileHeader[] {
  const eocdSig = 0x06054b50;
  let eocd = -1;
  for (let i = buf.length - 22; i >= 0; i -= 1) {
    if (buf.readUInt32LE(i) === eocdSig) {
      eocd = i;
      break;
    }
  }
  if (eocd < 0) {
    throw new Error('invalid_zip: missing EOCD');
  }

  const cdSize = buf.readUInt32LE(eocd + 12);
  const cdOffset = buf.readUInt32LE(eocd + 16);
  if (cdOffset + cdSize > buf.length) {
    throw new Error('invalid_zip: central directory exceeds archive');
  }
  let cursor = cdOffset;

  const cdfhSig = 0x02014b50;
  const entries: CentralFileHeader[] = [];
  while (cursor < cdOffset + cdSize) {
    if (cursor + 46 > buf.length) {
      throw new Error('invalid_zip: truncated central directory');
    }
    const sig = buf.readUInt32LE(cursor);
    if (sig !== cdfhSig) {
      break;
    }
    const compressionMethod = buf.readUInt16LE(cursor + 10);
    const compressedSize = buf.readUInt32LE(cursor + 20);
    const uncompressedSize = buf.readUInt32LE(cursor + 24);
    const fileNameLen = buf.readUInt16LE(cursor + 28);
    const extraLen = buf.readUInt16LE(cursor + 30);
    const commentLen = buf.readUInt16LE(cursor + 32);
    const localHeaderOffset = buf.readUInt32LE(cursor + 42);
    const fileName = buf.subarray(cursor + 46, cursor + 46 + fileNameLen).toString('utf8');
    entries.push({
      fileName,
      compressedSize,
      uncompressedSize,
      compressionMethod,
      localHeaderOffset,
    });
    cursor = cursor + 46 + fileNameLen + extraLen + commentLen;
  }
  return entries;
}

function extractFileData(buf: Buffer, entry: CentralFileHeader): Buffer {
  const lfhSig = 0x04034b50;
  if (entry.localHeaderOffset < 0 || entry.localHeaderOffset + 30 > buf.length) {
    throw new Error('invalid_zip: invalid local header offset');
  }
  const sig = buf.readUInt32LE(entry.localHeaderOffset);
  if (sig !== lfhSig) {
    throw new Error('invalid_zip: missing local header');
  }
  const fileNameLen = buf.readUInt16LE(entry.localHeaderOffset + 26);
  const extraLen = buf.readUInt16LE(entry.localHeaderOffset + 28);
  const dataOffset = entry.localHeaderOffset + 30 + fileNameLen + extraLen;
  if (dataOffset < 0 || dataOffset + entry.compressedSize > buf.length) {
    throw new Error('invalid_zip: truncated file data');
  }
  const compressed = buf.subarray(dataOffset, dataOffset + entry.compressedSize);

  if (entry.compressionMethod === 0) {
    return Buffer.from(compressed);
  }
  if (entry.compressionMethod === 8) {
    return inflateRawSync(compressed);
  }
  throw new Error(`unsupported_zip_compression_method:${entry.compressionMethod}`);
}
