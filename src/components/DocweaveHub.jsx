"use client";

import { useState, useEffect } from "react";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import rehypeHighlight from "rehype-highlight";
import {
  GitBranch,
  User,
  ChevronDown,
  Plus,
  Edit3,
  GitMerge,
  CheckCircle,
  AlertCircle,
  X,
  RefreshCw,
  Heart,
  Eye,
  Copy,
  Download,
  Bell,
} from "lucide-react";

export default function DocweaveHub() {
  const [repositories, setRepositories] = useState([]);
  const [newRepoUrl, setNewRepoUrl] = useState("");
  const [newRepoBranch, setNewRepoBranch] = useState("main");
  const [autoUpdate, setAutoUpdate] = useState(false);
  const [autoMerge, setAutoMerge] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [apiKey, setApiKey] = useState("");
  const [showModal, setShowModal] = useState(false);
  const [selectedDocumentation, setSelectedDocumentation] = useState("");
  const [selectedRepoName, setSelectedRepoName] = useState("");
  const [notification, setNotification] = useState(null);

  useEffect(() => {
    fetchRepositories();
  }, []);

  const fetchRepositories = async () => {
    try {
      const response = await fetch("/api/repositories");
      const data = await response.json();
      setRepositories(data.repositories || []);
    } catch (error) {
      console.error("Failed to fetch repositories:", error);
    }
  };

  const addRepository = async () => {
    if (!newRepoUrl.trim()) return;

    setIsLoading(true);
    try {
      const repoName =
        newRepoUrl.split("/").pop()?.replace(".git", "") || "Unknown";

      const response = await fetch("/api/repositories", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: repoName,
          url: newRepoUrl,
          branch: newRepoBranch,
          autoUpdate,
        }),
      });

      if (response.ok) {
        const data = await response.json();
        setRepositories((prev) => [...prev, data.repository]);
        setNewRepoUrl("");
        setNewRepoBranch("main");

        // Start documentation generation
        if (apiKey) {
          setNotification({
            type: "info",
            message: `Generating documentation for ${data.repository.name}...`,
          });
          generateDocumentation(
            data.repository.id,
            newRepoUrl,
            newRepoBranch,
            apiKey
          );
        }
      }
    } catch (error) {
      console.error("Failed to add repository:", error);
    } finally {
      setIsLoading(false);
    }
  };

  const generateDocumentation = async (repoId, repoUrl, branch, apiKey) => {
    try {
      setIsLoading(true);

      const response = await fetch("/api/generate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          repoUrl,
          branch,
          apiKey,
        }),
      });

      if (response.ok) {
        const data = await response.json();

        // Store documentation and show modal immediately
        setSelectedDocumentation(data.documentation);
        setSelectedRepoName(data.repoName);
        setShowModal(true);

        // Update the repository in the list
        setRepositories((prev) =>
          prev.map((repo) =>
            repo.id === repoId
              ? {
                  ...repo,
                  status: "success",
                  hasDocumentation: true,
                  lastUpdated: new Date().toISOString(),
                }
              : repo
          )
        );

        // Show success notification
        setNotification({
          type: "success",
          message: `Documentation generated successfully for ${data.repoName}!`,
        });

        // Clear notification after 3 seconds
        setTimeout(() => setNotification(null), 3000);
      } else {
        const errorData = await response.json();
        setNotification({
          type: "error",
          message: `Failed to generate documentation: ${errorData.error}`,
        });
        setTimeout(() => setNotification(null), 5000);
      }
    } catch (error) {
      console.error("Failed to generate documentation:", error);
      setNotification({
        type: "error",
        message: "Failed to generate documentation. Please try again.",
      });
      setTimeout(() => setNotification(null), 5000);
    } finally {
      setIsLoading(false);
    }
  };

  const viewDocumentation = async (repoId, repoName) => {
    try {
      const response = await fetch(`/api/documentation/${repoId}`);
      if (response.ok) {
        const data = await response.json();
        setSelectedDocumentation(data.documentation);
        setSelectedRepoName(repoName);
        setShowModal(true);
      } else {
        console.error("Documentation not found");
      }
    } catch (error) {
      console.error("Failed to fetch documentation:", error);
    }
  };

  const copyToClipboard = () => {
    navigator.clipboard.writeText(selectedDocumentation);
  };

  const downloadDocumentation = () => {
    const blob = new Blob([selectedDocumentation], { type: "text/markdown" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `${selectedRepoName}-documentation.md`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  const getStatusIcon = (status) => {
    switch (status) {
      case "success":
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
      case "generating":
        return "Generating...";
      case "up-to-date":
        return "Up-to-date";
      case "error":
        return "Error";
      default:
        return "";
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
          <Bell className="w-4 h-4" />
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
        <div className="flex items-center space-x-2">
          <div className="w-8 h-8 bg-blue-500 rounded flex items-center justify-center">
            <GitBranch className="w-5 h-5" />
          </div>
          <h1 className="text-xl font-semibold">Docweave Hub</h1>
        </div>
        <div className="flex items-center space-x-2">
          <User className="w-6 h-6" />
          <ChevronDown className="w-4 h-4" />
        </div>
      </header>

      <div className="flex">
        {/* Main Content */}
        <div className="flex-1 p-6 space-y-6 max-w-4xl mx-auto">
          {/* Add Repository Section */}
          <div className="bg-gray-800 rounded-lg p-6">
            <h3 className="text-lg font-semibold mb-4">Add Repository</h3>

            <div className="space-y-4">
              <div>
                <input
                  type="text"
                  placeholder="Paste Git Repository URL (GitHub, Bitbucket...)"
                  value={newRepoUrl}
                  onChange={(e) => setNewRepoUrl(e.target.value)}
                  className="w-full p-3 bg-gray-700 rounded border border-gray-600 focus:border-blue-500 focus:outline-none"
                />
                <div className="flex items-center justify-between mt-2">
                  <div className="flex items-center space-x-2">
                    <span className="text-sm text-gray-400">
                      Branch (optional)
                    </span>
                    <input
                      type="text"
                      value={newRepoBranch}
                      onChange={(e) => setNewRepoBranch(e.target.value)}
                      className="px-2 py-1 bg-gray-700 rounded border border-gray-600 text-sm"
                    />
                  </div>
                </div>
                <div className="flex items-center space-x-2 mt-2">
                  <input
                    type="checkbox"
                    checked={autoUpdate}
                    onChange={(e) => setAutoUpdate(e.target.checked)}
                    className="rounded"
                  />
                  <span className="text-sm">Auto-update on push</span>
                </div>
              </div>

              <div className="flex items-center space-x-2">
                <input
                  type="checkbox"
                  checked={autoMerge}
                  onChange={(e) => setAutoMerge(e.target.checked)}
                  className="rounded"
                />
                <span className="text-sm">Auto-merge README commit</span>
              </div>

              <div className="text-sm text-gray-400">
                Last updated: 2 minutes ago
              </div>

              <div className="space-y-2">
                <input
                  type="password"
                  placeholder="NVIDIA API Key"
                  value={apiKey}
                  onChange={(e) => setApiKey(e.target.value)}
                  className="w-full p-2 bg-gray-700 rounded border border-gray-600 focus:border-blue-500 focus:outline-none text-sm"
                />
                <button
                  onClick={addRepository}
                  disabled={isLoading || !newRepoUrl.trim() || !apiKey.trim()}
                  className="flex items-center space-x-2 bg-blue-600 hover:bg-blue-700 disabled:bg-gray-600 px-4 py-2 rounded w-full justify-center"
                >
                  {isLoading ? (
                    <RefreshCw className="w-4 h-4 animate-spin" />
                  ) : (
                    <Plus className="w-4 h-4" />
                  )}
                  <span>
                    {isLoading
                      ? "Generating Documentation..."
                      : "Add & Auto Generate Documentation"}
                  </span>
                </button>
              </div>
            </div>
          </div>

          {/* Integrated Repositories */}
          <div className="bg-gray-800 rounded-lg p-6">
            <h3 className="text-lg font-semibold mb-4">
              Integrated Repositories
            </h3>
            <div className="space-y-3">
              {repositories
                .filter((repo) => repo.type === "integrated")
                .map((repo) => (
                  <div
                    key={repo.id}
                    className="flex items-center justify-between p-3 bg-gray-700 rounded"
                  >
                    <div className="flex items-center space-x-3">
                      <GitBranch className="w-4 h-4 text-gray-400" />
                      <span className="text-sm">{repo.name}</span>
                    </div>
                    <div className="flex items-center space-x-2">
                      {repo.hasDocumentation && (
                        <button
                          onClick={() => viewDocumentation(repo.id, repo.name)}
                          className="p-1 hover:bg-gray-600 rounded"
                          title="View Documentation"
                        >
                          <Eye className="w-4 h-4 text-blue-400" />
                        </button>
                      )}
                      {getStatusIcon(repo.status)}
                      <span className="text-sm text-gray-400">
                        {getStatusText(repo.status)}
                      </span>
                    </div>
                  </div>
                ))}
            </div>
          </div>
        </div>
      </div>

      {/* Documentation Preview Modal */}
      {showModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-gray-800 rounded-lg max-w-4xl w-full max-h-[90vh] flex flex-col">
            {/* Modal Header */}
            <div className="flex items-center justify-between p-4 border-b border-gray-700">
              <h2 className="text-lg font-semibold">
                Documentation Preview - {selectedRepoName}
              </h2>
              <div className="flex items-center space-x-2">
                <button
                  onClick={copyToClipboard}
                  className="p-2 hover:bg-gray-700 rounded"
                  title="Copy to Clipboard"
                >
                  <Copy className="w-4 h-4" />
                </button>
                <button
                  onClick={downloadDocumentation}
                  className="p-2 hover:bg-gray-700 rounded"
                  title="Download Markdown"
                >
                  <Download className="w-4 h-4" />
                </button>
                <button
                  onClick={() => setShowModal(false)}
                  className="p-2 hover:bg-gray-700 rounded"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>
            </div>

            {/* Modal Content */}
            <div className="flex-1 overflow-auto p-4">
              <div className="bg-gray-900 text-gray-100 rounded p-6 prose prose-invert max-w-none github-markdown-dark">
                <ReactMarkdown
                  remarkPlugins={[remarkGfm]}
                  rehypePlugins={[rehypeHighlight]}
                  components={{
                    h1: ({ children }) => (
                      <h1 className="text-3xl font-bold mb-4 pb-2 border-b border-gray-600 text-gray-100">
                        {children}
                      </h1>
                    ),
                    h2: ({ children }) => (
                      <h2 className="text-2xl font-semibold mb-3 mt-6 pb-2 border-b border-gray-600 text-gray-100">
                        {children}
                      </h2>
                    ),
                    h3: ({ children }) => (
                      <h3 className="text-xl font-semibold mb-2 mt-4 text-gray-100">
                        {children}
                      </h3>
                    ),
                    h4: ({ children }) => (
                      <h4 className="text-lg font-semibold mb-2 mt-3 text-gray-100">
                        {children}
                      </h4>
                    ),
                    p: ({ children }) => (
                      <p className="mb-4 leading-relaxed text-gray-300">
                        {children}
                      </p>
                    ),
                    ul: ({ children }) => (
                      <ul className="mb-4 ml-6 list-disc text-gray-300">
                        {children}
                      </ul>
                    ),
                    ol: ({ children }) => (
                      <ol className="mb-4 ml-6 list-decimal text-gray-300">
                        {children}
                      </ol>
                    ),
                    li: ({ children }) => (
                      <li className="mb-1 text-gray-300">{children}</li>
                    ),
                    code: ({ inline, children }) =>
                      inline ? (
                        <code className="bg-gray-800 text-green-400 px-1 py-0.5 rounded text-sm font-mono">
                          {children}
                        </code>
                      ) : (
                        <code className="block bg-gray-800 p-4 rounded border border-gray-700 text-sm font-mono overflow-x-auto text-gray-300">
                          {children}
                        </code>
                      ),
                    pre: ({ children }) => (
                      <pre className="bg-gray-800 p-4 rounded border border-gray-700 mb-4 overflow-x-auto">
                        {children}
                      </pre>
                    ),
                    blockquote: ({ children }) => (
                      <blockquote className="border-l-4 border-gray-600 pl-4 italic text-gray-400 mb-4">
                        {children}
                      </blockquote>
                    ),
                    table: ({ children }) => (
                      <table className="border-collapse border border-gray-600 mb-4 w-full">
                        {children}
                      </table>
                    ),
                    th: ({ children }) => (
                      <th className="border border-gray-600 px-4 py-2 bg-gray-800 font-semibold text-left text-gray-100">
                        {children}
                      </th>
                    ),
                    td: ({ children }) => (
                      <td className="border border-gray-600 px-4 py-2 text-gray-300">
                        {children}
                      </td>
                    ),
                    a: ({ children, href }) => (
                      <a href={href} className="text-blue-400 hover:underline">
                        {children}
                      </a>
                    ),
                    strong: ({ children }) => (
                      <strong className="font-semibold">{children}</strong>
                    ),
                    em: ({ children }) => (
                      <em className="italic">{children}</em>
                    ),
                  }}
                >
                  {selectedDocumentation}
                </ReactMarkdown>
              </div>
            </div>

            {/* Modal Footer */}
            <div className="p-4 border-t border-gray-700 flex justify-between items-center">
              <div className="text-sm text-gray-400">
                Generated with ❤️ by DocWeave
              </div>
              <div className="flex space-x-2">
                <button
                  onClick={() => setShowModal(false)}
                  className="px-4 py-2 bg-gray-600 hover:bg-gray-700 rounded"
                >
                  Close
                </button>
                <button
                  onClick={downloadDocumentation}
                  className="px-4 py-2 bg-blue-600 hover:bg-blue-700 rounded"
                >
                  Download
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
