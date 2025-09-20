import React, { useState, useEffect, useRef } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import api from '../api';
import toast from 'react-hot-toast';
import { Editor } from '@tinymce/tinymce-react';
import {
  Save, Image as ImageIcon, Trash2, ListOrdered, FilePlus2, Settings2, ImagePlus, SlidersHorizontal
} from 'lucide-react';
import styles from './AddPostPage.module.css';

const AddPostPage = () => {
  const { id } = useParams();
  const isEditMode = Boolean(id);
  const navigate = useNavigate();
  const editorRef = useRef(null);

  const [formData, setFormData] = useState({
    title: '',
    content: '',
    category: 'Blog',
    metaDescription: '',
    keywords: '',
    featuredImage: '',
    videoURL: ''
  });

  const [featuredImageFile, setFeaturedImageFile] = useState(null);
  const [imagePreview, setImagePreview] = useState('');
  const [loading, setLoading] = useState(false);
  const [isDirty, setIsDirty] = useState(false);
  const [pageMode, setPageMode] = useState(true);
  const [dragActive, setDragActive] = useState(false);

  // New: independent sticky admin panel with tabs
  const [activeTab, setActiveTab] = useState('publish'); // 'publish' | 'media' | 'seo'
  const [drawerOpen, setDrawerOpen] = useState(false);   // mobile bottom drawer

  const tinymceApiKey = import.meta.env.VITE_TINYMCE_API_KEY;

  // Fetch post data
  useEffect(() => {
    if (!isEditMode) return;
    setLoading(true);
    api.get(`/posts/id/${id}`)
      .then(res => {
        const post = res.data;
        setFormData({
          title: post.title || '',
          content: post.content || '',
          category: post.category || 'Blog',
          metaDescription: post.metaDescription || '',
          keywords: (post.keywords || []).join(', '),
          featuredImage: post.featuredImage || '',
          videoURL: post.videoURL || ''
        });
        if (post.featuredImage) setImagePreview(post.featuredImage);
      })
      .catch(() => toast.error('Failed to load post data.'))
      .finally(() => setLoading(false));
  }, [id, isEditMode]);

  // Unsaved changes guard
  useEffect(() => {
    const handler = (e) => {
      if (!isDirty || loading) return;
      e.preventDefault();
      e.returnValue = '';
    };
    window.addEventListener('beforeunload', handler);
    return () => window.removeEventListener('beforeunload', handler);
  }, [isDirty, loading]);

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
    setIsDirty(true);
  };

  const handleFileChange = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (!file.type.startsWith('image/')) { toast.error('Please select an image file.'); return; }
    if (file.size > 4 * 1024 * 1024) { toast.error('Image too large (max 4 MB).'); return; }
    setFeaturedImageFile(file);
    setImagePreview(URL.createObjectURL(file));
    setIsDirty(true);
  };

  const onFeaturedDrop = (e) => {
    e.preventDefault(); e.stopPropagation(); setDragActive(false);
    const file = e.dataTransfer.files?.[0];
    if (!file) return;
    if (!file.type.startsWith('image/')) { toast.error('Please drop an image file.'); return; }
    if (file.size > 4 * 1024 * 1024) { toast.error('Image too large (max 4 MB).'); return; }
    setFeaturedImageFile(file);
    setImagePreview(URL.createObjectURL(file));
    setIsDirty(true);
  };

  const removeImage = () => {
    setFeaturedImageFile(null);
    setImagePreview('');
    setFormData(prev => ({ ...prev, featuredImage: '' }));
    setIsDirty(true);
  };

  const slugFromTitle = (title) =>
    title.toLowerCase().trim()
      .replace(/[^a-z0-9\s-]/g, '')
      .replace(/\s+/g, '-')
      .replace(/-+/g, '-');

  const getVideoEmbed = (url) => {
    if (!url) return null;
    try {
      const u = new URL(url);
      if (u.hostname.includes('youtube.com') || u.hostname.includes('youtu.be')) {
        const id = u.searchParams.get('v') || u.pathname.split('/').filter(Boolean).pop();
        if (!id) return null;
        return (
          <div className={styles.videoFrameWrap}>
            <iframe
              className={styles.videoFrame}
              src={`https://www.youtube.com/embed/${id}`}
              title="YouTube"
              allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
              allowFullScreen
            />
          </div>
        );
      }
      if (u.hostname.includes('instagram.com')) {
        return <blockquote className={styles.instagramNote}>Instagram link detected. Preview will show on public page after publish.</blockquote>;
      }
    } catch { /* ignore */ }
    return null;
  };

  const insertTOC = () => editorRef.current?.execCommand('mceInsertContent', false, '<div class="mce-toc"></div>');

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (formData.title.trim().length < 5) { toast.error('Title must be at least 5 characters.'); return; }
    if (editorRef.current) {
      const plain = editorRef.current.getContent({ format: 'text' }).trim();
      if (plain.length < 30) { toast.error('Please add more body content.'); return; }
    }
    setLoading(true);
    const submissionData = new FormData();
    const contentWithMeta = `${formData.content}
      <div data-meta-category="${formData.category}" style="display:none"></div>`;
    Object.keys(formData).forEach(key => {
      submissionData.append(key, key === 'content' ? contentWithMeta : formData[key]);
    });
    if (featuredImageFile) submissionData.append('featuredImage', featuredImageFile);

    try {
      if (isEditMode) await api.put(`/posts/${id}`, submissionData);
      else await api.post('/posts', submissionData);
      toast.success(`Post ${isEditMode ? 'updated' : 'created'} successfully!`);
      setIsDirty(false);
      navigate('/admin/posts');
    } catch {
      toast.error('Failed to save post.');
    } finally {
      setLoading(false);
    }
  };

  const editorConfig = {
  /* Layout & Menus */
  height: 620,
  menubar: false,
  toolbar_mode: 'sliding',
  toolbar_sticky: true,               // keep toolbar visible while scrolling
  toolbar_sticky_offset: 64,          // adjust if your top header is taller/shorter

  /* Popular, free plugins only */
  plugins: [
    // Essentials
    'autolink', 'lists', 'advlist', 'link', 'image', 'media', 'table',
    // Authoring utilities
    'searchreplace', 'preview', 'anchor', 'charmap', 'hr', 'nonbreaking', 'insertdatetime',
    'toc', 'quickbars', 'autoresize', 'directionality', 'visualblocks',
    'wordcount', 'textpattern',
    // Power tools
    'code', 'fullscreen', 'pagebreak'
  ],

  /* Put Color + Align + Font + Font Size first, and Fullscreen clearly visible */
  toolbar:
    'forecolor backcolor | alignleft aligncenter alignright alignjustify | ' +
    'fontfamily fontsize | bold italic underline | blocks | ' +
    'bullist numlist outdent indent | link image media table | ' +
    'searchreplace preview visualblocks code fullscreen | toc pagebreak',

  /* Quickbars (appear on selection / insertion) */
  quickbars_selection_toolbar:
    'bold italic underline | forecolor backcolor | link | alignleft aligncenter alignright | bullist numlist | removeformat',
  quickbars_insert_toolbar: 'image media table hr',

  /* Brand color palette (shows first in color pickers) */
  color_map: [
    // Brand & accent first
    '4f46e5', 'Brand Indigo',
    '4338ca', 'Indigo Dark',
    'f97316', 'Accent Orange',
    'ea580c', 'Accent Dark',
    // Inks & neutrals to match your site
    '0f172a', 'Ink 900',
    '1e293b', 'Ink 800',
    '334155', 'Ink 700',
    '475569', 'Ink 600',
    'e2e8f0', 'Line',
    'f8fafc', 'Soft'
  ],

  /* Font menus (loaded below in content_style) */
  font_family_formats:
    'Default=; ' +
    'Inter=Inter,system-ui,-apple-system,Segoe UI,Roboto,Helvetica,Arial,sans-serif; ' +
    'Open Sans="Open Sans",system-ui,-apple-system,Segoe UI,Roboto,Helvetica,Arial,sans-serif; ' +
    'Roboto=Roboto,system-ui,-apple-system,Segoe UI,Helvetica,Arial,sans-serif; ' +
    'Georgia=Georgia,serif; ' +
    'Merriweather=Merriweather,Georgia,serif; ' +
    'Lora=Lora,Georgia,serif; ' +
    'Source Serif Pro="Source Serif Pro",Georgia,serif; ' +
    'Monospace=SFMono-Regular,Consolas,Monaco,monospace',
  fontsize_formats: '12px 14px 16px 18px 20px 22px 24px 28px 32px 36px',

  /* Keep common HTML intact */
  extended_valid_elements:
    'h1[class|style],h2[class|style],h3[class|style],h4[class|style],' +
    'p[class|style],strong,em,u,span[class|style],' +
    'ul,li,ol,a[href|target|rel|title],' +
    'img[src|alt|width|height|style],blockquote,code,pre,hr,' +
    'table[width|height|class|style],tr,td,th,thead,tbody,tfoot,' +
    'div[class|style],section[class|style],figure[class|style],figcaption[class|style]',

  /* Comfortable writing */
  autoresize_bottom_margin: 40,
  autoresize_min_height: 420,
  autoresize_overflow_padding: 16,

  /* Document-like appearance (toggle with pageMode in your component) */
  body_class: pageMode ? 'page-mode show-ruler' : '',

  /* Make editor visuals match your SinglePostPage exactly */
  content_style: `
    /* Load menu fonts */
    @import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;600&family=Open+Sans:wght@400;600&family=Roboto:wght@400;500;700&family=Merriweather:wght@400;700&family=Lora:wght@400;600&family=Source+Serif+Pro:wght@400;600&display=swap');

    :root {
      --ink-900: #0f172a;
      --ink-800: #1e293b;
      --ink-700: #334155;
      --ink-600: #475569;
      --line: #e2e8f0;
      --soft: #f8fafc;
      --brand: #4f46e5;        /* Use your Indigo as primary in editor */
      --brand-dark: #4338ca;
      --brand-soft: #eef2ff;
      --accent: #F97316;
      --accent-dark: #EA580C;
    }

    body {
      font-family: Inter, system-ui, -apple-system, Segoe UI, Roboto, Helvetica, Arial, sans-serif;
      font-size: 1.05rem;
      line-height: 1.75;
      color: var(--ink-800);
    }

    /* Page layout simulation */
    body.page-mode {
      max-width: 800px;
      margin: 32px auto !important;
      padding: 2.54cm 2.2cm;
      background: #ffffff;
      border: 1px solid var(--line);
      box-shadow: 0 10px 30px rgba(0,0,0,0.06);
    }
    body.show-ruler.page-mode { position: relative; }
    body.show-ruler.page-mode:before {
      content: '';
      position: absolute; top: 16px; left: 2.2cm; right: 2.2cm; height: 8px;
      background-image: repeating-linear-gradient(to right, #c7c7c7, #c7c7c7 1px, transparent 1px, transparent 8px);
      opacity: 0.55; pointer-events: none;
    }

    /* Headings (mirror your front-end) */
    h1 { font-size: 2rem; line-height: 1.25; margin: 0.8em 0 0.4em; font-weight: 800; color: var(--ink-900); }
    h2 { margin: 1.6rem 0 0.7rem; font-size: 1.4rem; font-weight: 800; color: var(--ink-900); }
    h3 { margin: 1.2rem 0 0.6rem; font-size: 1.2rem; font-weight: 800; color: var(--ink-900); }

    /* Paragraphs & links */
    p { margin: 0 0 1.1em; }
    a { color: var(--accent-dark); text-decoration: none; border-bottom: 1px dashed rgba(234, 88, 12, 0.4); }
    a:hover { border-bottom-color: var(--accent-dark); }

    /* Lists */
    ul, ol { padding-left: 1.2em; }

    /* Inline/Block code */
    code {
      background: #0f172a0d;
      padding: 0.15em 0.35em;
      border-radius: 6px;
      font-family: ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, "Liberation Mono", "Courier New", monospace;
    }
    pre {
      background: #0f172a0d;
      border: 1px solid var(--line);
      border-radius: 12px;
      padding: 14px;
      overflow: auto;
    }

    /* Tables */
    table { border-collapse: collapse; width: 100%; }
    th, td { border-bottom: 1px solid var(--line); padding: 10px 12px; text-align: left; vertical-align: top; }
    tr:nth-child(even) { background: #fafafa; }

    /* Images & figures */
    img { max-width: 100%; height: auto; display: block; border-radius: 12px; }
    figure { margin: 1rem 0; }
    figcaption { margin-top: 6px; font-size: 0.9rem; color: var(--ink-600); text-align: center; }

    /* Blockquote */
    blockquote {
      border-left: 4px solid var(--line);
      margin: 1em 0;
      padding: 0.5em 1em;
      color: #444;
      background: var(--soft);
      border-radius: 6px;
    }
  `,

  /* Support captions on images */
  image_caption: true,

  /* Image uploads — unchanged routes */
  automatic_uploads: true,
  images_upload_url: '/api/posts/upload-image',
  images_upload_handler: (blobInfo, progress) => new Promise((resolve, reject) => {
    const formData = new FormData();
    formData.append('file', blobInfo.blob(), blobInfo.filename());
    api.post('/posts/upload-image', formData, {
      headers: { 'Content-Type': 'multipart/form-data' }
    })
    .then(res => {
      if (res.data && res.data.location) resolve(res.data.location);
      else reject('Invalid JSON response from server');
    })
    .catch(err => reject('Image upload failed: ' + (err.response?.data?.message || err.message)));
  }),

  /* Paste: keep structure, reduce junk */
  paste_block_drop: true,
  paste_merge_formats: true,
  // If you see very messy pastes from Word/Docs, you can enable:
  // valid_styles: { '*': 'text-align,color,background-color,font-size,font-family' },

  /* Links default to new tab */
  default_link_target: '_blank',
  link_target_list: false,

  /* Polish */
  branding: false
};



  const metaLen = formData.metaDescription.length;
  const metaTip =
    metaLen === 0 ? 'Add a compelling summary (aim 120–160 characters).'
    : metaLen < 50 ? 'A bit short — consider adding detail.'
    : metaLen <= 160 ? 'Looks good for Google.'
    : 'Too long for most snippets — consider trimming.';

  return (
    <form className={styles.pageWrap} onSubmit={handleSubmit}>
      {/* Top bar */}
      <header className={styles.header}>
        <div className={styles.headerLeft}>
          <h1 className={styles.headerTitle}>{isEditMode ? 'Edit Post' : 'Create New Post'}</h1>
          <div className={styles.slugPreview}>
            Permalink: <span>/{slugFromTitle(formData.title) || 'your-title'}</span>
          </div>
        </div>
        <div className={styles.headerActions}>
          <button type="button" className={styles.secondaryBtn} title="Insert Table of Contents" onClick={insertTOC}>
            <ListOrdered size={16} />
            Insert TOC
          </button>
          <button type="submit" className={styles.submitBtn} disabled={loading}>
            <Save size={18} />
            {loading ? 'Saving…' : isEditMode ? 'Update Post' : 'Publish Post'}
          </button>
        </div>
      </header>

      {/* 2-column: Editor (scrolls with page) + Sticky Admin Panel (independent scroll) */}
      <div className={styles.layout}>
        {/* Left: content editor */}
        <main className={styles.editorCol}>
          <fieldset className={styles.card}>
            <legend className={styles.cardTitle}>Main Content</legend>
            <input
              type="text"
              name="title"
              value={formData.title}
              onChange={handleInputChange}
              placeholder="Post Title"
              className={styles.titleInput}
              required
            />
          </fieldset>

          <fieldset className={styles.card}>
            <legend className={styles.cardTitle}>Body Content</legend>

            <div className={styles.toolbarRow}>
              <label className={styles.toggleRow}>
                <input type="checkbox" checked={pageMode} onChange={() => setPageMode(v => !v)} />
                <span>Document layout (margin + border + ruler)</span>
              </label>

              <button
                type="button"
                className={styles.secondaryBtn}
                onClick={() => editorRef.current?.execCommand('mceInsertContent', false, '<hr class="mce-pagebreak" />')}
                title="Insert Page Break"
              >
                <FilePlus2 size={16} />
                Page Break
              </button>
            </div>

            <Editor
              apiKey={tinymceApiKey}
              onInit={(evt, editor) => (editorRef.current = editor)}
              value={formData.content}
              init={editorConfig}
              onEditorChange={(newContent) => {
                setFormData(prev => ({ ...prev, content: newContent }));
                if (!isDirty) setIsDirty(true);
              }}
            />
          </fieldset>
        </main>

        {/* Right: sticky independent admin panel */}
        <aside className={styles.sideDock}>
          {/* Tab bar */}
          <div className={styles.tabBar} role="tablist" aria-label="Admin panel">
            <button
              type="button"
              role="tab"
              aria-selected={activeTab === 'publish'}
              className={`${styles.tabBtn} ${activeTab === 'publish' ? styles.tabActive : ''}`}
              onClick={() => setActiveTab('publish')}
              title="Publish"
            >
              <Settings2 size={16} /> <span>Publish</span>
            </button>
            <button
              type="button"
              role="tab"
              aria-selected={activeTab === 'media'}
              className={`${styles.tabBtn} ${activeTab === 'media' ? styles.tabActive : ''}`}
              onClick={() => setActiveTab('media')}
              title="Media"
            >
              <ImagePlus size={16} /> <span>Media</span>
            </button>
            <button
              type="button"
              role="tab"
              aria-selected={activeTab === 'seo'}
              className={`${styles.tabBtn} ${activeTab === 'seo' ? styles.tabActive : ''}`}
              onClick={() => setActiveTab('seo')}
              title="SEO"
            >
              <SlidersHorizontal size={16} /> <span>SEO</span>
            </button>
          </div>

          {/* Scroll area (independent) */}
          <div className={styles.dockScroll}>
            {/* PUBLISH */}
            {activeTab === 'publish' && (
              <div className={styles.card}>
                <legend className={styles.cardTitle}>Publish</legend>
                <div className={styles.inputGroup}>
                  <label>Category</label>
                  <select
                    name="category"
                    value={formData.category}
                    onChange={handleInputChange}
                    className={styles.selectInput}
                  >
                    <option value="Blog">Blog Post</option>
                    <option value="News">News</option>
                    <option value="Notification">Exam Notification</option>
                    <option value="Strategy">Strategy Guide</option>
                  </select>
                </div>

                <button type="submit" className={styles.submitBtnFull} disabled={loading}>
                  <Save size={18} />
                  {loading ? 'Saving…' : isEditMode ? 'Update' : 'Publish'}
                </button>

                <p className={styles.infoText}>
                  Tip: Use H2/H3 for sections. Add a TOC for long posts.
                </p>
              </div>
            )}

            {/* MEDIA */}
            {activeTab === 'media' && (
              <div className={styles.card}>
                <legend className={styles.cardTitle}>Media</legend>

                <div
                  className={`${styles.imageUploader} ${dragActive ? styles.uploadActive : ''}`}
                  onDragEnter={(e) => { e.preventDefault(); e.stopPropagation(); setDragActive(true); }}
                  onDragOver={(e) => { e.preventDefault(); e.stopPropagation(); }}
                  onDragLeave={(e) => { e.preventDefault(); e.stopPropagation(); setDragActive(false); }}
                  onDrop={onFeaturedDrop}
                >
                  {imagePreview ? (
                    <div className={styles.imagePreview}>
                      <img src={imagePreview} alt="Featured preview" />
                      <button type="button" onClick={removeImage} className={styles.removeImageBtn} title="Remove image">
                        <Trash2 size={16} />
                      </button>
                    </div>
                  ) : (
                    <label htmlFor="file-upload" className={styles.uploadLabel}>
                      <ImageIcon size={48} />
                      <span>Click or drag & drop to upload image (max 4 MB)</span>
                    </label>
                  )}
                  <input
                    id="file-upload"
                    type="file"
                    onChange={handleFileChange}
                    accept="image/*"
                    style={{ display: 'none' }}
                  />
                </div>

                <div className={styles.inputGroup}>
                  <label>YouTube/Instagram Video URL (Optional)</label>
                  <input
                    type="text"
                    name="videoURL"
                    value={formData.videoURL}
                    onChange={handleInputChange}
                    placeholder="Paste video link here"
                  />
                  <div style={{ marginTop: 8 }}>{getVideoEmbed(formData.videoURL)}</div>
                </div>
              </div>
            )}

            {/* SEO */}
            {activeTab === 'seo' && (
              <div className={styles.card}>
                <legend className={styles.cardTitle}>SEO Settings</legend>

                <div className={styles.inputGroup}>
                  <label>Meta Description</label>
                  <textarea
                    name="metaDescription"
                    value={formData.metaDescription}
                    onChange={handleInputChange}
                    rows="4"
                    placeholder="Short description for Google (aim 120–160 chars)"
                  />
                  <span
                    className={styles.charCount}
                    style={{
                      color:
                        metaLen === 0 ? '#6b7280' :
                        metaLen <= 160 && metaLen >= 50 ? '#059669' : '#b91c1c'
                    }}
                  >
                    {metaLen} / 160 • {metaTip}
                  </span>
                </div>

                <div className={styles.inputGroup}>
                  <label>Keywords (comma-separated)</label>
                  <input
                    type="text"
                    name="keywords"
                    value={formData.keywords}
                    onChange={handleInputChange}
                    placeholder="nimcet 2025, cuet pg"
                  />
                  <div className={styles.chipsWrap}>
                    {formData.keywords
                      .split(',')
                      .map(k => k.trim())
                      .filter(Boolean)
                      .slice(0, 12)
                      .map((k, i) => (
                        <span key={i} className={styles.chip}>{k}</span>
                      ))}
                  </div>
                </div>
              </div>
            )}
          </div>
        </aside>
      </div>

      {/* Mobile floating action to open drawer */}
      <button
        type="button"
        className={styles.fab}
        onClick={() => setDrawerOpen(true)}
        aria-label="Open admin panel"
      >
        <Settings2 size={20} />
      </button>

      {/* Mobile bottom drawer for the admin panel */}
      <div className={`${styles.drawer} ${drawerOpen ? styles.drawerOpen : ''}`} role="dialog" aria-modal="true">
        <div className={styles.drawerHeader}>
          <div className={styles.tabBarMobile}>
            <button
              type="button"
              className={`${styles.tabBtn} ${activeTab === 'publish' ? styles.tabActive : ''}`}
              onClick={() => setActiveTab('publish')}
            >
              <Settings2 size={16} /> <span>Publish</span>
            </button>
            <button
              type="button"
              className={`${styles.tabBtn} ${activeTab === 'media' ? styles.tabActive : ''}`}
              onClick={() => setActiveTab('media')}
            >
              <ImagePlus size={16} /> <span>Media</span>
            </button>
            <button
              type="button"
              className={`${styles.tabBtn} ${activeTab === 'seo' ? styles.tabActive : ''}`}
              onClick={() => setActiveTab('seo')}
            >
              <SlidersHorizontal size={16} /> <span>SEO</span>
            </button>
          </div>
          <button type="button" className={styles.drawerClose} onClick={() => setDrawerOpen(false)}>Close</button>
        </div>
        <div className={styles.drawerBody}>
          {/* Reuse same content as sidebar, based on activeTab */}
          {activeTab === 'publish' && (
            <div className={styles.card}>
              <legend className={styles.cardTitle}>Publish</legend>
              <div className={styles.inputGroup}>
                <label>Category</label>
                <select
                  name="category"
                  value={formData.category}
                  onChange={handleInputChange}
                  className={styles.selectInput}
                >
                  <option value="Blog">Blog Post</option>
                  <option value="News">News</option>
                  <option value="Notification">Exam Notification</option>
                  <option value="Strategy">Strategy Guide</option>
                </select>
              </div>
              <button type="submit" className={styles.submitBtnFull} disabled={loading}>
                <Save size={18} />
                {loading ? 'Saving…' : isEditMode ? 'Update' : 'Publish'}
              </button>
            </div>
          )}

          {activeTab === 'media' && (
            <div className={styles.card}>
              <legend className={styles.cardTitle}>Media</legend>
              <div
                className={`${styles.imageUploader} ${dragActive ? styles.uploadActive : ''}`}
                onDragEnter={(e) => { e.preventDefault(); e.stopPropagation(); setDragActive(true); }}
                onDragOver={(e) => { e.preventDefault(); e.stopPropagation(); }}
                onDragLeave={(e) => { e.preventDefault(); e.stopPropagation(); setDragActive(false); }}
                onDrop={onFeaturedDrop}
              >
                {imagePreview ? (
                  <div className={styles.imagePreview}>
                    <img src={imagePreview} alt="Featured preview" />
                    <button type="button" onClick={removeImage} className={styles.removeImageBtn} title="Remove image">
                      <Trash2 size={16} />
                    </button>
                  </div>
                ) : (
                  <label htmlFor="file-upload-mobile" className={styles.uploadLabel}>
                    <ImageIcon size={48} />
                    <span>Tap or drag & drop to upload image (max 4 MB)</span>
                  </label>
                )}
                <input
                  id="file-upload-mobile"
                  type="file"
                  onChange={handleFileChange}
                  accept="image/*"
                  style={{ display: 'none' }}
                />
              </div>

              <div className={styles.inputGroup}>
                <label>YouTube/Instagram Video URL (Optional)</label>
                <input
                  type="text"
                  name="videoURL"
                  value={formData.videoURL}
                  onChange={handleInputChange}
                  placeholder="Paste video link here"
                />
                <div style={{ marginTop: 8 }}>{getVideoEmbed(formData.videoURL)}</div>
              </div>
            </div>
          )}

          {activeTab === 'seo' && (
            <div className={styles.card}>
              <legend className={styles.cardTitle}>SEO Settings</legend>
              <div className={styles.inputGroup}>
                <label>Meta Description</label>
                <textarea
                  name="metaDescription"
                  value={formData.metaDescription}
                  onChange={handleInputChange}
                  rows="4"
                  placeholder="Short description for Google (aim 120–160 chars)"
                />
                <span
                  className={styles.charCount}
                  style={{
                    color:
                      metaLen === 0 ? '#6b7280' :
                      metaLen <= 160 && metaLen >= 50 ? '#059669' : '#b91c1c'
                  }}
                >
                  {metaLen} / 160 • {metaTip}
                </span>
              </div>

              <div className={styles.inputGroup}>
                <label>Keywords (comma-separated)</label>
                <input
                  type="text"
                  name="keywords"
                  value={formData.keywords}
                  onChange={handleInputChange}
                  placeholder="nimcet 2025, cuet pg"
                />
                <div className={styles.chipsWrap}>
                  {formData.keywords
                    .split(',')
                    .map(k => k.trim())
                    .filter(Boolean)
                    .slice(0, 12)
                    .map((k, i) => (
                      <span key={i} className={styles.chip}>{k}</span>
                    ))}
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </form>
  );
};

export default AddPostPage;
