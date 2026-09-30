import React, { useCallback, useEffect, useRef, useState } from 'react';
import axios from 'axios';
import { useAuth } from '../contexts/AuthContext';
import { getAuthToken } from '../utils/apiBase';
import { canManageResource } from '../utils/ownership';
import {
  NewspaperIcon,
  PlusIcon,
  MagnifyingGlassIcon,
  LightBulbIcon,
  DocumentTextIcon,
  ChatBubbleLeftIcon,
  TrashIcon,
  PencilIcon,
  HeartIcon,
  BookmarkIcon,
  ShareIcon,
  BriefcaseIcon,
} from '../components/icons';

type PostType = 'news' | 'update' | 'idea' | 'blog' | 'opinion' | 'opportunity';

interface CommunityComment {
  id: string;
  postId: string;
  userId: string;
  authorName: string;
  body: string;
  createdAt: string;
}

interface CommunityPost {
  id: string;
  userId: string;
  authorName: string;
  title: string;
  body: string;
  postType: PostType;
  tags: string[];
  linkUrl?: string | null;
  createdAt: string;
  updatedAt: string;
  likeCount: number;
  likedByMe: boolean;
  commentCount: number;
  savedByMe: boolean;
}

const POST_TYPE_META: Record<
  PostType,
  { label: string; hint: string; icon: React.FC<React.SVGProps<SVGSVGElement>> }
> = {
  news: {
    label: 'News',
    hint: 'Something happening in research or industry',
    icon: NewspaperIcon,
  },
  update: {
    label: 'Update',
    hint: 'A finding, tool, or report worth sharing',
    icon: DocumentTextIcon,
  },
  idea: {
    label: 'Idea',
    hint: 'A thought or suggestion for the community',
    icon: LightBulbIcon,
  },
  blog: {
    label: 'Blog',
    hint: 'A longer write-up or personal take',
    icon: DocumentTextIcon,
  },
  opinion: {
    label: 'Opinion',
    hint: 'Your view on how research should work',
    icon: ChatBubbleLeftIcon,
  },
  opportunity: {
    label: 'Opportunity',
    hint: 'Open role, internship, or lab call',
    icon: BriefcaseIcon,
  },
};

const FILTERS: Array<{ id: 'all' | PostType; label: string }> = [
  { id: 'all', label: 'All' },
  { id: 'news', label: 'News' },
  { id: 'update', label: 'Updates' },
  { id: 'idea', label: 'Ideas' },
  { id: 'blog', label: 'Blogs' },
  { id: 'opinion', label: 'Opinions' },
  { id: 'opportunity', label: 'Opportunities' },
];

const authHeaders = () => ({ Authorization: `Bearer ${getAuthToken() || ''}` });

const formatWhen = (value: string) => {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return '';
  const diffMs = Date.now() - date.getTime();
  const mins = Math.floor(diffMs / 60000);
  if (mins < 1) return 'Just now';
  if (mins < 60) return `${mins}m ago`;
  const hours = Math.floor(mins / 60);
  if (hours < 24) return `${hours}h ago`;
  const days = Math.floor(hours / 24);
  if (days < 7) return `${days}d ago`;
  return date.toLocaleDateString();
};

const emptyForm = {
  title: '',
  body: '',
  postType: 'update' as PostType,
  tags: '',
  linkUrl: '',
};

const CurrentTrendsPage: React.FC = () => {
  const { user } = useAuth();
  const [posts, setPosts] = useState<CommunityPost[]>([]);
  const [filter, setFilter] = useState<'all' | PostType>('all');
  const [search, setSearch] = useState('');
  const [searchInput, setSearchInput] = useState('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [showComposer, setShowComposer] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [form, setForm] = useState(emptyForm);
  const [saving, setSaving] = useState(false);
  const [expandedComments, setExpandedComments] = useState<Set<string>>(new Set());
  const [commentsByPost, setCommentsByPost] = useState<Record<string, CommunityComment[]>>({});
  const [commentDrafts, setCommentDrafts] = useState<Record<string, string>>({});
  const [commentLoading, setCommentLoading] = useState<Record<string, boolean>>({});
  const [highlightId, setHighlightId] = useState<string | null>(null);
  const postRefs = useRef<Record<string, HTMLElement | null>>({});

  const loadPosts = useCallback(async () => {
    const token = getAuthToken();
    if (!token) {
      setError('Sign in to view the feed');
      setLoading(false);
      return;
    }
    try {
      setLoading(true);
      setError('');
      const response = await axios.get('/api/community-news', {
        params: {
          ...(filter !== 'all' ? { type: filter } : {}),
          ...(search ? { search } : {}),
          limit: 80,
        },
        headers: authHeaders(),
      });
      setPosts(
        (response.data.posts || []).map((p: CommunityPost) => ({
          ...p,
          likeCount: Number(p.likeCount) || 0,
          likedByMe: Boolean(p.likedByMe),
          commentCount: Number(p.commentCount) || 0,
          savedByMe: Boolean(p.savedByMe),
        }))
      );
    } catch (err) {
      console.error(err);
      setError('Failed to load posts');
    } finally {
      setLoading(false);
    }
  }, [filter, search]);

  useEffect(() => {
    void loadPosts();
  }, [loadPosts]);

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const postId = params.get('post');
    if (!postId || posts.length === 0) return;
    setHighlightId(postId);
    setExpandedComments((prev) => new Set(prev).add(postId));
    void loadComments(postId);
    requestAnimationFrame(() => {
      postRefs.current[postId]?.scrollIntoView({ behavior: 'smooth', block: 'center' });
    });
  }, [posts]);

  const openCreate = () => {
    setEditingId(null);
    setForm(emptyForm);
    setShowComposer(true);
  };

  const openEdit = (post: CommunityPost) => {
    setEditingId(post.id);
    setForm({
      title: post.title,
      body: post.body,
      postType: post.postType,
      tags: (post.tags || []).join(', '),
      linkUrl: post.linkUrl || '',
    });
    setShowComposer(true);
  };

  const closeComposer = () => {
    setShowComposer(false);
    setEditingId(null);
    setForm(emptyForm);
  };

  const submitPost = async (event: React.FormEvent) => {
    event.preventDefault();
    const token = getAuthToken();
    if (!token) return;
    if (!form.title.trim() || !form.body.trim()) {
      setError('Title and content are required');
      return;
    }

    const payload = {
      title: form.title.trim(),
      body: form.body.trim(),
      postType: form.postType,
      tags: form.tags
        .split(',')
        .map((t) => t.trim())
        .filter(Boolean),
      linkUrl: form.linkUrl.trim() || null,
    };

    try {
      setSaving(true);
      setError('');
      if (editingId) {
        await axios.put(`/api/community-news/${editingId}`, payload, {
          headers: authHeaders(),
        });
      } else {
        await axios.post('/api/community-news', payload, {
          headers: authHeaders(),
        });
      }
      closeComposer();
      await loadPosts();
    } catch (err: any) {
      console.error(err);
      setError(err.response?.data?.error || 'Failed to save post');
    } finally {
      setSaving(false);
    }
  };

  const deletePost = async (post: CommunityPost) => {
    if (!window.confirm('Delete this post?')) return;
    const token = getAuthToken();
    if (!token) return;
    try {
      await axios.delete(`/api/community-news/${post.id}`, {
        headers: authHeaders(),
      });
      setPosts((prev) => prev.filter((p) => p.id !== post.id));
    } catch (err) {
      console.error(err);
      setError('Failed to delete post');
    }
  };

  const toggleLike = async (post: CommunityPost) => {
    const prevLiked = post.likedByMe;
    const prevCount = post.likeCount;
    setPosts((list) =>
      list.map((p) =>
        p.id === post.id
          ? {
              ...p,
              likedByMe: !prevLiked,
              likeCount: Math.max(0, prevCount + (prevLiked ? -1 : 1)),
            }
          : p
      )
    );
    try {
      const res = await axios.post(
        `/api/community-news/${post.id}/like`,
        {},
        { headers: authHeaders() }
      );
      setPosts((list) =>
        list.map((p) =>
          p.id === post.id
            ? {
                ...p,
                likedByMe: Boolean(res.data.liked),
                likeCount: Number(res.data.likeCount) || 0,
              }
            : p
        )
      );
    } catch (err) {
      console.error(err);
      setPosts((list) =>
        list.map((p) =>
          p.id === post.id ? { ...p, likedByMe: prevLiked, likeCount: prevCount } : p
        )
      );
    }
  };

  const toggleSave = async (post: CommunityPost) => {
    const prev = post.savedByMe;
    setPosts((list) =>
      list.map((p) => (p.id === post.id ? { ...p, savedByMe: !prev } : p))
    );
    try {
      const res = await axios.post(
        `/api/community-news/${post.id}/save`,
        {},
        { headers: authHeaders() }
      );
      setPosts((list) =>
        list.map((p) =>
          p.id === post.id ? { ...p, savedByMe: Boolean(res.data.saved) } : p
        )
      );
    } catch (err) {
      console.error(err);
      setPosts((list) =>
        list.map((p) => (p.id === post.id ? { ...p, savedByMe: prev } : p))
      );
    }
  };

  const sharePost = async (post: CommunityPost) => {
    const url = `${window.location.origin}/current-trends?post=${post.id}`;
    try {
      if (navigator.share) {
        await navigator.share({ title: post.title, text: post.body.slice(0, 140), url });
      } else {
        await navigator.clipboard.writeText(url);
        alert('Link copied');
      }
    } catch (err: any) {
      if (err?.name === 'AbortError') return;
      try {
        await navigator.clipboard.writeText(url);
        alert('Link copied');
      } catch {
        alert(url);
      }
    }
  };

  const loadComments = async (postId: string) => {
    setCommentLoading((m) => ({ ...m, [postId]: true }));
    try {
      const res = await axios.get(`/api/community-news/${postId}/comments`, {
        headers: authHeaders(),
      });
      setCommentsByPost((m) => ({ ...m, [postId]: res.data.comments || [] }));
    } catch (err) {
      console.error(err);
    } finally {
      setCommentLoading((m) => ({ ...m, [postId]: false }));
    }
  };

  const toggleComments = async (postId: string) => {
    const next = new Set(expandedComments);
    if (next.has(postId)) {
      next.delete(postId);
      setExpandedComments(next);
      return;
    }
    next.add(postId);
    setExpandedComments(next);
    if (!commentsByPost[postId]) {
      await loadComments(postId);
    }
  };

  const submitComment = async (postId: string) => {
    const body = (commentDrafts[postId] || '').trim();
    if (!body) return;
    try {
      const res = await axios.post(
        `/api/community-news/${postId}/comments`,
        { body },
        { headers: authHeaders() }
      );
      setCommentDrafts((m) => ({ ...m, [postId]: '' }));
      setCommentsByPost((m) => ({
        ...m,
        [postId]: [...(m[postId] || []), res.data.comment],
      }));
      setPosts((list) =>
        list.map((p) =>
          p.id === postId
            ? { ...p, commentCount: Number(res.data.commentCount) || p.commentCount + 1 }
            : p
        )
      );
    } catch (err: any) {
      console.error(err);
      alert(err.response?.data?.error || 'Failed to post comment');
    }
  };

  const deleteComment = async (postId: string, commentId: string) => {
    if (!confirm('Delete this comment?')) return;
    try {
      await axios.delete(`/api/community-news/comments/${commentId}`, {
        headers: authHeaders(),
      });
      setCommentsByPost((m) => ({
        ...m,
        [postId]: (m[postId] || []).filter((c) => c.id !== commentId),
      }));
      setPosts((list) =>
        list.map((p) =>
          p.id === postId
            ? { ...p, commentCount: Math.max(0, (p.commentCount || 1) - 1) }
            : p
        )
      );
    } catch (err: any) {
      console.error(err);
      alert(err.response?.data?.error || 'Failed to delete comment');
    }
  };

  return (
    <div className="min-h-[calc(100vh-4rem)] bg-[#FAFBFC]">
      <div className="max-w-3xl mx-auto px-4 sm:px-6 py-8">
        <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-4 mb-6">
          <div>
            <h1 className="text-2xl sm:text-3xl font-semibold text-slate-900 tracking-tight flex items-center gap-2">
              <NewspaperIcon className="w-7 h-7 text-slate-700" />
              News & updates
            </h1>
            <p className="mt-1.5 text-[14px] text-slate-600 max-w-xl">
              Share news, ideas, opinions, and work opportunities - then like, comment, share, or save
              what matters.
            </p>
          </div>
          <button
            type="button"
            onClick={openCreate}
            className="inline-flex items-center gap-2 px-3.5 py-2 text-[13px] font-medium text-white bg-slate-900 rounded-md hover:bg-slate-800 transition-colors shrink-0"
          >
            <PlusIcon className="w-4 h-4" />
            Share something
          </button>
        </div>

        <div className="mb-4 flex flex-col sm:flex-row gap-3">
          <form
            className="relative flex-1"
            onSubmit={(e) => {
              e.preventDefault();
              setSearch(searchInput.trim());
            }}
          >
            <MagnifyingGlassIcon className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
            <input
              type="search"
              value={searchInput}
              onChange={(e) => setSearchInput(e.target.value)}
              placeholder="Search posts…"
              className="w-full pl-9 pr-3 py-2 text-[13px] border border-slate-200 rounded-md bg-white focus:outline-none focus:ring-2 focus:ring-slate-900/10 focus:border-slate-300"
            />
          </form>
        </div>

        <div className="flex gap-1 overflow-x-auto border-b border-slate-200/80 mb-5">
          {FILTERS.map((tab) => (
            <button
              key={tab.id}
              type="button"
              onClick={() => setFilter(tab.id)}
              className={`relative px-3.5 py-2.5 text-[13px] font-medium whitespace-nowrap transition-colors ${
                filter === tab.id ? 'text-slate-900' : 'text-slate-500 hover:text-slate-800'
              }`}
            >
              {tab.label}
              {filter === tab.id && (
                <span className="absolute left-2 right-2 -bottom-px h-0.5 bg-slate-900 rounded-full" />
              )}
            </button>
          ))}
        </div>

        {error && (
          <div className="mb-4 px-4 py-3 text-[13px] text-red-700 bg-red-50 border border-red-100 rounded-lg">
            {error}
          </div>
        )}

        {showComposer && (
          <div className="mb-6 bg-white border border-slate-200/80 rounded-xl p-5 shadow-sm">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-[15px] font-semibold text-slate-900">
                {editingId ? 'Edit post' : 'Share with the community'}
              </h2>
              <button
                type="button"
                onClick={closeComposer}
                className="text-[13px] text-slate-500 hover:text-slate-800"
              >
                Cancel
              </button>
            </div>

            <form onSubmit={submitPost} className="space-y-4">
              <div>
                <label className="block text-[12px] font-medium text-slate-600 mb-1.5">Type</label>
                <div className="flex flex-wrap gap-2">
                  {(Object.keys(POST_TYPE_META) as PostType[]).map((type) => {
                    const meta = POST_TYPE_META[type];
                    const selected = form.postType === type;
                    return (
                      <button
                        key={type}
                        type="button"
                        onClick={() => setForm((f) => ({ ...f, postType: type }))}
                        className={`inline-flex items-center gap-1.5 px-3 py-1.5 text-[12px] rounded-md border transition-colors ${
                          selected
                            ? 'bg-slate-900 text-white border-slate-900'
                            : 'bg-white text-slate-600 border-slate-200 hover:border-slate-300'
                        }`}
                        title={meta.hint}
                      >
                        <meta.icon className="w-3.5 h-3.5" />
                        {meta.label}
                      </button>
                    );
                  })}
                </div>
                <p className="mt-1.5 text-[12px] text-slate-500">
                  {POST_TYPE_META[form.postType].hint}
                </p>
              </div>

              <div>
                <label className="block text-[12px] font-medium text-slate-600 mb-1.5">Title</label>
                <input
                  type="text"
                  value={form.title}
                  onChange={(e) => setForm((f) => ({ ...f, title: e.target.value }))}
                  placeholder={
                    form.postType === 'opportunity'
                      ? 'e.g. Postdoc opening - single-cell immunology'
                      : 'e.g. Found an amazing tool for image generation'
                  }
                  className="w-full px-3 py-2 text-[13px] border border-slate-200 rounded-md focus:outline-none focus:ring-2 focus:ring-slate-900/10"
                  maxLength={500}
                  required
                />
              </div>

              <div>
                <label className="block text-[12px] font-medium text-slate-600 mb-1.5">Content</label>
                <textarea
                  value={form.body}
                  onChange={(e) => setForm((f) => ({ ...f, body: e.target.value }))}
                  placeholder={
                    form.postType === 'opportunity'
                      ? 'Describe the role, lab, location, and how to apply.'
                      : 'Share what you found, read, or think - enough detail for others to learn from it.'
                  }
                  rows={6}
                  className="w-full px-3 py-2 text-[13px] border border-slate-200 rounded-md focus:outline-none focus:ring-2 focus:ring-slate-900/10 resize-y"
                  required
                />
              </div>

              <div className="grid sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-[12px] font-medium text-slate-600 mb-1.5">
                    Tags <span className="font-normal text-slate-400">(comma-separated)</span>
                  </label>
                  <input
                    type="text"
                    value={form.tags}
                    onChange={(e) => setForm((f) => ({ ...f, tags: e.target.value }))}
                    placeholder="cancer, AI, tools"
                    className="w-full px-3 py-2 text-[13px] border border-slate-200 rounded-md focus:outline-none focus:ring-2 focus:ring-slate-900/10"
                  />
                </div>
                <div>
                  <label className="block text-[12px] font-medium text-slate-600 mb-1.5">
                    Link <span className="font-normal text-slate-400">(optional)</span>
                  </label>
                  <input
                    type="url"
                    value={form.linkUrl}
                    onChange={(e) => setForm((f) => ({ ...f, linkUrl: e.target.value }))}
                    placeholder="https://…"
                    className="w-full px-3 py-2 text-[13px] border border-slate-200 rounded-md focus:outline-none focus:ring-2 focus:ring-slate-900/10"
                  />
                </div>
              </div>

              <div className="flex justify-end gap-2 pt-1">
                <button
                  type="button"
                  onClick={closeComposer}
                  className="px-3.5 py-2 text-[13px] font-medium text-slate-600 border border-slate-200 rounded-md hover:bg-slate-50"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={saving}
                  className="px-3.5 py-2 text-[13px] font-medium text-white bg-slate-900 rounded-md hover:bg-slate-800 disabled:opacity-50"
                >
                  {saving ? 'Saving…' : editingId ? 'Save changes' : 'Publish'}
                </button>
              </div>
            </form>
          </div>
        )}

        <div className="space-y-3">
          {loading ? (
            <div className="bg-white border border-slate-200/80 rounded-xl px-6 py-12 text-center text-[13px] text-slate-500">
              Loading posts…
            </div>
          ) : posts.length === 0 ? (
            <div className="bg-white border border-slate-200/80 rounded-xl px-6 py-12 text-center">
              <p className="text-[14px] font-medium text-slate-800">No posts yet</p>
              <p className="mt-1 text-[13px] text-slate-500 max-w-sm mx-auto">
                Be the first - share a tool, opinion, or work opportunity.
              </p>
              <button
                type="button"
                onClick={openCreate}
                className="mt-4 inline-flex items-center gap-2 px-3.5 py-2 text-[13px] font-medium text-white bg-slate-900 rounded-md hover:bg-slate-800"
              >
                <PlusIcon className="w-4 h-4" />
                Share something
              </button>
            </div>
          ) : (
            posts.map((post) => {
              const meta = POST_TYPE_META[post.postType] || POST_TYPE_META.update;
              const TypeIcon = meta.icon;
              const isOwner = canManageResource(post.userId, user);
              const commentsOpen = expandedComments.has(post.id);
              const comments = commentsByPost[post.id] || [];

              return (
                <article
                  key={post.id}
                  ref={(el) => {
                    postRefs.current[post.id] = el;
                  }}
                  className={`bg-white border rounded-xl p-5 transition-colors ${
                    highlightId === post.id
                      ? 'border-slate-400 ring-2 ring-slate-900/10'
                      : 'border-slate-200/80 hover:border-slate-300/80'
                  }`}
                >
                  <div className="flex items-start justify-between gap-3">
                    <div className="min-w-0 flex-1">
                      <div className="flex flex-wrap items-center gap-2 text-[12px] text-slate-500">
                        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md bg-slate-100 text-slate-700 font-medium">
                          <TypeIcon className="w-3.5 h-3.5" />
                          {meta.label}
                        </span>
                        <span className="font-medium text-slate-700">{post.authorName}</span>
                        <span>·</span>
                        <span>{formatWhen(post.createdAt)}</span>
                      </div>
                      <h2 className="mt-2 text-[16px] font-semibold text-slate-900 tracking-tight">
                        {post.title}
                      </h2>
                      <p className="mt-2 text-[14px] text-slate-600 whitespace-pre-wrap leading-relaxed">
                        {post.body}
                      </p>
                      {(post.tags?.length > 0 || post.linkUrl) && (
                        <div className="mt-3 flex flex-wrap items-center gap-2">
                          {(post.tags || []).map((tag) => (
                            <span
                              key={tag}
                              className="text-[11px] px-2 py-0.5 rounded-md bg-slate-50 text-slate-600 border border-slate-200"
                            >
                              {tag}
                            </span>
                          ))}
                          {post.linkUrl && (
                            <a
                              href={post.linkUrl}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="text-[12px] font-medium text-slate-800 underline-offset-2 hover:underline"
                            >
                              Open link
                            </a>
                          )}
                        </div>
                      )}
                    </div>
                    {isOwner && (
                      <div className="flex items-center gap-1 shrink-0">
                        <button
                          type="button"
                          onClick={() => openEdit(post)}
                          className="p-2 rounded-md text-slate-500 hover:bg-slate-50 hover:text-slate-800"
                          aria-label="Edit post"
                        >
                          <PencilIcon className="w-4 h-4" />
                        </button>
                        <button
                          type="button"
                          onClick={() => void deletePost(post)}
                          className="p-2 rounded-md text-slate-500 hover:bg-red-50 hover:text-red-700"
                          aria-label="Delete post"
                        >
                          <TrashIcon className="w-4 h-4" />
                        </button>
                      </div>
                    )}
                  </div>

                  <div className="mt-4 pt-3 border-t border-slate-100 flex flex-wrap items-center gap-1">
                    <button
                      type="button"
                      onClick={() => void toggleLike(post)}
                      className={`inline-flex items-center gap-1.5 px-2.5 py-1.5 rounded-md text-[12px] font-medium transition-colors ${
                        post.likedByMe
                          ? 'text-red-600 bg-red-50'
                          : 'text-slate-600 hover:bg-slate-50'
                      }`}
                    >
                      <HeartIcon className="w-4 h-4" />
                      {post.likeCount > 0 ? post.likeCount : 'Like'}
                    </button>
                    <button
                      type="button"
                      onClick={() => void toggleComments(post.id)}
                      className={`inline-flex items-center gap-1.5 px-2.5 py-1.5 rounded-md text-[12px] font-medium transition-colors ${
                        commentsOpen
                          ? 'text-slate-900 bg-slate-100'
                          : 'text-slate-600 hover:bg-slate-50'
                      }`}
                    >
                      <ChatBubbleLeftIcon className="w-4 h-4" />
                      {post.commentCount > 0 ? post.commentCount : 'Comment'}
                    </button>
                    <button
                      type="button"
                      onClick={() => void sharePost(post)}
                      className="inline-flex items-center gap-1.5 px-2.5 py-1.5 rounded-md text-[12px] font-medium text-slate-600 hover:bg-slate-50"
                    >
                      <ShareIcon className="w-4 h-4" />
                      Share
                    </button>
                    <button
                      type="button"
                      onClick={() => void toggleSave(post)}
                      className={`inline-flex items-center gap-1.5 px-2.5 py-1.5 rounded-md text-[12px] font-medium transition-colors ${
                        post.savedByMe
                          ? 'text-amber-800 bg-amber-50'
                          : 'text-slate-600 hover:bg-slate-50'
                      }`}
                    >
                      <BookmarkIcon className="w-4 h-4" />
                      {post.savedByMe ? 'Saved' : 'Save'}
                    </button>
                  </div>

                  {commentsOpen && (
                    <div className="mt-3 pt-3 border-t border-slate-100 space-y-3">
                      {commentLoading[post.id] ? (
                        <p className="text-[12px] text-slate-400">Loading comments…</p>
                      ) : comments.length === 0 ? (
                        <p className="text-[12px] text-slate-400">No comments yet.</p>
                      ) : (
                        comments.map((c) => (
                          <div key={c.id} className="flex items-start justify-between gap-2">
                            <div className="min-w-0">
                              <div className="text-[12px] text-slate-500">
                                <span className="font-medium text-slate-700">{c.authorName}</span>
                                <span className="mx-1">·</span>
                                <span>{formatWhen(c.createdAt)}</span>
                              </div>
                              <p className="mt-0.5 text-[13px] text-slate-700 whitespace-pre-wrap">
                                {c.body}
                              </p>
                            </div>
                            {canManageResource(c.userId, user) && (
                              <button
                                type="button"
                                onClick={() => void deleteComment(post.id, c.id)}
                                className="p-1 text-slate-400 hover:text-red-600 shrink-0"
                                aria-label="Delete comment"
                              >
                                <TrashIcon className="w-3.5 h-3.5" />
                              </button>
                            )}
                          </div>
                        ))
                      )}
                      <div className="flex gap-2">
                        <input
                          type="text"
                          value={commentDrafts[post.id] || ''}
                          onChange={(e) =>
                            setCommentDrafts((m) => ({ ...m, [post.id]: e.target.value }))
                          }
                          onKeyDown={(e) => {
                            if (e.key === 'Enter' && !e.shiftKey) {
                              e.preventDefault();
                              void submitComment(post.id);
                            }
                          }}
                          placeholder="Write a comment…"
                          className="flex-1 px-3 py-2 text-[13px] border border-slate-200 rounded-md focus:outline-none focus:ring-2 focus:ring-slate-900/10"
                        />
                        <button
                          type="button"
                          onClick={() => void submitComment(post.id)}
                          disabled={!(commentDrafts[post.id] || '').trim()}
                          className="px-3 py-2 text-[13px] font-medium text-white bg-slate-900 rounded-md hover:bg-slate-800 disabled:opacity-40"
                        >
                          Post
                        </button>
                      </div>
                    </div>
                  )}
                </article>
              );
            })
          )}
        </div>
      </div>
    </div>
  );
};

export default CurrentTrendsPage;
