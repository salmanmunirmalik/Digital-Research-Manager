import React, { useState } from 'react';
import {
  PlusIcon,
  FolderIcon,
  ChevronRightIcon,
  ChevronDownIcon,
  EllipsisVerticalIcon
} from './icons';

interface Space {
  id: string;
  name: string;
  color?: string;
  icon?: string;
  task_count?: number;
  folders?: Folder[];
  lists?: List[];
}

interface Folder {
  id: string;
  name: string;
  color?: string;
  task_count?: number;
  lists?: List[];
}

interface List {
  id: string;
  name: string;
  color?: string;
  task_count?: number;
}

interface LabWorkspaceSidebarProps {
  workspace: {
    id: string;
    name: string;
    spaces?: Space[];
  } | null;
  selectedSpaceId?: string;
  selectedFolderId?: string;
  selectedListId?: string;
  onSpaceSelect: (spaceId: string) => void;
  onFolderSelect: (folderId: string) => void;
  onListSelect: (listId: string) => void;
  onCreateSpace: () => void;
  onCreateFolder: (spaceId: string) => void;
  onCreateList: (spaceId: string, folderId?: string) => void;
  loading?: boolean;
}

const LabWorkspaceSidebar: React.FC<LabWorkspaceSidebarProps> = ({
  workspace,
  selectedSpaceId,
  selectedFolderId,
  selectedListId,
  onSpaceSelect,
  onFolderSelect,
  onListSelect,
  onCreateSpace,
  onCreateFolder,
  onCreateList,
  loading = false
}) => {
  const [expandedSpaces, setExpandedSpaces] = useState<Set<string>>(new Set());
  const [expandedFolders, setExpandedFolders] = useState<Set<string>>(new Set());

  const toggleSpace = (spaceId: string) => {
    const newExpanded = new Set(expandedSpaces);
    if (newExpanded.has(spaceId)) {
      newExpanded.delete(spaceId);
    } else {
      newExpanded.add(spaceId);
    }
    setExpandedSpaces(newExpanded);
  };

  const toggleFolder = (folderId: string) => {
    const newExpanded = new Set(expandedFolders);
    if (newExpanded.has(folderId)) {
      newExpanded.delete(folderId);
    } else {
      newExpanded.add(folderId);
    }
    setExpandedFolders(newExpanded);
  };

  if (loading) {
    return (
      <div className="w-64 bg-white border-r border-gray-200 h-full flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  if (!workspace) {
    return (
      <div className="w-64 bg-white border-r border-gray-200 h-full flex items-center justify-center">
        <p className="text-gray-500">No workspace found</p>
      </div>
    );
  }

  return (
    <div className="w-64 bg-white border-r border-gray-200 h-full flex flex-col">
      {/* Header */}
      <div className="p-4 border-b border-gray-200">
        <div className="flex items-center justify-between mb-2">
          <h2 className="text-lg font-semibold text-gray-900">{workspace.name}</h2>
          <button
            onClick={onCreateSpace}
            className="p-1 text-gray-400 hover:text-gray-600 rounded hover:bg-gray-100"
            title="Create space"
          >
            <PlusIcon className="w-5 h-5" />
          </button>
        </div>
      </div>

      {/* Navigation Tree */}
      <div className="flex-1 overflow-y-auto p-2">
        {workspace.spaces && workspace.spaces.length > 0 ? (
          <div className="space-y-1">
            {workspace.spaces.map((space) => {
              const isExpanded = expandedSpaces.has(space.id);
              const isSelected = selectedSpaceId === space.id;

              return (
                <div key={space.id}>
                  {/* Space */}
                  <div
                    className={`group flex items-center justify-between px-2 py-1.5 rounded-md cursor-pointer transition-colors ${
                      isSelected
                        ? 'bg-blue-50 text-blue-700'
                        : 'text-gray-700 hover:bg-gray-50'
                    }`}
                    onClick={() => {
                      toggleSpace(space.id);
                      onSpaceSelect(space.id);
                    }}
                  >
                    <div className="flex items-center gap-2 flex-1 min-w-0">
                      {space.folders && space.folders.length > 0 ? (
                        isExpanded ? (
                          <ChevronDownIcon className="w-4 h-4 text-gray-400 flex-shrink-0" />
                        ) : (
                          <ChevronRightIcon className="w-4 h-4 text-gray-400 flex-shrink-0" />
                        )
                      ) : null}
                      <div
                        className="w-3 h-3 rounded flex-shrink-0"
                        style={{ backgroundColor: space.color || '#6366f1' }}
                      />
                      <span className="text-sm font-medium truncate">{space.name}</span>
                      {space.task_count !== undefined && space.task_count > 0 && (
                        <span className="ml-auto text-xs text-gray-500 bg-gray-100 px-1.5 py-0.5 rounded">
                          {space.task_count}
                        </span>
                      )}
                    </div>
                  </div>

                  {/* Folders and Lists */}
                  {isExpanded && (
                    <div className="ml-6 mt-1 space-y-1">
                      {/* Direct Lists (no folder) */}
                      {space.lists && space.lists.map((list) => {
                        const isListSelected = selectedListId === list.id && !selectedFolderId;
                        return (
                          <div
                            key={list.id}
                            className={`flex items-center justify-between px-2 py-1 rounded-md cursor-pointer transition-colors ${
                              isListSelected
                                ? 'bg-blue-50 text-blue-700'
                                : 'text-gray-600 hover:bg-gray-50'
                            }`}
                            onClick={(e) => {
                              e.stopPropagation();
                              onListSelect(list.id);
                            }}
                          >
                            <div className="flex items-center gap-2 flex-1 min-w-0">
                              <div
                                className="w-2 h-2 rounded-full flex-shrink-0"
                                style={{ backgroundColor: list.color || '#10b981' }}
                              />
                              <span className="text-sm truncate">{list.name}</span>
                              {list.task_count !== undefined && list.task_count > 0 && (
                                <span className="ml-auto text-xs text-gray-500">
                                  {list.task_count}
                                </span>
                              )}
                            </div>
                          </div>
                        );
                      })}

                      {/* Folders */}
                      {space.folders && space.folders.map((folder) => {
                        const isFolderExpanded = expandedFolders.has(folder.id);
                        const isFolderSelected = selectedFolderId === folder.id;

                        return (
                          <div key={folder.id} className="mt-1">
                            <div
                              className={`flex items-center justify-between px-2 py-1 rounded-md cursor-pointer transition-colors ${
                                isFolderSelected
                                  ? 'bg-blue-50 text-blue-700'
                                  : 'text-gray-600 hover:bg-gray-50'
                              }`}
                              onClick={(e) => {
                                e.stopPropagation();
                                toggleFolder(folder.id);
                                onFolderSelect(folder.id);
                              }}
                            >
                              <div className="flex items-center gap-2 flex-1 min-w-0">
                                {isFolderExpanded ? (
                                  <ChevronDownIcon className="w-4 h-4 text-gray-400 flex-shrink-0" />
                                ) : (
                                  <ChevronRightIcon className="w-4 h-4 text-gray-400 flex-shrink-0" />
                                )}
                                <FolderIcon className="w-4 h-4 text-gray-400 flex-shrink-0" />
                                <span className="text-sm font-medium truncate">{folder.name}</span>
                                {folder.task_count !== undefined && folder.task_count > 0 && (
                                  <span className="ml-auto text-xs text-gray-500">
                                    {folder.task_count}
                                  </span>
                                )}
                              </div>
                            </div>

                            {/* Lists in Folder */}
                            {isFolderExpanded && folder.lists && (
                              <div className="ml-4 mt-1 space-y-1">
                                {folder.lists.map((list) => {
                                  const isListSelected = selectedListId === list.id && selectedFolderId === folder.id;
                                  return (
                                    <div
                                      key={list.id}
                                      className={`flex items-center justify-between px-2 py-1 rounded-md cursor-pointer transition-colors ${
                                        isListSelected
                                          ? 'bg-blue-50 text-blue-700'
                                          : 'text-gray-600 hover:bg-gray-50'
                                      }`}
                                      onClick={(e) => {
                                        e.stopPropagation();
                                        onListSelect(list.id);
                                      }}
                                    >
                                      <div className="flex items-center gap-2 flex-1 min-w-0">
                                        <div
                                          className="w-2 h-2 rounded-full flex-shrink-0"
                                          style={{ backgroundColor: list.color || '#10b981' }}
                                        />
                                        <span className="text-sm truncate">{list.name}</span>
                                        {list.task_count !== undefined && list.task_count > 0 && (
                                          <span className="ml-auto text-xs text-gray-500">
                                            {list.task_count}
                                          </span>
                                        )}
                                      </div>
                                    </div>
                                  );
                                })}
                              </div>
                            )}
                          </div>
                        );
                      })}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        ) : (
          <div className="text-center py-8">
            <p className="text-sm text-gray-500 mb-4">No spaces yet</p>
            <button
              onClick={onCreateSpace}
              className="text-sm text-blue-600 hover:text-blue-700 font-medium"
            >
              Create your first space
            </button>
          </div>
        )}
      </div>
    </div>
  );
};

export default LabWorkspaceSidebar;


