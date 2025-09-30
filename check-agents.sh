#!/bin/bash

# 🔍 エージェントシステム状態確認

echo "🤖 マルチエージェントシステム状態確認"
echo "========================================="

# tmuxセッション状態
echo ""
echo "📺 Tmuxセッション状態:"
if tmux has-session -t president 2>/dev/null; then
    echo "  ✅ president セッション: 起動中"
else
    echo "  ❌ president セッション: 未起動"
fi

if tmux has-session -t multiagent 2>/dev/null; then
    echo "  ✅ multiagent セッション: 起動中"
    # pane数確認
    pane_count=$(tmux list-panes -t multiagent:agents 2>/dev/null | wc -l)
    echo "     └── agents window panes: ${pane_count}/4 (期待値: 4)"
else
    echo "  ❌ multiagent セッション: 未起動"
fi

# Worker完了ファイル状態
echo ""
echo "📁 Worker完了追跡ファイル:"
for i in 1 2 3; do
    if [ -f "./tmp/worker${i}_done.txt" ]; then
        echo "  ✅ worker${i}_done.txt: 存在"
    else
        echo "  ⏳ worker${i}_done.txt: 未完了"
    fi
done

# ログファイル状態
echo ""
echo "📋 ログファイル:"
if [ -f "./logs/send_log.txt" ]; then
    log_count=$(wc -l < "./logs/send_log.txt")
    echo "  ✅ send_log.txt: ${log_count} 件のメッセージ記録"
else
    echo "  ⏳ send_log.txt: ログファイル未作成"
fi

# 実行可能ファイル確認
echo ""
echo "🛠️ 実行可能ファイル:"
files=("agent-send.sh" "init-workers.sh" "check-agents.sh")
for file in "${files[@]}"; do
    if [ -x "./$file" ]; then
        echo "  ✅ $file: 実行可能"
    else
        echo "  ❌ $file: 実行権限なし"
    fi
done

echo ""
echo "========================================="
echo "💡 次のステップ:"
echo "   1. tmuxセッション起動 (president, multiagent)"  
echo "   2. ./init-workers.sh で完了追跡初期化"
echo "   3. ./agent-send.sh president \"あなたはpresidentです。指示書に従って\""