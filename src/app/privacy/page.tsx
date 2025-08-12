export const metadata = {
  title: "プライバシーポリシー",
};

export default function PrivacyPage() {
  return (
    <div className="max-w-3xl mx-auto p-6 sm:p-10">
      <h1 className="text-xl font-semibold mb-4">プライバシーポリシー</h1>
      <p className="text-sm opacity-70 mb-6">最終更新日: {new Date().toLocaleDateString()}</p>

      <div className="prose prose-sm dark:prose-invert">
        <h2>1. 収集する情報</h2>
        <p>
          本サービスは、ユーザー認証のため Google OAuth により最低限のユーザー情報（氏名、メールアドレス、アイコン等）を取得します。
        </p>

        <h2>2. 利用目的</h2>
        <ul>
          <li>本人確認、ログイン認証のため</li>
          <li>サービスの提供・改善のため</li>
        </ul>

        <h2>3. 保存場所</h2>
        <p>
          タスク、BGM プレイリスト等のアプリデータは、主としてブラウザのローカルストレージに保存されます。サーバー側ではユーザー情報のみを保持します。
        </p>

        <h2>4. 第三者提供</h2>
        <p>
          法令に基づく場合を除き、ユーザーの同意なく第三者に個人情報を提供しません。
        </p>

        <h2>5. 安全管理</h2>
        <p>
          ユーザー情報は、アクセス制御・暗号化・ログ監視等、適切な安全管理措置のもと取り扱います。
        </p>

        <h2>6. 開示・訂正・削除</h2>
        <p>
          退会・解約の申請があった場合、<strong>ユーザー情報は直ちに削除</strong>します。その他の開示・訂正・削除は、問い合わせ窓口までご連絡ください。
        </p>

        <h2>7. 改定</h2>
        <p>
          本ポリシーは、必要に応じて予告なく改定されることがあります。改定後も本サービスを利用した場合、改定後のポリシーに同意したものとみなします。
        </p>
      </div>
    </div>
  );
}


