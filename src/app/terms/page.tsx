export const metadata = {
  title: "利用規約",
};

export default function TermsPage() {
  return (
    <div className="max-w-3xl mx-auto p-6 sm:p-10">
      <h1 className="text-xl font-semibold mb-4">利用規約</h1>
      <p className="text-sm opacity-70 mb-6">最終更新日: {new Date().toLocaleDateString()}</p>

      <div className="prose prose-sm dark:prose-invert">
        <h2>1. 適用</h2>
        <p>
          本規約は、本サービス「unwavr」（以下「本サービス」）の利用条件を定めるものです。利用者は、本規約に同意したうえで本サービスを利用するものとします。
        </p>

        <h2>2. アカウント</h2>
        <p>
          本サービスは Google アカウントによる認証（OAuth）を利用します。認証に必要な範囲で、Google が提供するプロフィール情報を取り扱います。
        </p>

        <h2>3. 取り扱う情報</h2>
        <ul>
          <li>認証のためのユーザー情報（例: 氏名、メールアドレス、アイコンなどの基本プロフィール）</li>
          <li>アプリ内で作成したタスク等のデータは、原則としてブラウザのローカルストレージに保存されます</li>
        </ul>

        <h2>4. 禁止事項</h2>
        <ul>
          <li>法令または公序良俗に違反する行為</li>
          <li>不正アクセス、リバースエンジニアリング等、本サービスの運営を妨害する行為</li>
        </ul>

        <h2>5. 免責</h2>
        <p>
          本サービスは、可能な限り安定した提供に努めますが、利用者が被った損害について一切の責任を負いません。
        </p>

        <h2>6. 規約の変更</h2>
        <p>
          本規約の内容は、必要に応じて予告なく変更されることがあります。変更後に本サービスを利用した場合、変更後の規約に同意したものとみなします。
        </p>

        <h2>7. 退会・解約</h2>
        <p>
          利用者が退会・解約を行った場合、当社が保有する当該利用者のユーザー情報は<strong>解約と同時に直ちに削除</strong>されます。
        </p>
      </div>
    </div>
  );
}


