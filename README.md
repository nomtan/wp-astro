# wp-astro

Kinsta上のWordPressをHeadless CMSとして利用し、WordPress REST APIの投稿・固定ページをAstroでSSRする最小構成です。

## 構成

```text
Kinsta WordPress
  └ REST API
       ↓
Astro SSR
       ↓
Docker
       ↓
ECR
       ↓
ECS Fargate
       ↓
ALB
```

Astro SSR + WordPress REST API + Docker に加えて、ECR / ECS Fargate へ継続デプロイする GitHub Actions の土台を用意しています。

AWS初期構築手順は [`docs/aws-deploy.md`](docs/aws-deploy.md) を参照してください。

## Routes

- `/` 投稿一覧
- `/posts/[slug]` 投稿詳細
- `/pages/[slug]` 固定ページ詳細
- `/health` ALB / ECS向けヘルスチェック

## Setup

```bash
npm install
cp .env.example .env
npm run dev
```

`.env`:

```env
WP_API_URL=https://your-wordpress.example.com/wp-json/wp/v2
```

## Production build

```bash
npm run build
npm run start
```

デフォルトでは `4321` ポートでNode.js SSRサーバーが起動します。

## Docker

```bash
docker build -t wp-astro .
docker run --rm -p 4321:4321 -e WP_API_URL=https://your-wordpress.example.com/wp-json/wp/v2 wp-astro
```

ブラウザから以下を確認できます。

```text
http://localhost:4321
http://localhost:4321/health
```

Docker Image 内では `HOST=0.0.0.0` / `PORT=4321` を設定し、ALBからコンテナへ接続できるようにしています。

## WordPress REST API

利用する標準エンドポイント:

```text
GET /wp-json/wp/v2/posts
GET /wp-json/wp/v2/posts?slug={slug}
GET /wp-json/wp/v2/pages?slug={slug}
```

カスタム投稿・ACF・キャッシュ等はこの最小構成には含めていません。

## AWS deploy

`main` への push で `.github/workflows/deploy.yml` を実行する想定です。

```text
GitHub Actions
  ↓
ECR
  ↓
ECS Fargate
  ↓
ALB
```

AWS認証は固定Access KeyではなくGitHub Actions OIDCを利用します。

必要なGitHub Actions VariablesやAWS側の作成項目は [`docs/aws-deploy.md`](docs/aws-deploy.md) にまとめています。
