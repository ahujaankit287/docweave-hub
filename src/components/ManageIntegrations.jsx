"use client";

import { useState, useEffect, useCallback } from "react";
import Link from "next/link";
import {
  GitBranch,
  Trash2,
  Edit3,
  Save,
  X,
  RefreshCw,
  CheckCircle,
  AlertCircle,
  Settings,
  ArrowLeft,
  ExternalLink,
  Eye,
} from "lucide-react";

export default function ManageIntegrations() {
  const [repositories, setRepositories] = useState([]);
  const [editingRepo, setEditingRepo] = useState(null);
  const [editForm, setEditForm] = useState({
    name: "",
    url: "",
    branch: "",
    autoUpdate: false,
    autoMerge: false,
  });
  const [isLoading, setIsLoading] = useState(false);
  const [notification, setNotification] = useState(null);

  const fetchRepositories = useCallback(async () => {
    try {
      const response = await fetch("/api/repositories");
      const data = await response.json();
      setRepositories(data.repositories || []);
    } catch (error) {
      console.error("Failed to fetch repositories:", error);
      showNotification("error", "Failed to load repositories");
    }
  }, []);

  useEffect(() => {
    fetchRepositories();
  }, [fetchRepositories]);

  const showNotification = (type, message) => {
    setNotification({ type, message });
    setTimeout(() => setNotification(null), 3000);
  };

  const startEditing = (repo) => {
    setEditingRepo(repo.id);
    setEditForm({
      name: repo.name,
      url: repo.url,
      branch: repo.branch || "main",
      autoUpdate: repo.autoUpdate || false,
      autoMerge: repo.autoMerge || false,
    });
  };

  const cancelEditing = () => {
    setEditingRepo(null);
    setEditForm({
      name: "",
      url: "",
      branch: "",
      autoUpdate: false,
      autoMerge: false,
    });
  };

  const saveChanges = async (repoId) => {
    setIsLoading(true);
    try {
      const response = await fetch(`/api/repositories/${repoId}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(editForm),
      });

      if (response.ok) {
        const data = await response.json();
        setRepositories((prev) =>
          prev.map((repo) => (repo.id === repoId ? data.repository : repo))
        );
        showNotification("success", "Repository updated successfully");
        cancelEditing();
      } else {
        showNotification("error", "Failed to update repository");
      }
    } catch (error) {
      console.error("Failed to update repository:", error);
      showNotification("error", "Failed to update repository");
    } finally {
      setIsLoading(false);
    }
  };

  const deleteRepository = async (repoId, repoName) => {
    if (
      !confirm(
        `Are you sure you want to delete "${repoName}"? This action cannot be undone.`
      )
    ) {
      return;
    }

    setIsLoading(true);
    try {
      const response = await fetch(`/api/repositories/${repoId}`, {
        method: "DELETE",
      });

      if (response.ok) {
        setRepositories((prev) => prev.filter((repo) => repo.id !== repoId));
        showNotification("success", `"${repoName}" deleted successfully`);
      } else {
        showNotification("error", "Failed to delete repository");
      }
    } catch (error) {
      console.error("Failed to delete repository:", error);
      showNotification("error", "Failed to delete repository");
    } finally {
      setIsLoading(false);
    }
  };

  const viewDocumentation = async (repoId, repoName) => {
    window.location.href = `/?view=${repoId}&name=${encodeURIComponent(
      repoName
    )}`;
  };

  const regenerateDocumentation = async (repo) => {
    if (!confirm(`Regenerate documentation for "${repo.name}"?`)) {
      return;
    }

    setIsLoading(true);
    try {
      const response = await fetch("/api/generate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          repoUrl: repo.url,
          branch: repo.branch || "main",
          repoId: repo.id,
        }),
      });

      if (response.ok) {
        showNotification(
          "success",
          `Documentation regenerated for ${repo.name}`
        );
        fetchRepositories();
      } else {
        showNotification("error", "Failed to regenerate documentation");
      }
    } catch (error) {
      console.error("Failed to regenerate documentation:", error);
      showNotification("error", "Failed to regenerate documentation");
    } finally {
      setIsLoading(false);
    }
  };

  const getStatusIcon = (status) => {
    switch (status) {
      case "up-to-date":
        return <CheckCircle className="w-4 h-4 text-green-500" />;
      case "generating":
        return <RefreshCw className="w-4 h-4 text-yellow-500 animate-spin" />;
      case "error":
        return <AlertCircle className="w-4 h-4 text-red-500" />;
      default:
        return null;
    }
  };

  const getStatusText = (status) => {
    switch (status) {
      case "up-to-date":
        return "Up-to-date";
      case "generating":
        return "Generating...";
      case "error":
        return "Error";
      default:
        return "Unknown";
    }
  };

  return (
    <div className="min-h-screen bg-gray-900 text-white">
      {/* Notification */}
      {notification && (
        <div
          className={`fixed top-4 right-4 z-50 p-4 rounded-lg shadow-lg flex items-center space-x-2 ${
            notification.type === "success"
              ? "bg-green-600"
              : notification.type === "error"
              ? "bg-red-600"
              : "bg-blue-600"
          }`}
        >
          <span>{notification.message}</span>
          <button
            onClick={() => setNotification(null)}
            className="ml-2 hover:bg-black hover:bg-opacity-20 rounded p-1"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      )}

      {/* Header */}
      <header className="flex items-center justify-between p-4 border-b border-gray-700">
        <div className="flex items-center space-x-4">
          <Link
            href="/"
            className="p-2 hover:bg-gray-700 rounded transition-colors"
            title="Back to Hub"
          >
            <ArrowLeft className="w-5 h-5" />
          </Link>
          <div className="flex items-center space-x-2">
            <Settings className="w-6 h-6 text-blue-500" />
            <h1 className="text-xl font-semibold">Manage Integrations</h1>
          </div>
        </div>
        <div className="text-sm text-gray-400">
          {repositories.length}{" "}
          {repositories.length === 1 ? "repository" : "repositories"}
        </div>
      </header>

      {/* Main Content */}
      <div className="max-w-6xl mx-auto p-6">
        {repositories.length === 0 ? (
          <div className="bg-gray-800 rounded-lg p-12 text-center">
            <GitBranch className="w-16 h-16 text-gray-600 mx-auto mb-4" />
            <h2 className="text-xl font-semibold mb-2">No Repositories Yet</h2>
            <p className="text-gray-400 mb-4">
              Add your first repository to get started with documentation
              generation.
            </p>
            <Link
              href="/"
              className="inline-block px-6 py-2 bg-blue-600 hover:bg-blue-700 rounded transition-colors"
            >
              Add Repository
            </Link>
          </div>
        ) : (
          <div className="space-y-4">
            {repositories.map((repo) => (
              <div
                key={repo.id}
                className="bg-gray-800 rounded-lg p-6 border border-gray-700 hover:border-gray-600 transition-colors"
              >
                {editingRepo === repo.id ? (
                  /* Edit Mode */
                  <div className="space-y-4">
                    <div className="flex items-center justify-between mb-4">
                      <h3 className="text-lg font-semibold flex items-center space-x-2">
                        <Edit3 className="w-5 h-5 text-blue-500" />
                        <span>Edit Repository</span>
                      </h3>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div>
                        <label className="block text-sm text-gray-400 mb-1">
                          Repository Name
                        </label>
                        <input
                          type="text"
                          value={editForm.name}
                          onChange={(e) =>
                            setEditForm({ ...editForm, name: e.target.value })
                          }
                          className="w-full p-2 bg-gray-700 rounded border border-gray-600 focus:border-blue-500 focus:outline-none"
                        />
                      </div>

                      <div>
                        <label className="block text-sm text-gray-400 mb-1">
                          Branch
                        </label>
                        <input
                          type="text"
                          value={editForm.branch}
                          onChange={(e) =>
                            setEditForm({ ...editForm, branch: e.target.value })
                          }
                          className="w-full p-2 bg-gray-700 rounded border border-gray-600 focus:border-blue-500 focus:outline-none"
                        />
                      </div>
                    </div>

                    <div>
                      <label className="block text-sm text-gray-400 mb-1">
                        Repository URL
                      </label>
                      <input
                        type="text"
                        value={editForm.url}
                        onChange={(e) =>
                          setEditForm({ ...editForm, url: e.target.value })
                        }
                        className="w-full p-2 bg-gray-700 rounded border border-gray-600 focus:border-blue-500 focus:outline-none"
                      />
                    </div>

                    <div className="flex items-center space-x-2">
                      <input
                        type="checkbox"
                        checked={editForm.autoUpdate}
                        onChange={(e) =>
                          setEditForm({
                            ...editForm,
                            autoUpdate: e.target.checked,
                          })
                        }
                        className="rounded"
                      />
                      <span className="text-sm">Auto-run on code change</span>
                    </div>

                    <div className="flex items-center space-x-2">
                      <input
                        type="checkbox"
                        checked={editForm.autoMerge}
                        onChange={(e) =>
                          setEditForm({
                            ...editForm,
                            autoMerge: e.target.checked,
                          })
                        }
                        className="rounded"
                      />
                      <span className="text-sm">Auto-merge README commit</span>
                    </div>

                    <div className="flex space-x-2 pt-2">
                      <button
                        onClick={() => saveChanges(repo.id)}
                        disabled={isLoading}
                        className="flex items-center space-x-2 px-4 py-2 bg-green-600 hover:bg-green-700 disabled:bg-gray-600 rounded transition-colors"
                      >
                        <Save className="w-4 h-4" />
                        <span>Save Changes</span>
                      </button>
                      <button
                        onClick={cancelEditing}
                        disabled={isLoading}
                        className="flex items-center space-x-2 px-4 py-2 bg-gray-600 hover:bg-gray-700 disabled:bg-gray-600 rounded transition-colors"
                      >
                        <X className="w-4 h-4" />
                        <span>Cancel</span>
                      </button>
                    </div>
                  </div>
                ) : (
                  /* View Mode */
                  <div>
                    <div className="flex items-start justify-between mb-4">
                      <div className="flex-1">
                        <div className="flex items-center space-x-3 mb-2">
                          <GitBranch className="w-5 h-5 text-gray-400" />
                          <h3 className="text-lg font-semibold">{repo.name}</h3>
                          {getStatusIcon(repo.status)}
                          <span className="text-sm text-gray-400">
                            {getStatusText(repo.status)}
                          </span>
                        </div>
                        <div className="space-y-1 text-sm text-gray-400 ml-8">
                          <div>
                            <span className="text-gray-500">URL:</span>{" "}
                            <span className="font-mono text-xs">
                              {repo.url}
                            </span>
                          </div>
                          <div>
                            <span className="text-gray-500">Branch:</span>{" "}
                            <span className="text-blue-400">
                              {repo.branch || "main"}
                            </span>
                          </div>
                          {repo.lastUpdated && (
                            <div>
                              <span className="text-gray-500">
                                Last Updated:
                              </span>{" "}
                              {new Date(repo.lastUpdated).toLocaleString()}
                            </div>
                          )}
                          <div>
                            <span className="text-gray-500">
                              Auto-run on code change:
                            </span>{" "}
                            {repo.autoUpdate ? (
                              <span className="text-green-400">Enabled</span>
                            ) : (
                              <span className="text-gray-400">Disabled</span>
                            )}
                          </div>
                          <div>
                            <span className="text-gray-500">
                              Auto-merge README:
                            </span>{" "}
                            {repo.autoMerge ? (
                              <span className="text-green-400">Enabled</span>
                            ) : (
                              <span className="text-gray-400">Disabled</span>
                            )}
                          </div>
                        </div>
                      </div>

                      <div className="flex items-center space-x-2">
                        {repo.hasDocumentation && (
                          <button
                            onClick={() =>
                              viewDocumentation(repo.id, repo.name)
                            }
                            className="p-2 hover:bg-gray-700 rounded transition-colors"
                            title="View Documentation"
                          >
                            <Eye className="w-4 h-4 text-blue-400" />
                          </button>
                        )}
                        <a
                          href={repo.url}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="p-2 hover:bg-gray-700 rounded transition-colors"
                          title="Open Repository"
                        >
                          <ExternalLink className="w-4 h-4 text-blue-400" />
                        </a>
                        <button
                          onClick={() => regenerateDocumentation(repo)}
                          disabled={isLoading}
                          className="p-2 hover:bg-gray-700 rounded transition-colors disabled:opacity-50"
                          title="Regenerate Documentation"
                        >
                          <RefreshCw
                            className={`w-4 h-4 text-green-400 ${
                              isLoading ? "animate-spin" : ""
                            }`}
                          />
                        </button>
                        <button
                          onClick={() => startEditing(repo)}
                          disabled={isLoading}
                          className="p-2 hover:bg-gray-700 rounded transition-colors disabled:opacity-50"
                          title="Edit Repository"
                        >
                          <Edit3 className="w-4 h-4 text-yellow-400" />
                        </button>
                        <button
                          onClick={() => deleteRepository(repo.id, repo.name)}
                          disabled={isLoading}
                          className="p-2 hover:bg-red-900 rounded transition-colors disabled:opacity-50"
                          title="Delete Repository"
                        >
                          <Trash2 className="w-4 h-4 text-red-400" />
                        </button>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
