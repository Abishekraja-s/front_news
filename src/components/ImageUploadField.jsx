import { useRef, useState } from 'react';
import toast from 'react-hot-toast';
import { mediaService } from '../services/articleService';
import { getImageUrl } from '../utils/images';
import {
  PORTAL_IMAGE_MAX_BYTES,
  PORTAL_IMAGE_MAX_LABEL,
  portalImageSizeError,
} from '../utils/imageUploadLimits';

/**
 * Image URL field with file upload + optional preview.
 * Default: POST /media/upload
 * Pass uploadFn for portal endpoints (matrimony / marketplace 50 KB).
 */
const ImageUploadField = ({
  value = '',
  onChange,
  placeholder = 'Image URL',
  inputClassName = 'admin-input',
  showPreview = true,
  seed = 'upload',
  previewClassName = 'max-h-36 w-full object-contain rounded-lg bg-slate-50 border border-slate-200',
  required = false,
  label,
  uploadFn,
  maxBytes,
  hint,
}) => {
  const [uploading, setUploading] = useState(false);
  const fileRef = useRef(null);
  const sizeLimit = maxBytes ?? null;

  const handleUpload = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (!file.type.startsWith('image/')) {
      toast.error('Please choose an image file');
      e.target.value = '';
      return;
    }
    if (sizeLimit != null && file.size > sizeLimit) {
      toast.error(
        sizeLimit === PORTAL_IMAGE_MAX_BYTES
          ? portalImageSizeError()
          : `Image must be ${Math.round(sizeLimit / 1024)} KB or less`
      );
      e.target.value = '';
      return;
    }
    const fd = new FormData();
    fd.append('file', file);
    setUploading(true);
    try {
      const uploader = uploadFn || mediaService.upload;
      const { data } = await uploader(fd);
      const url = data.data?.url || '';
      if (!url) throw new Error('No URL returned');
      onChange(url);
      toast.success('Image uploaded');
    } catch (err) {
      toast.error(err.response?.data?.message || err.message || 'Upload failed');
    } finally {
      setUploading(false);
      e.target.value = '';
    }
  };

  return (
    <div className="space-y-2">
      {label && <p className="text-sm font-medium text-slate-700">{label}</p>}
      {showPreview && value?.trim() && (
        <div className="rounded-xl border border-slate-200 p-2 bg-slate-50">
          <img
            src={getImageUrl(value, seed)}
            alt=""
            className={previewClassName}
            onError={(e) => {
              e.currentTarget.style.display = 'none';
            }}
          />
        </div>
      )}
      <div className="flex flex-wrap gap-2 items-stretch">
        <input
          type="text"
          value={value}
          onChange={(e) => onChange(e.target.value)}
          placeholder={placeholder}
          required={required}
          className={`${inputClassName} flex-1 min-w-[180px]`}
        />
        <label className="btn-secondary text-sm py-2 px-3 cursor-pointer inline-flex items-center justify-center whitespace-nowrap disabled:opacity-50">
          {uploading ? 'Uploading…' : 'Upload image'}
          <input
            ref={fileRef}
            type="file"
            accept="image/jpeg,image/png,image/gif,image/webp,image/avif,image/svg+xml,.jpg,.jpeg,.png,.gif,.webp,.avif,.svg"
            className="hidden"
            disabled={uploading}
            onChange={handleUpload}
          />
        </label>
        {value?.trim() && (
          <button
            type="button"
            onClick={() => onChange('')}
            className="text-xs text-rose-600 hover:underline px-2"
          >
            Clear
          </button>
        )}
      </div>
      <p className="text-xs text-slate-500">
        {hint ||
          (sizeLimit != null
            ? `Max image size: ${sizeLimit === PORTAL_IMAGE_MAX_BYTES ? PORTAL_IMAGE_MAX_LABEL : `${Math.round(sizeLimit / 1024)} KB`}. Upload a file or paste a URL.`
            : 'Upload a file from your computer, or paste an image URL.')}
      </p>
    </div>
  );
};

export default ImageUploadField;
