/* eslint-disable @typescript-eslint/no-explicit-any */

'use client';

import {
  Star,
  Trash2,
  AlertTriangle,
  FolderPlus,
  Folder,
  X,
  Edit2,
  Check,
  Plus,
} from 'lucide-react';
import { useEffect, useState } from 'react';
import { createPortal } from 'react-dom';

import {
  clearAllFavorites,
  getAllFavorites,
  getAllPlayRecords,
  getAllFavoriteFolders,
  createFavoriteFolder as createFolder,
  updateFavoriteFolder,
  deleteFavoriteFolder,
  FavoriteFolder,
} from '@/lib/db.client';

import PageLayout from '@/components/PageLayout';
import VideoCard from '@/components/VideoCard';

interface FavoriteItem {
  id: string;
  source: string;
  title: string;
  year: string;
  poster: string;
  episodes?: number;
  source_name?: string;
  currentEpisode?: number;
  search_title?: string;
  origin?: 'vod' | 'live';
  folder_id?: string;
}

export default function FavoritesPage() {
  const [favoriteItems, setFavoriteItems] = useState<FavoriteItem[]>([]);
  const [folders, setFolders] = useState<FavoriteFolder[]>([]);
  const [activeFolder, setActiveFolder] = useState<string | null>(null); // null = 全部收藏
  const [loading, setLoading] = useState(true);
  const [showConfirmDialog, setShowConfirmDialog] = useState(false);
  const [showCreateFolderDialog, setShowCreateFolderDialog] = useState(false);
  const [editingFolder, setEditingFolder] = useState<FavoriteFolder | null>(
    null
  );
  const [newFolderName, setNewFolderName] = useState('');
  const [isCreating, setIsCreating] = useState(false);

  // 加载收藏数据
  const loadFavorites = async () => {
    setLoading(true);
    try {
      const [allFavorites, allPlayRecords, allFolders] = await Promise.all([
        getAllFavorites(),
        getAllPlayRecords(),
        getAllFavoriteFolders(),
      ]);

      setFolders(allFolders);

      // 根据保存时间排序（从近到远）
      const sorted = Object.entries(allFavorites)
        .sort(([, a], [, b]) => b.save_time - a.save_time)
        .map(([key, fav]) => {
          const plusIndex = key.indexOf('+');
          const source = key.slice(0, plusIndex);
          const id = key.slice(plusIndex + 1);

          // 查找对应的播放记录，获取当前集数
          const playRecord = allPlayRecords[key];
          const currentEpisode = playRecord?.index;

          return {
            id,
            source,
            title: fav.title,
            year: fav.year,
            poster: fav.cover,
            episodes: fav.total_episodes,
            source_name: fav.source_name,
            currentEpisode,
            search_title: fav?.search_title,
            origin: fav?.origin,
            folder_id: (fav as any).folder_id,
          } as FavoriteItem;
        });
      setFavoriteItems(sorted);
    } catch (error) {
      console.error('加载收藏失败:', error);
    } finally {
      setLoading(false);
    }
  };

  // 根据当前选中的收藏夹筛选收藏
  const filteredFavorites = activeFolder
    ? favoriteItems.filter((item) => item.folder_id === activeFolder)
    : favoriteItems;

  // 获取当前收藏夹中的收藏数量
  const getFolderCount = (folderId: string | null) => {
    if (folderId === null) {
      return favoriteItems.length;
    }
    return favoriteItems.filter((item) => item.folder_id === folderId).length;
  };

  // 清空所有收藏
  const handleClearAll = async () => {
    try {
      await clearAllFavorites();
      setFavoriteItems([]);
      setShowConfirmDialog(false);
    } catch (error) {
      console.error('清空收藏失败:', error);
    }
  };

  // 创建收藏夹
  const handleCreateFolder = async () => {
    if (!newFolderName.trim()) return;

    setIsCreating(true);
    try {
      const folder = await createFolder(newFolderName.trim());
      if (folder) {
        setFolders((prev) => [...prev, folder]);
        setNewFolderName('');
        setShowCreateFolderDialog(false);
      }
    } catch (error) {
      console.error('创建收藏夹失败:', error);
    } finally {
      setIsCreating(false);
    }
  };

  // 更新收藏夹名称
  const handleUpdateFolder = async () => {
    if (!editingFolder || !newFolderName.trim()) return;

    setIsCreating(true);
    try {
      const success = await updateFavoriteFolder(editingFolder.id, {
        name: newFolderName.trim(),
      });
      if (success) {
        setFolders((prev) =>
          prev.map((f) =>
            f.id === editingFolder.id
              ? { ...f, name: newFolderName.trim(), updated_at: Date.now() }
              : f
          )
        );
        setNewFolderName('');
        setEditingFolder(null);
      }
    } catch (error) {
      console.error('更新收藏夹失败:', error);
    } finally {
      setIsCreating(false);
    }
  };

  // 删除收藏夹
  const handleDeleteFolder = async (folderId: string) => {
    try {
      const success = await deleteFavoriteFolder(folderId);
      if (success) {
        setFolders((prev) => prev.filter((f) => f.id !== folderId));
        // 如果删除的是当前选中的收藏夹，切换到全部
        if (activeFolder === folderId) {
          setActiveFolder(null);
        }
      }
    } catch (error) {
      console.error('删除收藏夹失败:', error);
    }
  };

  // 打开编辑收藏夹对话框
  const openEditDialog = (folder: FavoriteFolder) => {
    setEditingFolder(folder);
    setNewFolderName(folder.name);
  };

  // 页面加载时获取收藏数据
  useEffect(() => {
    loadFavorites();
  }, []);

  return (
    <PageLayout activePath='/favorites'>
      <div className='min-h-screen bg-gray-50 dark:bg-gray-900'>
        {/* 页面头部 */}
        <div className='bg-white dark:bg-gray-800 shadow-sm border-b border-gray-200 dark:border-gray-700'>
          <div className='max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4'>
            <div className='flex items-center justify-between'>
              <div className='flex items-center gap-3'>
                <Star className='w-6 h-6 text-yellow-500' />
                <h1 className='text-xl font-bold text-gray-800 dark:text-gray-200'>
                  我的收藏
                </h1>
                {favoriteItems.length > 0 && (
                  <span className='px-2 py-0.5 text-xs font-medium bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-300 rounded-full'>
                    {favoriteItems.length} 项
                  </span>
                )}
              </div>
              {favoriteItems.length > 0 && (
                <button
                  onClick={() => setShowConfirmDialog(true)}
                  className='flex items-center gap-1.5 px-3 py-1.5 text-sm text-red-500 hover:text-red-700 dark:text-red-400 dark:hover:text-red-300 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg transition-colors'
                >
                  <Trash2 className='w-4 h-4' />
                  清空全部
                </button>
              )}
            </div>

            {/* 收藏夹 Tab 切换 */}
            <div className='mt-4 flex items-center gap-2 overflow-x-auto pb-2 scrollbar-thin'>
              {/* 全部收藏 Tab */}
              <button
                onClick={() => setActiveFolder(null)}
                className={`flex items-center gap-2 px-3 py-1.5 text-sm rounded-lg whitespace-nowrap transition-colors ${
                  activeFolder === null
                    ? 'bg-yellow-500 text-white'
                    : 'bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-600'
                }`}
              >
                <Star className='w-4 h-4' />
                全部
                <span className='text-xs opacity-80'>
                  ({getFolderCount(null)})
                </span>
              </button>

              {/* 收藏夹列表 */}
              {folders.map((folder) => (
                <div key={folder.id} className='flex items-center gap-1 group'>
                  <button
                    onClick={() => setActiveFolder(folder.id)}
                    className={`flex items-center gap-2 px-3 py-1.5 text-sm rounded-lg whitespace-nowrap transition-colors ${
                      activeFolder === folder.id
                        ? 'bg-yellow-500 text-white'
                        : 'bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-600'
                    }`}
                  >
                    <Folder className='w-4 h-4' />
                    {folder.name}
                    <span className='text-xs opacity-80'>
                      ({getFolderCount(folder.id)})
                    </span>
                  </button>
                  {/* 编辑和删除按钮 */}
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      openEditDialog(folder);
                    }}
                    className='opacity-0 group-hover:opacity-100 p-1 hover:bg-gray-200 dark:hover:bg-gray-600 rounded transition-opacity'
                  >
                    <Edit2 className='w-3 h-3' />
                  </button>
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      handleDeleteFolder(folder.id);
                    }}
                    className='opacity-0 group-hover:opacity-100 p-1 hover:bg-red-100 dark:hover:bg-red-900/30 text-red-500 rounded transition-opacity'
                  >
                    <Trash2 className='w-3 h-3' />
                  </button>
                </div>
              ))}

              {/* 创建收藏夹按钮 */}
              <button
                onClick={() => {
                  setEditingFolder(null);
                  setNewFolderName('');
                  setShowCreateFolderDialog(true);
                }}
                className='flex items-center gap-1.5 px-3 py-1.5 text-sm rounded-lg whitespace-nowrap bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-600 transition-colors'
              >
                <FolderPlus className='w-4 h-4' />
                新建收藏夹
              </button>
            </div>
          </div>
        </div>

        {/* 收藏列表内容 */}
        <div className='max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6'>
          {loading ? (
            <div className='flex items-center justify-center py-20'>
              <div className='w-8 h-8 border-4 border-yellow-500 border-t-transparent rounded-full animate-spin'></div>
            </div>
          ) : filteredFavorites.length === 0 ? (
            <div className='flex flex-col items-center justify-center py-20 text-gray-500 dark:text-gray-400'>
              <Star className='w-16 h-16 mb-4 opacity-30' />
              <p className='text-lg'>
                {activeFolder
                  ? folders.find((f) => f.id === activeFolder)?.name ||
                    '该收藏夹'
                  : '暂无收藏内容'}
              </p>
              <p className='text-sm mt-1 opacity-60'>
                在观看视频时点击收藏按钮来添加内容
              </p>
            </div>
          ) : (
            <div className='grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-4 sm:gap-6'>
              {filteredFavorites.map((item) => (
                <VideoCard
                  key={item.id + item.source}
                  query={item.search_title}
                  {...item}
                  from='favorite'
                  type={item.episodes && item.episodes > 1 ? 'tv' : ''}
                />
              ))}
            </div>
          )}
        </div>
      </div>

      {/* 确认清空对话框 */}
      {showConfirmDialog &&
        createPortal(
          <div
            className='fixed inset-0 bg-black bg-opacity-50 z-[9999] flex items-center justify-center p-4 transition-opacity duration-300'
            onClick={() => setShowConfirmDialog(false)}
          >
            <div
              className='bg-white dark:bg-gray-800 rounded-lg shadow-xl max-w-md w-full border border-red-200 dark:border-red-800 transition-all duration-300'
              onClick={(e) => e.stopPropagation()}
            >
              <div className='p-6'>
                <div className='flex items-start gap-4 mb-4'>
                  <div className='flex-shrink-0'>
                    <AlertTriangle className='w-8 h-8 text-red-500' />
                  </div>
                  <div className='flex-1'>
                    <h3 className='text-lg font-semibold text-gray-900 dark:text-gray-100 mb-2'>
                      清空收藏
                    </h3>
                    <p className='text-sm text-gray-600 dark:text-gray-400'>
                      确定要清空所有收藏吗？此操作不可恢复。
                    </p>
                  </div>
                </div>

                <div className='flex gap-3 mt-6'>
                  <button
                    onClick={() => setShowConfirmDialog(false)}
                    className='flex-1 px-4 py-2 text-sm font-medium text-gray-700 dark:text-gray-300 bg-gray-100 dark:bg-gray-700 hover:bg-gray-200 dark:hover:bg-gray-600 rounded-lg transition-colors'
                  >
                    取消
                  </button>
                  <button
                    onClick={handleClearAll}
                    className='flex-1 px-4 py-2 text-sm font-medium text-white bg-red-600 hover:bg-red-700 rounded-lg transition-colors'
                  >
                    确定清空
                  </button>
                </div>
              </div>
            </div>
          </div>,
          document.body
        )}

      {/* 创建/编辑收藏夹对话框 */}
      {(showCreateFolderDialog || editingFolder) &&
        createPortal(
          <div
            className='fixed inset-0 bg-black bg-opacity-50 z-[9999] flex items-center justify-center p-4 transition-opacity duration-300'
            onClick={() => {
              setShowCreateFolderDialog(false);
              setEditingFolder(null);
              setNewFolderName('');
            }}
          >
            <div
              className='bg-white dark:bg-gray-800 rounded-lg shadow-xl max-w-md w-full border border-gray-200 dark:border-gray-700 transition-all duration-300'
              onClick={(e) => e.stopPropagation()}
            >
              <div className='p-6'>
                <div className='flex items-center justify-between mb-4'>
                  <h3 className='text-lg font-semibold text-gray-900 dark:text-gray-100'>
                    {editingFolder ? '编辑收藏夹' : '新建收藏夹'}
                  </h3>
                  <button
                    onClick={() => {
                      setShowCreateFolderDialog(false);
                      setEditingFolder(null);
                      setNewFolderName('');
                    }}
                    className='p-1 hover:bg-gray-100 dark:hover:bg-gray-700 rounded'
                  >
                    <X className='w-5 h-5' />
                  </button>
                </div>

                <div className='mb-4'>
                  <label className='block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2'>
                    收藏夹名称
                  </label>
                  <input
                    type='text'
                    value={newFolderName}
                    onChange={(e) => setNewFolderName(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter') {
                        editingFolder
                          ? handleUpdateFolder()
                          : handleCreateFolder();
                      }
                    }}
                    placeholder='请输入收藏夹名称'
                    className='w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 focus:ring-2 focus:ring-yellow-500 focus:border-transparent'
                    autoFocus
                  />
                </div>

                <div className='flex gap-3'>
                  <button
                    onClick={() => {
                      setShowCreateFolderDialog(false);
                      setEditingFolder(null);
                      setNewFolderName('');
                    }}
                    className='flex-1 px-4 py-2 text-sm font-medium text-gray-700 dark:text-gray-300 bg-gray-100 dark:bg-gray-700 hover:bg-gray-200 dark:hover:bg-gray-600 rounded-lg transition-colors'
                  >
                    取消
                  </button>
                  <button
                    onClick={
                      editingFolder ? handleUpdateFolder : handleCreateFolder
                    }
                    disabled={!newFolderName.trim() || isCreating}
                    className='flex-1 flex items-center justify-center gap-2 px-4 py-2 text-sm font-medium text-white bg-yellow-500 hover:bg-yellow-600 disabled:bg-gray-300 dark:disabled:bg-gray-600 rounded-lg transition-colors'
                  >
                    {isCreating ? (
                      <div className='w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin' />
                    ) : (
                      <Check className='w-4 h-4' />
                    )}
                    {editingFolder ? '保存' : '创建'}
                  </button>
                </div>
              </div>
            </div>
          </div>,
          document.body
        )}
    </PageLayout>
  );
}
