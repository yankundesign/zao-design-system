import { MAX_IMAGE_BYTES } from './image-analysis';
import { ReferenceStoreError } from './references-server';

export async function parseReferenceRequest(request: Request) {
  const length = Number(request.headers.get('content-length'));
  if (Number.isFinite(length) && length > MAX_IMAGE_BYTES + 1024 * 1024)
    throw new ReferenceStoreError('Choose an image under 16 MB.', 413);
  const contentType = request.headers.get('content-type') ?? '';
  if (contentType.startsWith('application/json')) {
    try {
      return { metadata: (await request.json()) as unknown, image: undefined };
    } catch {
      throw new ReferenceStoreError('Reference details must be valid JSON.');
    }
  }
  if (!contentType.startsWith('multipart/form-data'))
    throw new ReferenceStoreError('Send JSON details or a multipart image upload.', 415);
  const form = await request.formData();
  const source = form.get('metadata');
  if (typeof source !== 'string')
    throw new ReferenceStoreError('Include reference details as metadata JSON.');
  let metadata: unknown;
  try {
    metadata = JSON.parse(source);
  } catch {
    throw new ReferenceStoreError('Reference details must be valid JSON.');
  }
  const file = form.get('image');
  if (file !== null && !(file instanceof File))
    throw new ReferenceStoreError('Choose an image file.');
  if (file && file.size > MAX_IMAGE_BYTES)
    throw new ReferenceStoreError('Choose an image under 16 MB.', 413);
  return { metadata, image: file ? Buffer.from(await file.arrayBuffer()) : undefined };
}
