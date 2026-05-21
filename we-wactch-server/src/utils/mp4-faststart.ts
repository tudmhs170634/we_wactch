import { readFileSync, writeFileSync } from 'fs';
import { Logger } from '@nestjs/common';

const logger = new Logger('MP4Faststart');

/**
 * Pure Node.js MP4 Faststart
 * Di chuyển moov atom lên trước mdat atom để video phát ngay.
 * Không cần FFmpeg.
 */
export async function mp4Faststart(inputPath: string, outputPath: string): Promise<boolean> {
  const buf = readFileSync(inputPath);
  const atoms = parseAtoms(buf);

  const moovAtom = atoms.find((a) => a.type === 'moov');
  const mdatAtom = atoms.find((a) => a.type === 'mdat');

  if (!moovAtom || !mdatAtom) {
    logger.warn('Cannot find moov or mdat atom. Skipping.');
    return false;
  }

  // Nếu moov đã ở trước mdat → đã faststart rồi
  if (moovAtom.offset < mdatAtom.offset) {
    logger.log('Video already has faststart. No processing needed.');
    // Copy file nguyên bản
    writeFileSync(outputPath, buf);
    return true;
  }

  logger.log('Moving moov atom before mdat...');

  // Trích xuất moov data
  const moovData = Buffer.from(buf.subarray(moovAtom.offset, moovAtom.offset + moovAtom.size));

  // Cập nhật chunk offsets trong moov (stco/co64)
  // Vì moov sẽ được chèn trước mdat, tất cả chunk offset cần tăng thêm moovAtom.size
  const offsetShift = moovAtom.size;
  updateChunkOffsets(moovData, offsetShift);

  // Ghép lại: [ftyp + các atom trước mdat] + [moov] + [mdat + phần sau]
  const beforeMdat = buf.subarray(0, mdatAtom.offset);
  const mdatAndAfter = buf.subarray(mdatAtom.offset, moovAtom.offset);

  const result = Buffer.concat([beforeMdat, moovData, mdatAndAfter]);
  writeFileSync(outputPath, result);

  logger.log(`Faststart completed. Output: ${outputPath}`);
  return true;
}

interface Atom {
  type: string;
  offset: number;
  size: number;
}

/**
 * Parse top-level atoms từ MP4 buffer
 */
function parseAtoms(buf: Buffer): Atom[] {
  const atoms: Atom[] = [];
  let offset = 0;

  while (offset < buf.length - 8) {
    let size = buf.readUInt32BE(offset);
    const type = buf.subarray(offset + 4, offset + 8).toString('ascii');

    if (size === 0) break; // atom cuối cùng
    if (size === 1) {
      // 64-bit extended size
      if (offset + 16 > buf.length) break;
      size = Number(buf.readBigUInt64BE(offset + 8));
    }

    if (size < 8 || offset + size > buf.length + 1) break;

    atoms.push({ type, offset, size });
    offset += size;
  }

  return atoms;
}

/**
 * Tìm và cập nhật tất cả stco/co64 atoms bên trong moov
 * stco: 32-bit chunk offsets
 * co64: 64-bit chunk offsets
 */
function updateChunkOffsets(moovBuf: Buffer, shift: number): void {
  findAndUpdateBoxes(moovBuf, 0, moovBuf.length, shift);
}

function findAndUpdateBoxes(buf: Buffer, start: number, end: number, shift: number): void {
  let offset = start;

  while (offset < end - 8) {
    let size = buf.readUInt32BE(offset);
    const type = buf.subarray(offset + 4, offset + 8).toString('ascii');

    if (size === 0 || size < 8) break;
    if (size === 1) {
      if (offset + 16 > end) break;
      size = Number(buf.readBigUInt64BE(offset + 8));
    }

    if (offset + size > end) break;

    if (type === 'stco') {
      // stco: version(1) + flags(3) + entry_count(4) + entries(4 each)
      const headerSize = 8; // atom header
      const entryCount = buf.readUInt32BE(offset + headerSize + 4);
      for (let i = 0; i < entryCount; i++) {
        const pos = offset + headerSize + 8 + i * 4;
        if (pos + 4 > offset + size) break;
        const oldOffset = buf.readUInt32BE(pos);
        buf.writeUInt32BE(oldOffset + shift, pos);
      }
    } else if (type === 'co64') {
      // co64: version(1) + flags(3) + entry_count(4) + entries(8 each)
      const headerSize = 8;
      const entryCount = buf.readUInt32BE(offset + headerSize + 4);
      for (let i = 0; i < entryCount; i++) {
        const pos = offset + headerSize + 8 + i * 8;
        if (pos + 8 > offset + size) break;
        const oldOffset = buf.readBigUInt64BE(pos);
        buf.writeBigUInt64BE(oldOffset + BigInt(shift), pos);
      }
    } else if (['trak', 'mdia', 'minf', 'stbl', 'moov'].includes(type)) {
      // Container atoms — tìm bên trong
      findAndUpdateBoxes(buf, offset + 8, offset + size, shift);
    }

    offset += size;
  }
}