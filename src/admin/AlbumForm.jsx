import { useCallback, useEffect, useRef, useState } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import toast from 'react-hot-toast';
import { albumService } from '../services/articleService';
import { getImageUrl } from '../utils/images';
import AdminPageHeader from './AdminPageHeader';
import ImageUploadField from '../components/ImageUploadField';

const emptyForm = {
  title: '',
  description: '',
  category: '',
  coverImage: '',
  albumDate: new Date().toISOString().slice(0, 10),
  status: 'draft',
  displayOrder: 0,
};

const AlbumForm = () => {
  const { id } = useParams();
  const isEdit = Boolean(id);
  const navigate = useNavigate();
  const fileRef = useRef(null);

  const [form, setForm] = useState(emptyForm);
  const [categories, setCategories] = useState([]);
  const [images, setImages] = useState([]);
  const [loading, setLoading] = useState(isEdit);
  const [saving, setSaving] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [previews, setPreviews] = useState([]);
  const [albumId, setAlbumId] = useState(id || null);

  const loadAlbum = useCallback(async () => {
    if (!id) return;
    setLoading(true);
    try {
      const { data } = await albumService.getAdminById(id);
      const album = data.data;
      setAlbumId(album._id);
      setForm({
        title: album.title || '',
        description: album.description || '',
        category: album.category?._id || album.category || '',
        coverImage: album.coverImage || '',
        albumDate: album.albumDate
          ? new Date(album.albumDate).toISOString().slice(0, 10)
          : emptyForm.albumDate,
        status: album.status || 'draft',
        displayOrder: album.displayOrder ?? 0,
      });
      setImages(album.images || []);
    } catch {
      toast.error('Failed to load album');
      navigate('/admin/albums');
    } finally {
      setLoading(false);
    }
  }, [id, navigate]);

  useEffect(() => {
    albumService
      .getCategories()
      .then(({ data }) => setCategories(data.data || []))
      .catch(() => {});
  }, []);

  useEffect(() => {
    loadAlbum();
  }, [loadAlbum]);

  useEffect(() => {
    return () => {
      previews.forEach((p) => URL.revokeObjectURL(p.url));
    };
  }, [previews]);

  const setField = (key, value) => setForm((f) => ({ ...f, [key]: value }));

  const saveMeta = async () => {
    if (!form.title.trim()) {
      toast.error('Album title is required');
      return null;
    }
    const payload = {
      title: form.title.trim(),
      description: form.description.trim(),
      category: form.category || null,
      coverImage: form.coverImage.trim(),
      albumDate: form.albumDate || undefined,
      status: form.status,
      displayOrder: Number(form.displayOrder) || 0,
    };

    if (albumId) {
      const { data } = await albumService.update(albumId, payload);
      return data.data;
    }
    const { data } = await albumService.create(payload);
    const created = data.data;
    setAlbumId(created._id);
    navigate(`/admin/albums/edit/${created._id}`, { replace: true });
    return created;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSaving(true);
    try {
      await saveMeta();
      toast.success(isEdit || albumId ? 'Album saved' : 'Album created');
      if (albumId) await loadAlbum();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Save failed');
    } finally {
      setSaving(false);
    }
  };

  const onPickFiles = (e) => {
    const files = Array.from(e.target.files || []);
    if (!files.length) return;
    const allowed = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp'];
    const valid = [];
    const nextPreviews = [];
    for (const file of files) {
      if (!allowed.includes(file.type) && !/\.(jpe?g|png|webp)$/i.test(file.name)) {
        toast.error(`${file.name}: only JPG, PNG, WebP allowed`);
        continue;
      }
      if (file.size > 12 * 1024 * 1024) {
        toast.error(`${file.name}: max 12 MB before compression`);
        continue;
      }
      valid.push(file);
      nextPreviews.push({
        key: `${file.name}-${file.size}-${file.lastModified}`,
        name: file.name,
        url: URL.createObjectURL(file),
        file,
      });
    }
    setPreviews((prev) => [...prev, ...nextPreviews]);
    e.target.value = '';
  };

  const removePreview = (key) => {
    setPreviews((prev) => {
      const item = prev.find((p) => p.key === key);
      if (item) URL.revokeObjectURL(item.url);
      return prev.filter((p) => p.key !== key);
    });
  };

  const uploadSelected = async () => {
    if (!previews.length) {
      toast.error('Choose images first');
      return;
    }
    setUploading(true);
    try {
      let idToUse = albumId;
      if (!idToUse) {
        const created = await saveMeta();
        if (!created?._id) throw new Error('Create album first');
        idToUse = created._id;
      }
      const fd = new FormData();
      previews.forEach((p) => fd.append('files', p.file));
      const { data } = await albumService.uploadImages(idToUse, fd);
      toast.success(data.message || 'Images uploaded');
      previews.forEach((p) => URL.revokeObjectURL(p.url));
      setPreviews([]);
      const refreshed = await albumService.getAdminById(idToUse);
      setImages(refreshed.data.data?.images || []);
      if (refreshed.data.data?.coverImage) {
        setField('coverImage', refreshed.data.data.coverImage);
      }
    } catch (err) {
      toast.error(err.response?.data?.message || err.message || 'Upload failed');
    } finally {
      setUploading(false);
    }
  };

  const handleDeleteImage = async (image) => {
    if (!window.confirm('Remove this image from the album?')) return;
    try {
      await albumService.deleteImage(image._id);
      setImages((list) => list.filter((i) => i._id !== image._id));
      toast.success('Image removed');
    } catch (err) {
      toast.error(err.response?.data?.message || 'Delete failed');
    }
  };

  const handleSetCover = async (image) => {
    if (!albumId) return;
    try {
      await albumService.setCover(albumId, { imageId: image._id });
      setField('coverImage', image.url || image.webpUrl || image.thumbnailUrl);
      toast.success('Cover image updated');
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to set cover');
    }
  };

  const moveImage = async (index, dir) => {
    const next = [...images];
    const target = index + dir;
    if (target < 0 || target >= next.length) return;
    [next[index], next[target]] = [next[target], next[index]];
    setImages(next);
    if (!albumId) return;
    try {
      await albumService.reorderImages(
        albumId,
        next.map((i) => i._id)
      );
    } catch {
      toast.error('Reorder failed');
      loadAlbum();
    }
  };

  if (loading) {
    return (
      <div className="py-16 text-center text-slate-500">
        <div className="w-10 h-10 border-4 border-brand-200 border-t-brand-600 rounded-full animate-spin mx-auto" />
        <p className="mt-3 text-sm">Loading album…</p>
      </div>
    );
  }

  return (
    <div className="space-y-6 max-w-5xl">
      <AdminPageHeader
        title={isEdit || albumId ? 'Edit Album' : 'Add New Album'}
        subtitle="Fill album details, upload images (auto-compressed to ~50–100 KB WebP), then publish"
      >
        <Link to="/admin/albums" className="btn-secondary text-sm py-2.5 px-4 text-center">
          ← Album List
        </Link>
      </AdminPageHeader>

      <form onSubmit={handleSubmit} className="space-y-5 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 p-4 sm:p-6">
        <div className="grid sm:grid-cols-2 gap-4">
          <label className="block sm:col-span-2">
            <span className="text-sm font-medium text-slate-700 dark:text-slate-200">Album Title *</span>
            <input
              className="admin-input mt-1"
              value={form.title}
              onChange={(e) => setField('title', e.target.value)}
              required
              placeholder="e.g. Independence Day Celebrations 2026"
            />
          </label>

          <label className="block sm:col-span-2">
            <span className="text-sm font-medium text-slate-700 dark:text-slate-200">Description</span>
            <textarea
              className="admin-input mt-1 min-h-[100px]"
              value={form.description}
              onChange={(e) => setField('description', e.target.value)}
              placeholder="Short description for the album page"
            />
          </label>

          <label className="block">
            <span className="text-sm font-medium text-slate-700 dark:text-slate-200">Category</span>
            <select
              className="admin-input mt-1"
              value={form.category}
              onChange={(e) => setField('category', e.target.value)}
            >
              <option value="">Uncategorized</option>
              {categories.map((c) => (
                <option key={c._id} value={c._id}>
                  {c.name}
                </option>
              ))}
            </select>
          </label>

          <label className="block">
            <span className="text-sm font-medium text-slate-700 dark:text-slate-200">Album Date</span>
            <input
              type="date"
              className="admin-input mt-1"
              value={form.albumDate}
              onChange={(e) => setField('albumDate', e.target.value)}
            />
          </label>

          <label className="block">
            <span className="text-sm font-medium text-slate-700 dark:text-slate-200">Status</span>
            <select
              className="admin-input mt-1"
              value={form.status}
              onChange={(e) => setField('status', e.target.value)}
            >
              <option value="draft">Draft</option>
              <option value="published">Published</option>
            </select>
          </label>

          <label className="block">
            <span className="text-sm font-medium text-slate-700 dark:text-slate-200">Display Order</span>
            <input
              type="number"
              className="admin-input mt-1"
              value={form.displayOrder}
              onChange={(e) => setField('displayOrder', e.target.value)}
            />
          </label>
        </div>

        <ImageUploadField
          label="Album Cover Image"
          value={form.coverImage}
          onChange={(url) => setField('coverImage', url)}
          placeholder="Cover image URL or upload"
          seed={form.title || 'album-cover'}
        />
        <p className="text-xs text-slate-500 -mt-2">
          You can also set cover from gallery images below after upload.
        </p>

        <div className="flex flex-wrap gap-2 pt-2">
          <button type="submit" disabled={saving} className="btn-primary text-sm py-2.5 px-5">
            {saving ? 'Saving…' : albumId ? 'Save Album' : 'Create Album'}
          </button>
          {(isEdit || albumId) && form.status === 'draft' && (
            <button
              type="button"
              disabled={saving}
              className="btn-secondary text-sm py-2.5 px-4"
              onClick={async () => {
                setField('status', 'published');
                setSaving(true);
                try {
                  const payload = {
                    ...form,
                    title: form.title.trim(),
                    description: form.description.trim(),
                    category: form.category || null,
                    status: 'published',
                    displayOrder: Number(form.displayOrder) || 0,
                  };
                  await albumService.update(albumId, payload);
                  toast.success('Album published');
                } catch (err) {
                  toast.error(err.response?.data?.message || 'Publish failed');
                  setField('status', 'draft');
                } finally {
                  setSaving(false);
                }
              }}
            >
              Publish Now
            </button>
          )}
        </div>
      </form>

      <section className="rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 p-4 sm:p-6 space-y-4">
        <div>
          <h2 className="text-lg font-semibold text-slate-900 dark:text-slate-100">Manage Album Images</h2>
          <p className="text-sm text-slate-500 mt-1">
            Upload multiple images. Server compresses each to ~50–100 KB WebP and stores them under{' '}
            <code className="text-xs bg-slate-100 px-1 rounded">/uploads/albums/…</code>
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <input
            ref={fileRef}
            type="file"
            accept="image/jpeg,image/jpg,image/png,image/webp,.jpg,.jpeg,.png,.webp"
            multiple
            className="hidden"
            onChange={onPickFiles}
          />
          <button
            type="button"
            className="btn-secondary text-sm py-2 px-4"
            onClick={() => fileRef.current?.click()}
          >
            Choose Images
          </button>
          <button
            type="button"
            className="btn-primary text-sm py-2 px-4"
            disabled={uploading || !previews.length}
            onClick={uploadSelected}
          >
            {uploading ? 'Optimizing & uploading…' : `Upload ${previews.length || ''} selected`}
          </button>
        </div>

        {previews.length > 0 && (
          <div>
            <p className="text-sm font-medium text-slate-700 mb-2">Preview before upload</p>
            <div className="grid grid-cols-2 sm:grid-cols-4 md:grid-cols-5 gap-3">
              {previews.map((p) => (
                <div key={p.key} className="relative rounded-lg overflow-hidden border border-slate-200 bg-slate-50">
                  <img src={p.url} alt="" className="aspect-square w-full object-cover" />
                  <button
                    type="button"
                    onClick={() => removePreview(p.key)}
                    className="absolute top-1 right-1 h-7 w-7 rounded-full bg-black/70 text-white text-sm"
                    aria-label="Remove"
                  >
                    ×
                  </button>
                  <p className="text-[10px] p-1 truncate text-slate-600">{p.name}</p>
                </div>
              ))}
            </div>
          </div>
        )}

        {images.length === 0 ? (
          <p className="text-sm text-slate-500 py-4">No images in this album yet.</p>
        ) : (
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3">
            {images.map((image, index) => {
              const src = image.thumbnailUrl || image.webpUrl || image.url;
              const isCover =
                form.coverImage &&
                [image.url, image.webpUrl, image.thumbnailUrl].includes(form.coverImage);
              return (
                <div
                  key={image._id}
                  className={`relative rounded-xl overflow-hidden border bg-slate-50 ${
                    isCover ? 'border-brand-500 ring-2 ring-brand-200' : 'border-slate-200'
                  }`}
                >
                  <img
                    src={getImageUrl(src, image._id)}
                    alt={image.caption || ''}
                    className="aspect-square w-full object-cover"
                    loading="lazy"
                  />
                  {isCover && (
                    <span className="absolute top-2 left-2 text-[10px] font-semibold uppercase tracking-wide bg-brand-600 text-white px-2 py-0.5 rounded">
                      Cover
                    </span>
                  )}
                  <div className="p-2 space-y-1.5 bg-white">
                    <p className="text-[10px] text-slate-500">
                      {image.width}×{image.height}
                      {image.size ? ` · ${Math.round(image.size / 1024)} KB` : ''}
                    </p>
                    <div className="flex flex-wrap gap-1">
                      <button
                        type="button"
                        className="text-[10px] px-1.5 py-0.5 rounded bg-slate-100 hover:bg-slate-200"
                        onClick={() => moveImage(index, -1)}
                        disabled={index === 0}
                      >
                        ←
                      </button>
                      <button
                        type="button"
                        className="text-[10px] px-1.5 py-0.5 rounded bg-slate-100 hover:bg-slate-200"
                        onClick={() => moveImage(index, 1)}
                        disabled={index === images.length - 1}
                      >
                        →
                      </button>
                      <button
                        type="button"
                        className="text-[10px] px-1.5 py-0.5 rounded bg-brand-50 text-brand-700"
                        onClick={() => handleSetCover(image)}
                      >
                        Set cover
                      </button>
                      <button
                        type="button"
                        className="text-[10px] px-1.5 py-0.5 rounded bg-red-50 text-red-700"
                        onClick={() => handleDeleteImage(image)}
                      >
                        Remove
                      </button>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </section>
    </div>
  );
};

export default AlbumForm;
