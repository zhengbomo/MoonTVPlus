/* eslint-disable no-console */

import { NextRequest, NextResponse } from 'next/server';

import { getAuthInfoFromCookie } from '@/lib/auth';
import { db } from '@/lib/db';
import { FavoriteFolder } from '@/lib/types';

export const runtime = 'nodejs';

/**
 * GET /api/favorite-folders
 * 获取用户所有收藏夹
 */
export async function GET(request: NextRequest) {
  try {
    const authInfo = getAuthInfoFromCookie(request);
    if (!authInfo || !authInfo.username) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const folders = await db.getAllFavoriteFolders(authInfo.username);
    return NextResponse.json(folders, { status: 200 });
  } catch (err) {
    console.error('获取收藏夹失败', err);
    return NextResponse.json(
      { error: 'Internal Server Error' },
      { status: 500 }
    );
  }
}

/**
 * POST /api/favorite-folders
 * 创建收藏夹
 * body: { id: string; name: string; cover?: string; created_at: number; updated_at: number }
 */
export async function POST(request: NextRequest) {
  try {
    const authInfo = getAuthInfoFromCookie(request);
    if (!authInfo || !authInfo.username) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    if (authInfo.username !== process.env.USERNAME) {
      const userInfoV2 = await db.getUserInfoV2(authInfo.username);
      if (!userInfoV2) {
        return NextResponse.json({ error: '用户不存在' }, { status: 401 });
      }
      if (userInfoV2.banned) {
        return NextResponse.json({ error: '用户已被封禁' }, { status: 401 });
      }
    }

    const body = await request.json();
    const { id, name, cover, created_at, updated_at }: FavoriteFolder = body;

    if (!id || !name) {
      return NextResponse.json(
        { error: 'Missing required fields' },
        { status: 400 }
      );
    }

    const folder: FavoriteFolder = {
      id,
      name,
      cover,
      created_at: created_at || Date.now(),
      updated_at: updated_at || Date.now(),
    };

    await db.createFavoriteFolder(authInfo.username, folder);

    return NextResponse.json({ success: true, folder }, { status: 200 });
  } catch (err) {
    console.error('创建收藏夹失败', err);
    return NextResponse.json(
      { error: 'Internal Server Error' },
      { status: 500 }
    );
  }
}

/**
 * PUT /api/favorite-folders?id=xxx
 * 更新收藏夹
 * body: { name?: string; cover?: string }
 */
export async function PUT(request: NextRequest) {
  try {
    const authInfo = getAuthInfoFromCookie(request);
    if (!authInfo || !authInfo.username) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    if (authInfo.username !== process.env.USERNAME) {
      const userInfoV2 = await db.getUserInfoV2(authInfo.username);
      if (!userInfoV2) {
        return NextResponse.json({ error: '用户不存在' }, { status: 401 });
      }
      if (userInfoV2.banned) {
        return NextResponse.json({ error: '用户已被封禁' }, { status: 401 });
      }
    }

    const { searchParams } = new URL(request.url);
    const folderId = searchParams.get('id');

    if (!folderId) {
      return NextResponse.json(
        { error: 'Missing folder id' },
        { status: 400 }
      );
    }

    const body = await request.json();
    const { name, cover } = body;

    await db.updateFavoriteFolder(authInfo.username, folderId, { name, cover });

    return NextResponse.json({ success: true }, { status: 200 });
  } catch (err) {
    console.error('更新收藏夹失败', err);
    return NextResponse.json(
      { error: 'Internal Server Error' },
      { status: 500 }
    );
  }
}

/**
 * DELETE /api/favorite-folders?id=xxx
 * 删除收藏夹
 */
export async function DELETE(request: NextRequest) {
  try {
    const authInfo = getAuthInfoFromCookie(request);
    if (!authInfo || !authInfo.username) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    if (authInfo.username !== process.env.USERNAME) {
      const userInfoV2 = await db.getUserInfoV2(authInfo.username);
      if (!userInfoV2) {
        return NextResponse.json({ error: '用户不存在' }, { status: 401 });
      }
      if (userInfoV2.banned) {
        return NextResponse.json({ error: '用户已被封禁' }, { status: 401 });
      }
    }

    const { searchParams } = new URL(request.url);
    const folderId = searchParams.get('id');

    if (!folderId) {
      return NextResponse.json(
        { error: 'Missing folder id' },
        { status: 400 }
      );
    }

    await db.deleteFavoriteFolder(authInfo.username, folderId);

    return NextResponse.json({ success: true }, { status: 200 });
  } catch (err) {
    console.error('删除收藏夹失败', err);
    return NextResponse.json(
      { error: 'Internal Server Error' },
      { status: 500 }
    );
  }
}
