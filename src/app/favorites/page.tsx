/* eslint-disable @typescript-eslint/no-explicit-any */

'use client';

import { Star, Trash2, AlertTriangle } from 'lucide-react';
import { useEffect, useState } from 'react';
import { createPortal } from 'react-dom';

import {
  clearAllFavorites,
  getAllFavorites,
  getAllPlayRecords,
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
}

export default function FavoritesPage() {
  const [favoriteItems, setFavoriteItems] = useState<FavoriteItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [showConfirmDialog, setShowConfirmDialog] = useState(false);

  // 加载收藏数据
  const loadFavorites = async () => {
    setLoading(true);
    try {
      const allFavorites = await getAllFavorites();
      const allPlayRecords = await getAllPlayRecords();

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
          } as FavoriteItem;
        });
      setFavoriteItems(sorted);
    } catch (error) {
      console.error('加载收藏失败:', error);
    } finally {
      setLoading(false);
    }
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
          </div>
        </div>

        {/* 收藏列表内容 */}
        <div className='max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6'>
          {loading ? (
            <div className='flex items-center justify-center py-20'>
              <div className='w-8 h-8 border-4 border-yellow-500 border-t-transparent rounded-full animate-spin'></div>
            </div>
          ) : favoriteItems.length === 0 ? (
            <div className='flex flex-col items-center justify-center py-20 text-gray-500 dark:text-gray-400'>
              <Star className='w-16 h-16 mb-4 opacity-30' />
              <p className='text-lg'>暂无收藏内容</p>
              <p className='text-sm mt-1 opacity-60'>在观看视频时点击收藏按钮来添加内容</p>
            </div>
          ) : (
            <div className='grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-4 sm:gap-6'>
              {favoriteItems.map((item) => (
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

      {/* 确认对话框 */}
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
                {/* 图标和标题 */}
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

                {/* 按钮组 */}
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
    </PageLayout>
  );
}
