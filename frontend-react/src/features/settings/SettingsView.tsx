// Settings View
// Central settings page for customization

import { useState } from 'react';
import { useNavigate } from 'react-router-dom';

export function SettingsView() {
  const navigate = useNavigate();
  const [activeSection, setActiveSection] = useState<'tags' | 'categories' | 'general'>('general');

  // Delete All Data confirmation
  const [showDeleteWarning, setShowDeleteWarning] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [deleteConfirmText, setDeleteConfirmText] = useState('');
  const [isDeleting, setIsDeleting] = useState(false);
  const [showDeleteSuccess, setShowDeleteSuccess] = useState(false);
  const [showDeleteError, setShowDeleteError] = useState(false);
  const [deleteErrorMessage, setDeleteErrorMessage] = useState('');

  // Tags management
  const [customTags, setCustomTags] = useState<string[]>([
    'PPL',
    'IR',
    'CPL',
    'CFI',
    'Priority',
    'Optional',
  ]);
  const [newTag, setNewTag] = useState('');

  // Categories management
  const [customCategories, setCustomCategories] = useState<string[]>([
    'Flight Training',
    'Aircraft Rental',
    'Ground School',
    'Books & Materials',
    'Exams & Checkrides',
    'Medical',
    'Equipment',
    'Insurance',
    'Membership',
    'Fuel',
    'Maintenance',
    'Other',
  ]);
  const [newCategory, setNewCategory] = useState('');

  const handleAddTag = () => {
    const trimmed = newTag.trim();
    if (trimmed && !customTags.includes(trimmed)) {
      setCustomTags([...customTags, trimmed]);
      setNewTag('');
    }
  };

  const handleRemoveTag = (tag: string) => {
    setCustomTags(customTags.filter((t) => t !== tag));
  };

  const handleAddCategory = () => {
    const trimmed = newCategory.trim();
    if (trimmed && !customCategories.includes(trimmed)) {
      setCustomCategories([...customCategories, trimmed]);
      setNewCategory('');
    }
  };

  const handleRemoveCategory = (category: string) => {
    if (customCategories.length > 1) {
      setCustomCategories(customCategories.filter((c) => c !== category));
    }
  };

  const handleDeleteAllDataClick = () => {
    setShowDeleteWarning(true);
  };

  const handleContinueToConfirm = () => {
    setShowDeleteWarning(false);
    setShowDeleteConfirm(true);
  };

  const handleCancelDelete = () => {
    setShowDeleteWarning(false);
    setShowDeleteConfirm(false);
    setDeleteConfirmText('');
  };

  const handleConfirmDelete = async () => {
    if (deleteConfirmText !== 'DELETE') {
      return;
    }

    setIsDeleting(true);
    try {
      // Call API to delete all data
      const response = await fetch('/api/data/delete-all', {
        method: 'DELETE',
      });

      if (!response.ok) {
        throw new Error('Failed to delete data');
      }

      // Close modals and show success
      setShowDeleteConfirm(false);
      setDeleteConfirmText('');
      setShowDeleteSuccess(true);
    } catch (error) {
      console.error('Failed to delete all data:', error);
      setShowDeleteConfirm(false);
      setDeleteConfirmText('');
      setDeleteErrorMessage(error instanceof Error ? error.message : 'Failed to delete data. Please try again.');
      setShowDeleteError(true);
    } finally {
      setIsDeleting(false);
    }
  };

  const handleSuccessClose = () => {
    setShowDeleteSuccess(false);
    navigate('/dashboard');
  };

  const handleErrorClose = () => {
    setShowDeleteError(false);
    setDeleteErrorMessage('');
  };

  return (
    <div className="p-6 max-w-6xl mx-auto">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <button
            onClick={() => navigate(-1)}
            className="flex items-center gap-2 text-slate-400 hover:text-white transition-colors mb-2"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
            </svg>
            Back
          </button>
          <h1 className="text-3xl font-bold text-white">Settings</h1>
          <p className="text-slate-400 mt-1">Customize your TrueHour experience</p>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        {/* Sidebar Navigation */}
        <div className="md:col-span-1">
          <nav className="space-y-1 bg-truehour-card border border-truehour-border rounded-lg p-2">
            <button
              onClick={() => setActiveSection('general')}
              className={`w-full text-left px-4 py-2 rounded-lg transition-colors ${
                activeSection === 'general'
                  ? 'bg-truehour-blue text-white'
                  : 'text-slate-300 hover:bg-truehour-darker hover:text-white'
              }`}
            >
              General
            </button>
            <button
              onClick={() => setActiveSection('tags')}
              className={`w-full text-left px-4 py-2 rounded-lg transition-colors ${
                activeSection === 'tags'
                  ? 'bg-truehour-blue text-white'
                  : 'text-slate-300 hover:bg-truehour-darker hover:text-white'
              }`}
            >
              Tags
            </button>
            <button
              onClick={() => setActiveSection('categories')}
              className={`w-full text-left px-4 py-2 rounded-lg transition-colors ${
                activeSection === 'categories'
                  ? 'bg-truehour-blue text-white'
                  : 'text-slate-300 hover:bg-truehour-darker hover:text-white'
              }`}
            >
              Categories
            </button>
          </nav>
        </div>

        {/* Main Content */}
        <div className="md:col-span-3">
          {/* General Settings */}
          {activeSection === 'general' && (
            <div className="bg-truehour-card border border-truehour-border rounded-lg p-6">
              <h2 className="text-2xl font-bold text-white mb-4">General Settings</h2>
              <div className="space-y-6">
                <div>
                  <h3 className="text-lg font-semibold text-white mb-3">Appearance</h3>
                  <div className="space-y-3">
                    <div className="flex items-center justify-between p-4 bg-truehour-darker rounded-lg">
                      <div>
                        <div className="text-white font-medium">Theme</div>
                        <div className="text-xs text-slate-500">Currently: Dark Mode</div>
                      </div>
                      <span className="text-xs px-3 py-1.5 rounded-full bg-amber-500/10 text-amber-400 border border-amber-500/20">
                        Coming Soon
                      </span>
                    </div>
                  </div>
                </div>

                <div>
                  <h3 className="text-lg font-semibold text-white mb-3">Data Management</h3>
                  <div className="space-y-3">
                    <div className="flex items-center justify-between p-4 bg-truehour-darker rounded-lg">
                      <div>
                        <div className="text-white font-medium">Auto-save</div>
                        <div className="text-xs text-slate-500">Automatically save changes</div>
                      </div>
                      <span className="text-xs px-3 py-1.5 rounded-full bg-amber-500/10 text-amber-400 border border-amber-500/20">
                        Coming Soon
                      </span>
                    </div>
                    <div className="flex items-center justify-between p-4 bg-red-900/20 border border-red-500/30 rounded-lg">
                      <div>
                        <div className="text-white font-medium">Delete All Data</div>
                        <div className="text-xs text-slate-500">Permanently delete all aircraft, expenses, flights, and settings</div>
                      </div>
                      <button
                        onClick={handleDeleteAllDataClick}
                        className="px-4 py-2 bg-red-600 hover:bg-red-700 text-white font-medium rounded-lg transition-colors"
                      >
                        Delete All Data
                      </button>
                    </div>
                  </div>
                </div>

                <div>
                  <h3 className="text-lg font-semibold text-white mb-3">About</h3>
                  <div className="p-4 bg-truehour-darker rounded-lg">
                    <div className="space-y-2 text-sm">
                      <div className="flex justify-between">
                        <span className="text-slate-400">Version</span>
                        <span className="text-white">2.0.0</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-slate-400">Developer</span>
                        <span className="text-white">FliteAxis</span>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Tags Settings */}
          {activeSection === 'tags' && (
            <div className="bg-truehour-card border border-truehour-border rounded-lg p-6">
              <h2 className="text-2xl font-bold text-white mb-2">Custom Tags</h2>
              <p className="text-slate-400 mb-6">
                Manage tags that can be applied to budget cards for better organization
              </p>

              {/* Add New Tag */}
              <div className="mb-6">
                <label htmlFor="new-tag" className="block text-sm font-medium text-slate-300 mb-2">
                  Add New Tag
                </label>
                <div className="flex gap-2">
                  <input
                    type="text"
                    id="new-tag"
                    value={newTag}
                    onChange={(e) => setNewTag(e.target.value)}
                    onKeyDown={(e) => e.key === 'Enter' && handleAddTag()}
                    className="flex-1 bg-truehour-darker border border-truehour-border text-white rounded-lg px-4 py-2 focus:outline-none focus:border-truehour-blue"
                    placeholder="Enter tag name"
                  />
                  <button
                    onClick={handleAddTag}
                    className="px-6 py-2 bg-truehour-blue hover:bg-blue-600 text-white font-medium rounded-lg transition-colors"
                  >
                    Add Tag
                  </button>
                </div>
              </div>

              {/* Existing Tags */}
              <div>
                <h3 className="text-sm font-medium text-slate-300 mb-3">Available Tags ({customTags.length})</h3>
                <div className="flex flex-wrap gap-2">
                  {customTags.map((tag, idx) => (
                    <span
                      key={idx}
                      className="inline-flex items-center gap-2 text-sm px-3 py-1.5 rounded-full bg-blue-500/10 text-blue-400 border border-blue-500/20"
                    >
                      {tag}
                      <button
                        onClick={() => handleRemoveTag(tag)}
                        className="hover:text-blue-300 transition-colors"
                        aria-label={`Remove ${tag} tag`}
                      >
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                        </svg>
                      </button>
                    </span>
                  ))}
                </div>
              </div>

              <div className="mt-6 p-4 bg-blue-500/10 border border-blue-500/20 rounded-lg">
                <div className="flex gap-3">
                  <svg className="w-5 h-5 text-blue-400 flex-shrink-0 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
                    />
                  </svg>
                  <div className="text-sm text-blue-300">
                    <div className="font-medium mb-1">Note about tags</div>
                    <div>
                      Tags help you organize budget cards by certification level (PPL, IR, CPL), priority, or any custom
                      categories you need. These changes are saved locally and will persist across sessions.
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Categories Settings */}
          {activeSection === 'categories' && (
            <div className="bg-truehour-card border border-truehour-border rounded-lg p-6">
              <h2 className="text-2xl font-bold text-white mb-2">Budget Categories</h2>
              <p className="text-slate-400 mb-6">
                Customize the expense categories available when creating budget cards and expenses
              </p>

              {/* Add New Category */}
              <div className="mb-6">
                <label htmlFor="new-category" className="block text-sm font-medium text-slate-300 mb-2">
                  Add New Category
                </label>
                <div className="flex gap-2">
                  <input
                    type="text"
                    id="new-category"
                    value={newCategory}
                    onChange={(e) => setNewCategory(e.target.value)}
                    onKeyDown={(e) => e.key === 'Enter' && handleAddCategory()}
                    className="flex-1 bg-truehour-darker border border-truehour-border text-white rounded-lg px-4 py-2 focus:outline-none focus:border-truehour-blue"
                    placeholder="Enter category name"
                  />
                  <button
                    onClick={handleAddCategory}
                    className="px-6 py-2 bg-truehour-blue hover:bg-blue-600 text-white font-medium rounded-lg transition-colors"
                  >
                    Add Category
                  </button>
                </div>
              </div>

              {/* Existing Categories */}
              <div>
                <h3 className="text-sm font-medium text-slate-300 mb-3">
                  Available Categories ({customCategories.length})
                </h3>
                <div className="grid grid-cols-2 gap-2">
                  {customCategories.map((category, idx) => (
                    <div
                      key={idx}
                      className="flex items-center justify-between p-3 bg-truehour-darker border border-truehour-border rounded-lg"
                    >
                      <span className="text-white text-sm">{category}</span>
                      <button
                        onClick={() => handleRemoveCategory(category)}
                        disabled={customCategories.length === 1}
                        className="p-1 text-slate-400 hover:text-red-400 transition-colors disabled:opacity-30 disabled:cursor-not-allowed"
                        aria-label={`Remove ${category} category`}
                      >
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            strokeWidth={2}
                            d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"
                          />
                        </svg>
                      </button>
                    </div>
                  ))}
                </div>
              </div>

              <div className="mt-6 p-4 bg-amber-500/10 border border-amber-500/20 rounded-lg">
                <div className="flex gap-3">
                  <svg
                    className="w-5 h-5 text-amber-400 flex-shrink-0 mt-0.5"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"
                    />
                  </svg>
                  <div className="text-sm text-amber-300">
                    <div className="font-medium mb-1">Important</div>
                    <div>
                      Removing a category won't delete existing budget cards or expenses that use it. However, you won't be able
                      to create new items with that category. At least one category must remain.
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Delete Warning Modal (Step 1) */}
      {showDeleteWarning && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-truehour-card border border-red-500/50 rounded-lg w-full max-w-md">
            <div className="p-6">
              <div className="flex items-start gap-4 mb-4">
                <div className="flex-shrink-0 w-12 h-12 rounded-full bg-red-500/20 flex items-center justify-center">
                  <svg className="w-6 h-6 text-red-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"
                    />
                  </svg>
                </div>
                <div className="flex-1">
                  <h3 className="text-xl font-bold text-white mb-2">Delete All Data?</h3>
                  <p className="text-slate-300 text-sm leading-relaxed">
                    This will permanently delete all of your aircraft, expenses, flights, budget cards, and settings.
                    This action cannot be undone.
                  </p>
                </div>
              </div>

              <div className="flex items-center justify-end gap-3 mt-6">
                <button
                  onClick={handleCancelDelete}
                  className="px-4 py-2 text-slate-300 hover:text-white transition-colors"
                >
                  Cancel
                </button>
                <button
                  onClick={handleContinueToConfirm}
                  className="px-6 py-2 bg-red-600 hover:bg-red-700 text-white font-medium rounded-lg transition-colors"
                >
                  Continue
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Delete Confirmation Modal (Step 2) */}
      {showDeleteConfirm && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-truehour-card border border-red-500/50 rounded-lg w-full max-w-md">
            <div className="p-6">
              <div className="flex items-start gap-4 mb-4">
                <div className="flex-shrink-0 w-12 h-12 rounded-full bg-red-500/20 flex items-center justify-center">
                  <svg className="w-6 h-6 text-red-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"
                    />
                  </svg>
                </div>
                <div className="flex-1">
                  <h3 className="text-xl font-bold text-white mb-2">Type DELETE to Confirm</h3>
                  <p className="text-slate-300 text-sm leading-relaxed mb-4">
                    This is your last chance to cancel. Type <span className="font-mono font-bold text-red-400">DELETE</span> below to permanently delete all your data.
                  </p>
                  <input
                    type="text"
                    value={deleteConfirmText}
                    onChange={(e) => setDeleteConfirmText(e.target.value)}
                    placeholder="Type DELETE"
                    className="w-full bg-truehour-darker border border-truehour-border text-white rounded-lg px-4 py-2 focus:outline-none focus:border-red-500"
                    autoFocus
                  />
                </div>
              </div>

              <div className="flex items-center justify-end gap-3 mt-6">
                <button
                  onClick={handleCancelDelete}
                  disabled={isDeleting}
                  className="px-4 py-2 text-slate-300 hover:text-white transition-colors disabled:opacity-50"
                >
                  Cancel
                </button>
                <button
                  onClick={handleConfirmDelete}
                  disabled={deleteConfirmText !== 'DELETE' || isDeleting}
                  className="px-6 py-2 bg-red-600 hover:bg-red-700 text-white font-medium rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
                >
                  {isDeleting ? (
                    <>
                      <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                      Deleting...
                    </>
                  ) : (
                    'Continue'
                  )}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Delete Success Modal */}
      {showDeleteSuccess && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-truehour-card border border-green-500/50 rounded-lg w-full max-w-md">
            <div className="p-6">
              <div className="flex items-center gap-3 mb-4">
                <div className="w-12 h-12 rounded-full bg-green-500/20 flex items-center justify-center">
                  <svg className="w-6 h-6 text-green-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                  </svg>
                </div>
                <h3 className="text-xl font-bold text-white">Success</h3>
              </div>
              <p className="text-slate-300 mb-6">All data has been successfully deleted.</p>
              <div className="flex justify-end">
                <button
                  onClick={handleSuccessClose}
                  className="px-6 py-2 bg-truehour-blue hover:bg-blue-600 text-white font-medium rounded-lg transition-colors"
                >
                  Go to Dashboard
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Delete Error Modal */}
      {showDeleteError && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-truehour-card border border-red-500/50 rounded-lg w-full max-w-md">
            <div className="p-6">
              <div className="flex items-center gap-3 mb-4">
                <div className="w-12 h-12 rounded-full bg-red-500/20 flex items-center justify-center">
                  <svg className="w-6 h-6 text-red-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
                    />
                  </svg>
                </div>
                <h3 className="text-xl font-bold text-white">Error</h3>
              </div>
              <p className="text-slate-300 mb-6">{deleteErrorMessage}</p>
              <div className="flex justify-end">
                <button
                  onClick={handleErrorClose}
                  className="px-6 py-2 bg-truehour-blue hover:bg-blue-600 text-white font-medium rounded-lg transition-colors"
                >
                  Close
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
