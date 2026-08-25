# AWS deployment guide

このプロジェクトを ECR + ECS Fargate + ALB で配信するための初期構築手順です。

## 全体像

```text
GitHub
  ↓ GitHub Actions
Docker build
  ↓
ECR
  ↓
ECS Fargate
  ↓
ALB
  ↓
Browser

ECS Fargate
  ↓ runtime fetch
Kinsta WordPress REST API
```

## 1. ECR

ECR は Docker Image の保存先です。

作成するリポジトリ名の例:

```text
wp-astro
```

GitHub Actions は `main` への push ごとに Docker Image を build し、Git commit SHA をタグとして ECR に push します。

## 2. ECS Cluster

ECS Cluster は Task / Service をまとめる論理的な箱です。

例:

```text
wp-astro-cluster
```

Fargate を利用するため EC2 インスタンスを自分で用意する必要はありません。

## 3. Task Definition

Task Definition は「コンテナをどう起動するか」の定義です。

最初は以下を目安にします。

```text
Family: wp-astro
Launch type: Fargate
OS: Linux
CPU: 0.5 vCPU
Memory: 1 GB
Network mode: awsvpc
Container name: wp-astro
Container port: 4321
```

コンテナ環境変数:

```text
WP_API_URL=https://your-wordpress.example.com/wp-json/wp/v2
```

Task Execution Role には ECR から Image を pull し CloudWatch Logs へログを送る権限を持たせます。

## 4. ALB

ALB はブラウザから ECS Task へ HTTP リクエストを流す入口です。

Target Group の目安:

```text
Target type: IP
Protocol: HTTP
Port: 4321
Health check path: /health
```

Fargate は `awsvpc` ネットワークモードを使うため、Target Group の target type は `instance` ではなく `ip` を使用します。

ALB と ECS Task の Security Group は分けます。

```text
Internet
  ↓ 80 / 443
ALB Security Group
  ↓ 4321 only
ECS Security Group
```

ECS Security Group の 4321 番ポートは、インターネット全体ではなく ALB Security Group からだけ許可します。

## 5. ECS Service

Service は「Task を常に何個起動しておくか」を管理します。

初期構成:

```text
Service name: wp-astro-service
Launch type: Fargate
Desired tasks: 1
Load balancer: ALB
Target group: wp-astro
```

まず学習・検証段階では Task 1 個で十分です。本番可用性を上げる段階で 2 個以上にします。

## 6. GitHub Actions と AWS OIDC

長期的な AWS Access Key / Secret Key を GitHub Secrets に保存せず、GitHub Actions から AWS IAM Role を OIDC で引き受ける構成にします。

AWS IAM 側で GitHub の OIDC Provider と deploy 用 Role を作成し、`nomtan/wp-astro` の `main` ブランチだけが Role を引き受けられるよう trust policy を制限します。

GitHub repository の Settings → Secrets and variables → Actions → Variables に以下を登録します。

```text
AWS_REGION=ap-northeast-1
AWS_ROLE_ARN=arn:aws:iam::<account-id>:role/<deploy-role-name>
ECR_REPOSITORY=wp-astro
ECS_CLUSTER=wp-astro-cluster
ECS_SERVICE=wp-astro-service
ECS_TASK_DEFINITION=wp-astro
CONTAINER_NAME=wp-astro
```

`main` に push すると `.github/workflows/deploy.yml` が以下を実行します。

```text
GitHub Actions
  ↓ OIDC
AWS IAM Role
  ↓
Docker build
  ↓
ECR push
  ↓
現在の ECS Task Definition を取得
  ↓
新しい Image URI に差し替え
  ↓
新 revision を登録
  ↓
ECS Service を rolling deploy
```

## 7. デプロイ後の確認

ALB の DNS 名へアクセスします。

```text
http://<alb-dns-name>/
http://<alb-dns-name>/health
```

`/health` は WordPress REST API にアクセスしないため、WordPress 障害と Astro コンテナ障害を切り分けられます。

期待するレスポンス:

```json
{"status":"ok"}
```

## 次の段階

最初の ECS 配信が確認できた後に追加します。

- HTTPS / ACM
- Route 53 / 独自ドメイン
- Desired tasks = 2
- ECS Auto Scaling
- CloudFront
- CloudWatch Logs / Alarm
- WordPress 更新とキャッシュ無効化
