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

現段階ではAstro SSR + WordPress REST API + Dockerまでを実装しています。AWS側（ECR / ECS Fargate / ALB）は次の段階で追加します。

## Routes

- `/` 投稿一覧
- `/posts/[slug]` 投稿詳細
- `/pages/[slug]` 固定ページ詳細

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

ブラウザから `http://localhost:4321` を開いて確認できます。

## WordPress REST API

利用する標準エンドポイント:

```text
GET /wp-json/wp/v2/posts
GET /wp-json/wp/v2/posts?slug={slug}
GET /wp-json/wp/v2/pages?slug={slug}
```

カスタム投稿・ACF・キャッシュ等はこの最小構成には含めていません。
