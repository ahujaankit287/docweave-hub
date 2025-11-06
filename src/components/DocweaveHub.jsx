'use client'

import { useState, useEffect } from 'react'
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
  Heart
} from 'lucide-react'

export default function DocweaveHub() {
  const [repositories, setRepositories] = useState([])
  const [newRepoUrl, setNewRepoUrl] = useState('')
  const [newRepoBranch, setNewRepoBranch] = useState('main')
  const [autoUpdate, setAutoUpdate] = useState(false)
  const [autoMerge, setAutoMerge] = useState(false)
  const [isLoading, setIsLoading] = useState(false)
  const [apiKey, setApiKey] = useState('')

  useEffect(() => {
    fetchRepositories()
  }, [])

  const fetchRepositories = async () => {
    try {
      const response = await fetch('/api/repositories')
      const data = await response.json()
      setRepositories(data.repositories || [])
    } catch (error) {
      console.error('Failed to fetch repositories:', error)
    }
  }

  const addRepository = async () => {
    if (!newRepoUrl.trim()) return

    setIsLoading(true)
    try {
      const repoName = newRepoUrl.split('/').pop()?.replace('.git', '') || 'Unknown'
      
      const response = await fetch('/api/repositories', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: repoName,
          url: newRepoUrl,
          branch: newRepoBranch,
          autoUpdate
        })
      })

      if (response.ok) {
        const data = await response.json()
        setRepositories(prev => [...prev, data.repository])
        setNewRepoUrl('')
        setNewRepoBranch('main')
        
        // Start documentation generation
        if (apiKey) {
          generateDocumentation(data.repository.id, newRepoUrl, newRepoBranch, apiKey)
        }
      }
    } catch (error) {
      console.error('Failed to add repository:', error)
    } finally {
      setIsLoading(false)
    }
  }

  const generateDocumentation = async (repoId, repoUrl, branch, apiKey) => {
    try {
      const response = await fetch('/api/generate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          repoUrl,
          branch,
          apiKey
        })
      })

      if (response.ok) {
        const data = await response.json()
        console.log('Documentation generation started:', data.generationId)
      }
    } catch (error) {
      console.error('Failed to generate documentation:', error)
    }
  }

  const getStatusIcon = (status) => {
    switch (status) {
      case 'success':
      case 'up-to-date':
        return <CheckCircle className="w-4 h-4 text-green-500" />
      case 'generating':
        return <RefreshCw className="w-4 h-4 text-yellow-500 animate-spin" />
      case 'error':
        return <AlertCircle className="w-4 h-4 text-red-500" />
      default:
        return null
    }
  }

  const getStatusText = (status) => {
    switch (status) {
      case 'generating':
        return 'Generating...'
      case 'up-to-date':
        return 'Up-to-date'
      case 'error':
        return 'Error'
      default:
        return ''
    }
  }

  return (
    <div className="min-h-screen bg-gray-900 text-white">
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
        {/* Sidebar */}
        <div className="w-80 bg-gray-800 p-4 space-y-4">
          <div>
            <h2 className="text-lg font-semibold mb-4">Existing Repositories</h2>
            <div className="space-y-2">
              {repositories.filter(repo => repo.type === 'existing').map((repo) => (
                <div key={repo.id} className="flex items-center space-x-3 p-2 rounded hover:bg-gray-700">
                  <GitBranch className="w-4 h-4 text-gray-400" />
                  <span className="flex-1 text-sm">{repo.name}</span>
                  {getStatusIcon(repo.status)}
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Main Content */}
        <div className="flex-1 p-6 space-y-6">
          {/* Add Repository Section */}
          <div className="bg-gray-800 rounded-lg p-6">
            <h3 className="text-lg font-semibold mb-4">Add Repository</h3>
            
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium mb-2">Team Documentation Portal</label>
                <div className="flex items-center space-x-2 mb-2">
                  <span className="text-sm text-gray-400">Branch (optional)</span>
                  <div className="w-3 h-3 bg-gray-600 rounded-full"></div>
                </div>
                <div className="flex items-center space-x-2 mb-4">
                  <input
                    type="checkbox"
                    checked={autoUpdate}
                    onChange={(e) => setAutoUpdate(e.target.checked)}
                    className="rounded"
                  />
                  <span className="text-sm">Auto-update on push</span>
                </div>
              </div>

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
                    <span className="text-sm text-gray-400">Branch (optional)</span>
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
                  disabled={isLoading || !newRepoUrl.trim()}
                  className="flex items-center space-x-2 bg-blue-600 hover:bg-blue-700 disabled:bg-gray-600 px-4 py-2 rounded w-full justify-center"
                >
                  {isLoading ? (
                    <RefreshCw className="w-4 h-4 animate-spin" />
                  ) : (
                    <Plus className="w-4 h-4" />
                  )}
                  <span>Add & Auto Generate Merge Requests</span>
                </button>
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
            </div>
          </div>

          {/* Integrated Repositories */}
          <div className="bg-gray-800 rounded-lg p-6">
            <h3 className="text-lg font-semibold mb-4">Integrated Repositories</h3>
            <div className="space-y-3">
              {repositories.filter(repo => repo.type === 'integrated').map((repo) => (
                <div key={repo.id} className="flex items-center justify-between p-3 bg-gray-700 rounded">
                  <div className="flex items-center space-x-3">
                    <GitBranch className="w-4 h-4 text-gray-400" />
                    <span className="text-sm">{repo.name}</span>
                  </div>
                  <div className="flex items-center space-x-2">
                    {getStatusIcon(repo.status)}
                    <span className="text-sm text-gray-400">{getStatusText(repo.status)}</span>
                  </div>
                </div>
              ))}
            </div>
            
            <div className="mt-4 p-3 bg-red-900/20 border border-red-500/20 rounded">
              <div className="text-red-400 text-sm">API Key Invalid</div>
            </div>
          </div>
        </div>

        {/* Documentation Preview */}
        <div className="w-96 bg-gray-800 p-4">
          <div className="flex items-center justify-between mb-4">
            <h3 className="font-semibold">Documentation Preview</h3>
            <div className="flex space-x-2">
              <button className="bg-green-600 hover:bg-green-700 px-3 py-1 rounded text-sm flex items-center space-x-1">
                <Edit3 className="w-3 h-3" />
                <span>Create/Update README.md</span>
              </button>
              <button className="bg-blue-600 hover:bg-blue-700 px-3 py-1 rounded text-sm flex items-center space-x-1">
                <GitMerge className="w-3 h-3" />
                <span>Open Merge Request in GitHub</span>
              </button>
            </div>
          </div>

          <div className="bg-gray-900 rounded p-4 font-mono text-xs overflow-auto max-h-96">
            <div className="text-gray-400 mb-2">📋 Table of Contents</div>
            <div className="space-y-1 text-gray-300">
              <div>📋 Table of Contents</div>
              <div className="ml-4">
                <div>🔍 Awesome project</div>
                <div className="text-blue-400">
                  {`{`}<br />
                  &nbsp;&nbsp;#awesome (dev) : #awesome(localhost:3001) : {`{`}<br />
                  &nbsp;&nbsp;&nbsp;&nbsp;#routes : #awesome(localhost:3001/api) : {`{`}<br />
                  &nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;#auth : #awesome(localhost:3001/api/auth)<br />
                  &nbsp;&nbsp;&nbsp;&nbsp;{`}`}<br />
                  &nbsp;&nbsp;{`}`}<br />
                  {`}`}
                </div>
              </div>
              <div className="mt-4">
                <div>🔍 Overview</div>
                <div className="text-gray-400">Project definition</div>
              </div>
              <div className="mt-4">
                <div className="text-blue-400">
                  #awesome-client-store-data-v2 : {`{`}<br />
                  &nbsp;&nbsp;#service (dev) : #awesome(localhost:3001) : {`{`}<br />
                  &nbsp;&nbsp;&nbsp;&nbsp;#routes : #awesome(localhost:3001/api) : {`{`}<br />
                  &nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;#auth : #awesome(localhost:3001/api/auth)<br />
                  &nbsp;&nbsp;&nbsp;&nbsp;{`}`}<br />
                  &nbsp;&nbsp;{`}`}<br />
                  {`}`}
                </div>
              </div>
              <div className="mt-4">
                <div>🔍 Overview</div>
                <div className="text-gray-400">Project definition</div>
              </div>
              <div className="mt-4">
                <div className="text-blue-400">
                  #awesome-client-store-data-v3 : {`{`}<br />
                  &nbsp;&nbsp;#build (dev) #api #auth #localhost:3001) : {`{`}<br />
                  &nbsp;&nbsp;&nbsp;&nbsp;#routes : #awesome(localhost:3001/api) : {`{`}<br />
                  &nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;#auth : #awesome(localhost:3001/api/auth)<br />
                  &nbsp;&nbsp;&nbsp;&nbsp;{`}`}<br />
                  &nbsp;&nbsp;{`}`}<br />
                  {`}`}
                </div>
              </div>
            </div>
          </div>

          <div className="mt-4 text-center text-xs text-gray-400 flex items-center justify-center space-x-1">
            <span>Generated with</span>
            <Heart className="w-3 h-3 text-red-500" />
            <span>by docweave</span>
          </div>
        </div>
      </div>
    </div>
  )
}