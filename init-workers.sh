#!/bin/bash

# 🛠️ Worker完了追跡システム初期化

echo "🔧 Worker完了追跡システムを初期化中..."

# tmpディレクトリの確認・作成
mkdir -p ./tmp

# 既存の完了ファイルをクリア
rm -f ./tmp/worker*_done.txt

echo "✅ 初期化完了"
echo "📁 tmpディレクトリ準備完了"
echo "🔄 worker完了ファイルをリセットしました"